// Two windows on one room, in the browser: once one window moves the room to
// a new conversation, the other never shows the engine's refusal. A message
// typed there stays in the box with a plain line and Reload, Remember there
// says the same, and Reload joins the room's new conversation (it does not
// retire it under the window that shows it), where the message goes out.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";

const waitUntil = waitEvery(150);

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

// A machine without Chromium cannot run a browser assertion at all; skip
// whole, the same way remote-settings-readonly-smoke does.
{
	const p = typeof chromium?.executablePath === "function" ? chromium.executablePath() : "";
	if (!p || !fs.existsSync(p)) {
		console.log("two window room ui smoke skipped (Chromium not installed)");
		process.exit(0);
	}
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webServerDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-two-window-ui-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
const workspace = path.join(tempRoot, "workspace");
fs.mkdirSync(workspace, { recursive: true });
fs.writeFileSync(path.join(workspace, "invented.md"), "# Invented source\n");
fs.writeFileSync(path.join(workspace, "owners.md"), "# Invented shared file\n");
fs.writeFileSync(path.join(workspace, "lost-keep.md"), "# Invented keep original\n");
fs.writeFileSync(path.join(workspace, "guard-keep.md"), "# Invented keep original\n");
fs.writeFileSync(path.join(workspace, "guard-keep-save.md"), "# Invented save original\n");
fs.writeFileSync(path.join(workspace, "guard-keep-save-conflict.md"), "# Invented save original\n");
fs.writeFileSync(path.join(workspace, "guard-keep-timeout.md"), "# Invented timeout original\n");
fs.writeFileSync(path.join(workspace, "guard-unknown-timeout.md"), "# Invented unknown original\n");
fs.writeFileSync(path.join(workspace, "identity.md"), "# Invented identity source\n");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
process.env.HOME = tempHome;
process.env.USERPROFILE = tempHome;
process.env.EXXPERTS_CODING_AGENT_DIR = agentDir;
process.env.EXXETA_PERSISTENT_AGENTS_ROOT = agentsRoot;

const CLAUDE = { provider: "fake-claude", model: "claude-fake" };
const requests: Array<{ model: string }> = [];

function sse(res: http.ServerResponse, event: string | null, payload: unknown): void {
	res.write(`${event ? `event: ${event}\n` : ""}data: ${JSON.stringify(payload)}\n\n`);
}

// Two synthetic providers: one speaks the Anthropic stream, one the OpenAI one.
const providers = http.createServer((req, res) => {
	let raw = "";
	req.on("data", (chunk) => { raw += chunk; });
	req.on("end", () => {
		const body = JSON.parse(raw || "{}");
		requests.push({ model: String(body.model) });
		res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
		const text = `Answer from ${body.model}.`;
		if (String(req.url ?? "").includes("/messages")) {
			sse(res, "message_start", { type: "message_start", message: { id: `msg_${requests.length}`, type: "message", role: "assistant", model: body.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 100, output_tokens: 1 } } });
			sse(res, "content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
			sse(res, "content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } });
			sse(res, "content_block_stop", { type: "content_block_stop", index: 0 });
			sse(res, "message_delta", { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 20 } });
			sse(res, "message_stop", { type: "message_stop" });
			res.end();
			return;
		}
		const base = { id: `cmpl_${requests.length}`, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: body.model };
		sse(res, null, { ...base, choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }] });
		sse(res, null, { ...base, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } });
		res.write("data: [DONE]\n\n");
		res.end();
	});
});

let server: ChildProcessWithoutNullStreams | undefined;
const serverOutput: string[] = [];
const MOVED = "This room went on in another window. Reload to continue there.";

