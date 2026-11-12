// The real chat-owned document host moves between the room and its child window.
// All files and room data in this smoke are invented and confined to a temporary home.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";
import { smallDocx } from "./workspace-preview-fixtures.js";

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
const provider = http.createServer((request, response) => {
	let body = "";
	request.on("data", (chunk) => { body += chunk; });
	request.on("end", () => {
		const points = Array.from({ length: 12 }, (_, index) => `- Invented checkpoint point ${index + 1} is agreed for the synthetic workspace.`).join("\n");
		const message = body.includes("Checkpoint Compression Constitution") ? `TITLE:\nInvented checkpoint\n\nSESSION_ARC:\nWe planned an invented task.\n\nBODY:\n${points}\n\nPARKED:\nNone\n` : "Invented fake answer.";
		response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
		const send = (event: string, payload: unknown) => response.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
		send("message_start", { type: "message_start", message: { id: "invented-message", type: "message", role: "assistant", model: "claude-fake", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } });
		send("content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
		send("content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: message } });
		send("content_block_stop", { type: "content_block_stop", index: 0 });
		send("message_delta", { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 20 } });
		send("message_stop", { type: "message_stop" });
		response.end();
	});
});
await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", resolve));
const providerAddress = provider.address();
assert(providerAddress && typeof providerAddress !== "string", "the fake model listens locally");
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

const original = "# Invented source\r\n\r\n";
// HTML textarea values expose CRLF as LF; the file bytes are checked separately.
const rawDisplay = original.replaceAll("\r\n", "\n");
fs.writeFileSync(path.join(workspace, "invented.md"), original);
fs.writeFileSync(path.join(workspace, "interaction.md"), "- [ ] Invented child task\n\n[Open invented](invented.md)\n\n[External invented](https://example.invalid/invented)\n");
fs.writeFileSync(path.join(workspace, "retained.docx"), await smallDocx());
fs.writeFileSync(path.join(workspace, "retained.pdf"), ninePagePdf());
{
	const { default: ExcelJS } = await import("exceljs");
	const workbook = new ExcelJS.Workbook();
	workbook.addWorksheet("Invented sheet").getCell("A1").value = "Invented original cell";
	fs.writeFileSync(path.join(workspace, "retained.xlsx"), Buffer.from(await workbook.xlsx.writeBuffer()));
}
fs.writeFileSync(path.join(workspace, "retained.txt"), "Invented original text snapshot");
fs.writeFileSync(path.join(workspace, "retained.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64"));
fs.writeFileSync(path.join(workspace, "loading.html"), '<body><p>Invented loading snapshot</p></body>');
fs.writeFileSync(path.join(workspace, "snapshot.html"), '<body><p>Invented original snapshot</p><script>document.body.dataset.executed = "yes"</script></body>');
fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({ providers: {
	"fake-claude": { name: "Fake Claude", baseUrl: `http://127.0.0.1:${providerAddress.port}`, api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] },
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
			await page.addInitScript({ content: `(() => { const original = window.setInterval; window.__t20RestoreInterval = () => { window.setInterval = original; }; window.setInterval = (callback, delay, ...args) => original(callback, delay === 2000 ? 30000 : delay, ...args); })();` });
			let writes = 0;
			page.on("request", (request) => { if (request.method() === "PUT" && request.url().includes("/workspace-markdown?")) writes++; });
			await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
			await page.waitForLoadState("networkidle");
			const dismiss = page.locator(".whats-new-close");
			if (await dismiss.count()) await dismiss.click();
			await page.locator(".persistent-agent-card").filter({ hasText: "Cedar Studio" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			await page.locator(".sidebar-workspace-files").waitFor();
			assert(await page.locator(".sidebar-workspace-files").evaluate((tree) => Boolean(tree.closest(".docs-host"))), "the attached tree belongs to the single document container");
			const detach = page.getByRole("button", { name: "Detach", exact: true });
			const detachCount = await detach.count();
			assert(detachCount === 1, `a selected room shows one Detach control before opening a tab (found ${detachCount})`);
			assert(await detach.isEnabled(), "Detach is available for an empty selected room when safeguards are ready");
			await page.evaluate(`window.__t20AppendOpen = window.open; window.open = function (...args) { const child = window.__t20AppendOpen.apply(this, args); if (child) { child.__t20Append = child.Node.prototype.appendChild; child.Node.prototype.appendChild = function (node) { if (node.className === "docs-host") throw new Error("invented post-adoption fault"); return child.__t20Append.call(this, node); }; } return child; };`);
			let appendChild: import("playwright").Page | undefined;
			try {
				const rendererErrors: string[] = [];
				page.on("console", (message) => { if (message.type() === "error") rendererErrors.push(message.text()); });
				page.on("pageerror", (error) => rendererErrors.push(error.message));
				await page.evaluate(() => { const testOpen = window.open; (window as any).__t20AppendCalls = 0; window.open = function (...args) { (window as any).__t20AppendCalls++; return testOpen.apply(this, args); }; });
				const appendOpened = page.waitForEvent("popup");
				await detach.click();
				appendChild = await appendOpened.catch(async (error) => {
					const state = await Promise.race([page.evaluate(() => ({ openCalls: (window as any).__t20AppendCalls, text: document.body.innerText.slice(-800), detachedHosts: document.querySelectorAll(".docs-host").length })), new Promise<"owner-renderer-evaluation-stalled">((resolve) => setTimeout(() => resolve("owner-renderer-evaluation-stalled"), 2_000))]);
					throw new Error(`${error instanceof Error ? error.message : String(error)} (${JSON.stringify({ state, rendererErrors })})`, { cause: error });
				});
				await page.getByText("Cedar Studio · Documents unavailable", { exact: true }).waitFor();
				assert(await page.locator(".sidebar-workspace-files").count() === 0 && writes === 0, "a post-adoption failure retains the fenced host rather than reporting an ordinary refusal");
				await page.evaluate(`window.open = window.__t20AppendOpen;`);
				await appendChild.evaluate(`Node.prototype.appendChild = window.__t20Append;`);
				const appendClosed = appendChild.waitForEvent("close");
				await page.getByRole("button", { name: "Return", exact: true }).click();
				await appendClosed;
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				assert(writes === 0, "recovering the post-adoption failure sends no write");
			} finally {
				await page.evaluate(`window.open = window.__t20AppendOpen; delete window.__t20AppendOpen;`);
				if (appendChild && !appendChild.isClosed()) await appendChild.evaluate(`if (window.__t20Append) Node.prototype.appendChild = window.__t20Append;`).catch(() => {});
			}
			await page.evaluate(`window.__t20RecoveryOpen = window.open; window.__t20RecoveryAdopt = document.adoptNode; document.adoptNode = function () { throw new Error("invented rollback fault"); }; window.open = function (...args) { const child = window.__t20RecoveryOpen.apply(this, args); if (child) { child.__t20RecoveryAdopt = child.document.adoptNode; child.document.adoptNode = function (node) { if (node.className === "docs-host") throw new Error("invented adoption fault"); return child.__t20RecoveryAdopt.call(this, node); }; } return child; };`);
			let recoveryChild: import("playwright").Page | undefined;
			try {
				const recoveryOpened = page.waitForEvent("popup");
				await detach.click();
				recoveryChild = await recoveryOpened;
				await page.getByText("Cedar Studio · Documents unavailable", { exact: true }).waitFor();
				await page.evaluate(`window.open = window.__t20RecoveryOpen; document.adoptNode = window.__t20RecoveryAdopt;`);
				await recoveryChild.evaluate(`document.adoptNode = window.__t20RecoveryAdopt;`);
				const recoveredClosed = recoveryChild.waitForEvent("close");
				await page.getByRole("button", { name: "Return", exact: true }).click();
				await recoveredClosed;
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				assert(await page.locator(".workspace-tab").count() === 0 && writes === 0, "recovering a partial move retains one empty owner session without a write");
			} finally {
				await page.evaluate(`window.open = window.__t20RecoveryOpen; document.adoptNode = window.__t20RecoveryAdopt; delete window.__t20RecoveryOpen; delete window.__t20RecoveryAdopt`).catch(() => {});
				if (recoveryChild && !recoveryChild.isClosed()) await recoveryChild.evaluate(`document.adoptNode = window.__t20RecoveryAdopt; delete window.__t20RecoveryAdopt`).catch(() => {});
			}
			let releaseLoad!: () => void, beginLoad!: () => void;
			const loadReleased = new Promise<void>((resolve) => { releaseLoad = resolve; });
			const loadStarted = new Promise<void>((resolve) => { beginLoad = resolve; });
			await page.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() !== "GET") return route.continue();
				beginLoad();
				await loadReleased;
				await route.fulfill({ status: 403, json: { code: "workspace_read_forbidden", error: "Invented read refusal" } });
			});
			await page.evaluate(`window.__t20PopupOpen = window.open; window.open = function (...args) { window.__t20PopupArgs = args; return window.__t20PopupOpen.apply(this, args); }`);
			const emptyOpened = page.waitForEvent("popup");
			await detach.click();
			const emptyChild = await emptyOpened;
			const popupArgs = await page.evaluate(`window.open = window.__t20PopupOpen; delete window.__t20PopupOpen; window.__t20PopupArgs`) as string[];
			assert(popupArgs[0] === "about:blank" && typeof popupArgs[1] === "string" && !/Cedar|invented|draft/i.test(popupArgs[1]) && /width=\d+/.test(popupArgs[2]) && /height=\d+/.test(popupArgs[2]) && /left=-?\d+/.test(popupArgs[2]) && /top=-?\d+/.test(popupArgs[2]), "the real browser popup request excludes room and draft text and includes placement hints");
			assert(await emptyChild.locator(".workspace-tab").count() === 0, "an empty document session has no invented tab");
			await emptyChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
			fs.writeFileSync(path.join(workspace, "focused.md"), "# Invented focus refresh\n");
			await emptyChild.evaluate(() => window.dispatchEvent(new Event("focus")));
			await emptyChild.locator(".workspace-file-browser-file", { hasText: "focused.md" }).waitFor({ timeout: 1500 });
			await page.evaluate(() => (window as any).__t20RestoreInterval());
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
			let releasePreview!: () => void, startPreview!: () => void, loadingReads = 0;
			const previewReleased = new Promise<void>((resolve) => { releasePreview = resolve; });
			const previewStarted = new Promise<void>((resolve) => { startPreview = resolve; });
			await page.route("**/workspace-preview?*", async (route) => {
				const url = new URL(route.request().url());
				if (url.searchParams.get("path") !== "loading.html" || url.searchParams.get("frame") === "1") return route.continue();
				loadingReads++;
				startPreview();
				await previewReleased;
				await route.continue().catch(() => {});
			});
			await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "loading.html" }).click();
			await previewStarted;
			let loadingChild!: import("playwright").Page;
			try {
				const loadingOpened = page.waitForEvent("popup");
				await detach.click();
				loadingChild = await loadingOpened;
				await loadingChild.locator(".workspace-preview-html").getByText("Loading preview…", { exact: true }).waitFor();
			} finally { releasePreview(); }
			await loadingChild.frameLocator('.workspace-preview-html iframe[title="loading.html"]').getByText("Invented loading snapshot").waitFor();
			assert(loadingReads === 1, "moving a loading preview preserves its existing content request");
			const loadingClosed = loadingChild.waitForEvent("close");
			await loadingChild.getByRole("button", { name: "Return", exact: true }).click();
			await loadingClosed;
			await page.frameLocator('.workspace-preview-html iframe[title="loading.html"]').getByText("Invented loading snapshot").waitFor();
			assert(loadingReads === 1, "Return does not refetch a preview loaded during the move");
			await page.locator(".workspace-tab", { hasText: "loading.html" }).locator(".workspace-tab-close").click();
			await page.unroute("**/workspace-preview?*");
			let htmlReads = 0;
			context.on("request", (request) => {
				const url = new URL(request.url());
				if (url.pathname.endsWith("/workspace-preview") && url.searchParams.get("path") === "snapshot.html" && url.searchParams.get("frame") !== "1") htmlReads++;
			});
			await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "snapshot.html" }).click();
			await page.frameLocator('.workspace-preview-html iframe[title="snapshot.html"]').getByText("Invented original snapshot").waitFor();
			assert(await page.frameLocator('.workspace-preview-html iframe[title="snapshot.html"]').locator("body").getAttribute("data-executed") === "yes", "the authorized original HTML snapshot executes in its opaque frame");
			fs.writeFileSync(path.join(workspace, "snapshot.html"), '<body><p>Invented later disk content</p></body>');
			const previewOpened = page.waitForEvent("popup");
			await detach.click();
			const previewChild = await previewOpened;
			await previewChild.frameLocator('.workspace-preview-html iframe[title="snapshot.html"]').getByText("Invented original snapshot").waitFor();
			assert(await previewChild.frameLocator('.workspace-preview-html iframe[title="snapshot.html"]').locator("body").getAttribute("data-executed") === "yes" && htmlReads === 1, "the child executes the retained snapshot without rereading changed disk content");
			await page.getByText("Cedar Studio · Documents in another window", { exact: true }).waitFor();
			await previewChild.evaluate(`window.__t20OriginalFocus = window.focus; window.__t20FocusCalls = 0; window.focus = () => { window.__t20FocusCalls++; }`);
			try {
				await page.getByRole("button", { name: "Show documents", exact: true }).click();
				assert(await previewChild.evaluate(`window.__t20FocusCalls`) === 1, "Show documents targets the existing registered child once");
			} finally { await previewChild.evaluate(`window.focus = window.__t20OriginalFocus; delete window.__t20OriginalFocus; delete window.__t20FocusCalls`); }
			const previewClosed = previewChild.waitForEvent("close");
			await page.getByRole("button", { name: "Return", exact: true }).click();
			await previewClosed;
			await page.getByText("Cedar Studio · Documents in another window", { exact: true }).waitFor({ state: "detached" });
			assert(await page.getByText("Cedar Studio · Documents in another window", { exact: true }).count() === 0, "chat Return clears the strip after the registered child closes");
			await page.frameLocator('.workspace-preview-html iframe[title="snapshot.html"]').getByText("Invented original snapshot").waitFor();
			assert(htmlReads === 1, "Return keeps the original HTML snapshot without another content read");
			let textReads = 0, imageReads = 0, wordReads = 0, pdfReads = 0, sheetReads = 0;
			context.on("request", (request) => {
				const url = new URL(request.url());
				if (url.searchParams.get("path") === "retained.txt" && url.pathname.endsWith("/workspace-preview")) textReads++;
				if (url.searchParams.get("path") === "retained.docx" && url.pathname.endsWith("/workspace-preview")) wordReads++;
				if (url.searchParams.get("path") === "retained.pdf" && url.pathname.endsWith("/workspace-preview")) pdfReads++;
				if (url.searchParams.get("path") === "retained.xlsx" && url.pathname.endsWith("/workspace-preview")) sheetReads++;
				if (url.searchParams.get("path") === "retained.png" && url.pathname.endsWith("/workspace-image")) imageReads++;
			});
			const snapshotsOpened = page.waitForEvent("popup");
			await detach.click();
			const snapshotsChild = await snapshotsOpened;
			await snapshotsChild.locator(".workspace-file-browser-file", { hasText: "retained.pdf" }).click();
			await snapshotsChild.locator('.workspace-preview-pdf img[alt="Page 1"]').waitFor();
			const originalPdf = await snapshotsChild.locator('.workspace-preview-pdf img[alt="Page 1"]').getAttribute("src");
			await snapshotsChild.locator(".workspace-file-browser-file", { hasText: "retained.xlsx" }).click();
			await snapshotsChild.locator(".workspace-spreadsheet").getByText("Invented original cell", { exact: true }).waitFor();
			await snapshotsChild.locator(".workspace-file-browser-file", { hasText: "retained.docx" }).click();
			await snapshotsChild.frameLocator('.workspace-preview-word iframe[title="retained.docx"]').getByText("Invented heading").waitFor();
			await snapshotsChild.locator(".workspace-file-browser-file", { hasText: "retained.txt" }).click();
			await snapshotsChild.locator(".workspace-preview-text pre").getByText("Invented original text snapshot", { exact: true }).waitFor();
			await snapshotsChild.locator(".workspace-file-browser-file", { hasText: "retained.png" }).click();
			await snapshotsChild.locator('.workspace-preview-image img[alt="retained.png"]').waitFor();
			await snapshotsChild.evaluate(`window.__t20ImageFrames = 0; window.__t20ImageFrame = window.requestAnimationFrame; window.requestAnimationFrame = (callback) => { window.__t20ImageFrames++; return window.__t20ImageFrame(callback); }`);
			try {
				await snapshotsChild.getByRole("button", { name: "Zoom in", exact: true }).click();
				await waitUntil(() => snapshotsChild.evaluate(`window.__t20ImageFrames > 0`), "image zoom schedules in its actual child window");
			} finally { await snapshotsChild.evaluate(`window.requestAnimationFrame = window.__t20ImageFrame; delete window.__t20ImageFrame; delete window.__t20ImageFrames`); }
			fs.writeFileSync(path.join(workspace, "retained.pdf"), "Invented damaged later PDF");
			fs.writeFileSync(path.join(workspace, "retained.xlsx"), "Invented damaged later workbook");
			fs.writeFileSync(path.join(workspace, "retained.docx"), "Invented damaged later document");
			fs.writeFileSync(path.join(workspace, "retained.txt"), "Invented later text snapshot");
			fs.writeFileSync(path.join(workspace, "retained.png"), "Invented invalid later image");
			const snapshotsClosed = snapshotsChild.waitForEvent("close");
			await snapshotsChild.getByRole("button", { name: "Return", exact: true }).click();
			await snapshotsClosed;
			await page.locator('.workspace-preview-image img[alt="retained.png"]').waitFor();
			await waitUntil(() => page.locator('.workspace-preview-image img[alt="retained.png"]').evaluate((image) => (image as HTMLImageElement).naturalWidth === 1).catch(() => false), "Return retains the image snapshot opened first in the child");
			await page.locator(".workspace-tab", { hasText: "retained.txt" }).click();
			await page.locator(".workspace-preview-text pre").getByText("Invented original text snapshot", { exact: true }).waitFor();
			await page.locator(".workspace-tab", { hasText: "retained.docx" }).click();
			await page.frameLocator('.workspace-preview-word iframe[title="retained.docx"]').getByText("Invented heading").waitFor();
			await page.locator(".workspace-tab", { hasText: "retained.xlsx" }).click();
			await page.locator(".workspace-spreadsheet").getByText("Invented original cell", { exact: true }).waitFor();
			await page.locator(".workspace-tab", { hasText: "retained.pdf" }).click();
			await page.locator('.workspace-preview-pdf img[alt="Page 1"]').waitFor();
			assert(await page.locator('.workspace-preview-pdf img[alt="Page 1"]').getAttribute("src") === originalPdf, "Return retains the PDF page opened first in the child");
			assert(textReads === 1 && imageReads === 1 && wordReads === 1 && pdfReads === 1 && sheetReads === 1, "Return does not refetch snapshots opened first in the child");
			await page.locator(".workspace-tab", { hasText: "retained.pdf" }).locator(".workspace-tab-close").click();
			await page.locator(".workspace-tab", { hasText: "retained.xlsx" }).locator(".workspace-tab-close").click();
			await page.locator(".workspace-tab", { hasText: "retained.docx" }).locator(".workspace-tab-close").click();
			await page.locator(".workspace-tab", { hasText: "retained.txt" }).locator(".workspace-tab-close").click();
			await page.locator(".workspace-tab", { hasText: "retained.png" }).locator(".workspace-tab-close").click();
			await page.locator(".workspace-tab", { hasText: "snapshot.html" }).locator(".workspace-tab-close").click();
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
			await page.evaluate(`window.__t20OriginalTree = document.querySelector(".sidebar-workspace-files"); window.__t20OriginalEditor = document.querySelector('[aria-label="Raw Markdown source"]'); window.__t20OriginalHost = window.__t20OriginalEditor?.closest(".docs-host");`);
			assert(await page.evaluate(`Boolean(window.__t20OriginalHost && window.__t20OriginalHost.contains(window.__t20OriginalTree))`), "the attached tree and editor share one stable document container");
			const opened = page.waitForEvent("popup");
			await detach.click();
			const child = await opened;
			await child.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
			await child.locator(".workspace-tab[data-active='true']", { hasText: "invented.md" }).waitFor();
			assert(await child.getByRole("textbox", { name: "Raw Markdown source" }).inputValue() === rawDisplay, "the child presents the source and active tab");
			assert(await child.evaluate(`document.querySelector(".docs-host") === opener.__t20OriginalHost && document.querySelector(".sidebar-workspace-files") === opener.__t20OriginalTree && document.querySelector('[aria-label="Raw Markdown source"]') === opener.__t20OriginalEditor`), "the actual child holds the same container, tree, and editor nodes");
			const childFile = child.locator(".workspace-file-browser-file", { hasText: "invented.md" });
			const childTree = child.getByRole("region", { name: "Workspace files" });
			await childFile.hover();
			await childTree.getByRole("tooltip").getByText("invented.md", { exact: true }).waitFor();
			assert(await page.getByRole("tooltip").count() === 0, "the tree tooltip belongs to the actual child host");
			await child.locator(".documents-child-bar").hover();
			await childTree.getByRole("tooltip").waitFor({ state: "hidden" });
			assert(await page.locator("textarea").first().isVisible(), "chat remains usable in the owner window");
			await page.getByRole("button", { name: "Attachments", exact: true }).click();
			await page.getByRole("region", { name: "Attachments" }).waitFor();
			assert(await child.getByRole("textbox", { name: "Raw Markdown source" }).inputValue() === rawDisplay && await child.locator(".workspace-tab[data-active='true']", { hasText: "invented.md" }).isVisible(), "opening the chat Attachments pane keeps the same active child document");
			await page.getByRole("button", { name: "Attachments", exact: true }).click();
			const writesBeforeTab = writes;
			await child.locator(".workspace-tab", { hasText: "invented.md" }).locator(".workspace-tab-close").click();
			assert(!child.isClosed() && await child.locator(".workspace-tab").count() === 0 && writes === writesBeforeTab, "closing a tab once leaves the document child open without writing");
			let selectedReads = 0;
			const countSelectedRead = (request: import("playwright").Request) => { const url = new URL(request.url()); if (request.method() === "GET" && url.pathname.endsWith("/workspace-markdown") && url.searchParams.get("path") === "invented.md") selectedReads++; };
			context.on("request", countSelectedRead);
			try {
				await child.locator(".workspace-file-browser-file", { hasText: "invented.md" }).click();
				await child.locator(".markdown-editor-tiptap .ProseMirror").getByText("Invented source").waitFor();
				await child.waitForTimeout(250);
				assert(!child.isClosed() && selectedReads === 1 && writes === writesBeforeTab, "the selected file executes once without child closure or a write");
			} finally { context.off("request", countSelectedRead); }
			await child.keyboard.press("Control+f");
			const childSearch = child.getByRole("search");
			await childSearch.waitFor();
			await child.evaluate(`window.__t20FindFrames = 0; window.__t20FindFrame = window.requestAnimationFrame; window.requestAnimationFrame = (callback) => { window.__t20FindFrames++; return window.__t20FindFrame(callback); }`);
			try {
				await childSearch.getByPlaceholder("Find in file…").fill("Invented");
				await child.locator(".md-search-match-current").waitFor();
				await waitUntil(() => child.evaluate(`window.__t20FindFrames > 0`), "the search scroll schedules in the child window");
				await childSearch.getByPlaceholder("Find in file…").press("Escape");
			} finally { await child.evaluate(`window.requestAnimationFrame = window.__t20FindFrame; delete window.__t20FindFrame; delete window.__t20FindFrames`); }
			assert(await childSearch.count() === 0 && await child.locator(".workspace-tab", { hasText: "invented.md" }).count() === 1, "Escape closes Find without closing the actual child document tab");
			await page.evaluate(`window.__t20RealmTimeout = window.setTimeout; window.setTimeout = (callback, delay, ...args) => window.__t20RealmTimeout(callback, delay === 1000 ? 30000 : delay, ...args)`);
			try {
				await child.locator(".workspace-file-browser-file", { hasText: "interaction.md" }).click();
				const childCheckbox = child.locator('.markdown-editor-tiptap input[type="checkbox"]').first();
				await childCheckbox.click();
				assert(await childCheckbox.isChecked(), "the actual child editor applies a checkbox click");
				await child.locator(".markdown-editor-status").getByText("Unsaved", { exact: true }).waitFor();
				await child.locator(".workspace-file-browser-file", { hasText: "invented.md" }).click();
				await page.getByRole("dialog", { name: "Unsaved Markdown changes" }).getByRole("button", { name: "Discard changes" }).click();
				await child.locator(".workspace-tab[data-active='true']", { hasText: "invented.md" }).waitFor();
				await child.locator(".workspace-file-browser-file", { hasText: "interaction.md" }).click();
				await child.getByRole("button", { name: "Preview", exact: true }).click();
				let externalLinkRequests = 0;
				await context.route("https://example.invalid/**", (route) => { externalLinkRequests++; return route.abort(); });
				await page.evaluate(`window.__t20OriginalOpen = window.open; window.__t20ExternalOpens = 0; window.open = () => { window.__t20ExternalOpens++; return null; }`);
				await child.evaluate(`window.__t20OriginalOpen = window.open; window.__t20ExternalOpens = 0; window.open = () => { window.__t20ExternalOpens++; return null; }`);
				try {
					await child.getByRole("link", { name: "External invented" }).click();
					const childOpens = await child.evaluate(`window.__t20ExternalOpens`);
					const ownerOpens = await page.evaluate(`window.__t20ExternalOpens`);
					assert(childOpens === 1 && ownerOpens === 0 && externalLinkRequests === 0, `an explicit external link uses only the child fake opener without a network request: child=${childOpens}, owner=${ownerOpens}, requests=${externalLinkRequests}`);
				} finally {
					await child.evaluate(`window.open = window.__t20OriginalOpen; delete window.__t20OriginalOpen; delete window.__t20ExternalOpens`);
					await page.evaluate(`window.open = window.__t20OriginalOpen; delete window.__t20OriginalOpen; delete window.__t20ExternalOpens`);
					await context.unroute("https://example.invalid/**");
				}
				await child.getByRole("link", { name: "Open invented" }).click();
				await child.locator(".workspace-tab[data-active='true']", { hasText: "invented.md" }).waitFor();
				assert(!child.isClosed() && Number(writes) === 0, "child checkbox and internal preview link use the current document host without a write");
			} finally { await page.evaluate(`window.setTimeout = window.__t20RealmTimeout; delete window.__t20RealmTimeout`); }
			let childPrompts = 0, ownerPrompts = 0;
			const onChildPrompt = (dialog: import("playwright").Dialog) => { childPrompts++; void dialog.dismiss(); };
			const onOwnerPrompt = (dialog: import("playwright").Dialog) => { ownerPrompts++; void dialog.dismiss(); };
			child.on("dialog", onChildPrompt);
			page.on("dialog", onOwnerPrompt);
			try {
				await child.getByRole("button", { name: "Set or remove link", exact: true }).click();
				await waitUntil(() => Promise.resolve(childPrompts + ownerPrompts > 0), "the link prompt opens");
				assert(childPrompts === 1 && ownerPrompts === 0, "the link prompt belongs to the actual child window");
			} finally { child.off("dialog", onChildPrompt); page.off("dialog", onOwnerPrompt); }
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
			assert(await detach.isEnabled(), "Detach remains available after child conflict recovery");
			const pageCountBeforeConflictReopen = context.pages().length;
			const conflictReopened = page.waitForEvent("popup");
			await detach.click();
			conflictChild = await conflictReopened;
			assert(context.pages().includes(conflictChild), "the fresh conflict child belongs to the smoke browser context");
			assert(await conflictChild.opener() === page, "the owner remains the actual opener after conflict recovery");
			assert(context.pages().length === pageCountBeforeConflictReopen + 1, "conflict recovery opens exactly one fresh child page");
			await conflictChild.locator(".markdown-editor-conflict").waitFor();
			let releaseKeep!: () => void, beginKeep!: () => void;
			const keepReleased = new Promise<void>((resolve) => { releaseKeep = resolve; });
			const keepStarted = new Promise<void>((resolve) => { beginKeep = resolve; });
			await context.route("**/workspace-markdown?*", async (route) => {
				if (route.request().method() !== "PUT") return route.continue();
				beginKeep();
				await keepReleased;
				await route.continue();
			});
			try {
				const keepMine = conflictChild.getByRole("button", { name: "Keep mine", exact: true });
				await keepMine.click();
				await keepStarted;
				const closedConflictChild = conflictChild.waitForEvent("close");
				const returnFromConflict = conflictChild.getByRole("button", { name: "Return", exact: true });
				await returnFromConflict.waitFor({ timeout: 30_000 });
				await returnFromConflict.click({ timeout: 30_000 });
				await closedConflictChild;
				assert(await raw.inputValue() === conflictDraft && Number(writes) === 2, "Return retains the pending conflict resolution and exact draft");
			} finally { releaseKeep(); }
			await waitUntil(() => fs.readFileSync(path.join(workspace, "invented.md"), "utf8") === conflictDraft, "the retained Keep mine reaches the original workspace");
			assert(Number(writes) === 2, "returning a pending Keep mine sends no duplicate write");
			await waitUntil(async () => await page.locator(".markdown-editor-status").textContent() === "Saved", "the retained Keep mine settles");
			await context.unroute("**/workspace-markdown?*");
			let unknownPutIntercepted = 0;
			await context.route(/\/workspace-markdown(?:\?|$)/, (route) => {
				if (route.request().method() !== "PUT") return route.continue();
				unknownPutIntercepted++;
				return route.abort();
			});
			const unknownOpened = page.waitForEvent("popup");
			await detach.click();
			const unknownChild = await unknownOpened;
			const unknownRaw = unknownChild.getByRole("textbox", { name: "Raw Markdown source" });
			await unknownRaw.waitFor();
			const unknownDraft = "# Invented unresolved child draft\n";
			await unknownRaw.fill(unknownDraft);
			assert(await unknownRaw.inputValue() === unknownDraft, "the fresh child retains the exact unresolved-write draft after typing");
			assert(await unknownChild.locator(".markdown-editor-save").isEnabled(), `typing in the reopened child enables Save (status=${await unknownChild.locator(".markdown-editor-status").textContent()})`);
			await unknownChild.locator(".markdown-editor-save").click();
			await waitUntil(() => unknownPutIntercepted === 1, "one unknown workspace PUT reaches the browser boundary");
			assert(unknownPutIntercepted === 1, "Save in the fresh child sends one intercepted unresolved write");
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
			const closeRoom = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Invented Close Ordering", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
			assert(closeRoom.status === 201, "the close-order room is created");
			const closeRoomId = String(closeRoom.body?.agent?.id ?? "");
			assert((await api(`/api/persistent-agents/${encodeURIComponent(closeRoomId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) })).status === 200, "the close-order room uses the invented workspace");
			const closePage = await context.newPage();
			try {
				await closePage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				await closePage.waitForLoadState("networkidle");
				const closeDismiss = closePage.locator(".whats-new-close");
				if (await closeDismiss.count()) await closeDismiss.click();
				await closePage.locator(".persistent-agent-card").filter({ hasText: "Invented Close Ordering" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await closePage.locator(".sidebar-workspace-files").waitFor();
				const closeOpened = closePage.waitForEvent("popup");
				await closePage.getByRole("button", { name: "Detach", exact: true }).click();
				const heldChild = await closeOpened;
				await heldChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				await heldChild.evaluate(`window.__t20OriginalClose = window.close; window.__t20CloseCalls = 0; window.close = () => { window.__t20CloseCalls++; }`);
				await closePage.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				await waitUntil(() => heldChild.evaluate(`window.__t20CloseCalls > 0`), "the real Home flow requests the registered child close");
				assert(!heldChild.isClosed() && (await closePage.evaluate(() => location.hash)).includes("/room/"), "Home waits when the actual child is not closed");
				await closePage.getByText("Invented Close Ordering · Documents unavailable", { exact: true }).waitFor({ timeout: 8_000 });
				assert(!heldChild.isClosed() && (await closePage.evaluate(() => location.hash)).includes("/room/"), "a child-close settlement deadline keeps the original continuation fenced");
				await closePage.getByRole("navigation", { name: "Room navigation" }).getByRole("button", { name: "Home", exact: true }).click();
				assert((await closePage.evaluate(() => location.hash)).includes("/room/"), "a second Home cannot replace the unresolved original action");
				const childClosed = heldChild.waitForEvent("close");
				await heldChild.evaluate(`window.close = window.__t20OriginalClose; window.close()`);
				await childClosed;
				await waitUntil(async () => !(await closePage.evaluate(() => location.hash)).includes("/room/"), "Home continues after actual child closure");
			} finally { await closePage.close().catch(() => {}); }
			const historyPage = await context.newPage();
			try {
				await historyPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				await historyPage.waitForLoadState("networkidle");
				const dismissHistory = historyPage.locator(".whats-new-close");
				if (await dismissHistory.count()) await dismissHistory.click();
				await historyPage.locator(".persistent-agent-card").filter({ hasText: "Invented Close Ordering" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await historyPage.locator(".sidebar-workspace-files").waitFor();
				await waitUntil(async () => (await historyPage.evaluate(() => location.hash)).includes("/room/"), "the history source room is recorded");
				const historyOpened = historyPage.waitForEvent("popup");
				await historyPage.getByRole("button", { name: "Detach", exact: true }).click();
				const historyChild = await historyOpened;
				await historyChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				await historyChild.evaluate(`window.__t20OriginalClose = window.close; window.__t20CloseCalls = 0; window.close = () => { window.__t20CloseCalls++; }`);
				await historyPage.evaluate(() => window.history.back());
				await waitUntil(() => historyChild.evaluate(`window.__t20CloseCalls > 0`), "browser Back requests the registered child close");
				assert(!historyChild.isClosed() && await historyPage.getByRole("navigation", { name: "Room navigation" }).isVisible(), "browser Back keeps the current room visible until the child actually closes");
				const historyClosed = historyChild.waitForEvent("close");
				await historyChild.evaluate(`window.close = window.__t20OriginalClose; window.close()`);
				await historyClosed;
				await historyPage.getByRole("heading", { name: "Your rooms." }).waitFor();
			} finally { await historyPage.close().catch(() => {}); }
			const reloadRoom = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Invented Reload Ordering", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
			assert(reloadRoom.status === 201, "the reload-order room is created");
			const reloadRoomId = String(reloadRoom.body?.agent?.id ?? "");
			assert((await api(`/api/persistent-agents/${encodeURIComponent(reloadRoomId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) })).status === 200, "the reload-order room uses the invented workspace");
			const reloadPage = await context.newPage();
			const moverPage = await context.newPage();
			try {
				await reloadPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				await reloadPage.waitForLoadState("networkidle");
				const dismissReload = reloadPage.locator(".whats-new-close");
				if (await dismissReload.count()) await dismissReload.click();
				await reloadPage.locator(".persistent-agent-card").filter({ hasText: "Invented Reload Ordering" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				const composer = reloadPage.locator("textarea").first();
				await composer.fill("Invented original question.");
				await composer.press("Enter");
				await reloadPage.getByText("Invented fake answer.", { exact: true }).waitFor();
				const oldStatus = await api(`/api/persistent-agents/${encodeURIComponent(reloadRoomId)}/status`);
				const oldThread = String(oldStatus.body?.runtime?.activeThreadId ?? "");
				assert(oldThread, "the reload-order room has a current conversation");
				const reloadOpened = reloadPage.waitForEvent("popup");
				await reloadPage.getByRole("button", { name: "Detach", exact: true }).click();
				const reloadChild = await reloadOpened;
				await reloadChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				await reloadChild.evaluate(`window.__t20OriginalClose = window.close; window.__t20CloseCalls = 0; window.close = () => { window.__t20CloseCalls++; }`);
				await moverPage.goto(`${baseUrl}/#/room/${encodeURIComponent(reloadRoomId)}`);
				await moverPage.getByText("Invented original question.", { exact: true }).waitFor();
				await moverPage.getByRole("button", { name: "Forget", exact: true }).first().click();
				await moverPage.getByRole("alertdialog", { name: "Forget this conversation and start fresh?" }).getByRole("button", { name: "Forget", exact: true }).click();
				await waitUntil(async () => { const current = await api(`/api/persistent-agents/${encodeURIComponent(reloadRoomId)}/status`); const next = String(current.body?.runtime?.activeThreadId ?? ""); return Boolean(next && next !== oldThread); }, "the other owner moves the room to an invented replacement conversation");
				await composer.fill("Invented stale question.");
				await composer.press("Enter");
				await reloadPage.getByText("This room went on in another window. Reload to continue there.", { exact: true }).waitFor();
				await reloadPage.route("**/api/persistent-agents", (route) => route.fulfill({ status: 503, json: { error: "Invented unavailable status" } }));
				const refusedStatus = reloadPage.waitForResponse((response) => response.url().endsWith("/api/persistent-agents") && response.status() === 503);
				await reloadPage.getByRole("button", { name: "Reload", exact: true }).click();
				await refusedStatus;
				await reloadPage.waitForTimeout(250);
				assert(await reloadPage.getByRole("navigation", { name: "Room navigation" }).isVisible() && !reloadChild.isClosed() && await reloadChild.evaluate(`window.__t20CloseCalls`) === 0, "a failed Reload status read retains the current room and child");
				await reloadPage.unroute("**/api/persistent-agents");
				const liveStatuses = await api("/api/persistent-agents");
				assert(liveStatuses.status === 200 && Array.isArray(liveStatuses.body), "the invented room statuses are readable");
				const sameContextStatuses = liveStatuses.body.map((status: any) => status.id === reloadRoomId ? { ...status, runtime: { ...status.runtime, state: "active", activeThreadId: oldThread }, activeLock: { ...status.activeLock, surface: "web" } } : status);
				await reloadPage.route("**/api/persistent-agents", (route) => route.fulfill({ status: 200, json: sameContextStatuses }));
				await reloadPage.route("**/threads/**", (route) => route.request().method() === "GET" ? route.fulfill({ status: 503, json: { error: "Invented unavailable thread" } }) : route.continue());
				const refusedThread = reloadPage.waitForResponse((response) => response.url().includes("/threads/") && response.status() === 503);
				await reloadPage.getByRole("button", { name: "Reload", exact: true }).click();
				await refusedThread;
				await reloadPage.waitForTimeout(250);
				assert(await reloadPage.getByRole("navigation", { name: "Room navigation" }).isVisible() && !reloadChild.isClosed() && await reloadChild.evaluate(`window.__t20CloseCalls`) === 0, "a failed same-context resume retains the current room and child");
				await reloadPage.unroute("**/api/persistent-agents");
				await reloadPage.unroute("**/threads/**");
				const oldThreadRecord = await api(`/api/persistent-agents/${encodeURIComponent(reloadRoomId)}/threads/${encodeURIComponent(oldThread)}`);
				assert(oldThreadRecord.status === 200 && oldThreadRecord.body?.thread, "the invented earlier thread is readable");
				let sameReads = 0, sameWrites = 0;
				await reloadPage.route("**/api/persistent-agents", (route) => route.fulfill({ status: 200, json: sameContextStatuses }));
				await reloadPage.route("**/threads/**", (route) => {
					if (!route.request().url().endsWith(`/threads/${encodeURIComponent(oldThread)}`)) return route.continue();
					if (route.request().method() === "GET") { sameReads++; return route.fulfill({ status: 200, json: oldThreadRecord.body }); }
					if (route.request().method() === "PUT") { sameWrites++; return route.fulfill({ status: 200, json: { thread: oldThreadRecord.body.thread, runtime: sameContextStatuses.find((status: any) => status.id === reloadRoomId).runtime } }); }
					return route.continue();
				});
				await reloadPage.getByRole("button", { name: "Reload", exact: true }).click();
				await waitUntil(() => sameWrites === 1, "same-context Reload completes its existing thread read and save");
				assert(sameReads === 1 && !reloadChild.isClosed() && await reloadChild.evaluate(`window.__t20CloseCalls`) === 0 && await reloadChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).isVisible(), "same-context Reload executes once without closing or replacing the document child");
				await reloadPage.unroute("**/api/persistent-agents");
				await reloadPage.unroute("**/threads/**");
				await composer.fill("Invented stale question again.");
				await composer.press("Enter");
				await reloadPage.getByText("This room went on in another window. Reload to continue there.", { exact: true }).waitFor();
				let replacementReads = 0;
				reloadPage.on("request", (request) => { if (request.method() === "GET" && request.url().includes("/threads/")) replacementReads++; });
				await reloadPage.getByRole("button", { name: "Reload", exact: true }).click();
				await waitUntil(() => reloadChild.evaluate(`window.__t20CloseCalls > 0`), "moved-room Reload requests the registered child close");
				assert(!reloadChild.isClosed() && replacementReads === 0, "moved-room Reload withholds the replacement thread while the actual child is open");
				const reloadClosed = reloadChild.waitForEvent("close");
				await reloadChild.evaluate(`window.close = window.__t20OriginalClose; window.close()`);
				await reloadClosed;
				await waitUntil(() => replacementReads > 0, "moved-room Reload reads the replacement only after child closure");
			} finally { await reloadPage.close().catch(() => {}); await moverPage.close().catch(() => {}); }
			const mementoRoom = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Invented Memento Ordering", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
			assert(mementoRoom.status === 201, "the Memento-order room is created");
			const mementoRoomId = String(mementoRoom.body?.agent?.id ?? "");
			assert((await api(`/api/persistent-agents/${encodeURIComponent(mementoRoomId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) })).status === 200, "the Memento-order room uses the invented workspace");
			const mementoPage = await context.newPage();
			try {
				await mementoPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				await mementoPage.waitForLoadState("networkidle");
				const dismissMemento = mementoPage.locator(".whats-new-close");
				if (await dismissMemento.count()) await dismissMemento.click();
				await mementoPage.locator(".persistent-agent-card").filter({ hasText: "Invented Memento Ordering" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await mementoPage.locator(".sidebar-workspace-files").waitFor();
				const mementoOpened = mementoPage.waitForEvent("popup");
				await mementoPage.getByRole("button", { name: "Detach", exact: true }).click();
				const mementoChild = await mementoOpened;
				await mementoChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				await mementoChild.evaluate(`window.__t20OriginalClose = window.close; window.__t20CloseCalls = 0; window.close = () => { window.__t20CloseCalls++; }`);
				let mementoRequests = 0;
				mementoPage.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith("/memento")) mementoRequests++; });
				const confirm = mementoPage.getByRole("alertdialog", { name: "Forget this conversation and start fresh?" });
				await mementoPage.getByRole("button", { name: "Forget", exact: true }).first().click();
				await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
				await confirm.waitFor({ state: "detached" });
				assert(!mementoChild.isClosed() && await mementoChild.evaluate(`window.__t20CloseCalls`) === 0 && mementoRequests === 0, "canceling Memento confirmation leaves the child open without an operation request");
				await mementoPage.getByRole("button", { name: "Forget", exact: true }).first().click();
				await confirm.getByRole("button", { name: "Forget", exact: true }).click();
				await waitUntil(() => mementoChild.evaluate(`window.__t20CloseCalls > 0`), "confirmed Memento requests the registered child close");
				assert(!mementoChild.isClosed() && mementoRequests === 0, "Memento waits for actual child closure before its request");
				const mementoClosed = mementoChild.waitForEvent("close");
				const mementoResponse = mementoPage.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith("/memento"));
				await mementoChild.evaluate(`window.close = window.__t20OriginalClose; window.close()`);
				await mementoClosed;
				assert((await mementoResponse).ok(), "confirmed Memento reaches its real route after the child closes");
			} finally { await mementoPage.close().catch(() => {}); }
			const settingsRoom = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Invented Settings Memento", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
			assert(settingsRoom.status === 201, "the settings Memento room is created");
			const settingsRoomId = String(settingsRoom.body?.agent?.id ?? "");
			assert((await api(`/api/persistent-agents/${encodeURIComponent(settingsRoomId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) })).status === 200, "the settings Memento room uses the invented workspace");
			const settingsPage = await context.newPage();
			try {
				await settingsPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				await settingsPage.waitForLoadState("networkidle");
				const dismissSettings = settingsPage.locator(".whats-new-close");
				if (await dismissSettings.count()) await dismissSettings.click();
				await settingsPage.locator(".persistent-agent-card").filter({ hasText: "Invented Settings Memento" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await settingsPage.locator(".sidebar-workspace-files").waitFor();
				const settingsOpened = settingsPage.waitForEvent("popup");
				await settingsPage.getByRole("button", { name: "Detach", exact: true }).click();
				const settingsChild = await settingsOpened;
				await settingsChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				await settingsChild.evaluate(`window.__t20OriginalClose = window.close; window.__t20CloseCalls = 0; window.close = () => { window.__t20CloseCalls++; }`);
				let settingsRequests = 0;
				settingsPage.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith("/memento")) settingsRequests++; });
				await settingsPage.getByRole("button", { name: "Room settings" }).click();
				await settingsPage.locator(".settings-dialog-nav-item").filter({ hasText: /^Conversation$/ }).first().click();
				const settingsForget = settingsPage.locator(".room-session-section").getByRole("button", { name: "Forget…" });
				const settingsConfirm = settingsPage.getByRole("alertdialog", { name: "Forget this conversation and start fresh?" });
				await settingsForget.click();
				await settingsConfirm.getByRole("button", { name: "Cancel", exact: true }).click();
				await settingsConfirm.waitFor({ state: "detached" });
				assert(!settingsChild.isClosed() && await settingsChild.evaluate(`window.__t20CloseCalls`) === 0 && settingsRequests === 0, "canceling room-settings Memento keeps the child and sends no request");
				await settingsForget.click();
				await settingsConfirm.getByRole("button", { name: "Forget", exact: true }).click();
				await waitUntil(() => settingsChild.evaluate(`window.__t20CloseCalls > 0`), "confirmed settings Memento requests child closure");
				assert(!settingsChild.isClosed() && settingsRequests === 0, "room-settings Memento waits for actual child closure before its request");
				const settingsClosed = settingsChild.waitForEvent("close");
				const settingsResponse = settingsPage.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith("/memento"));
				await settingsChild.evaluate(`window.close = window.__t20OriginalClose; window.close()`);
				await settingsClosed;
				assert((await settingsResponse).ok(), "room-settings Memento reaches its real route after child closure");
			} finally { await settingsPage.close().catch(() => {}); }
			for (const operation of ["archive", "purge"] as const) {
				const roomName = operation === "archive" ? "Invented Archive Ordering" : "Invented Purge Ordering";
				const room = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: roomName, userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
				assert(room.status === 201, `the ${operation} ordering room is created`);
				const roomId = String(room.body?.agent?.id ?? "");
				assert((await api(`/api/persistent-agents/${encodeURIComponent(roomId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) })).status === 200, `the ${operation} ordering room uses the invented workspace`);
				const operationPage = await context.newPage();
				try {
					await operationPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
					await operationPage.waitForLoadState("networkidle");
					const operationDismiss = operationPage.locator(".whats-new-close");
					if (await operationDismiss.count()) await operationDismiss.click();
					await operationPage.locator(".persistent-agent-card").filter({ hasText: roomName }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
					await operationPage.locator(".sidebar-workspace-files").waitFor();
					const operationOpened = operationPage.waitForEvent("popup");
					await operationPage.getByRole("button", { name: "Detach", exact: true }).click();
					const operationChild = await operationOpened;
					await operationChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
					await operationChild.evaluate(`window.__t20OriginalClose = window.close; window.__t20CloseCalls = 0; window.close = () => { window.__t20CloseCalls++; }`);
					let operationRequests = 0;
					operationPage.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith(`/${operation}`)) operationRequests++; });
					await operationPage.getByRole("button", { name: "Room settings" }).click();
					await operationPage.locator(".settings-dialog-nav-item").filter({ hasText: /^Archive or delete$/ }).first().click();
					const operationButton = operationPage.locator(".room-danger-zone").getByRole("button", { name: operation === "archive" ? "Archive" : "Delete room", exact: true });
					if (operation === "purge") {
						await operationButton.click();
						const confirmation = operationPage.getByRole("alertdialog", { name: `Delete ${roomName}?` });
						await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
						await confirmation.waitFor({ state: "detached" });
						assert(!operationChild.isClosed() && await operationChild.evaluate(`window.__t20CloseCalls`) === 0 && operationRequests === 0, "canceling purge confirmation leaves the child open and sends no request");
					}
					await operationButton.click();
					if (operation === "purge") await operationPage.getByRole("alertdialog", { name: `Delete ${roomName}?` }).getByRole("button", { name: "Delete room", exact: true }).click();
					await waitUntil(() => operationChild.evaluate(`window.__t20CloseCalls > 0`), `${operation} requests the registered child close`);
					assert(!operationChild.isClosed() && operationRequests === 0, `${operation} waits for actual child closure before its route`);
					const operationClosed = operationChild.waitForEvent("close");
					const operationResponse = operationPage.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/${operation}`) && response.ok());
					await operationChild.evaluate(`window.close = window.__t20OriginalClose; window.close()`);
					await operationClosed;
					assert((await operationResponse).ok(), `${operation} reaches its real route after the child closes`);
				} finally { await operationPage.close().catch(() => {}); }
			}
			const checkpointRoom = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Invented Checkpoint Ordering", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
			assert(checkpointRoom.status === 201, "the checkpoint ordering room is created");
			const checkpointRoomId = String(checkpointRoom.body?.agent?.id ?? "");
			assert((await api(`/api/persistent-agents/${encodeURIComponent(checkpointRoomId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) })).status === 200, "the checkpoint room uses the invented workspace");
			const checkpointPage = await context.newPage();
			try {
				await checkpointPage.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
				await checkpointPage.waitForLoadState("networkidle");
				const checkpointDismiss = checkpointPage.locator(".whats-new-close");
				if (await checkpointDismiss.count()) await checkpointDismiss.click();
				await checkpointPage.locator(".persistent-agent-card").filter({ hasText: "Invented Checkpoint Ordering" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
				await checkpointPage.locator(".sidebar-workspace-files").waitFor();
				const checkpointComposer = checkpointPage.locator("textarea").first();
				await checkpointComposer.fill("Invented checkpoint request.");
				await checkpointComposer.press("Enter");
				await checkpointPage.getByText("Invented fake answer.", { exact: true }).waitFor({ timeout: 45_000 });
				await waitUntil(async () => {
					const status = await api(`/api/persistent-agents/${encodeURIComponent(checkpointRoomId)}/status`);
					const threadId = status.body?.activeThread?.threadId;
					if (!threadId || status.body?.activeThread?.inFlight !== false) return false;
					const thread = await api(`/api/persistent-agents/${encodeURIComponent(checkpointRoomId)}/threads/${encodeURIComponent(threadId)}`);
					return JSON.stringify(thread.body).includes("Invented fake answer.");
				}, "the fake answer is saved before checkpointing");
				const checkpointOpened = checkpointPage.waitForEvent("popup");
				await checkpointPage.getByRole("button", { name: "Detach", exact: true }).click();
				const checkpointChild = await checkpointOpened;
				await checkpointChild.locator(".workspace-file-browser-file", { hasText: "invented.md" }).waitFor();
				await checkpointChild.evaluate(`window.__t20OriginalClose = window.close; window.__t20CloseCalls = 0; window.close = () => { window.__t20CloseCalls++; }`);
				await checkpointPage.getByRole("button", { name: "Choose what to keep…", exact: true }).click();
				const checkpointDialog = checkpointPage.getByRole("dialog", { name: "Remember this conversation" });
				await checkpointDialog.getByRole("button", { name: "Generate memory proposal" }).click();
				await checkpointDialog.getByText("Invented checkpoint point 12 is agreed for the synthetic workspace.", { exact: true }).waitFor({ timeout: 30_000 });
				const threadGets: string[] = [];
				checkpointPage.on("request", (request) => { if (request.method() === "GET" && request.url().includes("/threads/")) threadGets.push(request.url()); });
				const approvalResponse = checkpointPage.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith("/checkpoint/approve") && response.ok());
				await checkpointDialog.getByRole("button", { name: "Save to memory" }).click();
				const approval = await (await approvalResponse).json();
				const nextThread = String(approval.postCheckpoint?.activeThreadId || approval.runtimeBoundary?.newThreadId || "");
				assert(nextThread, "checkpoint supplies the invented replacement conversation");
				await waitUntil(() => checkpointChild.evaluate(`window.__t20CloseCalls > 0`), "checkpoint replacement requests child closure");
				assert(!checkpointChild.isClosed() && !threadGets.some((url) => url.endsWith(`/threads/${encodeURIComponent(nextThread)}`)), "checkpoint save completes but the replacement waits for the actual child close");
				const checkpointClosed = checkpointChild.waitForEvent("close");
				await checkpointChild.evaluate(`window.close = window.__t20OriginalClose; window.close()`);
				await checkpointClosed;
				await waitUntil(() => Promise.resolve(threadGets.some((url) => url.endsWith(`/threads/${encodeURIComponent(nextThread)}`))), "checkpoint replacement reads the original target after child closure");
				await checkpointDialog.getByText("Memory updated", { exact: true }).waitFor({ timeout: 20_000 });
			} finally { await checkpointPage.close().catch(() => {}); }
		} finally { await context.close(); }
	} finally { await browser.close(); }
	console.log("workspace-detached-documents-ui smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-4000));
	throw error;
} finally {
	await stopSmokeServer(server);
	await new Promise<void>((resolve) => provider.close(() => resolve()));
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
