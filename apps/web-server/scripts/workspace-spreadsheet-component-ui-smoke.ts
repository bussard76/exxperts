import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import * as XLSX from "xlsx";
import { freePort, stopSmokeServer } from "./smoke-server-process.js";
import { runWorkspaceSpreadsheetSnapshot } from "../src/persistent-room-shelf-reading.js";

const ui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web-ui");
const pageFile = path.join(ui, "__t87_preview_test.html");
const entryFile = path.join(ui, "__t87_preview_test.tsx");
if (fs.existsSync(pageFile) || fs.existsSync(entryFile)) throw new Error("temporary preview harness already exists");
fs.writeFileSync(pageFile, '<!doctype html><html><body><div id="root"></div><script type="module" src="/__t87_preview_test.tsx"></script></body></html>');
fs.writeFileSync(entryFile, 'import React from "react"; import { createRoot } from "react-dom/client"; import { WorkspaceSpreadsheetPreview } from "./src/components/WorkspaceSpreadsheetPreview"; const root = createRoot(document.getElementById("root")!); (window as any).showPreview = (path: string) => root.render(<WorkspaceSpreadsheetPreview agentId="invented-room" conversationId="invented-thread" path={path} />); (window as any).showPreview("invented.xlsx");');
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Invented cell"]]), "Example");
const parsed = await runWorkspaceSpreadsheetSnapshot(Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })), new AbortController().signal);
assert(parsed.ok && parsed.result);
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
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
	let mode: "valid" | "wrong-room" | "invalid-schema" | "empty" | "slow" = "valid";
	let releaseSlow: (() => void) | undefined;
	let markRequested: (() => void) | undefined;
	const requested = new Promise<void>((resolve) => { markRequested = resolve; });
	await page.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
		const book = structuredClone(parsed.result!.workbook);
		const selectedPath = new URL(route.request().url()).searchParams.get("path");
		if (mode === "slow") { book.sheets[0].cells[0].text = "Other cell"; markRequested?.(); await new Promise<void>((resolve) => { releaseSlow = resolve; }); }
		if (mode === "invalid-schema") book.sheets[0].cells[0].style = 999;
		if (mode === "empty") Object.assign(book.sheets[0], { rowCount: 0, columnCount: 0, rows: [], columns: [], cells: [], merges: [] });
		const body = { schemaVersion: 1, agentId: mode === "wrong-room" ? "different-room" : "invented-room", conversationId: "invented-thread", path: selectedPath, kind: "spreadsheet", notices: parsed.notices, workbook: book };
		await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
	});
	await page.goto(`${base}/__t87_preview_test.html`);
	await page.getByText("Invented cell", { exact: true }).waitFor({ timeout: 10000 });
	mode = "slow";
	await page.evaluate(() => (window as any).showPreview("other.xlsx"));
	await requested;
	assert.equal(await page.getByText("Invented cell", { exact: true }).count(), 0, "the old file is hidden while the next file loads");
	releaseSlow?.();
	await page.getByText("Other cell", { exact: true }).waitFor({ timeout: 10000 });
	mode = "wrong-room";
	await page.reload();
	await page.getByText("This file could not be previewed.", { exact: true }).waitFor({ timeout: 10000 });
	assert.equal(await page.getByText("Invented cell", { exact: true }).count(), 0);
	mode = "invalid-schema";
	await page.reload();
	await page.getByText("This file could not be previewed.", { exact: true }).waitFor({ timeout: 10000 });
	mode = "empty";
	await page.reload();
	await page.getByText("This sheet is empty.", { exact: true }).waitFor({ timeout: 10000 });
	console.log("workspace spreadsheet consumer UI smoke passed");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await browser?.close();
	await stopSmokeServer(server as any);
	fs.rmSync(pageFile, { force: true });
	fs.rmSync(entryFile, { force: true });
}