try {
	await new Promise<void>((resolve) => providers.listen(0, "127.0.0.1", resolve));
	const providerPort = (providers.address() as AddressInfo).port;
	fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({
		providers: {
			"fake-claude": { name: "Fake Claude", baseUrl: `http://127.0.0.1:${providerPort}`, api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] },
		},
	}, null, 2), { mode: 0o600 });
	fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }, null, 2), { mode: 0o600 });
	fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [
		{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" },
	] }, null, 2), { mode: 0o600 });
	fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }, null, 2), { mode: 0o600 });

	const agents = await import("../src/persistent-agents.js");
	const roomModels = await import("../src/room-models.js");
	const agentId = agents.createPersistentAgentFromScaffoldInput({ displayName: "Two Window Room", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }).agent.agentId;
	roomModels.writeRoomModels(agentId, { conversation: CLAUDE });

	server = spawn("npx", ["tsx", "src/index.ts"], {
		shell: process.platform === "win32",
		...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
		cwd: webServerDir,
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready");
	const workspaceSaved = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) });
	assert(workspaceSaved.ok, "the invented workspace is configured");
	// When the room's lock was last taken: a window whose connection is ready holds it.
	const lockTakenAt = async () => Number(((await (await authedFetch(`${baseUrl}/api/persistent-agents`)).json()) as Array<{ id: string; activeLock?: { acquiredAt?: number } | null }>).find((room) => room.id === agentId)?.activeLock?.acquiredAt ?? 0);
	const lockTakenSince = (before: number, label: string) => waitUntil(async () => (await lockTakenAt()) > before, label);
	const activeThread = async () => String(((await (await authedFetch(`${baseUrl}/api/persistent-agents/${agentId}/status`)).json()) as { runtime?: { activeThreadId?: string } }).runtime?.activeThreadId ?? "");

	const browser = await chromium.launch();
	try {
		const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
		const a = await ctx.newPage();
		await a.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
		await a.waitForLoadState("networkidle");
		const dismiss = a.locator(".whats-new-close");
		if (await dismiss.count()) await dismiss.click();
		await a.locator(".persistent-agent-card").filter({ hasText: "Two Window Room" }).getByRole("button", { name: "Enter" }).click();
		const composerA = a.locator("textarea").first();
		await a.locator('button[title="Send"]').first().waitFor({ timeout: 15000 });
		await lockTakenSince(0, "window A's connection is ready");
		await composerA.fill("First question.");
		await composerA.press("Enter");
		await a.getByText("Answer from claude-fake.").first().waitFor({ timeout: 20000 });
		const first = await activeThread();
		// Window B reads the conversation from disk: wait until the first exchange is saved there.
		await waitUntil(async () => JSON.stringify(await (await authedFetch(`${baseUrl}/api/persistent-agents/${agentId}/threads/${first}`)).json()).includes("Answer from claude-fake."), "the first exchange is saved");

		// Window B opens the room by its address and moves it on: Forget starts a fresh conversation.
		const b = await ctx.newPage();
		const beforeB = await lockTakenAt();
		await b.goto(`${baseUrl}/#/room/${agentId}`);
		await b.locator('button[title="Send"]').first().waitFor({ timeout: 15000 });
		await b.getByText("First question.").first().waitFor({ timeout: 30000 });
		await lockTakenSince(beforeB, "window B's connection is ready");
		// Each window has its own editor; the existing revision route arbitrates their writes.
		await a.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "owners.md" }).click();
		await b.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "owners.md" }).click();
		const ownerAEditor = a.locator(".markdown-editor-tiptap .ProseMirror");
		const ownerBEditor = b.locator(".markdown-editor-tiptap .ProseMirror");
		await ownerAEditor.getByText("Invented shared file").waitFor();
		await ownerBEditor.getByText("Invented shared file").waitFor();
		let releaseOwnerA!: () => void, startOwnerA!: () => void, ownerAWrites = 0;
		const ownerAReleased = new Promise<void>((resolve) => { releaseOwnerA = resolve; });
		const ownerAStarted = new Promise<void>((resolve) => { startOwnerA = resolve; });
		await a.route("**/workspace-markdown?*", async (route) => {
			if (route.request().method() !== "PUT") return route.continue();
			ownerAWrites++;
			startOwnerA();
			await ownerAReleased;
			await route.continue();
		});
		await ownerAEditor.click();
		await a.keyboard.type(" owner A draft");
		await a.locator(".markdown-editor-save").click();
		try {
			await ownerAStarted;
			await ownerBEditor.click();
			await b.keyboard.type(" owner B saved");
			await b.locator(".markdown-editor-save").click();
			await waitUntil(async () => fs.readFileSync(path.join(workspace, "owners.md"), "utf8").includes("owner B saved"), "the second owner's write lands");
		} finally { releaseOwnerA(); }
		await a.locator(".markdown-editor-conflict").waitFor();
		assert(ownerAWrites === 1 && (await ownerAEditor.textContent())?.includes("owner A draft") && fs.readFileSync(path.join(workspace, "owners.md"), "utf8").includes("owner B saved"), "a competing owner write preserves the first owner's draft and the second owner's saved file");
		await a.unroute("**/workspace-markdown?*");
		await a.locator(".workspace-tab", { hasText: "owners.md" }).locator(".workspace-tab-close").click();
		await a.getByRole("dialog", { name: "Unsaved Markdown changes" }).getByRole("button", { name: "Discard changes" }).click();
		await b.locator(".workspace-tab", { hasText: "owners.md" }).locator(".workspace-tab-close").click();
		const beforeForget = await lockTakenAt();
		await b.getByRole("button", { name: "Forget" }).click();
		await b.getByRole("button", { name: "Forget", exact: true }).last().click();
		await waitUntil(async () => { const now = await activeThread(); return !!now && now !== first; }, "the room is on a new conversation");
		const moved = await activeThread();
		await lockTakenSince(beforeForget, "window B's fresh conversation is connected");

		// Window A still shows the old conversation: a message typed there stays in the box with the plain line.
		const typed = "Typed in the old window.";
		await composerA.fill(typed);
		await composerA.press("Enter");
		await a.getByText(MOVED).first().waitFor({ timeout: 10000 }).catch(async (error) => { throw new Error(`the plain line did not show; the room reads: ${(await a.locator("main").innerText()).slice(-300)}`, { cause: error }); });
		const pageText = await a.locator("body").innerText();
		assert(!/activeThread|persistent-agent/.test(pageText), `no engine words in the room, got ${pageText.slice(-400)}`);
		assert(await composerA.inputValue() === typed, `the typed message stays in the box, got ${JSON.stringify(await composerA.inputValue())}`);
		const shownAsSent = await a.getByText(typed, { exact: true }).evaluateAll((els) => els.filter((el) => el.tagName !== "TEXTAREA").map((el) => el.outerHTML.slice(0, 200)));
		assert(shownAsSent.length === 0, `the message is not shown as sent, got ${JSON.stringify(shownAsSent)}`);
		assert(await a.getByRole("button", { name: "Reload" }).count() === 1, "the line offers Reload");

		// A dirty document is decided before Reload starts its own status read.
		await a.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).click();
		const reloadEditor = a.locator(".markdown-editor-tiptap .ProseMirror");
		await reloadEditor.getByText("Invented source").waitFor();
		await reloadEditor.click();
		await a.keyboard.type(" unsaved document");
		let reloadStatusReads = 0;
		await a.route("**/api/persistent-agents", (route) => { reloadStatusReads++; return route.continue(); });
		await a.getByRole("button", { name: "Reload" }).click();
		const reloadGuard = a.getByRole("dialog", { name: "Unsaved Markdown changes" });
		await reloadGuard.waitFor();
		assert(reloadStatusReads === 0, "dirty Reload asks before its status read starts");
		await reloadGuard.getByRole("button", { name: "Cancel" }).click();
		assert((await reloadEditor.textContent())?.includes("unsaved document") && await a.getByText(MOVED).count() > 0, "canceling dirty Reload retains the document and old context");
		await a.unroute("**/api/persistent-agents");
		// Reload joins the room's new conversation, keeps the message, and sends it there.
		const beforeReload = await lockTakenAt();
		await a.getByRole("button", { name: "Reload" }).click();
		await reloadGuard.getByRole("button", { name: "Discard changes" }).click();
		await waitUntil(async () => (await a.getByText(MOVED).count()) === 0, "the line goes after Reload");
		await a.locator('button[title="Send"]').first().waitFor({ timeout: 15000 });
		await lockTakenSince(beforeReload, "window A's connection is ready after Reload");
		assert(await activeThread() === moved, "Reload does not retire the conversation the other window shows");
		assert(await a.locator("textarea").first().inputValue() === typed, `the message is still in the box after Reload, got ${JSON.stringify(await a.locator("textarea").first().inputValue())}`);
		assert(await a.getByText("First question.").count() === 0, "window A now shows the room's new conversation");
		await a.locator("textarea").first().press("Enter");
		await a.getByText("Answer from claude-fake.").first().waitFor({ timeout: 20000 });
		assert(await activeThread() === moved, "the message went out in the room's new conversation");

		// A third window moves the room on again: Remember in window A says the same line, never that it stopped unexpectedly.
		await waitUntil(async () => JSON.stringify(await (await authedFetch(`${baseUrl}/api/persistent-agents/${agentId}/threads/${moved}`)).json()).includes(typed), "window A's message is saved");
		const c = await ctx.newPage();
		const beforeC = await lockTakenAt();
		await c.goto(`${baseUrl}/#/room/${agentId}`);
		await c.getByText(typed).first().waitFor({ timeout: 15000 });
		await c.locator('button[title="Send"]').first().waitFor({ timeout: 15000 });
		await lockTakenSince(beforeC, "window C's connection is ready");
		await c.getByRole("button", { name: "Forget" }).click();
		await c.getByRole("button", { name: "Forget", exact: true }).last().click();
		await waitUntil(async () => { const now = await activeThread(); return !!now && now !== moved; }, "the room is on a third conversation");
		await a.waitForTimeout(1000);
		assert(await a.getByText(MOVED).count() === 0, "window A has not been told yet");
		await a.getByRole("button", { name: "Remember", exact: true }).click();
		await a.getByText(MOVED).first().waitFor({ timeout: 10000 });
		await a.waitForTimeout(1000);
		assert(await a.getByText(/Remember stopped unexpectedly/).count() === 0 && await a.locator(".checkpoint-preview-actions").count() === 0, "Remember in the old window closes with the plain line");
		let releaseMovedStatus!: () => void, startMovedStatus!: () => void;
		const movedStatusReleased = new Promise<void>((resolve) => { releaseMovedStatus = resolve; });
		const movedStatusStarted = new Promise<void>((resolve) => { startMovedStatus = resolve; });
		await a.route("**/api/persistent-agents", async (route) => { startMovedStatus(); await movedStatusReleased; await route.continue(); });
		await a.getByRole("button", { name: "Reload", exact: true }).click();
		try {
			await movedStatusStarted;
			await a.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
			await a.waitForTimeout(500);
			assert((await a.title()).includes("Two Window Room") && await a.getByText(MOVED).count() > 0, "Home cannot replace an admitted Reload while its real room-status read is pending");
		} finally { releaseMovedStatus(); }
		await waitUntil(async () => (await a.getByText(MOVED).count()) === 0, "the admitted Reload completes after its status read");
		assert((await a.title()).includes("Two Window Room"), "the original room remains selected after the admitted Reload");
		await a.unroute("**/api/persistent-agents");
		// Permission can change without changing the file's content revision.
		const policy = await ctx.newPage();
		await policy.addInitScript({ content: `const realInterval = window.setInterval; window.setInterval = (callback, delay, ...args) => realInterval(callback, delay === 5000 ? 100 : delay, ...args);` });
		await policy.goto(`${baseUrl}/#/room/${agentId}`);
		await policy.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "identity.md" }).click();
		await policy.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented identity source").waitFor();
		await policy.getByRole("button", { name: "RAW", exact: true }).click();
		const policyRaw = policy.getByRole("textbox", { name: "Raw Markdown source" });
		let readOnly = false, policyWrites = 0;
		await policy.route("**/workspace-markdown?*", async (route) => {
			if (route.request().method() !== "GET") { policyWrites++; return route.continue(); }
			const response = await route.fetch();
			const body = await response.json();
			await route.fulfill({ response, json: { ...body, readOnly } });
		});
		await policyRaw.fill("# Invented permission draft\n");
		readOnly = true;
		await waitUntil(async () => !(await policyRaw.isEditable()), "unchanged-revision permission loss fences the real editor");
		assert(await policyRaw.inputValue() === "# Invented permission draft\n" && policyWrites === 0, "permission loss retains the unsaved source and starts no write");
		await policy.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
		const policyGuard = policy.getByRole("dialog", { name: "Unsaved Markdown changes" });
		await policyGuard.getByRole("button", { name: "Save and continue" }).click();
		await policyGuard.waitFor({ state: "hidden" });
		assert((await policy.evaluate(() => location.hash)).includes("/room/") && await policyRaw.inputValue() === "# Invented permission draft\n" && policyWrites === 0, "a guarded Save refuses navigation after permission loss without discarding the draft");
		readOnly = false;
		await waitUntil(() => policyRaw.isEditable(), "restored permission re-enables the real editor");
		await policy.close();
		const d = await ctx.newPage();
		await d.goto(`${baseUrl}/#/room/${agentId}`);
		await d.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "lost-keep.md" }).click();
		await d.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented keep original").waitFor();
		await d.getByRole("button", { name: "RAW", exact: true }).click();
		const keepRaw = d.getByRole("textbox", { name: "Raw Markdown source" });
		await waitUntil(async () => await keepRaw.inputValue() === "# Invented keep original\n", "the Keep mine test loads its original source");
		let releaseLostKeep!: () => void, startLostKeep!: () => void, lostKeepWrites = 0;
		const lostKeepReleased = new Promise<void>((resolve) => { releaseLostKeep = resolve; });
		const lostKeepStarted = new Promise<void>((resolve) => { startLostKeep = resolve; });
		await d.route("**/workspace-markdown?*", async (route) => {
			if (route.request().method() !== "PUT") return route.continue();
			if (++lostKeepWrites !== 1) return route.continue();
			await route.fetch();
			fs.writeFileSync(path.join(workspace, "lost-keep.md"), "# Invented competing source\n");
			startLostKeep();
			await lostKeepReleased;
			await route.abort();
		});
		await keepRaw.fill("# Invented sent source\n");
		await d.locator(".markdown-editor-save").click();
		try {
			await lostKeepStarted;
			await keepRaw.fill("# Invented keep original\n");
		} finally { releaseLostKeep(); }
		await d.locator(".markdown-editor-conflict").waitFor();
		assert(await keepRaw.inputValue() === "# Invented keep original\n", "lost-write conflict keeps the local source before the decision");
		await d.getByRole("button", { name: "Keep mine", exact: true }).click();
		await waitUntil(() => fs.readFileSync(path.join(workspace, "lost-keep.md"), "utf8") === "# Invented keep original\n", "Keep mine writes the retained source over the confirmed competing revision");
		await waitUntil(async () => await d.locator(".markdown-editor-status").textContent() === "Saved", "Keep mine settles after the lost response");
		assert(lostKeepWrites === 2, "Keep mine sends only the original write and the explicitly chosen replacement");
		await d.unroute("**/workspace-markdown?*");
		await d.locator(".workspace-tab", { hasText: "lost-keep.md" }).locator(".workspace-tab-close").click();
		await d.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).click();
		await d.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented source").waitFor();
		await d.getByRole("button", { name: "RAW", exact: true }).click();
		const homeRaw = d.getByRole("textbox", { name: "Raw Markdown source" });
		await waitUntil(async () => await homeRaw.inputValue() === "# Invented source\n", "the Home test loads its original source");
		let releaseHomeWrite!: () => void, startHomeWrite!: () => void, homeWrites = 0;
		const homeWriteReleased = new Promise<void>((resolve) => { releaseHomeWrite = resolve; });
		const homeWriteStarted = new Promise<void>((resolve) => { startHomeWrite = resolve; });
		await d.route("**/workspace-markdown?*", async (route) => {
			if (route.request().method() !== "PUT") return route.continue();
			if (++homeWrites === 1) { startHomeWrite(); await homeWriteReleased; }
			await route.continue();
		});
		await homeRaw.fill("# Invented pending Home write\n");
		await d.locator(".markdown-editor-save").click();
		try {
			await homeWriteStarted;
			await homeRaw.fill("# Invented source\n");
			await d.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
			await d.waitForTimeout(250);
			assert((await d.title()).includes("Two Window Room") && await d.getByRole("dialog", { name: "Unsaved Markdown changes" }).count() === 0, "Home waits for the pending write even when the visible source is clean");
		} finally { releaseHomeWrite(); }
		await d.locator(".persistent-agent-card").filter({ hasText: "Two Window Room" }).waitFor();
		assert(homeWrites === 2 && fs.readFileSync(path.join(workspace, "invented.md"), "utf8") === "# Invented source\n", "Home follows the confirmed latest source without abandoning the sent write");
		await d.unroute("**/workspace-markdown?*");
		{
			const h = await ctx.newPage();
			await h.goto(`${baseUrl}/#/room/${agentId}`);
			await h.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "guard-keep.md" }).click();
			await h.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented keep original").waitFor();
			await h.getByRole("button", { name: "RAW", exact: true }).click();
			const keepRaw = h.getByRole("textbox", { name: "Raw Markdown source" });
			await waitUntil(async () => await keepRaw.inputValue() === "# Invented keep original\n", "the Keep mine test loads its original source");
			let releaseLostKeep!: () => void, startLostKeep!: () => void, lostKeepWrites = 0;
			const lostKeepReleased = new Promise<void>((resolve) => { releaseLostKeep = resolve; });
			const lostKeepStarted = new Promise<void>((resolve) => { startLostKeep = resolve; });
			let releaseKeepDecision!: () => void, startKeepDecision!: () => void;
			const keepDecisionReleased = new Promise<void>((resolve) => { releaseKeepDecision = resolve; });
			const keepDecisionStarted = new Promise<void>((resolve) => { startKeepDecision = resolve; });
			await h.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() !== "PUT") return route.continue();
				if (++lostKeepWrites !== 1) { startKeepDecision(); await keepDecisionReleased; return route.continue(); }
				await route.fetch();
				fs.writeFileSync(path.join(workspace, "guard-keep.md"), "# Invented competing source\n");
				startLostKeep();
				await lostKeepReleased;
				await route.abort();
			});
			await keepRaw.fill("# Invented sent source\n");
			await h.locator(".markdown-editor-save").click();
			try {
				await lostKeepStarted;
				await keepRaw.fill("# Invented keep original\n");
			} finally { releaseLostKeep(); }
			await h.locator(".markdown-editor-conflict").waitFor();
			assert(await keepRaw.inputValue() === "# Invented keep original\n", "lost-write conflict keeps the local source before the decision");
			await h.getByRole("button", { name: "Keep mine", exact: true }).click();
			try {
				await keepDecisionStarted;
				await h.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).click();
				await h.getByRole("dialog", { name: "Unsaved Markdown changes" }).getByRole("button", { name: "Discard changes" }).click();
				await h.waitForTimeout(250);
				assert(await h.getByRole("complementary", { name: "Markdown editor: guard-keep.md" }).count() === 1, "Discard cannot leave while the Keep mine write is unresolved");
			} finally { releaseKeepDecision(); }
			await h.getByRole("complementary", { name: "Markdown editor: invented.md" }).waitFor();
			assert(lostKeepWrites === 2 && fs.readFileSync(path.join(workspace, "guard-keep.md"), "utf8") === "# Invented keep original\n", "Keep mine settles exactly once before Discard continues");
			await h.unroute("**/workspace-markdown?*");
			await h.locator(".workspace-tab", { hasText: "guard-keep.md" }).locator(".workspace-tab-close").click();
			await h.close();
		}
		for (const competing of [false, true]) {
			const targetFile = competing ? "guard-keep-save-conflict.md" : "guard-keep-save.md";
			const k = await ctx.newPage();
			await k.goto(`${baseUrl}/#/room/${agentId}`);
			await k.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: targetFile }).click();
			await k.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented save original").waitFor();
			await k.getByRole("button", { name: "RAW", exact: true }).click();
			const raw = k.getByRole("textbox", { name: "Raw Markdown source" });
			await raw.fill("# Invented mine first\n");
			fs.writeFileSync(path.join(workspace, targetFile), "# Invented competing revision\n");
			await k.locator(".markdown-editor-save").click();
			await k.locator(".markdown-editor-conflict").waitFor();
			let releaseKeep!: () => void, startKeep!: () => void, writes = 0;
			const released = new Promise<void>((resolve) => { releaseKeep = resolve; });
			const started = new Promise<void>((resolve) => { startKeep = resolve; });
			await k.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() !== "PUT") return route.continue();
				if (++writes === 1) { startKeep(); await released; }
				else if (competing) fs.writeFileSync(path.join(workspace, targetFile), "# Invented new competitor\n");
				await route.continue();
			});
			await k.getByRole("button", { name: "Keep mine", exact: true }).click();
			const newConflictResponse = competing ? k.waitForResponse((response) => response.request().method() === "PUT" && response.url().includes("/workspace-markdown?") && response.status() === 409) : null;
			try {
				await started;
				await raw.fill("# Invented mine latest\n");
				await k.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				await k.getByRole("dialog", { name: "Unsaved Markdown changes" }).getByRole("button", { name: "Save and continue" }).click();
				await k.waitForTimeout(250);
				assert(writes === 1 && await k.getByRole("complementary", { name: `Markdown editor: ${targetFile}` }).count() === 1, "Home Save cannot overtake the in-flight Keep mine write");
			} finally { releaseKeep(); }
			if (competing) {
				assert(await newConflictResponse, "the new competing revision receives a real 409");
				await k.locator(".markdown-editor-conflict").waitFor();
				assert((await raw.inputValue()) === "# Invented mine latest\n" && (await k.evaluate(() => location.hash)).includes("/room/") && Number(writes) === 2 && fs.readFileSync(path.join(workspace, targetFile), "utf8") === "# Invented new competitor\n", "a new revision refuses Home and retains the latest local source");
			} else {
				await k.locator(".persistent-agent-card").filter({ hasText: "Two Window Room" }).waitFor();
				assert(Number(writes) === 2 && fs.readFileSync(path.join(workspace, targetFile), "utf8") === "# Invented mine latest\n", "Home waits for the latest source after Keep mine");
			}
			await k.close();
		}
		{
			const t = await ctx.newPage();
			await t.goto(`${baseUrl}/#/room/${agentId}`);
			await t.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "guard-keep-timeout.md" }).click();
			await t.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented timeout original").waitFor();
			await t.getByRole("button", { name: "RAW", exact: true }).click();
			const raw = t.getByRole("textbox", { name: "Raw Markdown source" });
			await raw.fill("# Invented timeout draft\n");
			fs.writeFileSync(path.join(workspace, "guard-keep-timeout.md"), "# Invented timeout competitor\n");
			await t.locator(".markdown-editor-save").click();
			await t.locator(".markdown-editor-conflict").waitFor();
			await t.evaluate(() => {
				const original = window.setTimeout;
				window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: any[]) => original(handler, delay === 30_000 ? 1000 : delay, ...args)) as typeof window.setTimeout;
			});
			let releaseRead!: () => void, startRead!: () => void, writes = 0;
			const released = new Promise<void>((resolve) => { releaseRead = resolve; });
			const started = new Promise<void>((resolve) => { startRead = resolve; });
			await t.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() === "PUT") { writes++; return route.continue(); }
				startRead();
				await released;
				await route.continue().catch(() => {});
			});
			try {
				await t.getByRole("button", { name: "Keep mine", exact: true }).click();
				await started;
				await t.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				const guard = t.getByRole("dialog", { name: "Unsaved Markdown changes" });
				await guard.getByRole("button", { name: "Save and continue" }).click();
				await guard.waitFor({ state: "hidden", timeout: 4000 });
				assert((await raw.inputValue()) === "# Invented timeout draft\n" && (await t.evaluate(() => location.hash)).includes("/room/") && writes === 0, "a timed-out Keep mine read refuses Home and keeps the local draft");
			} finally { releaseRead(); }
			await t.waitForTimeout(500);
			assert(writes === 0 && fs.readFileSync(path.join(workspace, "guard-keep-timeout.md"), "utf8") === "# Invented timeout competitor\n", "a late read cannot start a Keep mine write after timeout");
			await t.close();
		}
		{
			const u = await ctx.newPage();
			await u.goto(`${baseUrl}/#/room/${agentId}`);
			await u.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "guard-unknown-timeout.md" }).click();
			await u.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented unknown original").waitFor();
			await u.getByRole("button", { name: "RAW", exact: true }).click();
			const raw = u.getByRole("textbox", { name: "Raw Markdown source" });
			await u.evaluate(() => {
				const original = window.setTimeout;
				window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: any[]) => original(handler, delay === 30_000 ? 1000 : delay, ...args)) as typeof window.setTimeout;
			});
			let releaseRead!: () => void, startRead!: () => void, releaseDiscardRead!: () => void, startDiscardRead!: () => void, writes = 0, reads = 0;
			const released = new Promise<void>((resolve) => { releaseRead = resolve; });
			const started = new Promise<void>((resolve) => { startRead = resolve; });
			const discardReleased = new Promise<void>((resolve) => { releaseDiscardRead = resolve; });
			const discardStarted = new Promise<void>((resolve) => { startDiscardRead = resolve; });
			await u.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() === "PUT") { writes++; return route.abort(); }
				if (++reads === 1) { startRead(); await released; }
				else { startDiscardRead(); await discardReleased; }
				await route.continue().catch(() => {});
			});
			try {
				await raw.fill("# Invented unknown draft\n");
				await u.locator(".markdown-editor-save").click();
				await started;
				await u.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				const guard = u.getByRole("dialog", { name: "Unsaved Markdown changes" });
				await guard.getByRole("button", { name: "Save and continue" }).click();
				await guard.waitFor({ state: "hidden", timeout: 4000 });
				assert((await raw.inputValue()) === "# Invented unknown draft\n" && (await u.evaluate(() => location.hash)).includes("/room/") && writes === 1, "a timed-out reconciliation refuses Home and retains the unknown write and draft");
			} finally { releaseRead(); }
			try {
				await u.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				const guard = u.getByRole("dialog", { name: "Unsaved Markdown changes" });
				await guard.getByRole("button", { name: "Discard changes" }).click();
				await discardStarted;
				await guard.waitFor({ state: "hidden", timeout: 4000 });
				assert((await raw.inputValue()) === "# Invented unknown draft\n" && (await u.evaluate(() => location.hash)).includes("/room/") && writes === 1, "a timed-out Discard reconciliation retains the unknown write and draft");
			} finally { releaseDiscardRead(); }
			await u.waitForTimeout(500);
			assert(writes === 1 && fs.readFileSync(path.join(workspace, "guard-unknown-timeout.md"), "utf8") === "# Invented unknown original\n", "late reconciliations cannot retry the unknown write");
			await u.close();
		}
		const e = await ctx.newPage();
		await e.goto(`${baseUrl}/#/room/${agentId}`);
		await e.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).click();
		const invalidatedEditor = e.locator(".markdown-editor-tiptap .ProseMirror");
		await invalidatedEditor.getByText("Invented source").waitFor();
		let releaseInvalidatedSave!: () => void, startInvalidatedSave!: () => void;
		const invalidatedSaveReleased = new Promise<void>((resolve) => { releaseInvalidatedSave = resolve; });
		const invalidatedSaveStarted = new Promise<void>((resolve) => { startInvalidatedSave = resolve; });
		await e.route("**/workspace-markdown?*", async (route) => {
			if (route.request().method() !== "PUT") return route.continue();
			startInvalidatedSave();
			await invalidatedSaveReleased;
			await route.continue();
		});
		await invalidatedEditor.click();
		await e.keyboard.type(" identity-fenced draft");
		await e.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
		const invalidatedGuard = e.getByRole("dialog", { name: "Unsaved Markdown changes" });
		await invalidatedGuard.getByRole("button", { name: "Save and continue" }).click();
		try {
			await invalidatedSaveStarted;
			const originalHash = await e.evaluate(() => window.location.hash);
			let beforeUnloadAsked = false;
			e.on("dialog", (dialog) => { if (dialog.type() === "beforeunload") beforeUnloadAsked = true; void dialog.dismiss(); });
			await e.route("**/workspace-files?*", (route) => route.fulfill({ status: 409, json: { code: "person_changed", error: "Invented identity change" } }));
			await e.evaluate(() => window.dispatchEvent(new Event("focus")));
			await e.getByText("Someone else is now signed in on this server.", { exact: true }).waitFor();
			assert(beforeUnloadAsked, "the browser held the invalidated page while the document write was pending");
			const completedWrite = e.waitForResponse((response) => response.request().method() === "PUT" && response.url().includes("/workspace-markdown?"));
			releaseInvalidatedSave();
			assert((await completedWrite).ok(), "the already-sent invented write reaches the real server");
			await e.waitForTimeout(500);
			assert((await e.evaluate(() => window.location.hash)) === originalHash, "a late save cannot execute Home after the page identity changes");
		} finally { releaseInvalidatedSave(); }
		const f = await ctx.newPage();
		await f.goto(`${baseUrl}/#/room/${agentId}`);
		const cleanHome = await f.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).elementHandle();
		assert(cleanHome, "the clean-action Home control is present");
		await f.getByRole("button", { name: "Room settings" }).click();
		await f.locator(".settings-dialog-nav-item").filter({ hasText: /^Folder$/ }).first().click();
		const folderPane = f.locator(".room-settings-section:not([hidden])");
		await folderPane.getByRole("button", { name: "Edit", exact: true }).click();
		await folderPane.getByLabel("Folder path").fill(path.join(workspace, "invented-folder"));
		const cleanOriginalHash = await f.evaluate(() => window.location.hash);
		let settingsUnloadAsked = false;
		f.on("dialog", (dialog) => { if (dialog.type() === "beforeunload") settingsUnloadAsked = true; void dialog.dismiss(); });
		await f.route("**/workspace-files?*", (route) => route.fulfill({ status: 409, json: { code: "person_changed", error: "Invented identity change" } }));
		await f.evaluate(() => window.dispatchEvent(new Event("focus")));
		await f.getByText("Someone else is now signed in on this server.", { exact: true }).waitFor();
		assert(settingsUnloadAsked, "the browser held the invalidated page because Room settings had an unsaved change");
		await cleanHome.evaluate((button) => (button as HTMLButtonElement).click());
		await f.waitForTimeout(500);
		assert((await f.evaluate(() => window.location.hash)) === cleanOriginalHash, "a stale clean Home action cannot run after the page identity changes");
		{
			const identityContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
			await identityContext.addInitScript({ content: `(() => {
				const state = { ids: [], fail: false, malformed: false, fallbackWhileFailed: 0 };
				window.__t20IdentityTest = state;
				const original = crypto.randomUUID.bind(crypto);
				const originalValues = crypto.getRandomValues.bind(crypto);
				Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: function (view) {
					if (state.fail || state.malformed) state.fallbackWhileFailed++;
					return originalValues(view);
				} });
				Object.defineProperty(crypto, "randomUUID", { configurable: true, value: function () {
					if (state.fail) throw new Error("invented crypto failure");
					if (state.malformed) return "invented-invalid-id";
					const id = original();
					state.ids.push(id);
					return id;
				} });
			})();` });
			const page = await identityContext.newPage();
			let popups = 0;
			page.on("popup", () => { popups++; });
			try {
				await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				const room = page.locator(".persistent-agent-card").filter({ hasText: "Two Window Room" });
				await room.waitFor();
				const mountedIds = await page.evaluate(() => (window as any).__t20IdentityTest.ids as string[]);
				assert(mountedIds.length >= 1 && mountedIds.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)), "the real App owner allocates canonical UUIDv4 identity on localhost");
				await room.getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "owners.md" }).click();
				await page.locator(".workspace-tab[data-active='true']", { hasText: "owners.md" }).waitFor();
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "identity.md" }).click();
				await page.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented identity source").waitFor();
				await page.evaluate(() => { (window as any).__t20IdentityTest.fail = true; });
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "owners.md" }).click();
				await page.waitForTimeout(300);
				assert(await page.locator(".workspace-tab[data-active='true']", { hasText: "identity.md" }).count() === 1 && await page.getByRole("dialog", { name: "Unsaved Markdown changes" }).count() === 0 && await page.evaluate(() => (window as any).__t20IdentityTest.fallbackWhileFailed) === 0 && popups === 0, "a failed request ID refuses a clean file selection without fallback or child authority");
				await page.evaluate(() => { (window as any).__t20IdentityTest.fail = false; });
				await page.getByRole("button", { name: "RAW", exact: true }).click();
				const raw = page.getByRole("textbox", { name: "Raw Markdown source" });
				await raw.fill("# Invented identity draft\n");
				const beforeClose = await page.evaluate(() => (window as any).__t20IdentityTest.ids.length as number);
				await page.locator(".workspace-tab", { hasText: "owners.md" }).locator(".workspace-tab-close").click();
				assert(await page.locator(".workspace-tab", { hasText: "owners.md" }).count() === 0 && await raw.inputValue() === "# Invented identity draft\n" && await page.getByRole("dialog", { name: "Unsaved Markdown changes" }).count() === 0 && await page.evaluate(() => (window as any).__t20IdentityTest.ids.length as number) === beforeClose + 1, "closing an inactive tab allocates one request and leaves the active draft without a prompt");
				const beforeRequest = await page.evaluate(() => (window as any).__t20IdentityTest.ids.length as number);
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "owners.md" }).click();
				const guard = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
				await guard.waitFor();
				const ids = await page.evaluate(() => (window as any).__t20IdentityTest.ids as string[]);
				assert(ids.length === beforeRequest + 1 && new Set(ids).size === ids.length && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(ids.at(-1)!), "the real admitted file action allocates a fresh UUIDv4 request");
				await page.evaluate(() => { (window as any).__t20IdentityTest.fail = true; });
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).evaluate((node) => (node as HTMLElement).click());
				assert(await guard.isVisible() && await raw.evaluate((node) => (node as HTMLTextAreaElement).readOnly) && await raw.inputValue() === "# Invented identity draft\n" && await page.evaluate(() => (window as any).__t20IdentityTest.fallbackWhileFailed) === 0, "a competing action preserves the admitted guard and fenced draft");
				await page.evaluate(() => { (window as any).__t20IdentityTest.fail = false; });
				await guard.getByRole("button", { name: "Cancel" }).click();
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "owners.md" }).click();
				await guard.waitFor();
				const repeatedIds = await page.evaluate(() => (window as any).__t20IdentityTest.ids as string[]);
				assert(repeatedIds.length === ids.length + 1 && new Set(repeatedIds).size === repeatedIds.length, "a later admitted action gets a fresh request ID");
				await guard.getByRole("button", { name: "Cancel" }).click();
				const originalHash = await page.evaluate(() => location.hash);
				await page.evaluate(() => { (window as any).__t20IdentityTest.fail = true; });
				await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				await page.waitForTimeout(300);
				assert((await page.evaluate(() => location.hash)) === originalHash && await raw.inputValue() === "# Invented identity draft\n" && await guard.count() === 0 && popups === 0 && await page.evaluate(() => (window as any).__t20IdentityTest.fallbackWhileFailed) === 0, "a throwing request allocator refuses Home without fallback and retains the session without a child");
				await page.evaluate(() => { (window as any).__t20IdentityTest.fail = false; (window as any).__t20IdentityTest.malformed = true; });
				await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				await page.waitForTimeout(300);
				assert((await page.evaluate(() => location.hash)) === originalHash && await raw.inputValue() === "# Invented identity draft\n" && await guard.count() === 0 && popups === 0 && await page.evaluate(() => (window as any).__t20IdentityTest.fallbackWhileFailed) === 0, "a malformed available UUID refuses Home without fallback or session loss");
				const anotherOwner = await identityContext.newPage();
				await anotherOwner.goto(`${baseUrl}/`);
				await anotherOwner.locator(".persistent-agent-card").filter({ hasText: "Two Window Room" }).waitFor();
				const anotherIds = await anotherOwner.evaluate(() => (window as any).__t20IdentityTest.ids as string[]);
				assert(anotherIds.length >= 1 && !ids.includes(anotherIds[0]), "a new App mount allocates a distinct owner UUIDv4");
				await anotherOwner.close();
			} finally { await identityContext.close(); }
		}
		{
			const insecureOrigin = "http://192.0.2.10";
			const insecureContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
			await insecureContext.addInitScript({ content: `(() => {
				const state = { calls: [], fail: false };
				window.__t20FallbackTest = state;
				const original = crypto.getRandomValues.bind(crypto);
				Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: function (view) {
					if (state.fail) throw new Error("invented crypto failure");
					const result = original(view);
					state.calls.push({ before: Array.from(view), output: view });
					return result;
				} });
			})();` });
			let closingInsecure = false;
			await insecureContext.route("**/*", async (route) => {
				try {
					const url = new URL(route.request().url());
					if (url.origin !== insecureOrigin) return await route.abort();
					const headers: Record<string, string> = { ...route.request().headers(), host: `127.0.0.1:${port}`, "x-exxperts-auth": SMOKE_AUTH_TOKEN };
					if (headers.origin) headers.origin = baseUrl;
					const response = await route.fetch({ url: `${baseUrl}${url.pathname}${url.search}`, headers, maxRedirects: 0 });
					await route.fulfill({ response });
				} catch (error) { if (!closingInsecure) throw error; }
			});
			// Hold this unrelated transport without server messages while the owner/HTTP consumers are exercised.
			await insecureContext.routeWebSocket("**/*", () => {});
			const page = await insecureContext.newPage();
			const pageErrors: string[] = [];
			page.on("pageerror", (error) => { pageErrors.push(error.message); });
			let popups = 0;
			page.on("popup", () => { popups++; });
			const calls = () => page.evaluate(() => (window as any).__t20FallbackTest.calls.map((call: any) => ({ before: call.before, after: Array.from(call.output) })) as Array<{ before: number[]; after: number[] }>);
			const validBytes = (call: { before: number[]; after: number[] }) => call.before.length === 16 && call.after.length === 16 && call.after.every((value, index) => value === (index === 6 ? (call.before[index] & 15) | 64 : index === 8 ? (call.before[index] & 63) | 128 : call.before[index]));
			try {
				await page.goto(`${insecureOrigin}/`);
				const room = page.locator(".persistent-agent-card").filter({ hasText: "Two Window Room" });
				await room.waitFor();
				assert(await page.evaluate(() => !isSecureContext && typeof crypto.randomUUID === "undefined"), "the actual owner page uses the intercepted insecure origin");
				const ownerCalls = await calls();
				assert(ownerCalls.length >= 1 && validBytes(ownerCalls[0]), "the App owner consumes 16 real random bytes with UUIDv4 masks on an insecure origin");
				await room.getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "identity.md" }).click();
				await page.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented identity source").waitFor();
				await page.getByRole("button", { name: "RAW", exact: true }).click();
				const raw = page.getByRole("textbox", { name: "Raw Markdown source" });
				await raw.fill("# Invented fallback draft\n");
				const beforeRequest = (await calls()).length;
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "owners.md" }).click();
				const guard = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
				await guard.waitFor();
				const requestCalls = await calls();
				assert(requestCalls.length === beforeRequest + 1 && validBytes(requestCalls.at(-1)!), "the admitted file action uses a fresh 16-byte UUIDv4 allocation");
				await guard.getByRole("button", { name: "Cancel" }).click();
				const hash = await page.evaluate(() => location.hash);
				await page.evaluate(() => { (window as any).__t20FallbackTest.fail = true; });
				await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				await page.waitForTimeout(300);
				assert((await page.evaluate(() => location.hash)) === hash && await raw.inputValue() === "# Invented fallback draft\n" && await guard.count() === 0 && popups === 0, "a throwing fallback refuses the action and retains the owner session without a child");
				await page.evaluate(() => { Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: undefined }); });
				await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				await page.waitForTimeout(300);
				assert(await raw.count() === 1, `the fallback editor remains mounted after missing cryptography: ${pageErrors.join(" | ")}`);
				assert((await page.evaluate(() => location.hash)) === hash && await raw.inputValue() === "# Invented fallback draft\n" && await guard.count() === 0 && popups === 0, "missing cryptographic primitives refuse Home without losing the session or opening a child");
				await page.evaluate(`Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: function () { return new Uint8Array(1); } })`);
				await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				await page.waitForTimeout(300);
				assert((await page.evaluate(() => location.hash)) === hash && await raw.inputValue() === "# Invented fallback draft\n" && await guard.count() === 0 && popups === 0, "a malformed fallback result refuses Home without creating authority");
			} finally { closingInsecure = true; await insecureContext.close(); }
		}
		{
			const noOwnerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
			await noOwnerContext.addInitScript({ content: `(() => {
				const state = { attempts: 0, fallback: 0 };
				window.__t20OwnerFailure = state;
				const originalValues = crypto.getRandomValues.bind(crypto);
				Object.defineProperty(crypto, "getRandomValues", { configurable: true, value: function (view) { state.fallback++; return originalValues(view); } });
				Object.defineProperty(crypto, "randomUUID", { configurable: true, value: function () { state.attempts++; throw new Error("invented owner failure"); } });
			})();` });
			const page = await noOwnerContext.newPage();
			let popups = 0;
			page.on("popup", () => { popups++; });
			try {
				await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				const room = page.locator(".persistent-agent-card").filter({ hasText: "Two Window Room" });
				await room.waitFor();
				const failure = await page.evaluate(() => (window as any).__t20OwnerFailure as { attempts: number; fallback: number });
				assert(failure.attempts >= 1 && failure.fallback === 0, "a throwing owner primitive fails without trying another primitive");
				await room.getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await page.waitForTimeout(300);
				assert(await room.isVisible() && await page.getByRole("navigation", { name: "Room navigation" }).count() === 0 && popups === 0, "an owner without identity grants no room action or child authority");
				await page.getByRole("navigation", { name: "Product navigation" }).getByRole("button", { name: "Memory", exact: true }).click();
				await page.getByRole("heading", { name: "Memory.", exact: true }).waitFor({ timeout: 10_000 });
				assert(popups === 0, "an unavailable document owner does not block unrelated navigation with no room session");
				await page.getByRole("navigation", { name: "Product navigation" }).getByRole("button", { name: "Rooms", exact: true }).click();
				await room.waitFor();
				await page.getByRole("navigation", { name: "Product navigation" }).getByRole("button", { name: "Wallet", exact: true }).click();
				await page.getByRole("heading", { name: "Wallet.", exact: true }).waitFor();
				await page.getByRole("navigation", { name: "Product navigation" }).getByRole("button", { name: "Rooms", exact: true }).click();
				await room.waitFor();
				assert(popups === 0, "unrelated navigation returns to Rooms without child authority");
			} finally { await noOwnerContext.close(); }
		}
		await ctx.close();
	} finally {
		await browser.close();
	}
	console.log("two-window-room-ui smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-6000));
	throw error;
} finally {
	try { (providers as any).closeAllConnections?.(); } catch {}
	try { providers.close(); } catch {}
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
