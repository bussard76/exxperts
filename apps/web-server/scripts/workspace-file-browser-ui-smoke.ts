import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const html = path.join(ui, "__t87_tree_test.html"), entry = path.join(ui, "__t87_tree_test.tsx");
if (fs.existsSync(html) || fs.existsSync(entry)) throw new Error("temporary tree harness already exists");
fs.writeFileSync(html, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_tree_test.tsx"></script></body></html>');
fs.writeFileSync(entry, 'import React,{useState} from "react"; import { createRoot } from "react-dom/client"; import { WorkspaceFileBrowser } from "./src/components/WorkspaceFileBrowser"; function Test({agentId}:{agentId:string}){const [selected,setSelected]=useState("");return <><WorkspaceFileBrowser agentId={agentId} conversationId="invented-thread" onFileSelect={item=>setSelected(item.relativePath)}/><output>{selected}</output></>};const root=createRoot(document.getElementById("root")!);(window as any).showRoom=(agentId: string)=>root.render(<Test agentId={agentId}/>);(window as any).showRoom("invented-room");');
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
	let wrongIdentity = false, invalidEntry = false, slow = false, noRoot = false, empty = false;
	let markRequested: (() => void) | undefined, releaseResponse: (() => void) | undefined;
	const arm = () => new Promise<void>((resolve) => { markRequested = resolve; });
	await page.route("**/api/persistent-agents/**/workspace-files?**", async (route) => {
		const url = new URL(route.request().url()), selected = url.searchParams.get("path") ?? "", room = url.pathname.split("/")[3];
		if (slow) { markRequested?.(); await new Promise<void>((resolve) => { releaseResponse = resolve; }); }
		const item = (name: string, kind: "file" | "directory", relativePath: string) => ({ name, relativePath, kind, bytes: kind === "file" ? 8 : null, modifiedAt: "2026-01-01T00:00:00.000Z", extension: kind === "file" ? ".txt" : "" });
		const entries = noRoot || empty ? [] : selected ? [item("entry.txt", "file", invalidEntry ? "../entry.txt" : "notes/entry.txt")] : [item("notes", "directory", "notes"), item("invented.txt", "file", "invented.txt"), item("lesson 1: draft.txt", "file", "lesson 1: draft.txt")];
		await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ agentId: wrongIdentity ? "wrong-room" : room, conversationId: "invented-thread", root: noRoot ? null : { displayLabel: "Invented folder", basename: "invented" }, path: selected, entries }) });
	});
	await page.goto(`${base}/__t87_tree_test.html`);
	await page.getByRole("button", { name: "lesson 1: draft.txt" }).click({ timeout: 10000 });
	assert.equal(await page.locator("output").textContent(), "lesson 1: draft.txt");
	await page.getByRole("button", { name: "Expand notes" }).click({ timeout: 10000 });
	await page.getByRole("button", { name: "entry.txt" }).click({ timeout: 10000 });
	assert.equal(await page.locator("output").textContent(), "notes/entry.txt");
	slow = true;
	const requested = arm();
	await page.evaluate(() => (window as any).showRoom("another-room"));
	await requested;
	assert.equal(await page.getByRole("button", { name: "invented.txt" }).count(), 0, "old room entries are hidden while the next room loads");
	releaseResponse?.();
	await page.getByRole("button", { name: "invented.txt" }).waitFor({ timeout: 10000 });
	slow = false;
	wrongIdentity = true;
	await page.reload();
	await page.getByText("Invalid workspace listing.").waitFor({ timeout: 10000 });
	wrongIdentity = false;
	invalidEntry = true;
	await page.reload();
	await page.getByRole("button", { name: "Expand notes" }).click({ timeout: 10000 });
	await page.getByText("Invalid workspace listing.").waitFor({ timeout: 10000 });
	assert.equal(await page.getByRole("button", { name: "entry.txt" }).count(), 0);
	invalidEntry = false;
	noRoot = true;
	await page.reload();
	await page.getByText("No workspace folder connected.").waitFor({ timeout: 10000 });
	noRoot = false;
	empty = true;
	await page.reload();
	await page.getByText("The workspace is empty.").waitFor({ timeout: 10000 });
	console.log("workspace file browser UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(html, { force: true });
	fs.rmSync(entry, { force: true });
}
