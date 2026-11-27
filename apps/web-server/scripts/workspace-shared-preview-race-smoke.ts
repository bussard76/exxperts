import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as XLSX from "xlsx";
import { SMOKE_AUTH_HEADERS } from "./smoke-server-process.js";

const home = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-box-race-"));
const folder = path.join(home, "invented-folder");
fs.mkdirSync(folder);
fs.writeFileSync(path.join(folder, "invented.txt"), "example");
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.EXXETA_PERSISTENT_AGENTS_ROOT = path.join(home, "agents");
process.env.EXXPERTS_AUTH_TOKEN = "exxperts-smoke-pinned-auth-token";
const appDir = path.join(home, ".exxperts", "app");
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, "openai-compatible-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible", providerId: "openai-compatible", label: "Synthetic Gateway", roomModels: [{ modelId: "invented" }], maintenanceModel: "invented" }));
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible" }));

let enabled = true;
const { registerServerHooks } = await import("../src/server-hooks.js");
registerServerHooks({ roomFilesAreTheFolder: () => enabled });
const { app } = await import("../src/server-app.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { persistentRoomShelfDirPath } = await import("../src/persistent-room-shelf.js");
const { runWorkspaceSpreadsheetSnapshot } = await import("../src/persistent-room-shelf-reading.js");
const originalFork = childProcess.fork;
try {
	const room = createPersistentAgentFromScaffoldInput({ displayName: "Invented Race Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
	writePersistentAgentThread(room, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const shelf = persistentRoomShelfDirPath(room);
	fs.mkdirSync(shelf, { recursive: true });
	const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Invented guarded value"]]), "Example");
	const bytes = Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
	const file = path.join(shelf, "race.xlsx"); fs.writeFileSync(file, bytes);
	const parsed = await runWorkspaceSpreadsheetSnapshot(bytes, new AbortController().signal);
	if (!parsed.ok || !parsed.result) throw new Error("invented reference workbook did not parse");
	const message = { ok: true, schemaVersion: 1, notices: parsed.notices, result: parsed.result };
	let started: (() => void) | undefined, release: (() => void) | undefined, calls = 0;
	childProcess.fork = (() => {
		calls++;
		const child = new EventEmitter() as EventEmitter & { stderr: PassThrough; kill: () => boolean };
		child.stderr = new PassThrough(); child.kill = () => { queueMicrotask(() => child.emit("close", 0, null)); return true; };
		release = () => child.emit("message", message); started?.(); return child;
	}) as unknown as typeof childProcess.fork;
	syncBuiltinESMExports();
	const request = () => app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=race.xlsx`, headers: SMOKE_AUTH_HEADERS });
	let arm = new Promise<void>((resolve) => { started = resolve; });
	let pending = request(); await arm; enabled = false; release!();
	const revoked = await pending;
	if (revoked.statusCode !== 403 || revoked.json().code !== "grant_changed" || revoked.body.includes("Invented guarded value")) throw new Error(`revoked shelf returned data: ${revoked.statusCode} ${revoked.body}`);
	const refusedBefore = await request();
	if (refusedBefore.statusCode < 400 || calls !== 1 || refusedBefore.body.includes("Invented guarded value")) throw new Error("revocation before the request must not invoke a parser");
	enabled = true; fs.writeFileSync(file, bytes);
	arm = new Promise<void>((resolve) => { started = resolve; });
	pending = request(); await arm; fs.writeFileSync(file, "invented replacement"); release!();
	const changed = await pending;
	if (changed.statusCode !== 409 || changed.json().code !== "file_changed" || changed.body.includes("Invented guarded value")) throw new Error(`changed file returned data: ${changed.statusCode} ${changed.body}`);
	if (Number(calls) !== 2) throw new Error("the two synthetic workers must have been observed");
	console.log("shared preview discards in-flight revoked and changed results");
} finally {
	childProcess.fork = originalFork; syncBuiltinESMExports();
	await app.close(); fs.rmSync(home, { recursive: true, force: true });
}
