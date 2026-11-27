import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_local_test.html"), entry = path.join(ui, "__t87_local_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary local-action harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_local_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react";import {createRoot} from "react-dom/client";import {useConfirmedLocalClientContext} from "./src/remote-client-context";function Test(){return <p>{useConfirmedLocalClientContext()?"available":"hidden"}</p>};createRoot(document.getElementById("root")!).render(<Test/>);');
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
	for (const [body, expected] of [[{ remote: false, sharedServer: false }, "available"], [{ remote: true, sharedServer: false }, "hidden"], [{ remote: false, sharedServer: true }, "hidden"], [{}, "hidden"]] as const) {
		const page = await browser.newPage();
		await page.route("**/api/remote/client-context", async (route) => { await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }); });
		const answer = page.waitForResponse("**/api/remote/client-context");
		await page.goto(`${base}/__t87_local_test.html`);
		await answer;
		await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
		await page.getByText(expected, { exact: true }).waitFor({ timeout: 10000 });
		assert.equal(await page.getByText(expected === "available" ? "hidden" : "available", { exact: true }).count(), 0);
		await page.close();
	}
	console.log("workspace local-action context UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
