import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import { syncBuiltinESMExports } from "node:module";
import { PassThrough } from "node:stream";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const originalFork = childProcess.fork;
let message: unknown;
let hanging = false, kills = 0, onFork: (() => void) | undefined;
childProcess.fork = (() => {
	const child = new EventEmitter() as EventEmitter & { stderr: PassThrough; kill: () => boolean };
	child.stderr = new PassThrough();
	child.kill = () => { kills++; queueMicrotask(() => child.emit("close", 0, null)); return true; };
	onFork?.();
	if (!hanging) queueMicrotask(() => child.emit("message", message));
	return child;
}) as unknown as typeof childProcess.fork;
syncBuiltinESMExports();
try {
	const { runWorkspaceSpreadsheetSnapshot, runWorkspacePdfSnapshot, runWorkspaceWordSnapshot } = await import("../src/persistent-room-shelf-reading.js");
	const signal = new AbortController().signal;
	message = { ok: true, schemaVersion: 1, notices: [], result: { kind: "spreadsheet", workbook: { dateSystem: "1900", styles: [], sheets: [] } } };
	assert.equal((await runWorkspaceSpreadsheetSnapshot(Buffer.from("invented"), signal)).code, "preview_failed");
	message = { ok: true, schemaVersion: 1, notices: [], result: { kind: "pdf", totalPages: 1, pages: [{ page: 1, mimeType: "image/jpeg", imageBase64: "AAAA", widthPx: 1, heightPx: 1 }] } };
	assert.equal((await runWorkspacePdfSnapshot(Buffer.from("invented"), signal)).code, "preview_failed");
	message = { ok: true, schemaVersion: 1, notices: [], result: { kind: "word", html: "<script>unsafe</script>" } };
	assert.equal((await runWorkspaceWordSnapshot(Buffer.from("invented"), signal)).code, "preview_failed");
	message = { ok: false, schemaVersion: 1, code: "invented_code", extra: "unexpected" };
	assert.equal((await runWorkspaceWordSnapshot(Buffer.from("invented"), signal)).code, "preview_failed");
	const saved = { TMPDIR: process.env.TMPDIR, TEMP: process.env.TEMP, TMP: process.env.TMP };
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), "preview-timeout-test-"));
	process.env.TMPDIR = temp; process.env.TEMP = temp; process.env.TMP = temp;
	const originalTimer = globalThis.setTimeout;
	try {
		hanging = true;
		globalThis.setTimeout = ((handler: any, delay?: number, ...args: any[]) => originalTimer(handler, delay === 30_000 || delay === 60_000 ? 10 : delay, ...args)) as typeof setTimeout;
		const beforeTimeout = kills;
		assert.equal((await runWorkspaceWordSnapshot(Buffer.from("invented"), signal)).code, "preview_timeout");
		assert.equal(kills, beforeTimeout + 1);
		assert.deepEqual(fs.readdirSync(temp), []);
		const controller = new AbortController();
		const started = new Promise<void>((resolve) => { onFork = resolve; });
		const beforeAbort = kills;
		const pending = runWorkspacePdfSnapshot(Buffer.from("invented"), controller.signal);
		await started;
		controller.abort();
		assert.equal((await pending).code, "preview_aborted");
		assert.equal(kills, beforeAbort + 1);
		assert.deepEqual(fs.readdirSync(temp), []);
	} finally {
		globalThis.setTimeout = originalTimer;
		for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
		fs.rmSync(temp, { recursive: true, force: true });
	}
	console.log("workspace snapshot worker-response validation passed");
} finally {
	childProcess.fork = originalFork;
	syncBuiltinESMExports();
}
