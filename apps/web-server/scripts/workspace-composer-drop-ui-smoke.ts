import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_drop_test.html"), entry = path.join(ui, "__t87_drop_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary drop harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_drop_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react";import {createRoot} from "react-dom/client";import {WorkspaceFileBrowser} from "./src/components/WorkspaceFileBrowser";import {ComposerInput} from "./src/components/in-room-chat";createRoot(document.getElementById("root")!).render(<><WorkspaceFileBrowser agentId="invented-room" conversationId="invented-thread"/><ComposerInput placeholder="Invented message" onSend={()=>true}/></>);');
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
	await page.route("**/api/remote/client-context", async (route) => {
		await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ remote: false, capability: "full", sharedServer: false, person: null, signOut: null, publicPages: null }) });
	});
	await page.route("**/api/persistent-agents/**/workspace-files?**", async (route) => {
		await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ agentId: "invented-room", conversationId: "invented-thread", root: { displayLabel: "Invented", basename: "invented" }, path: "", entries: [{ name: "invented.txt", relativePath: "invented.txt", kind: "file", bytes: 8, modifiedAt: "2026-01-01T00:00:00.000Z", extension: ".txt" }] }) });
	});
	await page.goto(`${base}/__t87_drop_test.html`);
	const file = page.getByRole("button", { name: "invented.txt" });
	await file.waitFor({ timeout: 10000 });
	const composer = page.getByPlaceholder("Invented message");
	await composer.fill("before after");
	await composer.evaluate((node: HTMLTextAreaElement) => { node.focus(); node.setSelectionRange(7, 7); });
	const transfer = await page.evaluateHandle(() => new DataTransfer());
	await file.dispatchEvent("dragstart", { dataTransfer: transfer });
	await composer.dispatchEvent("drop", { dataTransfer: transfer });
	assert.equal(await composer.inputValue(), "before invented.txtafter");
	await composer.fill("abc XYZ def");
	await composer.evaluate((node: HTMLTextAreaElement) => { node.focus(); node.setSelectionRange(4, 7); });
	await composer.dispatchEvent("drop", { dataTransfer: transfer });
	assert.equal(await composer.inputValue(), "abc invented.txt def");
	assert.equal(await composer.evaluate((node: HTMLTextAreaElement) => node.selectionStart), 16);
	const unrelated = await page.evaluateHandle(() => { const value = new DataTransfer(); value.setData("text/plain", "unrelated"); return value; });
	await composer.dispatchEvent("drop", { dataTransfer: unrelated });
	assert.equal(await composer.inputValue(), "abc invented.txt def");
	console.log("workspace composer drop UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
