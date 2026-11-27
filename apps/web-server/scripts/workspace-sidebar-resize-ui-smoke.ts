import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_resize_test.html"), entry = path.join(ui, "__t87_resize_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary resize harness already exists");
fs.writeFileSync(html, '<!doctype html><html><head><style>.app{display:grid;height:600px}</style></head><body><div id="root"></div><script type="module" src="/__t87_resize_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react";import {createRoot} from "react-dom/client";import "./src/styles/43-room-workspace.css";import {InRoomChatShellView} from "./src/components/in-room-chat";createRoot(document.getElementById("root")!).render(<InRoomChatShellView sidebar={<aside>Invented sidebar</aside>} sidebarResizable activeDisplay="Invented" busy={false} usage={{cost:0,totalTokens:0}} connected items={[]} empty onSend={()=>true} composerPlaceholder="Message" onResolveApproval={()=>{}}/>);');
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
	const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
	await page.route("**/api/remote/client-context", async (route) => { await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ remote: false, capability: "full", sharedServer: false, person: null, signOut: null, publicPages: null }) }); });
	await page.goto(`${base}/__t87_resize_test.html`);
	const separator = page.getByRole("separator", { name: "Resize sidebar" });
	await separator.waitFor({ timeout: 10000 });
	assert.equal(await separator.getAttribute("aria-valuenow"), "260");
	await separator.focus();
	await page.keyboard.press("ArrowRight");
	assert.equal(await separator.getAttribute("aria-valuenow"), "276");
	await page.keyboard.press("Home");
	assert.equal(await separator.getAttribute("aria-valuenow"), "220");
	await page.keyboard.press("End");
	assert.equal(await separator.getAttribute("aria-valuenow"), "720");
	await page.keyboard.press("Home");
	const box = await separator.boundingBox();
	assert(box);
	await page.mouse.move(box.x, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + 40, box.y + box.height / 2);
	await page.mouse.up();
	assert.equal(await separator.getAttribute("aria-valuenow"), "260");
	console.log("workspace sidebar resize UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
