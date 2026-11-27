import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_recovery_test.html"), entry = path.join(ui, "__t87_recovery_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary recovery harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_recovery_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React from "react";import {createRoot} from "react-dom/client";import {RoomWorkspaceSection} from "./src/components/RoomWorkspaceSection";createRoot(document.getElementById("root")!).render(<RoomWorkspaceSection status={{id:"invented-room",exists:true,status:"ready"} as any}/>);');
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
	for (const item of [
		{ mode: "picker", result: "changed", expected: true },
		{ mode: "typed", result: "changed", expected: true },
		{ mode: "picker", result: "unchanged", expected: false },
		{ mode: "picker", result: "refused", expected: false },
		{ mode: "picker", result: "unknown", expected: false },
		{ mode: "picker", result: "different", expected: false },
		{ mode: "picker", result: "unknown-before", expected: false },
	] as const) {
		const page = await browser.newPage();
		let attempted = false;
		await page.route("**/api/remote/client-context", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ remote: false, capability: "full", sharedServer: false }) }));
		await page.route("**/api/persistent-agents/**/bash-settings", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ settings: {} }) }));
		await page.route("**/api/persistent-agents/**/also-allowed", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ folders: [], sites: [] }) }));
		await page.route("**/api/system/choose-folder", (route) => route.fulfill(item.mode === "typed" ? { status: 400, contentType: "application/json", body: JSON.stringify({ code: "unsupported_platform" }) } : { status: 200, contentType: "application/json", body: JSON.stringify({ supported: true, cancelled: false, path: "/invented/project" }) }));
		await page.route("**/api/persistent-agents/**/workspace-default", (route) => {
			if (route.request().method() === "PUT") { attempted = true; return route.abort("failed"); }
			const beforeId = item.result === "unknown-before" ? undefined : "old-id";
			const policyId = attempted && item.result !== "unchanged" ? "new-id" : beforeId;
			const selected = attempted && item.result === "different" ? "/invented/other" : "/invented/project";
			const flag = attempted && item.result === "unknown" ? {} : { folderRefused: attempted && item.result === "refused" };
			const body = { agentId: "invented-room", storage: { kind: "invented" }, policy: { policyId, roots: [{ id: "root", displayLabel: "Invented", basename: "project", path: selected }], allowedToolNames: ["read", "ls", "find", "grep"], bashEnabled: false }, warnings: [], ...flag };
			return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
		});
		await page.goto(`${base}/__t87_recovery_test.html`);
		await page.getByRole("button", { name: "Change folder" }).click();
		if (item.mode === "typed") {
			await page.getByLabel("Location").fill("/invented/project");
			await page.getByRole("button", { name: "Use this folder" }).click();
		}
		if (item.expected) await page.getByText("Saved", { exact: true }).first().waitFor({ timeout: 10000, state: "attached" });
		else await page.getByRole("alert").getByText("Couldn't save the folder. Try again.").waitFor({ timeout: 10000 });
		assert.equal(attempted, true, `${item.mode}/${item.result} issued a save`);
		await page.close();
	}
	console.log("workspace location recovery UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
