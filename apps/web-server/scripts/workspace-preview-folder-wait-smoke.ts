import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import * as XLSX from "xlsx";
import { SMOKE_AUTH_HEADERS, SMOKE_SERVER_AUTH_ENV } from "./smoke-server-process.js";

const home = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-box-race-"));
const folder = path.join(home, "invented-folder");
fs.mkdirSync(folder);
fs.writeFileSync(path.join(folder, "invented.txt"), "example");
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.EXXETA_PERSISTENT_AGENTS_ROOT = path.join(home, "agents");
Object.assign(process.env, SMOKE_SERVER_AUTH_ENV);
const appDir = path.join(home, ".exxperts", "app");
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, "openai-compatible-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible", providerId: "openai-compatible", label: "Synthetic Gateway", roomModels: [{ modelId: "invented" }], maintenanceModel: "invented" }));
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible" }));

const { app } = await import("../src/server-app.js");
await import("../src/server-hooks.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { createPersistentRoomDefaultCapabilityPolicy, writePersistentRoomDefaultCapabilityPolicy } = await import("../src/persistent-room-workspace-policy.js");
const { setRoomBoxForTests } = await import("../src/room-box/box-available.js");
const { folderWait } = await import("../src/room-box/windows/folder-wait.js");
const { runWorkspaceSpreadsheetSnapshot } = await import("../src/persistent-room-shelf-reading.js");
const originalFork = childProcess.fork;

try {
	const created = createPersistentAgentFromScaffoldInput({ displayName: "Invented Room", userName: "Example", preferredUserAddress: "Example" });
	const id = created.agent.id;
	if (!id) throw new Error("missing created room id");
	writePersistentAgentThread(id, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const policy = createPersistentRoomDefaultCapabilityPolicy({ agentId: id, root: folder, repoRoot: process.cwd(), displayLabel: "Invented" });
	writePersistentRoomDefaultCapabilityPolicy(policy);
	setRoomBoxForTests({ platform: "win32", windows: "on" });
	const held = await new Promise<{ release: () => void }>((resolve) => { void folderWait.hold("command", [folder], undefined, async () => new Promise<void>((release) => resolve({ release }))); });
	const request = app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-preview?conversationId=invented-thread&path=invented.txt`, headers: SMOKE_AUTH_HEADERS });
	const settled = await Promise.race([request.then(() => true), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 100))]);
	if (settled) throw new Error("preview must wait for an overlapping boxed command");
	held.release();
	const response = await request;
	if (response.statusCode !== 200 || response.json().text !== "example") throw new Error(`preview must continue after the command releases: ${response.statusCode} ${response.body}`);
	const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Invented cell"]]), "Example");
	const bytes = Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
	fs.writeFileSync(path.join(folder, "invented.xlsx"), bytes);
	const parsed = await runWorkspaceSpreadsheetSnapshot(bytes, new AbortController().signal);
	if (!parsed.ok || !parsed.result) throw new Error("invented reference workbook failed");
	let started: (() => void) | undefined, releaseWorker: (() => void) | undefined;
	childProcess.fork = (() => {
		const child = new EventEmitter() as EventEmitter & { stderr: PassThrough; kill: () => boolean };
		child.stderr = new PassThrough(); child.kill = () => { queueMicrotask(() => child.emit("close", 0, null)); return true; };
		releaseWorker = () => child.emit("message", { ok: true, schemaVersion: 1, notices: parsed.notices, result: parsed.result });
		started?.(); return child;
	}) as unknown as typeof childProcess.fork;
	syncBuiltinESMExports();
	const workerStarted = new Promise<void>((resolve) => { started = resolve; });
	const parsing = app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-preview?conversationId=invented-thread&path=invented.xlsx`, headers: SMOKE_AUTH_HEADERS });
	await workerStarted;
	let commandBegan = false;
	const command = folderWait.hold("command", [folder], undefined, async () => { commandBegan = true; });
	await new Promise<void>((resolve) => setTimeout(resolve, 100));
	if (commandBegan) throw new Error("the file hold must remain while its worker parses");
	releaseWorker!();
	const parsedResponse = await parsing;
	await command;
	if (parsedResponse.statusCode !== 200 || !commandBegan) throw new Error("the file hold releases after parsing");
	console.log("workspace preview waits for the Windows folder hold");
} finally {
	childProcess.fork = originalFork; syncBuiltinESMExports();
	setRoomBoxForTests(null); await app.close(); fs.rmSync(home, { recursive: true, force: true });
}
