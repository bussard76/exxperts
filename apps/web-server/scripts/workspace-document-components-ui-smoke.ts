import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createCanvas } from "@napi-rs/canvas";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_document_test.html"), entry = path.join(ui, "__t87_document_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary document harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_document_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react"; import { createRoot } from "react-dom/client"; import { WorkspacePdfPreview } from "./src/components/WorkspacePdfPreview"; import { WorkspaceWordPreview } from "./src/components/WorkspaceWordPreview"; const root=createRoot(document.getElementById("root")!); (window as any).showPreview=(kind: string,path: string)=>root.render(kind==="pdf"?<WorkspacePdfPreview agentId="invented-room" conversationId="invented-thread" path={path}/>:<WorkspaceWordPreview agentId="invented-room" conversationId="invented-thread" path={path}/>); (window as any).showPreview("pdf","invented.pdf");');
const port = await freePort(), base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.resolve(ui, "../../node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: ui, stdio: ["ignore", "pipe", "pipe"] });
const output: string[] = [];
const ready = new Promise<void>((resolve, reject) => {
	const timer = setTimeout(() => reject(new Error("Vite did not start")), 15000);
	server.stdout.on("data", (chunk) => { output.push(String(chunk)); if (output.join("").includes("ready in")) { clearTimeout(timer); resolve(); } });
	server.once("exit", () => { clearTimeout(timer); reject(new Error("Vite exited before startup")); });
});
server.stderr.on("data", (chunk) => output.push(String(chunk)));
const jpeg = createCanvas(2, 2).toBuffer("image/jpeg").toString("base64");
const prefix = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">`;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	await ready;
	browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	let wrongIdentity = false;
	let invalidSchema = false;
	let slow = false;
	let markRequested: (() => void) | undefined, releaseResponse: (() => void) | undefined;
	const arm = () => new Promise<void>((resolve) => { markRequested = resolve; });
	await page.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
		const selected = new URL(route.request().url()).searchParams.get("path")!;
		if (slow) { markRequested?.(); await new Promise<void>((resolve) => { releaseResponse = resolve; }); }
		const common = { schemaVersion: 1, agentId: wrongIdentity ? "wrong-room" : "invented-room", conversationId: "invented-thread", path: selected };
		const body = selected.endsWith(".pdf") ? { ...common, kind: "pdf", notices: [], totalPages: 1, pages: [{ page: invalidSchema ? 2 : 1, mimeType: "image/jpeg", imageBase64: jpeg, widthPx: 2, heightPx: 2 }] } : { ...common, kind: "word", notices: [{ code: "external_resources_blocked", text: "External document resources are blocked." }], html: invalidSchema ? "<script>bad</script>" : `${prefix}</head><body><p>Invented document</p></body></html>` };
		await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
	});
	await page.goto(`${base}/__t87_document_test.html`);
	await page.getByAltText("Page 1").waitFor({ timeout: 10000 });
	slow = true;
	const pdfRequested = arm();
	await page.evaluate(() => (window as any).showPreview("pdf", "other.pdf"));
	await pdfRequested;
	assert.equal(await page.getByAltText("Page 1").count(), 0, "old PDF pages are hidden while another file loads");
	releaseResponse?.();
	await page.getByAltText("Page 1").waitFor({ timeout: 10000 });
	slow = false;
	await page.evaluate(() => (window as any).showPreview("word", "invented.docx"));
	await page.getByText("External document resources are blocked.").waitFor({ timeout: 10000 });
	const frame = page.locator('iframe[title="invented.docx"]');
	assert.equal(await frame.getAttribute("sandbox"), "");
	await page.frameLocator('iframe[title="invented.docx"]').getByText("Invented document").waitFor({ timeout: 10000 });
	slow = true;
	const wordRequested = arm();
	await page.evaluate(() => (window as any).showPreview("word", "other.docx"));
	await wordRequested;
	assert.equal(await page.locator("iframe").count(), 0, "old Word content is hidden while another file loads");
	releaseResponse?.();
	await page.locator('iframe[title="other.docx"]').waitFor({ timeout: 10000 });
	slow = false;
	wrongIdentity = true;
	await page.reload();
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 10000 });
	assert.equal(await page.getByAltText("Page 1").count(), 0);
	await page.evaluate(() => (window as any).showPreview("word", "invented.docx"));
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 10000 });
	assert.equal(await page.locator("iframe").count(), 0);
	wrongIdentity = false;
	invalidSchema = true;
	await page.reload();
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 10000 });
	await page.evaluate(() => (window as any).showPreview("word", "invented.docx"));
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 10000 });
	assert.equal(await page.locator("iframe").count(), 0);
	console.log("workspace document consumer UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
