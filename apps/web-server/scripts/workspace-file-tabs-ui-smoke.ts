// Files clicked in the workspace tree open as tabs in the right pane: PDF, image,
// Word and Excel read-only, Markdown in its editor. Clicking a file again brings
// its tab back, tabs switch and close, and closing the last one closes the pane.
// Offline: the room's model is never asked. Throwaway HOME.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";
import { smallDocx } from "./workspace-preview-fixtures.js";
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
const openerMarker = path.join(tempRoot, "fake-opener-calls");
const openerPreload = path.join(tempRoot, "fake-opener.cjs");
fs.writeFileSync(openerPreload, `
const cp = require("node:child_process");
const fs = require("node:fs");
const { EventEmitter } = require("node:events");
const realSpawn = cp.spawn;
cp.spawn = function(file, args, options) {
  if (file !== "/usr/bin/xdg-open" && file !== "/usr/bin/open") return realSpawn.apply(this, arguments);
  fs.appendFileSync(${JSON.stringify(openerMarker)}, JSON.stringify({ file, args, shell: options.shell }) + "\\n");
  const child = new EventEmitter();
  child.kill = () => true;
  setImmediate(() => child.emit("close", 0, null));
  return child;
};
require("node:module").syncBuiltinESMExports();
`);
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

function ninePagePdf(): Buffer {
	const objects: string[] = [];
	const kids = Array.from({ length: 9 }, (_, index) => `${3 + index * 2} 0 R`).join(" ");
	objects.push("<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${kids}] /Count 9 >>`);
	for (let index = 0; index < 9; index++) {
		const stream = index === 0 ? "1 0 0 rg 10 10 180 80 re f q 40 0 0 40 20 20 cm /I1 Do Q 0 0 0 rg BT /F1 14 Tf 70 45 Td (Invented) Tj ET" : "1 0 0 rg 10 10 180 80 re f";
		objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents ${4 + index * 2} 0 R /Resources << /Font << /F1 21 0 R >> /XObject << /I1 22 0 R >> >> >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
	}
	objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length 7 >>\nstream\n00FF00>\nendstream");
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
fs.writeFileSync(path.join(folder, "slow.png"), ONE_PIXEL_PNG);
{
	const { createCanvas } = await import("@napi-rs/canvas");
	const canvas = createCanvas(1, 1);
	canvas.getContext("2d").fillRect(0, 0, 1, 1);
	const jpeg = canvas.toBuffer("image/jpeg");
	fs.writeFileSync(path.join(folder, "first.jpg"), jpeg);
	fs.writeFileSync(path.join(folder, "second.JPEG"), jpeg);
	fs.writeFileSync(path.join(folder, "image.webp"), canvas.toBuffer("image/webp"));
	fs.writeFileSync(path.join(folder, "frame.gif"), Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
}
fs.writeFileSync(path.join(folder, "report.pdf"), ninePagePdf());
fs.writeFileSync(path.join(folder, "report.docx"), await smallDocx());
{
	const { default: ExcelJS } = await import("exceljs");
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Real summary");
	sheet.getCell("A1").value = "Invented total";
	sheet.getCell("A1").font = { bold: true, color: { argb: "FFCC2200" } };
	sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
	sheet.getColumn(1).width = 24;
	sheet.getCell("B2").value = { formula: "SUM(20,34)", result: 54 };
	sheet.getCell("B2").numFmt = '"$"#,##0.00';
	sheet.mergeCells("A3:B3");
	sheet.getCell("A3").value = "Invented merge";
	const detail = workbook.addWorksheet("Real detail", { views: [{ showGridLines: false }] });
	detail.getCell("A1").value = "Second sheet";
	fs.writeFileSync(path.join(folder, "actual.xlsx"), Buffer.from(await workbook.xlsx.writeBuffer()));
}
fs.writeFileSync(path.join(folder, "sample.xlsx"), "invented placeholder");
fs.writeFileSync(path.join(folder, "many.xlsx"), "invented placeholder");
{
	const { default: ExcelJS } = await import("exceljs");
	const { default: JSZip } = await import("jszip");
	const workbook = new ExcelJS.Workbook();
	workbook.addWorksheet("Invented");
	const zip = await JSZip.loadAsync(await workbook.xlsx.writeBuffer());
	const worksheet = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
	const extension = `<extLst><ext uri="urn:invented"><x:a xmlns:x="urn:invented">${"<x:a>".repeat(2_000_000)}${"</x:a>".repeat(2_000_000)}</x:a></ext></extLst>`;
	zip.file("xl/worksheets/sheet1.xml", worksheet.replace("</worksheet>", `${extension}</worksheet>`));
	fs.writeFileSync(path.join(folder, "exhaust.xlsx"), Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "STORE" })));
}
fs.writeFileSync(path.join(folder, "large.svg"), '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000"><rect width="2000" height="2000" fill="red"/></svg>');
fs.writeFileSync(path.join(folder, "notes.md"), "# Notes\n\nSome text\n");
fs.writeFileSync(path.join(folder, "draft.md"), "# Invented draft\n");
fs.writeFileSync(path.join(folder, "conflict-real.md"), "# Original invented draft\n");
fs.writeFileSync(path.join(folder, "old.doc"), "legacy");
fs.writeFileSync(path.join(folder, "old.xls"), "invented old workbook");
fs.writeFileSync(path.join(folder, "macro.xlsm"), "invented macro workbook");
fs.writeFileSync(path.join(folder, "plain.txt"), "plain");
const observedFiles = ["photo.png", "report.pdf", "report.docx", "sample.xlsx", "large.svg", "notes.md"];
const digest = (name: string) => createHash("sha256").update(fs.readFileSync(path.join(folder, name))).digest("hex");
const originalDigests = new Map(observedFiles.map((name) => [name, digest(name)]));

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
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot, ...(process.platform === "linux" ? { DISPLAY: ":987", NODE_OPTIONS: `--require=${openerPreload}` } : {}) }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready", 60_000);

	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Archive", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, `the room is created, got ${created.status}`);
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, `the folder is saved, got ${saved.status} ${JSON.stringify(saved.body)}`);
	const otherCreated = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Workshop", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(otherCreated.status === 201, "the second invented room is created");
	const otherAgentId = String(otherCreated.body?.agent?.id ?? "");
	const otherSaved = await api(`/api/persistent-agents/${encodeURIComponent(otherAgentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(otherSaved.status === 200, "the second invented room uses the same temporary workspace");

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
		const assertPreviewHasNoEditingControls = async () => {
			assert(await page.locator(".workspace-pane").getByRole("button", { name: /^(edit|save|download|print)$/i }).count() === 0, "the preview has no edit, save, download or print control");
		};
		const activeName = async () => (await page.locator(".workspace-tab[data-active='true'] .workspace-tab-select").textContent())?.trim();
		const tabNames = async () => (await tabs.locator(".workspace-tab-select").allTextContents()).map((name) => name.trim());

		let imageRequests = 0;
		let previewRequests = 0;
		let openStatus = 202;
		const openRequests: { method: string; body: unknown; intent: string | undefined }[] = [];
		await page.route("**/workspace-open", async (route) => {
			const request = route.request();
			openRequests.push({ method: request.method(), body: request.postDataJSON(), intent: request.headers()["x-exxperts-local-action"] });
			if (openStatus === 0) return route.abort();
			const status = openStatus < 0 ? 202 : openStatus;
			const body = openStatus === -1 ? JSON.stringify({ accepted: true, extra: true }) : openStatus === -2 ? "not json" : JSON.stringify(openStatus === 202 ? { accepted: true } : { error: "invented private detail" });
			await route.fulfill({ status, contentType: "application/json", body });
		});
		page.on("request", (request) => {
			if (request.url().includes("/workspace-image?")) imageRequests += 1;
			if (request.url().includes("/workspace-preview?")) previewRequests += 1;
		});
		await treeFile("notes.md").click();
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor({ timeout: 20_000 });
		await treeFile("photo.png").click();
		const image = page.locator(".workspace-preview-image img");
		await waitUntil(() => image.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0).catch(() => false), "the image has loaded");
		const externalOpen = page.getByRole("button", { name: "Open in default app" });
		await externalOpen.waitFor({ timeout: 5_000 });
		await assertPreviewHasNoEditingControls();
		await externalOpen.click();
		const openBody = openRequests[0]?.body as { path?: string; conversationId?: string };
		assert(openRequests.length === 1 && openRequests[0].method === "POST" && openRequests[0].intent === "open-workspace-file" && openBody.path === "photo.png" && typeof openBody.conversationId === "string" && openBody.conversationId.length > 0 && Object.keys(openBody).sort().join(",") === "conversationId,path", "the local open button sends one explicit intent for the active file");
		openStatus = 500;
		await externalOpen.click();
		await page.getByText("This file could not be opened in another program.", { exact: true }).waitFor();
		assert(await page.getByText("invented private detail").count() === 0, "open failures do not expose server details");
		for (const status of [400, 403, 409, 415, 422, 503, 504, -1, -2, 0]) {
			openStatus = status;
			const settled = status === 0
				? page.waitForEvent("requestfailed", (request) => request.url().includes("/workspace-open"))
				: page.waitForResponse((response) => response.url().includes("/workspace-open"));
			await externalOpen.click();
			await settled;
			await waitUntil(async () => await externalOpen.isEnabled() && await page.getByText("This file could not be opened in another program.", { exact: true }).count() === 1, `open failure ${status} shows the generic sentence`);
			assert(await page.getByText("invented private detail").count() === 0, `open failure ${status} hides response details`);
		}
		openStatus = 202;
		if (process.platform === "linux") {
			await page.unroute("**/workspace-open");
			const opened = page.waitForResponse((response) => response.url().includes("/workspace-open") && response.request().method() === "POST");
			await externalOpen.click();
			assert((await opened).status() === 202, "the real open route accepts the browser action");
			await waitUntil(() => fs.existsSync(openerMarker), "fake platform opener called");
			const calls = fs.readFileSync(openerMarker, "utf8").trim().split("\n").map((line) => JSON.parse(line));
			assert(calls.length === 1 && calls[0].file === "/usr/bin/xdg-open" && calls[0].shell === false && JSON.stringify(calls[0].args) === JSON.stringify([path.join(folder, "photo.png")]), "the browser action dispatches exactly one guarded original path to the fake opener");
		}
		assert(JSON.stringify(await tabNames()) === JSON.stringify(["notes.md", "photo.png"]), "Markdown and image each have a tab");
		await treeFile("notes.md").click();
		assert(await page.getByRole("button", { name: /Open in default app|Open PDF|Open in Word/ }).count() === 0, "Markdown has no external-open button");
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
		await treeFile("notes.md").click();
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor();
		let refusedSaves = 0;
		await page.route("**/workspace-markdown?*", async (route) => {
			if (route.request().method() !== "PUT") return route.continue();
			refusedSaves++;
			await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "revision_conflict", error: "Invented conflict", currentRevision: "invented-revision" }) });
		});
		await page.locator(".markdown-editor-tiptap .ProseMirror").click();
		await page.keyboard.type(" conflict draft");
		await treeFile("photo.png").click();
		await prompt.waitFor();
		await prompt.getByRole("button", { name: "Save and continue" }).click();
		await page.getByText("This file changed outside the editor.", { exact: true }).waitFor();
		assert(refusedSaves > 0 && (await activeName()) === "notes.md" && (await page.locator(".markdown-editor-tiptap .ProseMirror").textContent())?.includes("conflict draft"), "a failed conflict save keeps the draft and cancels the pending switch");
		await treeFile("photo.png").click();
		await prompt.waitFor();
		await prompt.getByRole("button", { name: "Cancel" }).click();
		assert((await activeName()) === "notes.md", "a new canceled action remains in the conflicted editor");
		await treeFile("photo.png").click();
		await prompt.getByRole("button", { name: "Discard changes" }).click();
		await page.unroute("**/workspace-markdown?*");
		assert((await activeName()) === "photo.png", "only an explicit later discard switches away after a conflict");
		await treeFile("draft.md").click();
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor();
		await page.locator(".markdown-editor-tiptap .ProseMirror").click();
		await page.keyboard.type(" saved draft");
		await treeFile("photo.png").click();
		await prompt.waitFor();
		await prompt.getByRole("button", { name: "Save and continue" }).click();
		await waitUntil(async () => (await activeName()) === "photo.png", "successful save resumes the requested preview");
		assert(fs.readFileSync(path.join(folder, "draft.md"), "utf8").includes("saved draft"), "save and continue writes the invented Markdown draft before switching");
		await tab("draft.md").locator(".workspace-tab-close").click();
		await treeFile("conflict-real.md").click();
		await page.locator(".markdown-editor-tiptap .ProseMirror").waitFor();
		let releaseRealSave!: () => void, resolveRealSaveStarted!: () => void;
		const realSaveReleased = new Promise<void>((resolve) => { releaseRealSave = resolve; });
		const realSaveStarted = new Promise<void>((resolve) => { resolveRealSaveStarted = resolve; });
		await page.route("**/workspace-markdown?*", async (route) => {
			if (route.request().method() !== "PUT" || new URL(route.request().url()).searchParams.get("path") !== "conflict-real.md") return route.continue();
			resolveRealSaveStarted();
			await realSaveReleased;
			await route.continue();
		});
		await page.locator(".markdown-editor-tiptap .ProseMirror").click();
		await page.keyboard.type(" local draft");
		await treeFile("photo.png").click();
		await prompt.waitFor();
		const realConflict = page.waitForResponse((response) => response.url().includes("/workspace-markdown?") && response.request().method() === "PUT" && response.status() === 409);
		await prompt.getByRole("button", { name: "Save and continue" }).click();
		await realSaveStarted;
		fs.writeFileSync(path.join(folder, "conflict-real.md"), "# Invented external edit\n");
		releaseRealSave();
		await realConflict;
		await page.getByText("This file changed outside the editor.", { exact: true }).waitFor();
		assert((await activeName()) === "conflict-real.md" && (await page.locator(".markdown-editor-tiptap .ProseMirror").textContent())?.includes("local draft") && fs.readFileSync(path.join(folder, "conflict-real.md"), "utf8") === "# Invented external edit\n", "a real revision conflict keeps the local draft and does not overwrite the changed file");
		await treeFile("photo.png").click();
		await prompt.waitFor();
		await prompt.getByRole("button", { name: "Discard changes" }).click();
		await tab("conflict-real.md").locator(".workspace-tab-close").click();
		await page.unroute("**/workspace-markdown?*");
		assert(await tree.locator(".workspace-file-browser-file[aria-current='true']").filter({ hasText: "photo.png" }).count() === 1, "tree marks the active file");
		const requestsBeforeChange = imageRequests;
		const callsBeforeChange = process.platform === "linux" ? fs.readFileSync(openerMarker, "utf8") : "";
		const { createCanvas } = await import("@napi-rs/canvas");
		const changedImage = createCanvas(2, 1);
		changedImage.getContext("2d").fillRect(0, 0, 2, 1);
		fs.writeFileSync(path.join(folder, "photo.png"), changedImage.toBuffer("image/png"));
		await treeFile("notes.md").click();
		await treeFile("photo.png").click();
		assert(imageRequests === requestsBeforeChange && await image.evaluate((node) => (node as HTMLImageElement).naturalWidth) === 1, "reactivating a tab after the fake open keeps the cached image");
		await tab("photo.png").locator(".workspace-tab-close").click();
		await treeFile("photo.png").click();
		await waitUntil(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth === 2).catch(() => false), "reopening fetches the changed invented image");
		assert(imageRequests === requestsBeforeChange + 1, "closing and reopening fetches the current image once");
		if (process.platform === "linux") assert(fs.readFileSync(openerMarker, "utf8") === callsBeforeChange, "tab activation and reopening never dispatch the opener");
		fs.writeFileSync(path.join(folder, "photo.png"), ONE_PIXEL_PNG);
		for (const name of ["first.jpg", "second.JPEG", "image.webp", "frame.gif"]) {
			await treeFile(name).click();
			const rendered = page.locator(".workspace-preview-image img:visible");
			await waitUntil(() => rendered.evaluate((node) => (node as HTMLImageElement).naturalWidth === 1 && (node as HTMLImageElement).naturalHeight === 1).catch(() => false), `${name} decodes in its preview tab`);
			assert((await activeName()) === name && await rendered.getAttribute("alt") === name, `${name} remains the active image`);
			await tab(name).locator(".workspace-tab-close").click();
			assert((await activeName()) === "photo.png", `${name} closes back to the previous image`);
		}
		let releaseSlow!: () => void, resolveStarted!: () => void, resolveFinished!: () => void;
		const slowReleased = new Promise<void>((resolve) => { releaseSlow = resolve; });
		const slowStarted = new Promise<void>((resolve) => { resolveStarted = resolve; });
		const slowFinished = new Promise<void>((resolve) => { resolveFinished = resolve; });
		await page.route("**/workspace-image?*", async (route) => {
			if (new URL(route.request().url()).searchParams.get("path") !== "slow.png") return route.continue();
			resolveStarted();
			await slowReleased;
			await route.fulfill({ status: 200, contentType: "image/png", body: ONE_PIXEL_PNG }).catch(() => {});
			resolveFinished();
		});
		await treeFile("slow.png").click();
		await slowStarted;
		await tab("slow.png").locator(".workspace-tab-close").click();
		assert((await activeName()) === "photo.png", "closing a loading preview restores the previous tab");
		releaseSlow();
		await slowFinished;
		assert((await activeName()) === "photo.png" && !(await tabNames()).includes("slow.png") && await page.locator(".workspace-preview-image img:visible").getAttribute("alt") === "photo.png", "a late image response cannot revive its closed tab or replace the active preview");
		await page.unroute("**/workspace-image?*");
		await treeFile("large.svg").click();
		assert((await activeName()) === "large.svg", "the third tab becomes active");
		await tab("photo.png").locator(".workspace-tab-close").click();
		assert((await activeName()) === "large.svg" && !(await tabNames()).includes("photo.png"), "closing a background tab preserves the active tab");
		await treeFile("photo.png").click();
		await tab("large.svg").locator(".workspace-tab-select").click();
		await tab("large.svg").locator(".workspace-tab-close").click();
		assert((await activeName()) === "photo.png", "closing a middle active tab selects its right neighbour");
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
		for (const file of ["old.xls", "macro.xlsm"]) {
			const before = previewRequests;
			await treeFile(file).click();
			await page.getByText("This file type cannot be previewed here.", { exact: true }).waitFor();
			assert((await activeName()) === file && await page.getByRole("button", { name: "Open in Excel" }).count() === 1, `${file} has a no-preview tab with its open action`);
			assert(previewRequests === before, `${file} does not invoke a preview parser`);
			await tab(file).locator(".workspace-tab-close").click();
		}
		await treeFile("report.pdf").click();
		const pdfPage = page.locator(".workspace-preview-pdf img");
		await waitUntil(async () => (await pdfPage.count()) === 9 && await pdfPage.first().evaluate((img) => (img as HTMLImageElement).naturalWidth > 0).catch(() => false), "all nine rendered PDF pages appear");
		assert((await activeName()) === "report.pdf", "PDF opens in its own tab");
		assert(await page.getByRole("button", { name: "Open PDF" }).count() === 1, "PDF uses its fixed open label");
		assert(await pdfPage.nth(8).getAttribute("alt") === "Page 9", "each PDF page has an accessible name");
		await assertPreviewHasNoEditingControls();
		const painted = await pdfPage.first().evaluate((img) => {
			const image = img as HTMLImageElement;
			const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
			const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
			const pixel = context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
			return pixel[0] > 200 && pixel[1] < 80 && pixel[2] < 80;
		});
		assert(painted, "the displayed PDF retains its color landmark");
		const landmarks = await pdfPage.first().evaluate((img) => {
			const image = img as HTMLImageElement;
			const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
			const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
			const green = context.getImageData(Math.floor(canvas.width * 0.2), Math.floor(canvas.height * 0.6), 1, 1).data;
			const text = context.getImageData(Math.floor(canvas.width * 0.35), Math.floor(canvas.height * 0.35), Math.floor(canvas.width * 0.5), Math.floor(canvas.height * 0.2)).data;
			let dark = 0;
			for (let i = 0; i < text.length; i += 4) if (text[i] < 70 && text[i + 1] < 70 && text[i + 2] < 70) dark++;
			return { green: green[0] < 70 && green[1] > 180 && green[2] < 70, dark };
		});
		assert(landmarks.green && landmarks.dark > 5, `the actual PDF preview paints its embedded image and text (${JSON.stringify(landmarks)})`);
		const pdfSize = await pdfPage.first().evaluate((img) => ({ width: (img as HTMLImageElement).naturalWidth, height: (img as HTMLImageElement).naturalHeight }));
		assert(pdfSize.width === pdfSize.height * 2, "the displayed PDF retains its page aspect ratio");
		const scrollable = page.locator(".workspace-preview-pdf");
		const scrollMetrics = await scrollable.evaluate((node) => {
			node.scrollTop = node.scrollHeight;
			return { top: node.scrollTop, height: node.clientHeight, content: node.scrollHeight, parent: node.parentElement?.clientHeight, pane: node.closest(".workspace-pane")?.clientHeight };
		});
		assert(scrollMetrics.top > 0, `PDF pages scroll vertically: ${JSON.stringify(scrollMetrics)}`);
		await treeFile("notes.md").click();
		await treeFile("report.pdf").click();
		assert(previewRequests === 1, "switching back does not refetch the PDF");
		await tab("report.pdf").locator(".workspace-tab-close").click();
		await treeFile("actual.xlsx").click();
		const realCell = page.getByText("Invented total", { exact: true });
		await realCell.waitFor({ timeout: 10_000 });
		const realStyle = await realCell.evaluate((node) => ({ color: getComputedStyle(node).color, weight: getComputedStyle(node).fontWeight, fill: getComputedStyle(node).backgroundColor }));
		assert(realStyle.color === "rgb(204, 34, 0)" && Number(realStyle.weight) >= 700 && realStyle.fill === "rgb(255, 255, 0)", "the real workbook displays its font and fill");
		assert(await realCell.evaluate((node) => getComputedStyle(node).borderRightColor) === "rgb(255, 255, 0)", "the filled cell hides its own gridline with its fill");
		assert(await page.getByText("$54.00", { exact: true }).count() === 1, "the real workbook displays the cached formatted result");
		assert(await page.getByText("Invented merge", { exact: true }).getAttribute("colspan") === "2", "the real workbook displays its merged range");
		await page.getByRole("button", { name: "Real detail", exact: true }).click();
		await page.getByText("Second sheet", { exact: true }).waitFor();
		assert(await page.getByText("Second sheet", { exact: true }).evaluate((node) => getComputedStyle(node).borderRightColor) === "rgba(0, 0, 0, 0)", "a sheet that hides gridlines renders transparent cell borders");
		await assertPreviewHasNoEditingControls();
		await tab("actual.xlsx").locator(".workspace-tab-close").click();
		let corruptWorkbook = false;
		await page.route("**/workspace-preview?*", async (route) => {
			const url = new URL(route.request().url());
			const requestedPath = url.searchParams.get("path");
			if (requestedPath !== "sample.xlsx" && requestedPath !== "many.xlsx") return route.continue();
			const font = { family: "Arial", sizePt: 11, color: "#CC2200", bold: true, italic: false, underline: "none", strike: false };
			const style = { fill: "#FFFF00", font, borders: { top: { style: "thin", color: "#000000" }, right: null, bottom: null, left: null }, align: { horizontal: "left", vertical: "bottom", wrap: false } };
			const otherStyle = { ...style, font: { ...font, color: "#0044CC", italic: true } };
			const sheet = (id: string, name: string, text: string, wide = false) => ({ id, name, visibility: "visible", showGridLines: true, rowCount: wide ? 80 : 1, columnCount: wide ? 12 : 1, defaultRowHeightPx: 20, defaultColumnWidthPx: 64, rows: [], columns: [{ index: 1, widthPx: 173 }], cells: [{ row: 1, column: 1, text, style: 0, runs: wide ? [{ text: "Invented ", style: 0 }, { text: "total", style: 1 }] : null, valueKind: "text" }, ...(wide ? [{ row: 2, column: 2, text: "—", style: 0, runs: null, valueKind: "formula-result-unavailable" }, { row: 3, column: 3, text: "Merged cell", style: 0, runs: null, valueKind: "text" }, { row: 80, column: 12, text: "Last cell", style: 0, runs: null, valueKind: "text" }] : [])], merges: wide ? [{ top: 3, left: 3, bottom: 4, right: 4 }] : [] });
			const summary = sheet("1", "Summary", "Invented total", true);
			if (corruptWorkbook) summary.cells[0].style = 77;
			const empty = { ...sheet("3", "Empty", ""), visibility: "hidden", rowCount: 0, columnCount: 0, columns: [], cells: [] };
			const sheets = requestedPath === "many.xlsx" ? Array.from({ length: 1025 }, (_, index) => ({ ...empty, id: String(index + 1), name: `Empty ${index + 1}` })) : [summary, sheet("2", "Detail", "Second sheet"), empty];
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ schemaVersion: 1, agentId, conversationId: url.searchParams.get("conversationId"), path: requestedPath, notices: [], kind: "spreadsheet", workbook: { dateSystem: "1900", styles: [style, otherStyle], sheets } }) });
		});
		await treeFile("sample.xlsx").click();
		const sheetCell = page.getByText("Invented total", { exact: true });
		await sheetCell.waitFor({ timeout: 5_000 });
		const appearance = await sheetCell.evaluate((node) => ({ color: getComputedStyle(node).color, weight: getComputedStyle(node).fontWeight, fill: getComputedStyle(node).backgroundColor }));
		assert(appearance.color === "rgb(204, 34, 0)" && Number(appearance.weight) >= 700 && appearance.fill === "rgb(255, 255, 0)", "spreadsheet text, font and fill are displayed");
		assert(Math.abs((await sheetCell.boundingBox())!.width - 173) < 1, "the workbook column width is retained");
		assert(await sheetCell.evaluate((node) => getComputedStyle(node).borderTopStyle) === "solid", "the workbook border is retained");
		assert(await sheetCell.getByText("total", { exact: true }).evaluate((node) => getComputedStyle(node).color) === "rgb(0, 68, 204)", "rich text retains its own font color");
		const mergedCell = page.getByText("Merged cell", { exact: true });
		assert(await mergedCell.getAttribute("rowspan") === "2" && await mergedCell.getAttribute("colspan") === "2", "merged cells occupy the declared rectangle");
		assert(await page.getByLabel("— No calculated value is stored in this file.").count() === 1, "a missing cached result has an accessible explanation");
		const gridScroll = await page.locator(".workspace-spreadsheet-scroll").evaluate((node) => { node.scrollLeft = node.scrollWidth; node.scrollTop = node.scrollHeight; return { left: node.scrollLeft, top: node.scrollTop }; });
		assert(gridScroll.left > 0 && gridScroll.top > 0, "a wide and tall spreadsheet scrolls on both axes");
		await page.getByRole("button", { name: "Detail", exact: true }).click();
		await page.getByText("Second sheet", { exact: true }).waitFor();
		assert(await page.getByRole("button", { name: "Open in Excel" }).count() === 1, "spreadsheet uses its fixed open label");
		await assertPreviewHasNoEditingControls();
		const requestsAfterSheet = previewRequests;
		await treeFile("notes.md").click();
		await treeFile("sample.xlsx").click();
		assert(await page.getByText("Second sheet", { exact: true }).count() === 1 && previewRequests === requestsAfterSheet, "the selected sheet survives tab switches without refetch");
		await page.getByRole("button", { name: "Empty", exact: true }).click();
		await page.getByText("This sheet is empty.", { exact: true }).waitFor();
		await tab("sample.xlsx").locator(".workspace-tab-close").click();
		await treeFile("many.xlsx").click();
		await page.getByRole("button", { name: "Empty 1025", exact: true }).click({ timeout: 5_000 });
		await page.getByText("This sheet is empty.", { exact: true }).waitFor();
		await tab("many.xlsx").locator(".workspace-tab-close").click();
		corruptWorkbook = true;
		await treeFile("sample.xlsx").click();
		await page.getByText("This file could not be previewed.", { exact: true }).waitFor();
		assert(await page.getByText("Invented total", { exact: true }).count() === 0, "invalid style references never render a partial workbook");
		await tab("sample.xlsx").locator(".workspace-tab-close").click();
		await treeFile("exhaust.xlsx").click();
		await page.getByText("This file could not be previewed.", { exact: true }).waitFor({ timeout: 40_000 });
		assert((await fetch(`${baseUrl}/healthz`)).ok, "the server remains available after the real exhausting workbook preview");
		await tab("exhaust.xlsx").locator(".workspace-tab-close").click();
		let externalRequests = 0;
		await page.route("**/*", async (route) => {
			if (route.request().url().includes("example.invalid")) { externalRequests++; await route.abort(); }
			else await route.continue();
		});
		await treeFile("report.docx").click();
		const wordFrame = page.locator(".workspace-preview-word iframe");
		await wordFrame.waitFor({ timeout: 20_000 });
		assert(await page.getByRole("button", { name: "Open in Word" }).count() === 1, "Word uses its fixed open label");
		assert(await wordFrame.getAttribute("sandbox") === "", "Word uses an empty sandbox");
		await assertPreviewHasNoEditingControls();
		const word = page.frameLocator(".workspace-preview-word iframe");
		const heading = word.getByText("Invented heading", { exact: true });
		await heading.waitFor();
		const headingStyle = await heading.evaluate((node) => ({ color: getComputedStyle(node).color, weight: getComputedStyle(node).fontWeight }));
		assert(headingStyle.color === "rgb(204, 34, 0)" && Number(headingStyle.weight) >= 700, "Word heading retains color and bold");
		const cell = word.locator("td").filter({ hasText: "Invented cell" });
		assert(await cell.evaluate((node) => getComputedStyle(node).backgroundColor) === "rgb(255, 255, 0)", "Word table retains shading");
		const border = await cell.evaluate((node) => ({ width: getComputedStyle(node).borderTopWidth, style: getComputedStyle(node).borderTopStyle }));
		assert(parseFloat(border.width) > 0 && border.style === "solid", "Word table retains its border");
		const embedded = word.locator("img");
		await waitUntil(() => embedded.evaluate((node) => (node as HTMLImageElement).naturalWidth === 1 && (node as HTMLImageElement).naturalHeight === 1).catch(() => false), "Word image decodes");
		const wordPixel = await embedded.evaluate((node) => {
			const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
			const context = canvas.getContext("2d")!; context.drawImage(node as HTMLImageElement, 0, 0);
			return [...context.getImageData(0, 0, 1, 1).data];
		});
		assert(wordPixel[0] < 20 && wordPixel[1] > 230 && wordPixel[2] < 20 && wordPixel[3] === 255, "Word image paints its green pixel");
		await word.getByText("External label", { exact: true }).click();
		assert(externalRequests === 0, "Word does not request or navigate to external resources");
		const parentAccess = await word.locator("body").evaluate(() => { try { return Boolean(window.parent.document.body); } catch { return false; } });
		assert(!parentAccess, "the Word frame cannot read the parent document");
		assert(await word.getByText("External image blocked.").count() === 1, "linked image shows an inert placeholder");
		assert(await page.getByText("External document resources are blocked.", { exact: true }).count() === 1, "the blocked-resource notice is visible");
		const requestsAfterWord = previewRequests;
		await treeFile("notes.md").click();
		await treeFile("report.docx").click();
		assert(previewRequests === requestsAfterWord, "switching back does not refetch Word");
		await tab("report.docx").locator(".workspace-tab-close").click();
		const restricted = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "custom", allowedToolNames: ["ls"] }, bashEnabled: false }) });
		assert(restricted.status === 200, "the invented workspace read permission was disabled");
		await treeFile("report.docx").click();
		await page.getByText("This file is not available under the current workspace permissions.", { exact: true }).waitFor();
		await tab("report.docx").locator(".workspace-tab-close").click();
		await tab("notes.md").locator(".workspace-tab-close").click();
		await waitUntil(async () => (await tabs.count()) === 0, "closing the last tab closes the pane");

		for (const name of observedFiles) assert(digest(name) === originalDigests.get(name), `${name} retains its original bytes after preview and tab interactions`);
		assert(pageErrors.length === 0, `the page had no errors, got ${pageErrors.join("; ")}`);
		await context.close();
		const restored = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "standard" } }) });
		assert(restored.status === 200, "the invented workspace read permission is restored for context checks");
		for (const [name, body, status] of [
			["failed", {}, 503],
			["missing fields", {}, 200],
			["missing shared field", { remote: false }, 200],
			["wrong field type", { remote: "false", sharedServer: false }, 200],
			["remote full", { remote: true, capability: "full", sharedServer: false }, 200],
			["remote read only", { remote: true, capability: "read-only", sharedServer: false }, 200],
			["shared", { remote: false, capability: "full", sharedServer: true }, 200],
		] as const) {
			const checkContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
			try {
				const checkPage = await checkContext.newPage();
				let contextStatus: number = status;
				let contextBody: unknown = body;
				await checkPage.route("**/api/remote/client-context", (route) => route.fulfill({ status: contextStatus, contentType: "application/json", body: JSON.stringify(contextBody) }));
				await checkPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				await checkPage.waitForLoadState("networkidle");
				const close = checkPage.locator(".whats-new-close");
				if (await close.count()) await close.click();
				const room = checkPage.locator(".persistent-agent-card").filter({ hasText: "Archive" });
				await room.getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await checkPage.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "photo.png" }).click();
				await checkPage.locator(".workspace-preview-image img").waitFor({ timeout: 6_000 }).catch(() => { throw new Error(`${name} context did not load the image`); });
				assert(await checkPage.getByRole("button", { name: "Open in default app" }).count() === 0, `${name} context cannot show local open`);
				if (name === "failed") {
					contextStatus = 200;
					contextBody = { remote: false, sharedServer: false, capability: "full" };
					await checkPage.evaluate(() => window.dispatchEvent(new Event("focus")));
					await checkPage.getByRole("button", { name: "Open in default app" }).waitFor({ timeout: 6_000 });
				}
			} finally { await checkContext.close(); }
		}
		const loadingContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
		try {
			const loadingPage = await loadingContext.newPage();
			let releaseContext!: () => void, startedContext!: () => void;
			const released = new Promise<void>((resolve) => { releaseContext = resolve; });
			const started = new Promise<void>((resolve) => { startedContext = resolve; });
			let contextRequests = 0;
			await loadingPage.route("**/api/remote/client-context", async (route) => {
				if (++contextRequests === 1) return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "invented unavailable" }) });
				startedContext(); await released;
				await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ remote: false, sharedServer: false, capability: "full" }) });
			});
			await loadingPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
			await loadingPage.waitForLoadState("networkidle");
			const close = loadingPage.locator(".whats-new-close");
			if (await close.count()) await close.click();
			await loadingPage.locator(".persistent-agent-card").filter({ hasText: "Archive" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			await loadingPage.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "photo.png" }).click();
			await loadingPage.locator(".workspace-preview-image img").waitFor();
			await loadingPage.evaluate(() => window.dispatchEvent(new Event("focus")));
			await started;
			assert(await loadingPage.getByRole("button", { name: "Open in default app" }).count() === 0, "open is hidden while local context is loading");
			releaseContext();
			await loadingPage.getByRole("button", { name: "Open in default app" }).waitFor({ timeout: 6_000 });
		} finally { await loadingContext.close(); }
		// A response from the old conversation must not restore its tab after Forget.
		const switchingContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
		try {
			const switchingPage = await switchingContext.newPage();
			let releaseOld!: () => void, sawOld!: () => void, finishedOld!: () => void;
			const oldReleased = new Promise<void>((resolve) => { releaseOld = resolve; });
			const oldStarted = new Promise<void>((resolve) => { sawOld = resolve; });
			const oldFinished = new Promise<void>((resolve) => { finishedOld = resolve; });
			const requests: string[] = [];
			await switchingPage.route("**/workspace-image?*", async (route) => {
				const url = new URL(route.request().url());
				if (url.searchParams.get("path") !== "slow.png") return route.continue();
				requests.push(url.searchParams.get("conversationId") ?? "");
				if (requests.length === 1) { sawOld(); await oldReleased; }
				await route.fulfill({ status: 200, contentType: "image/png", body: ONE_PIXEL_PNG }).catch(() => {});
				if (requests.length === 1) finishedOld();
			});
			await switchingPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
			await switchingPage.waitForLoadState("networkidle");
			const close = switchingPage.locator(".whats-new-close");
			if (await close.count()) await close.click();
			await switchingPage.locator(".persistent-agent-card").filter({ hasText: "Archive" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			await switchingPage.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "notes.md" }).click();
			const draft = switchingPage.locator(".markdown-editor-tiptap .ProseMirror");
			await draft.waitFor();
			await draft.click();
			await switchingPage.keyboard.type(" pending navigation draft");
			await switchingPage.getByRole("button", { name: "Forget", exact: true }).first().click();
			const unsaved = switchingPage.getByRole("dialog", { name: "Unsaved Markdown changes" });
			await unsaved.getByRole("button", { name: "Cancel" }).click();
			assert((await draft.textContent())?.includes("pending navigation draft") && await switchingPage.locator(".workspace-tab").count() === 1, "canceling conversation replacement preserves the unsaved draft and tab");
			await switchingPage.getByRole("button", { name: "Forget", exact: true }).first().click();
			await unsaved.getByRole("button", { name: "Discard changes" }).click();
			await switchingPage.getByRole("alertdialog", { name: "Forget this conversation and start fresh?" }).getByRole("button", { name: "Forget", exact: true }).click();
			await waitUntil(async () => (await switchingPage.locator(".workspace-tab").count()) === 0, "discarded draft closes after conversation replacement");
			assert(!fs.readFileSync(path.join(folder, "notes.md"), "utf8").includes("pending navigation draft"), "discarding the invented draft leaves the file unchanged");
			const slow = switchingPage.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "slow.png" });
			await slow.click();
			await oldStarted;
			await switchingPage.getByRole("button", { name: "Forget", exact: true }).first().click();
			await switchingPage.getByRole("button", { name: "Forget", exact: true }).last().click();
			await waitUntil(async () => (await switchingPage.locator(".workspace-tab").count()) === 0, "conversation replacement clears the loading tab");
			releaseOld();
			await oldFinished;
			assert(await switchingPage.locator(".workspace-tab").count() === 0 && await switchingPage.locator(".workspace-preview-image img:visible").count() === 0, "a late response cannot restore the old conversation preview");
			await slow.click();
			await switchingPage.locator(".workspace-preview-image img").waitFor();
			assert(requests.length === 2 && requests[0] && requests[1] && requests[0] !== requests[1], "the same path is fetched anew for the new conversation");
		} finally { await switchingContext.close(); }
		const roomContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
		try {
			const roomPage = await roomContext.newPage();
			let releaseOld!: () => void, sawOld!: () => void, finishedOld!: () => void;
			const oldReleased = new Promise<void>((resolve) => { releaseOld = resolve; });
			const oldStarted = new Promise<void>((resolve) => { sawOld = resolve; });
			const oldFinished = new Promise<void>((resolve) => { finishedOld = resolve; });
			const requestedRooms: string[] = [];
			await roomPage.route("**/example.invalid/**", (route) => route.abort());
			await roomPage.route("**/workspace-preview?*", async (route) => {
				const url = new URL(route.request().url());
				if (url.searchParams.get("path") !== "report.docx") return route.continue();
				requestedRooms.push(url.pathname);
				if (requestedRooms.length === 1) { sawOld(); await oldReleased; }
				await route.continue().catch(() => {});
				if (requestedRooms.length === 1) finishedOld();
			});
			await roomPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
			await roomPage.waitForLoadState("networkidle");
			const close = roomPage.locator(".whats-new-close");
			if (await close.count()) await close.click();
			await roomPage.locator(".persistent-agent-card").filter({ hasText: "Archive" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			await roomPage.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "notes.md" }).click();
			const roomDraft = roomPage.locator(".markdown-editor-tiptap .ProseMirror");
			await roomDraft.waitFor(); await roomDraft.click();
			await roomPage.keyboard.type(" pending room draft");
			const home = roomPage.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true });
			await home.click();
			const unsaved = roomPage.getByRole("dialog", { name: "Unsaved Markdown changes" });
			await unsaved.getByRole("button", { name: "Cancel" }).click();
			assert((await roomDraft.textContent())?.includes("pending room draft"), "canceling room navigation keeps the unsaved draft");
			await home.click();
			await unsaved.getByRole("button", { name: "Discard changes" }).click();
			const archive = roomPage.locator(".persistent-agent-card").filter({ hasText: "Archive" });
			await archive.waitFor();
			assert(!fs.readFileSync(path.join(folder, "notes.md"), "utf8").includes("pending room draft"), "discarding the room draft leaves the file unchanged");
			await archive.getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			await roomPage.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "report.docx" }).click();
			await oldStarted;
			await roomPage.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
			await roomPage.locator(".persistent-agent-card").filter({ hasText: "Workshop" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			releaseOld();
			await oldFinished;
			assert(await roomPage.locator(".workspace-tab").count() === 0 && await roomPage.locator(".workspace-preview-word iframe:visible").count() === 0, "a late Word response cannot restore a tab from another room");
			await roomPage.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "report.docx" }).click();
			await roomPage.frameLocator(".workspace-preview-word iframe").getByText("Invented heading", { exact: true }).waitFor({ timeout: 20_000 });
			assert(requestedRooms.length === 2 && requestedRooms[0].includes(encodeURIComponent(agentId)) && requestedRooms[1].includes(encodeURIComponent(otherAgentId)), "the same Word path is fetched under the new room identity");
		} finally { await roomContext.close(); }
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
