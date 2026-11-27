import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import { syncBuiltinESMExports } from "node:module";
import { PassThrough } from "node:stream";

const originalFork = childProcess.fork;
let message: unknown;
childProcess.fork = (() => {
	const child = new EventEmitter() as EventEmitter & { stderr: PassThrough; kill: () => boolean };
	child.stderr = new PassThrough();
	child.kill = () => { queueMicrotask(() => child.emit("close", 0, null)); return true; };
	queueMicrotask(() => child.emit("message", message));
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
	console.log("workspace snapshot worker-response validation passed");
} finally {
	childProcess.fork = originalFork;
	syncBuiltinESMExports();
}
