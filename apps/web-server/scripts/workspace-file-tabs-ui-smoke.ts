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
const ONE_PIXEL_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64");

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

function onePagePdf(): Buffer {
	const stream = "1 0 0 rg 10 10 180 80 re f";
	const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents 4 0 R >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
	let body = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((object, index) => { offsets.push(body.length); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
	return Buffer.from(body + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`, "latin1");
}

const folder = path.join(tempHome, "Projects", "archive");
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(path.join(folder, "photo.png"), ONE_PIXEL_PNG);
fs.writeFileSync(path.join(folder, "report.pdf"), onePagePdf());
fs.writeFileSync(path.join(folder, "large.svg"), '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000"><rect width="2000" height="2000" fill="red"/></svg>');
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

		let imageRequests = 0;
		page.on("request", (request) => { if (request.url().includes("/workspace-image?")) imageRequests += 1; });
		await treeFile("notes.md").click();
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor({ timeout: 20_000 });
		await treeFile("photo.png").click();
		const image = page.locator(".workspace-preview-image img");
		await waitUntil(() => image.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0).catch(() => false), "the image has loaded");
		assert(JSON.stringify(await tabNames()) === JSON.stringify(["notes.md", "photo.png"]), "Markdown and image each have a tab");
		await treeFile("notes.md").click();
		const editor = page.locator(".markdown-editor-tiptap .ProseMirror");
		await editor.click();
		await page.keyboard.type(" new draft");
		await treeFile("photo.png").click();
		const prompt = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
		await prompt.waitFor();
		assert((await prompt.textContent())?.includes("before opening another file"), "the guard describes switching to any file");
		await prompt.getByRole("button", { name: "Cancel" }).click();
		assert((await activeName()) === "notes.md", "cancel keeps the draft active");
		await treeFile("photo.png").click();
		await prompt.getByRole("button", { name: "Discard changes" }).click();
		assert(imageRequests === 1, "reactivating an image does not refetch it");
		assert((await tabs.count()) === 2 && (await activeName()) === "photo.png", "reopening activates the existing tab");
		assert(await tree.locator(".workspace-file-browser-file[aria-current='true']").filter({ hasText: "photo.png" }).count() === 1, "tree marks the active file");
		await tab("photo.png").locator(".workspace-tab-close").click();
		assert((await activeName()) === "notes.md", "closing the active tab selects its neighbour");
		await treeFile("large.svg").click();
		const svg = page.locator(".workspace-preview-image img:visible");
		await waitUntil(() => svg.evaluate((img) => (img as HTMLImageElement).naturalWidth === 2000).catch(() => false), "the SVG is shown as an image");
		const imageBounds = await svg.boundingBox();
		const paneBounds = await page.locator(".workspace-pane").boundingBox();
		assert(imageBounds && paneBounds && imageBounds.width <= paneBounds.width && imageBounds.height <= paneBounds.height, "a large image fits its pane");
		await tab("large.svg").locator(".workspace-tab-close").click();
		await treeFile("old.doc").click();
		await page.getByText("Save this old .doc file as .docx to preview it here.", { exact: true }).waitFor();
		assert((await activeName()) === "old.doc", "old Word file has an error-only tab");
		assert(await page.getByRole("button", { name: /open in/i }).count() === 0, "old Word tab does not offer external opening");
		await tab("old.doc").locator(".workspace-tab-close").click();
		await treeFile("report.pdf").click();
		const pdfPage = page.locator(".workspace-preview-pdf img");
		await waitUntil(() => pdfPage.evaluate((img) => (img as HTMLImageElement).naturalWidth > 0).catch(() => false), "the rendered PDF page appears");
		assert((await activeName()) === "report.pdf", "PDF opens in its own tab");
		assert(await pdfPage.getAttribute("alt") === "Page 1", "PDF page has an accessible name");
		await tab("report.pdf").locator(".workspace-tab-close").click();
		await tab("notes.md").locator(".workspace-tab-close").click();
		await waitUntil(async () => (await tabs.count()) === 0, "closing the last tab closes the pane");

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
