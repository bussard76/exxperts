// RAW mode of the Markdown editor is editable: what is typed there is what is
// saved, byte for byte, through the same save path as the rich editor.
// Offline: the room's model is never asked. Throwaway HOME, invented files only.
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

{
	const p = typeof chromium?.executablePath === "function" ? chromium.executablePath() : "";
	if (!p || !fs.existsSync(p)) {
		console.log("workspace markdown raw ui smoke skipped (Chromium not installed)");
		process.exit(0);
	}
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-markdown-raw-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

const folder = path.join(tempHome, "Projects", "handbook");
fs.mkdirSync(folder, { recursive: true });
// Written with `*` bullets and a double blank line on purpose: the rich editor would normalise both.
const notes = path.join(folder, "notes.md");
const NOTES = "# Notes\n\n* first\n* second\n\n\nTail line\n";
const todo = path.join(folder, "todo.md");
fs.writeFileSync(todo, "# Todo\n\n- [ ] first\n- [x] second\n");
fs.writeFileSync(notes, NOTES);

fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({
	providers: { "fake-claude": { name: "Fake Claude", baseUrl: "http://127.0.0.1:9", api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] } },
}, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [
	{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" },
] }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }, null, 2), { mode: 0o600 });

const waitUntil = waitEvery(150, 15_000);

async function api(pathname: string, init: AuthedFetchInit = {}): Promise<{ status: number; body: any }> {
	const response = await authedFetch(`${baseUrl}${pathname}`, { ...init, headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers } });
	const text = await response.text();
	return { status: response.status, body: text ? JSON.parse(text) : null };
}

