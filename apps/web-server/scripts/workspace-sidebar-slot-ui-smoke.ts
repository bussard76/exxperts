import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_sidebar_test.html"), entry = path.join(ui, "__t87_sidebar_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary sidebar harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_sidebar_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React,{useState} from "react";import {createRoot} from "react-dom/client";import {Sidebar} from "./src/components/Sidebar";function Test(){const [went,setWent]=useState(false);return <><Sidebar theme="light" appearance="light" onSetAppearance={()=>{}} onSettings={()=>{}} onHome={()=>setWent(true)} workspaceSlot={<div>Invented workspace</div>}/><output>{went?"Rooms opened":""}</output></>};createRoot(document.getElementById("root")!).render(<Test/>);');
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
	await page.route("**/api/remote/client-context", async (route) => { await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ remote: false, capability: "full", sharedServer: false, person: null, signOut: null, publicPages: null }) }); });
	await page.route("**/api/remote/status", async (route) => { await route.fulfill({ status: 200, contentType: "application/json", body: "{}" }); });
	await page.goto(`${base}/__t87_sidebar_test.html`);
	await page.getByText("Invented workspace").waitFor({ timeout: 10000 });
	await page.getByRole("button", { name: "Rooms", exact: true }).click();
	assert.equal(await page.locator("output").textContent(), "Rooms opened");
	console.log("workspace sidebar slot UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
