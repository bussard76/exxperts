// Files clicked in the workspace tree open as tabs in the right pane: PDF, image,
// Word and Excel read-only, Markdown in its editor. Clicking a file again brings
// its tab back, tabs switch and close, and closing the last one closes the pane.
// Offline: the room's model is never asked. Throwaway HOME.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";
import { ONE_PIXEL_PNG, onePagePdf, smallDocx, smallWorkbook } from "./workspace-preview-fixtures.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

{
	const p = typeof chromium?.executablePath === "function" ? chromium.executablePath() : "";
	if (!p || !fs.existsSync(p)) {
		console.log("workspace file tabs ui smoke skipped (Chromium not installed)");
		process.exit(0);
	}
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webServerDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-file-tabs-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

const folder = path.join(tempHome, "Projects", "archive");
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(path.join(folder, "report.pdf"), onePagePdf("Quarter"));
fs.writeFileSync(path.join(folder, "photo.png"), ONE_PIXEL_PNG);
fs.writeFileSync(path.join(folder, "letter.docx"), await smallDocx());
fs.writeFileSync(path.join(folder, "book.xlsx"), smallWorkbook());
fs.writeFileSync(path.join(folder, "notes.md"), "# Notes\n\nSome text\n");
fs.writeFileSync(path.join(folder, "old.doc"), "legacy");
fs.writeFileSync(path.join(folder, "plain.txt"), "plain");

// A provider at an address nobody answers: the room only has to open, never answer.
fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({
	providers: { "fake-claude": { name: "Fake Claude", baseUrl: "http://127.0.0.1:9", api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] } },
}, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [
	{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" },
] }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }, null, 2), { mode: 0o600 });

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
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready", 60_000);

	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Archive", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, `the room is created, got ${created.status}`);
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, `the folder is saved, got ${saved.status} ${JSON.stringify(saved.body)}`);

	const browser = await chromium.launch();
	try {
		const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
		const page = await context.newPage();
		const pageErrors: string[] = [];
		page.on("pageerror", (error) => pageErrors.push(error.message));
		await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
		await page.waitForLoadState("networkidle");
		const dismiss = page.locator(".whats-new-close");
		if (await dismiss.count()) await dismiss.click();

		const card = page.locator(".persistent-agent-card").filter({ hasText: "Archive" });
		await card.waitFor({ timeout: 10_000 });
		await card.getByRole("button", { name: /^(Enter|Resume)$/ }).click();

		const tree = page.locator(".sidebar-workspace-files");
		const treeFile = (name: string) => tree.locator(".workspace-file-browser-file", { hasText: name });
		const tabs = page.locator(".workspace-tab");
		const tab = (name: string) => tabs.filter({ hasText: name });
		const activeName = async () => (await page.locator(".workspace-tab[data-active='true'] .workspace-tab-select").textContent())?.trim();
		const tabNames = async () => (await tabs.locator(".workspace-tab-select").allTextContents()).map((name) => name.trim());

		await treeFile("report.pdf").click({ timeout: 20_000 });
		const canvas = page.locator(".workspace-preview-pdf canvas");
		await waitUntil(async () => (await canvas.count()) === 1, "the PDF page is drawn");
		const painted = await canvas.evaluate((node) => {
			const c = node as HTMLCanvasElement;
			const pixels = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
			for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 128) return true;
			return false;
		});
		assert(painted, "the PDF page carries visible text");
		console.log("  ok  a PDF opens as a tab and shows its page");

		await treeFile("photo.png").click();
		const image = page.locator(".workspace-preview-image img");
		await waitUntil(() => image.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0), "the image has loaded");
		console.log("  ok  an image opens as a second tab");

		await treeFile("letter.docx").click();
		const wordFrame = page.locator(".workspace-preview-word iframe");
		await wordFrame.waitFor({ timeout: 20_000 });
		assert(await wordFrame.getAttribute("sandbox") === "", "the Word view runs in a frame without any permission");
		const wordBody = page.frameLocator(".workspace-preview-word iframe").locator("body");
		await waitUntil(async () => (await wordBody.textContent())?.includes("Hello from Word") ?? false, "the Word text shows");
		assert((await wordBody.textContent())?.includes("<script>alert(1)</script>"), "script-like text stays visible text");
		assert(await page.frameLocator(".workspace-preview-word iframe").locator("table td").count() === 2, "the Word table is a table");
		console.log("  ok  a Word file shows its text and table, inert");

		await treeFile("book.xlsx").click();
		const table = page.locator(".workspace-preview-sheet table");
		await table.waitFor({ timeout: 20_000 });
		assert((await table.textContent())?.includes("Apples"), "the first sheet shows");
		await page.locator(".workspace-preview-sheet-tabs button", { hasText: "Places" }).click();
		await waitUntil(async () => (await table.textContent())?.includes("Springfield") ?? false, "the second sheet shows");
		console.log("  ok  an Excel file shows its sheets as tables");

		await treeFile("notes.md").click();
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor({ timeout: 20_000 });
		assert(JSON.stringify(await tabNames()) === JSON.stringify(["report.pdf", "photo.png", "letter.docx", "book.xlsx", "notes.md"]), `every file has one tab, got ${JSON.stringify(await tabNames())}`);
		console.log("  ok  a Markdown file opens its editor in a tab beside them");

		await treeFile("plain.txt").click();
		assert((await tabs.count()) === 5, "a file type without a view opens no tab");

		await treeFile("photo.png").click();
		await waitUntil(async () => (await activeName()) === "photo.png", "clicking the file again activates its tab");
		assert((await tabs.count()) === 5, "clicking the file again adds no tab");
		await image.waitFor({ timeout: 10_000 });
		assert(await page.locator(".workspace-file-browser-file.selected, .workspace-file-browser-file[aria-current='true']").filter({ hasText: "photo.png" }).count() === 1, "the tree marks the active file");
		console.log("  ok  clicking a file again brings its tab back");

		await tab("book.xlsx").locator(".workspace-tab-select").click();
		await table.waitFor({ timeout: 10_000 });
		assert((await activeName()) === "book.xlsx", "a tab switches when clicked");
		console.log("  ok  tabs switch");

		await tab("photo.png").locator(".workspace-tab-close").click();
		assert((await activeName()) === "book.xlsx", "closing another tab keeps the active one");
		assert((await tabs.count()) === 4, "the closed tab is gone");
		await tab("book.xlsx").locator(".workspace-tab-close").click();
		await waitUntil(async () => (await activeName()) === "notes.md", "closing the active tab moves to its neighbour");
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor({ timeout: 10_000 });
		console.log("  ok  tabs close, and the neighbour takes over");

		await treeFile("old.doc").click();
		await page.locator(".workspace-preview-error", { hasText: ".docx" }).waitFor({ timeout: 20_000 });
		console.log("  ok  an old .doc says what to do instead");

		for (const name of await tabNames()) await tab(name).locator(".workspace-tab-close").click();
		await waitUntil(async () => (await page.locator(".workspace-pane").count()) === 0, "closing the last tab closes the pane");
		console.log("  ok  closing the last tab closes the pane");

		assert(pageErrors.length === 0, `the page had no errors, got ${pageErrors.join("; ")}`);
		await context.close();
	} finally {
		await browser.close();
	}
	console.log("workspace-file-tabs-ui smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-4000));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