let server: ChildProcessWithoutNullStreams | undefined;
const serverOutput: string[] = [];
try {
	server = spawn(process.execPath, ["bin/exxperts-web.cjs", "--port", String(port), "--no-open"], {
		shell: process.platform === "win32",
		...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
		cwd: repoRoot,
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready", 60_000);

	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Handbook", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, `the room is created, got ${created.status}`);
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, `the folder is saved, got ${saved.status}`);

	const browser = await chromium.launch();
	try {
		const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
		await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
		await page.waitForLoadState("networkidle");
		const dismiss = page.locator(".whats-new-close");
		if (await dismiss.count()) await dismiss.click();
		const card = page.locator(".persistent-agent-card").filter({ hasText: "Handbook" });
		await card.waitFor({ timeout: 10_000 });
		await card.getByRole("button", { name: /^(Enter|Resume)$/ }).click();

		const tree = page.locator(".sidebar-workspace-files");
		const openNotes = async () => { await tree.locator(".workspace-file-browser-file", { hasText: "notes.md" }).click({ timeout: 15_000 }); };
		const raw = page.getByRole("textbox", { name: "Raw Markdown source" });
		const status = page.locator(".markdown-editor-status");
		await openNotes();
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor();

		// 1. Switching modes without typing changes nothing on disk and leaves the file clean.
		await page.getByRole("button", { name: "RAW", exact: true }).click();
		await raw.waitFor();
		// The text field fills the pane: a click anywhere in it puts the cursor there.
		const box = await raw.boundingBox();
		const body = await page.locator(".markdown-editor-body").boundingBox();
		assert(box && body && box.height >= body.height - 60, `RAW fills the pane, got ${box?.height} of ${body?.height}`);
		await page.getByRole("button", { name: "Edit", exact: true }).click();
		await page.getByRole("button", { name: "RAW", exact: true }).click();
		await raw.waitFor();
		await page.waitForTimeout(1500);
		assert(fs.readFileSync(notes, "utf8") === NOTES, "switching modes without typing leaves the file byte-identical");
		assert((await status.textContent())?.trim() === "Saved", `the file stays clean, got ${await status.textContent()}`);
		console.log("  ok  switching modes without typing changes nothing");

		// 2. Typing in RAW is saved exactly as typed, not normalised.
		await raw.click();
		await raw.evaluate((el) => { const t = el as HTMLTextAreaElement; t.setSelectionRange(t.value.length, t.value.length); });
		await page.keyboard.type("RAW tail");
		await waitUntil(() => fs.readFileSync(notes, "utf8").includes("RAW tail"), "the RAW edit is autosaved");
		const afterRaw = fs.readFileSync(notes, "utf8");
		assert(afterRaw === NOTES + "RAW tail", `only the typed text is added, nothing is reformatted: ${JSON.stringify(afterRaw)}`);
		const shown = await raw.inputValue();
		assert(fs.readFileSync(notes, "utf8") === shown, `what RAW shows is what was saved, byte for byte: ${JSON.stringify(shown)} vs ${JSON.stringify(fs.readFileSync(notes, "utf8"))}`);
		await waitUntil(async () => (await status.textContent())?.trim() === "Saved", "RAW edit shows as saved");
		console.log("  ok  RAW typing is saved byte for byte");

		// 3. The rich editor shows the RAW edit, and a markup edit made in RAW is rendered.
		await raw.click();
		await raw.evaluate((el) => { const t = el as HTMLTextAreaElement; t.setSelectionRange(t.value.length, t.value.length); });
		await page.keyboard.type("\n\n## From RAW\n");
		await waitUntil(() => fs.readFileSync(notes, "utf8").includes("## From RAW"), "the heading typed in RAW is saved");
		await page.getByRole("button", { name: "Edit", exact: true }).click();
		await page.locator(".markdown-editor-tiptap .ProseMirror h2", { hasText: "From RAW" }).waitFor();
		console.log("  ok  Edit shows what RAW typed");

		// 4. A change made on disk while RAW is dirty gives the conflict choice, and Reload wins.
		await page.getByRole("button", { name: "RAW", exact: true }).click();
		await raw.waitFor();
		await page.route("**/workspace-markdown?**", async (route) => {
			if (route.request().method() === "PUT") await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "mock save failure" }) });
			else await route.continue();
		});
		await raw.click();
		await raw.evaluate((el) => { const t = el as HTMLTextAreaElement; t.setSelectionRange(t.value.length, t.value.length); });
		await page.keyboard.type(" unsaved");
		await page.locator(".markdown-editor-error").waitFor({ state: "visible" });
		await page.unroute("**/workspace-markdown?**");
		fs.writeFileSync(notes, "# Changed outside\n");
		await page.locator(".markdown-editor-save").click();
		await page.locator(".markdown-editor-conflict").waitFor({ state: "visible" });
		await page.getByRole("button", { name: "Reload" }).click();
		await waitUntil(async () => (await raw.inputValue()) === "# Changed outside\n", "Reload replaces the RAW text");
		await page.waitForTimeout(2500);
		assert(fs.readFileSync(notes, "utf8") === "# Changed outside\n", "an old RAW draft is not written over the reloaded file");
		console.log("  ok  Reload wins over a dirty RAW draft");

		// 5. Keep mine writes the RAW draft.
		await raw.click();
		await raw.evaluate((el) => { const t = el as HTMLTextAreaElement; t.setSelectionRange(t.value.length, t.value.length); });
		await page.keyboard.type("mine");
		await waitUntil(() => fs.readFileSync(notes, "utf8") === "# Changed outside\nmine", "the next RAW edit is saved on top of the reloaded file");
		console.log("  ok  RAW saves again after a reload");

		// 6. Task checkmarks. In Edit a rendered checkbox is clickable and saves "[x]".
		await tree.locator(".workspace-file-browser-file", { hasText: "todo.md" }).click();
		await page.getByRole("button", { name: "Edit", exact: true }).click();
		const boxes = page.locator('.markdown-editor-tiptap .ProseMirror input[type="checkbox"]');
		await waitUntil(async () => (await boxes.count()) === 2, "both task items render as checkboxes");
		await boxes.first().click();
		await waitUntil(() => fs.readFileSync(todo, "utf8").includes("- [x] first"), "clicking a checkbox saves it as done");
		assert(fs.readFileSync(todo, "utf8").includes("- [x] second"), "the other task is untouched");
		console.log("  ok  Edit: a clicked checkbox is saved as [x]");

		// In RAW the task button works on the text: plain -> open -> done -> plain.
		await page.getByRole("button", { name: "RAW", exact: true }).click();
		await raw.waitFor();
		await raw.evaluate((el) => { const t = el as HTMLTextAreaElement; t.value; });
		await raw.click();
		await raw.evaluate((el) => { const t = el as HTMLTextAreaElement; t.setSelectionRange(t.value.length, t.value.length); });
		await page.keyboard.type("plain note");
		await waitUntil(() => fs.readFileSync(todo, "utf8").endsWith("plain note"), "a plain line is typed in RAW");
		const taskButton = page.getByRole("button", { name: "Task list" });
		await taskButton.click();
		await waitUntil(() => fs.readFileSync(todo, "utf8").endsWith("- [ ] plain note"), "the button turns the line into an open task");
		await taskButton.click();
		await waitUntil(() => fs.readFileSync(todo, "utf8").endsWith("- [x] plain note"), "the button marks it done");
		await taskButton.click();
		await waitUntil(() => fs.readFileSync(todo, "utf8").endsWith("\nplain note"), "the button takes the checkbox off again");
		assert(fs.readFileSync(todo, "utf8").startsWith("# Todo\n\n- [x] first\n- [x] second\n"), "other lines stay as they were");
		console.log("  ok  RAW: the task button cycles the line");

		// 7. A read-only grant makes the RAW text read-only.
		const readOnly = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "custom", allowedToolNames: ["ls", "read"] } }) });
		assert(readOnly.status === 200, "switch the room to read-only tools");
		await page.reload();
		await page.waitForLoadState("networkidle");
		if (await dismiss.count()) await dismiss.click();
		// The reload may land inside the room already; the room list only shows when it does not.
		if (await card.count()) await card.getByRole("button", { name: /^(Enter|Resume)$/ }).click();
		await openNotes();
		await page.getByRole("button", { name: "RAW", exact: true }).click();
		await raw.waitFor();
		assert(await raw.evaluate((el) => (el as HTMLTextAreaElement).readOnly), "RAW is read-only without a write grant");
		console.log("  ok  RAW is read-only without write access");
	} finally {
		await browser.close();
	}
	console.log("workspace markdown raw ui smoke passed");
} catch (error) {
	console.error(serverOutput.join("").slice(-2000));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
