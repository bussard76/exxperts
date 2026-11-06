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
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

function ninePagePdf(): Buffer {
	const objects: string[] = [];
	const kids = Array.from({ length: 9 }, (_, index) => `${3 + index * 2} 0 R`).join(" ");
	objects.push("<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${kids}] /Count 9 >>`);
	for (let index = 0; index < 9; index++) {
		const stream = "1 0 0 rg 10 10 180 80 re f";
		objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents ${4 + index * 2} 0 R >>`, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
	}
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
fs.writeFileSync(path.join(folder, "report.pdf"), ninePagePdf());
fs.writeFileSync(path.join(folder, "report.docx"), await smallDocx());
fs.writeFileSync(path.join(folder, "sample.xlsx"), "invented placeholder");
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
		let previewRequests = 0;
		let openStatus = 202;
		const openRequests: { method: string; body: unknown; intent: string | undefined }[] = [];
		await page.route("**/workspace-open", async (route) => {
			const request = route.request();
			openRequests.push({ method: request.method(), body: request.postDataJSON(), intent: request.headers()["x-exxperts-local-action"] });
			await route.fulfill({ status: openStatus, contentType: "application/json", body: JSON.stringify(openStatus === 202 ? { accepted: true } : { error: "invented private detail" }) });
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
		await externalOpen.click();
		const openBody = openRequests[0]?.body as { path?: string; conversationId?: string };
		assert(openRequests.length === 1 && openRequests[0].method === "POST" && openRequests[0].intent === "open-workspace-file" && openBody.path === "photo.png" && typeof openBody.conversationId === "string" && openBody.conversationId.length > 0 && Object.keys(openBody).sort().join(",") === "conversationId,path", "the local open button sends one explicit intent for the active file");
		openStatus = 500;
		await externalOpen.click();
		await page.getByText("This file could not be opened in another program.", { exact: true }).waitFor();
		assert(await page.getByText("invented private detail").count() === 0, "open failures do not expose server details");
		openStatus = 202;
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
		await waitUntil(async () => (await pdfPage.count()) === 9 && await pdfPage.first().evaluate((img) => (img as HTMLImageElement).naturalWidth > 0).catch(() => false), "all nine rendered PDF pages appear");
		assert((await activeName()) === "report.pdf", "PDF opens in its own tab");
		assert(await page.getByRole("button", { name: "Open PDF" }).count() === 1, "PDF uses its fixed open label");
		assert(await pdfPage.nth(8).getAttribute("alt") === "Page 9", "each PDF page has an accessible name");
		const painted = await pdfPage.first().evaluate((img) => {
			const image = img as HTMLImageElement;
			const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
			const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
			const pixel = context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
			return pixel[0] > 200 && pixel[1] < 80 && pixel[2] < 80;
		});
		assert(painted, "the displayed PDF retains its color landmark");
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
		let corruptWorkbook = false;
		await page.route("**/workspace-preview?*", async (route) => {
			const url = new URL(route.request().url());
			if (url.searchParams.get("path") !== "sample.xlsx") return route.continue();
			const font = { family: "Arial", sizePt: 11, color: "#CC2200", bold: true, italic: false, underline: "none", strike: false };
			const style = { fill: "#FFFF00", font, borders: { top: { style: "thin", color: "#000000" }, right: null, bottom: null, left: null }, align: { horizontal: "left", vertical: "bottom", wrap: false } };
			const otherStyle = { ...style, font: { ...font, color: "#0044CC", italic: true } };
			const sheet = (id: string, name: string, text: string, wide = false) => ({ id, name, visibility: "visible", rowCount: wide ? 80 : 1, columnCount: wide ? 12 : 1, defaultRowHeightPx: 20, defaultColumnWidthPx: 64, rows: [], columns: [{ index: 1, widthPx: 173 }], cells: [{ row: 1, column: 1, text, style: 0, runs: wide ? [{ text: "Invented ", style: 0 }, { text: "total", style: 1 }] : null, valueKind: "text" }, ...(wide ? [{ row: 2, column: 2, text: "—", style: 0, runs: null, valueKind: "formula-result-unavailable" }, { row: 3, column: 3, text: "Merged cell", style: 0, runs: null, valueKind: "text" }, { row: 80, column: 12, text: "Last cell", style: 0, runs: null, valueKind: "text" }] : [])], merges: wide ? [{ top: 3, left: 3, bottom: 4, right: 4 }] : [] });
			const summary = sheet("1", "Summary", "Invented total", true);
			if (corruptWorkbook) summary.cells[0].style = 77;
			const empty = { ...sheet("3", "Empty", ""), visibility: "hidden", rowCount: 0, columnCount: 0, columns: [], cells: [] };
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ schemaVersion: 1, agentId, conversationId: url.searchParams.get("conversationId"), path: "sample.xlsx", notices: [], kind: "spreadsheet", workbook: { dateSystem: "1900", styles: [style, otherStyle], sheets: [summary, sheet("2", "Detail", "Second sheet"), empty] } }) });
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
		const requestsAfterSheet = previewRequests;
		await treeFile("notes.md").click();
		await treeFile("sample.xlsx").click();
		assert(await page.getByText("Second sheet", { exact: true }).count() === 1 && previewRequests === requestsAfterSheet, "the selected sheet survives tab switches without refetch");
		await page.getByRole("button", { name: "Empty", exact: true }).click();
		await page.getByText("This sheet is empty.", { exact: true }).waitFor();
		await tab("sample.xlsx").locator(".workspace-tab-close").click();
		corruptWorkbook = true;
		await treeFile("sample.xlsx").click();
		await page.getByText("This file could not be previewed.", { exact: true }).waitFor();
		assert(await page.getByText("Invented total", { exact: true }).count() === 0, "invalid style references never render a partial workbook");
		await tab("sample.xlsx").locator(".workspace-tab-close").click();
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
