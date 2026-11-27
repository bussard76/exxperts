import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_image_test.html"), entry = path.join(ui, "__t87_image_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary image harness already exists");
fs.writeFileSync(html, '<!doctype html><html><head><style>.workspace-preview-image{width:500px;height:400px;position:relative;overflow:hidden}</style></head><body><div id="root"></div><script type="module" src="/__t87_image_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react"; import { createRoot } from "react-dom/client"; import { WorkspaceImagePreview } from "./src/components/WorkspaceImagePreview"; const root=createRoot(document.getElementById("root")!); (window as any).showPreview=(path: string)=>root.render(<WorkspaceImagePreview agentId="invented-room" conversationId="invented-thread" path={path}/>); (window as any).showPreview("invented.png");');
const port = await freePort(), base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.resolve(ui, "../../node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: ui, stdio: ["ignore", "pipe", "pipe"] });
const output: string[] = [];
const ready = new Promise<void>((resolve, reject) => {
	const timer = setTimeout(() => reject(new Error("Vite did not start")), 15000);
	server.stdout.on("data", (chunk) => { output.push(String(chunk)); if (output.join("").includes("ready in")) { clearTimeout(timer); resolve(); } });
	server.once("exit", () => { clearTimeout(timer); reject(new Error("Vite exited before startup")); });
});
server.stderr.on("data", (chunk) => output.push(String(chunk)));
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64");
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	await ready;
	browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	let slow = false, badMime = false, oversized = false;
	let markRequested: (() => void) | undefined, releaseResponse: (() => void) | undefined;
	const arm = () => new Promise<void>((resolve) => { markRequested = resolve; });
	await page.route("**/api/persistent-agents/**/workspace-image?**", async (route) => {
		if (slow) { markRequested?.(); await new Promise<void>((resolve) => { releaseResponse = resolve; }); }
		await route.fulfill({ status: 200, contentType: badMime ? "application/json" : "image/png", body: oversized ? Buffer.alloc(20_971_521) : pixel });
	});
	await page.goto(`${base}/__t87_image_test.html`);
	await page.getByAltText("invented.png").waitFor({ timeout: 10000 });
	await page.waitForFunction(() => (document.querySelector("img") as HTMLImageElement | null)?.naturalWidth === 1);
	assert(await page.getByRole("button", { name: "Zoom in" }).isVisible());
	await page.getByRole("button", { name: "Zoom in" }).click();
	await page.getByText("125%", { exact: true }).waitFor({ timeout: 10000 });
	slow = true;
	const requested = arm();
	await page.evaluate(() => (window as any).showPreview("other.png"));
	await requested;
	assert.equal(await page.locator("img").count(), 0, "old image is hidden while another file loads");
	releaseResponse?.();
	await page.getByAltText("other.png").waitFor({ timeout: 10000 });
	slow = false;
	badMime = true;
	await page.reload();
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 10000 });
	assert.equal(await page.locator("img").count(), 0);
	badMime = false;
	oversized = true;
	await page.reload();
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 20000 });
	assert.equal(await page.locator("img").count(), 0);
	console.log("workspace image consumer UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
