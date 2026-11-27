import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import JSZip from "jszip";
import * as esbuild from "esbuild";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_pptx_test.html"), entry = path.join(ui, "__t87_pptx_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary PPTX harness already exists");
const zip = new JSZip();
	zip.file("[Content_Types].xml", `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);
	zip.file("ppt/presentation.xml", `<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500" type="screen16x9"/></p:presentation>`);
	zip.file("ppt/_rels/presentation.xml.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>`);
	zip.file("ppt/slides/slide1.xml", `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="4572000" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="2400"/><a:t>Invented slide</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`);
const pptx = await zip.generateAsync({ type: "nodebuffer" });
const bundled = await esbuild.build({ entryPoints: [path.join(ui, "src/pptx-frame-entry.ts")], bundle: true, write: false, platform: "browser", format: "iife" });
const frameCode = bundled.outputFiles[0].text.replaceAll("</script", "<\\/script");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_pptx_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react"; import { createRoot } from "react-dom/client"; import { WorkspaceFramedPreview } from "./src/components/WorkspaceFramedPreview"; const root=createRoot(document.getElementById("root")!); (window as any).showPreview=(path: string)=>root.render(<WorkspaceFramedPreview agentId="invented-room" conversationId="invented-thread" path={path}/>); (window as any).showPreview("invented.pptx");');
const port = await freePort(), base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.resolve(ui, "../../node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: ui, stdio: ["ignore", "pipe", "pipe"] });
const output: string[] = [];
const ready = new Promise<void>((resolve, reject) => {
	const timer = setTimeout(() => reject(new Error("Vite did not start")), 15000);
	server.stdout.on("data", (chunk) => { output.push(String(chunk)); if (output.join("").includes("ready in")) { clearTimeout(timer); resolve(); } });
	server.once("exit", () => { clearTimeout(timer); reject(new Error("Vite exited before startup")); });
});
server.stderr.on("data", (chunk) => output.push(String(chunk)));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	await ready;
	browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	let fetches = 0;
	let slow = false, markRequested: (() => void) | undefined, releaseResponse: (() => void) | undefined;
	const arm = () => new Promise<void>((resolve) => { markRequested = resolve; });
	await page.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
		const query = new URL(route.request().url()).searchParams;
		if (query.has("frame")) {
			await route.fulfill({ status: 200, contentType: "text/html", headers: { "Content-Security-Policy": "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'" }, body: `<!doctype html><html><body><div id="slides"></div><script>window.received=0;window.addEventListener('message',e=>{if(e.data instanceof ArrayBuffer)window.received++})</script><script>${frameCode}</script></body></html>` });
		} else { fetches++; if (slow) { markRequested?.(); await new Promise<void>((resolve) => { releaseResponse = resolve; }); } await route.fulfill({ status: 200, contentType: "application/octet-stream", body: pptx }); }
	});
	await page.goto(`${base}/__t87_pptx_test.html`);
	const frame = page.locator('iframe[title="invented.pptx"]');
	await frame.waitFor({ timeout: 10000 });
	assert.equal(await frame.getAttribute("sandbox"), "allow-scripts");
	await page.frameLocator('iframe[title="invented.pptx"]').getByText("Invented slide").waitFor({ timeout: 20000 });
	await page.getByText("Loading preview…").waitFor({ state: "hidden", timeout: 10000 });
	assert.equal(fetches, 1);
	const child = page.frames().find((item) => item.url().includes("frame=1"));
	assert(child);
	const transfers = await child.evaluate(async () => { window.parent.postMessage({ kind: "frame-ready" }, "*"); await new Promise((resolve) => setTimeout(resolve, 50)); return (window as any).received; });
	assert.equal(transfers, 1, "repeated ready does not transfer bytes again");
	slow = true;
	const requested = arm();
	await page.evaluate(() => (window as any).showPreview("other.pptx"));
	await requested;
	assert.equal(await page.locator("iframe").count(), 0, "old frame is hidden while another file loads");
	await page.evaluate(() => window.postMessage({ kind: "frame-rendered" }, "*"));
	assert(await page.getByText("Loading preview…").isVisible());
	releaseResponse?.();
	await page.frameLocator('iframe[title="other.pptx"]').getByText("Invented slide").waitFor({ timeout: 20000 });
	assert.equal(fetches, 2);
	const stalled = await browser.newPage();
	await stalled.addInitScript(() => {
		const original = window.setTimeout.bind(window);
		window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: any[]) => original(handler, timeout === 30_000 ? 100 : timeout, ...args)) as typeof window.setTimeout;
	});
	await stalled.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
		if (new URL(route.request().url()).searchParams.has("frame")) await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><p>Invented stalled frame</p>" });
		else await route.fulfill({ status: 200, contentType: "application/octet-stream", body: pptx });
	});
	await stalled.goto(`${base}/__t87_pptx_test.html`);
	await stalled.getByText("This preview took too long to load.").waitFor({ timeout: 10000 });
	await stalled.close();
	const failed = await browser.newPage();
	await failed.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
		if (new URL(route.request().url()).searchParams.has("frame")) await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><script>window.addEventListener('message',()=>parent.postMessage({kind:'frame-failed'},'*'));parent.postMessage({kind:'frame-ready'},'*')</script>" });
		else await route.fulfill({ status: 200, contentType: "application/octet-stream", body: pptx });
	});
	await failed.goto(`${base}/__t87_pptx_test.html`);
	await failed.getByText("This file is damaged or cannot be read.").waitFor({ timeout: 10000 });
	await failed.close();
	const oversized = await browser.newPage();
	let framesRequested = 0;
	await oversized.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
		if (new URL(route.request().url()).searchParams.has("frame")) framesRequested++;
		await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.alloc(26_214_401) });
	});
	await oversized.goto(`${base}/__t87_pptx_test.html`);
	await oversized.getByText("This file could not be previewed.").waitFor({ timeout: 20000 });
	assert.equal(framesRequested, 0);
	await oversized.close();
	console.log("workspace PPTX frame UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
