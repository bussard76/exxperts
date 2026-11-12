// The real chat-owned document host moves between the room and its child window.
// All files and room data in this smoke are invented and confined to a temporary home.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

assert(fs.existsSync(chromium.executablePath()), "Chromium is required for detached-document evidence");
const webServerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-detached-documents-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
const workspace = path.join(tempRoot, "workspace");
for (const dir of [agentsRoot, agentDir, workspace]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
const original = "# Invented source\r\n\r\n";
// HTML textarea values expose CRLF as LF; the file bytes are checked separately.
const rawDisplay = original.replaceAll("\r\n", "\n");
fs.writeFileSync(path.join(workspace, "invented.md"), original);
fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({ providers: {
	"fake-claude": { name: "Fake Claude", baseUrl: "http://127.0.0.1:9", api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] },
} }), { mode: 0o600 });
fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [
	{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" },
] }), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }), { mode: 0o600 });

const waitUntil = waitEvery(150, 20_000);
async function api(pathname: string, init: AuthedFetchInit = {}): Promise<{ status: number; body: any }> {
	const response = await authedFetch(`${baseUrl}${pathname}`, { ...init, headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers } });
	const text = await response.text();
	return { status: response.status, body: text ? JSON.parse(text) : null };
}

let server: ChildProcessWithoutNullStreams | undefined;
const serverOutput: string[] = [];
try {
	server = spawn("npx", ["tsx", "src/index.ts"], {
		shell: process.platform === "win32",
		...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
		cwd: webServerDir,
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((response) => response.ok).catch(() => false), "server ready", 60_000);
	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Cedar Studio", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, "the invented room is created");
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, "the invented workspace is configured");
	const browser = await chromium.launch();
	try {
		const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
		try {
			const page = await context.newPage();
			let writes = 0;
			page.on("request", (request) => { if (request.method() === "PUT" && request.url().includes("/workspace-markdown?")) writes++; });
			await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
			await page.waitForLoadState("networkidle");
			const dismiss = page.locator(".whats-new-close");
			if (await dismiss.count()) await dismiss.click();
			await page.locator(".persistent-agent-card").filter({ hasText: "Cedar Studio" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			const detach = page.getByRole("button", { name: "Detach", exact: true });
			assert(await detach.count() === 1 && await detach.isEnabled(), "a selected room offers Detach even before opening a tab");
			let releaseLoad!: () => void, beginLoad!: () => void;
			const loadReleased = new Promise<void>((resolve) => { releaseLoad = resolve; });
			const loadStarted = new Promise<void>((resolve) => { beginLoad = resolve; });
			await page.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() !== "GET") return route.continue();
				beginLoad();
				await loadReleased;
				await route.fulfill({ status: 403, json: { code: "workspace_read_forbidden", error: "Invented read refusal" } });
			});
			const emptyOpened = page.waitForEvent("popup");
			await detach.click();
			const emptyChild = await emptyOpened;
			assert(await emptyChild.locator(".workspace-tab").count() === 0, "an empty document session has no invented tab");
			try {
				await emptyChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).click();
				await loadStarted;
				await emptyChild.getByText("Loading file…", { exact: true }).waitFor();
			} finally { releaseLoad(); }
			await emptyChild.getByText("Invented read refusal", { exact: true }).waitFor();
			const closedEmptyChild = emptyChild.waitForEvent("close");
			await emptyChild.getByRole("button", { name: "Return", exact: true }).click();
			await closedEmptyChild;
			assert(await page.getByText("Invented read refusal", { exact: true }).isVisible() && Number(writes) === 0, "Return retains a load error without inventing a draft or writing");
			await page.unroute("**/workspace-markdown?*");
			await page.locator(".workspace-tab", { hasText: "invented.md" }).locator(".workspace-tab-close").click();
			await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).click();
			await page.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented source").waitFor();
			await page.getByRole("button", { name: "RAW", exact: true }).click();
			const raw = page.getByRole("textbox", { name: "Raw Markdown source" });
			await raw.waitFor();
			assert(await raw.inputValue() === rawDisplay, "the original RAW source is presented");
			assert(await detach.count() === 1 && await detach.isEnabled(), "the document session offers Detach when all safeguards are ready");
			await page.evaluate(`window.__t20OriginalOpen = window.open; window.open = () => null`);
			try {
				await detach.click();
				assert(await raw.inputValue() === rawDisplay && writes === 0 && fs.readFileSync(path.join(workspace, "invented.md"), "utf8") === original, "a blocked popup retains the attached source and sends no write");
			} finally {
				await page.evaluate(`window.open = window.__t20OriginalOpen; delete window.__t20OriginalOpen`);
			}
			const opened = page.waitForEvent("popup");
			await detach.click();
			const child = await opened;
			await child.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
			await child.locator(".workspace-tab[data-active='true']", { hasText: "invented.md" }).waitFor();
			assert(await child.getByRole("textbox", { name: "Raw Markdown source" }).inputValue() === rawDisplay, "the child presents the source and active tab");
			assert(await page.locator("textarea").first().isVisible(), "chat remains usable in the owner window");
			await child.locator(".workspace-tab", { hasText: "invented.md" }).locator(".workspace-tab-close").click();
			assert(!child.isClosed() && await child.locator(".workspace-tab").count() === 0, "closing a tab leaves the document child open");
			await child.locator(".workspace-file-browser-file", { hasText: "invented.md" }).click();
			assert(!child.isClosed(), "selecting a file does not close the document child");
			await child.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented source").waitFor();
			await child.getByRole("button", { name: "RAW", exact: true }).click();
			const childRaw = child.getByRole("textbox", { name: "Raw Markdown source" });
			const edited = "# Invented child draft\n\n";
			// Hold the ordinary one-second autosave deadline while testing the movement itself.
			await page.evaluate(`window.__t20OriginalTimeout = window.setTimeout; window.setTimeout = (callback, delay, ...args) => window.__t20OriginalTimeout(callback, delay === 1000 ? 30000 : delay, ...args)`);
			await child.evaluate(`window.__t20OriginalTimeout = window.setTimeout; window.setTimeout = (callback, delay, ...args) => window.__t20OriginalTimeout(callback, delay === 1000 ? 30000 : delay, ...args)`);
			try {
				await childRaw.fill(edited);
				await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				const guard = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
				await guard.getByRole("button", { name: "Cancel", exact: true }).click();
				assert(!child.isClosed() && (await page.evaluate(() => location.hash)).includes("/room/") && await childRaw.inputValue() === edited, "Cancel retains the room, child and exact draft");
				const closed = child.waitForEvent("close");
				await child.getByRole("button", { name: "Return", exact: true }).click();
				await closed;
				assert(await raw.inputValue() === edited && writes === 0 && fs.readFileSync(path.join(workspace, "invented.md"), "utf8") === original, "Return retains the child's exact unsaved source without a movement write");
			} finally {
				await page.evaluate(`window.setTimeout = window.__t20OriginalTimeout; delete window.__t20OriginalTimeout`);
			}
			let releaseWrite!: () => void, beginWrite!: () => void;
			const writeReleased = new Promise<void>((resolve) => { releaseWrite = resolve; });
			const writeStarted = new Promise<void>((resolve) => { beginWrite = resolve; });
			await page.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() !== "PUT") return route.continue();
				beginWrite();
				await writeReleased;
				await route.continue();
			});
			const reopened = page.waitForEvent("popup");
			await detach.click();
			const savingChild = await reopened;
			await savingChild.getByRole("textbox", { name: "Raw Markdown source" }).waitFor();
			try {
				await savingChild.locator(".markdown-editor-save").click();
				await writeStarted;
				const closedSavingChild = savingChild.waitForEvent("close");
				await savingChild.getByRole("button", { name: "Return", exact: true }).click();
				await closedSavingChild;
				assert(await raw.inputValue() === edited && Number(writes) === 1, "Return retains a single pending Save and its source");
				await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				const pendingGuard = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
				await pendingGuard.getByRole("button", { name: "Discard changes" }).click();
				assert((await page.evaluate(() => location.hash)).includes("/room/"), "Discard cannot leave while the retained Save is pending");
				await pendingGuard.getByRole("button", { name: "Cancel", exact: true }).click();
			} finally { releaseWrite(); }
			await waitUntil(() => fs.readFileSync(path.join(workspace, "invented.md"), "utf8") === edited, "the retained Save reaches the original workspace");
			assert(Number(writes) === 1 && (await page.evaluate(() => location.hash)).includes("/room/"), "moving the pending Save sends no second write and the canceled leave stays canceled");
			await waitUntil(async () => await page.locator(".markdown-editor-status").textContent() === "Saved", "the retained Save settles");
			await page.unroute("**/workspace-markdown?*");
			const conflictOpened = page.waitForEvent("popup");
			await detach.click();
			let conflictChild = await conflictOpened;
			const conflictRaw = conflictChild.getByRole("textbox", { name: "Raw Markdown source" });
			await conflictRaw.waitFor();
			const conflictDraft = "# Invented child conflict draft\n";
			await page.evaluate(`window.__t20OriginalTimeout = window.setTimeout; window.setTimeout = (callback, delay, ...args) => window.__t20OriginalTimeout(callback, delay === 1000 ? 30000 : delay, ...args)`);
			await conflictChild.evaluate(`window.__t20OriginalTimeout = window.setTimeout; window.setTimeout = (callback, delay, ...args) => window.__t20OriginalTimeout(callback, delay === 1000 ? 30000 : delay, ...args)`);
			try {
				await conflictRaw.fill(conflictDraft);
				fs.writeFileSync(path.join(workspace, "invented.md"), "# Invented external revision\n");
				await conflictChild.locator(".markdown-editor-conflict").waitFor();
			} finally { await page.evaluate(`window.setTimeout = window.__t20OriginalTimeout; delete window.__t20OriginalTimeout`); }
			await conflictChild.close();
			await page.locator(".markdown-editor-conflict").waitFor();
			assert(await raw.inputValue() === conflictDraft && Number(writes) === 1, "unexpected browser-child closure retains the polled conflict and exact local source without writing");
			const conflictReopened = page.waitForEvent("popup");
			await detach.click();
			conflictChild = await conflictReopened;
			await conflictChild.locator(".markdown-editor-conflict").waitFor();
			let releaseKeep!: () => void, beginKeep!: () => void;
			const keepReleased = new Promise<void>((resolve) => { releaseKeep = resolve; });
			const keepStarted = new Promise<void>((resolve) => { beginKeep = resolve; });
			await page.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() !== "PUT") return route.continue();
				beginKeep();
				await keepReleased;
				await route.continue();
			});
			try {
				await conflictChild.getByRole("button", { name: "Keep mine", exact: true }).click();
				await keepStarted;
				const closedConflictChild = conflictChild.waitForEvent("close");
				await conflictChild.getByRole("button", { name: "Return", exact: true }).click();
				await closedConflictChild;
				assert(await raw.inputValue() === conflictDraft && Number(writes) === 2, "Return retains the pending conflict resolution and exact draft");
			} finally { releaseKeep(); }
			await waitUntil(() => fs.readFileSync(path.join(workspace, "invented.md"), "utf8") === conflictDraft, "the retained Keep mine reaches the original workspace");
			assert(Number(writes) === 2, "returning a pending Keep mine sends no duplicate write");
			await waitUntil(async () => await page.locator(".markdown-editor-status").textContent() === "Saved", "the retained Keep mine settles");
			await page.unroute("**/workspace-markdown?*");
			const unknownOpened = page.waitForEvent("popup");
			await detach.click();
			const unknownChild = await unknownOpened;
			const unknownRaw = unknownChild.getByRole("textbox", { name: "Raw Markdown source" });
			await unknownRaw.waitFor();
			const unknownDraft = "# Invented unresolved child draft\n";
			await page.route("**/workspace-markdown?*", (route) => route.request().method() === "PUT" ? route.abort() : route.continue());
			await unknownRaw.fill(unknownDraft);
			await unknownChild.locator(".markdown-editor-save").click();
			await unknownChild.locator(".markdown-editor-error").waitFor();
			const closedUnknownChild = unknownChild.waitForEvent("close");
			await unknownChild.getByRole("button", { name: "Return", exact: true }).click();
			await closedUnknownChild;
			assert(await raw.inputValue() === unknownDraft && Number(writes) === 3, "Return retains an unknown write and its source");
			await page.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
			const unknownGuard = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
			await unknownGuard.getByRole("button", { name: "Discard changes" }).click();
			await unknownGuard.waitFor({ state: "hidden" });
			assert((await page.evaluate(() => location.hash)).includes("/room/") && await raw.inputValue() === unknownDraft && Number(writes) === 3, "an unresolved returned write refuses Discard without a retry");
			const lossOpened = page.waitForEvent("popup");
			await detach.click();
			const lostChild = await lossOpened;
			await lostChild.getByRole("textbox", { name: "Raw Markdown source" }).waitFor();
			await lostChild.close();
			await waitUntil(async () => await raw.isVisible(), "the owner recovers after the real browser child closes");
			assert(await raw.inputValue() === unknownDraft && Number(writes) === 3, "unexpected browser-child closure retains the unresolved source without a retry");
		} finally { await context.close(); }
	} finally { await browser.close(); }
	console.log("workspace-detached-documents-ui smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-4000));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
