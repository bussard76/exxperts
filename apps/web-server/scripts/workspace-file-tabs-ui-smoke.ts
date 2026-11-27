import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_tabs_test.html"), entry = path.join(ui, "__t87_tabs_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary tabs harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_tabs_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React,{useState} from "react";import {createRoot} from "react-dom/client";import "./src/styles/43-room-workspace.css";import {WorkspaceFileTabs} from "./src/components/WorkspaceFileTabs";function Test(){const [tabs,setTabs]=useState(["notes/first.txt","second.txt"]);const [active,setActive]=useState<string|null>("notes/first.txt");return <WorkspaceFileTabs tabs={tabs} active={active} onSelect={setActive} onClose={path=>{setTabs(tabs.filter(item=>item!==path));if(active===path)setActive(null)}} onReorder={setTabs}/>};createRoot(document.getElementById("root")!).render(<Test/>);');
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
	await page.goto(`${base}/__t87_tabs_test.html`);
	const first = page.getByRole("tab", { name: "first.txt" }), second = page.getByRole("tab", { name: "second.txt" });
	await first.waitFor({ timeout: 10000 });
	assert.equal(await first.getAttribute("aria-selected"), "true");
	await second.click();
	assert.equal(await second.getAttribute("aria-selected"), "true");
	await page.locator(".workspace-tab").nth(1).dragTo(page.locator(".workspace-tab").nth(0), { targetPosition: { x: 1, y: 1 } });
	assert.equal(await page.getByRole("tab").first().textContent(), "second.txt");
	await page.getByRole("button", { name: "Close first.txt" }).click();
	assert.equal(await page.getByRole("tab").count(), 1);
	console.log("workspace file tabs UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
