import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_text_test.html"), entry = path.join(ui, "__t87_text_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary text harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_text_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react"; import { createRoot } from "react-dom/client"; import { WorkspaceTextPreview } from "./src/components/WorkspaceTextPreview"; import { WorkspaceHtmlPreview } from "./src/components/WorkspaceHtmlPreview"; const root=createRoot(document.getElementById("root")!); (window as any).showPreview=(kind: string,path: string)=>root.render(kind==="text"?<WorkspaceTextPreview agentId="invented-room" conversationId="invented-thread" path={path}/>:<WorkspaceHtmlPreview agentId="invented-room" conversationId="invented-thread" path={path}/>); (window as any).showPreview("text","invented.json");');
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
	let wrongIdentity = false, invalidSize = false, slow = false;
	let markRequested: (() => void) | undefined, releaseResponse: (() => void) | undefined;
	const arm = () => new Promise<void>((resolve) => { markRequested = resolve; });
	await page.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
		const query = new URL(route.request().url()).searchParams, selected = query.get("path")!;
		if (query.has("frame")) { await route.fulfill({ status: 200, contentType: "text/html", body: "<p>Invented HTML</p>" }); return; }
		if (slow) { markRequested?.(); await new Promise<void>((resolve) => { releaseResponse = resolve; }); }
		const common = { schemaVersion: 1, agentId: wrongIdentity ? "wrong-room" : "invented-room", conversationId: "invented-thread", path: selected, notices: [] };
		const body = selected.endsWith(".html") ? { ...common, kind: "html", html: invalidSize ? "é".repeat(8_388_609) : "<p>Invented HTML</p>" } : { ...common, kind: "text", text: invalidSize ? "é".repeat(8_388_609) : selected === "invented.json" ? '{"invented":1}' : "Other text" };
		await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
	});
	await page.goto(`${base}/__t87_text_test.html`);
	await page.getByText('"invented": 1', { exact: false }).waitFor({ timeout: 10000 });
	slow = true;
	const requested = arm();
	await page.evaluate(() => (window as any).showPreview("text", "other.txt"));
	await requested;
	assert.equal(await page.getByText('"invented": 1', { exact: false }).count(), 0, "old text is hidden while another file loads");
	releaseResponse?.();
	await page.getByText("Other text", { exact: true }).waitFor({ timeout: 10000 });
	slow = false;
	await page.evaluate(() => (window as any).showPreview("html", "invented.html"));
	const frame = page.locator('iframe[title="invented.html"]');
	await frame.waitFor({ timeout: 10000 });
	assert.equal(await frame.getAttribute("sandbox"), "allow-scripts");
	await page.frameLocator('iframe[title="invented.html"]').getByText("Invented HTML").waitFor({ timeout: 10000 });
	slow = true;
	const htmlRequested = arm();
	await page.evaluate(() => (window as any).showPreview("html", "other.html"));
	await htmlRequested;
	assert.equal(await page.locator("iframe").count(), 0, "old HTML is hidden while another file loads");
	releaseResponse?.();
	await page.locator('iframe[title="other.html"]').waitFor({ timeout: 10000 });
	slow = false;
	wrongIdentity = true;
	await page.reload();
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 10000 });
	await page.evaluate(() => (window as any).showPreview("html", "invented.html"));
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 10000 });
	assert.equal(await page.locator("iframe").count(), 0);
	wrongIdentity = false;
	invalidSize = true;
	await page.reload();
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 20000 });
	await page.evaluate(() => (window as any).showPreview("html", "invented.html"));
	await page.getByText("This file could not be previewed.").waitFor({ timeout: 20000 });
	assert.equal(await page.locator("iframe").count(), 0);
	console.log("workspace text and HTML consumer UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
