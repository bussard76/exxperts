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
			await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).click();
			await page.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented source").waitFor();
			await page.getByRole("button", { name: "RAW", exact: true }).click();
			const raw = page.getByRole("textbox", { name: "Raw Markdown source" });
			await raw.waitFor();
			assert(await raw.inputValue() === rawDisplay, "the original RAW source is presented");
			const detach = page.getByRole("button", { name: "Detach", exact: true });
			assert(await detach.count() === 1 && await detach.isEnabled(), "the document session offers Detach when all safeguards are ready");
			const opened = page.waitForEvent("popup");
			await detach.click();
			const child = await opened;
			await child.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
			await child.locator(".workspace-tab[data-active='true']", { hasText: "invented.md" }).waitFor();
			assert(await child.getByRole("textbox", { name: "Raw Markdown source" }).inputValue() === rawDisplay, "the child presents the source and active tab");
			assert(await page.locator("textarea").first().isVisible(), "chat remains usable in the owner window");
			const childRaw = child.getByRole("textbox", { name: "Raw Markdown source" });
			const edited = "# Invented child draft\n\n";
			await childRaw.fill(edited);
			const closed = child.waitForEvent("close");
			await child.getByRole("button", { name: "Return", exact: true }).click();
			await closed;
			assert(await raw.inputValue() === edited && writes === 0 && fs.readFileSync(path.join(workspace, "invented.md"), "utf8") === original, "Return retains the child's exact unsaved source without a movement write");
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
