import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

const safe = path.join(home, "safe");
const cwd = path.join(safe, "cwd"), binary = path.join(safe, "viewer");
fs.mkdirSync(cwd, { recursive: true });
fs.writeFileSync(binary, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 1, 2, 3, 4]), { mode: 0o755 });
const applications = path.join(home, ".local", "share", "applications");
fs.mkdirSync(applications, { recursive: true });
fs.writeFileSync(path.join(applications, "invented.desktop"), `[Desktop Entry]\nType=Application\nName=Invented\nMimeType=text/plain;\nExec=${binary} %f\nPath=${cwd}\n`);
process.env.XDG_DATA_HOME = path.join(home, ".local", "share");
process.env.XDG_DATA_DIRS = path.join(home, "other-data");
let queries = 0, types = 0, dispatches = 0, changed = false, changeFileAt = 0;
let unavailable = false;
let launched: { executable: string; args: string[]; cwd: string; shell: unknown } | undefined;
const originalExecFile = childProcess.execFile, originalSpawn = childProcess.spawn;
childProcess.execFile = ((_file: unknown, args: string[], _options: unknown, callback: any) => {
	if (args[1] === "filetype") { types++; queueMicrotask(() => callback(null, "text/plain\n", "")); return new EventEmitter(); }
	queries++; queueMicrotask(() => { if (changeFileAt === queries) fs.writeFileSync(path.join(folder, "invented.txt"), `changed invented file ${queries}`); callback(null, changed && queries % 2 === 0 ? "other.desktop\n" : "invented.desktop\n", ""); });
	return new EventEmitter();
}) as typeof childProcess.execFile;
childProcess.spawn = ((executable: string, args: string[], options: any) => {
	dispatches++; launched = { executable, args, cwd: options.cwd, shell: options.shell };
	const child = new EventEmitter() as EventEmitter & { unref: () => void; kill: () => boolean };
	child.unref = () => {}; child.kill = () => true; queueMicrotask(() => unavailable ? child.emit("error", Object.assign(new Error("unavailable"), { code: "ENOENT" })) : child.emit("spawn")); return child;
}) as typeof childProcess.spawn;
syncBuiltinESMExports();
const { app, PORT } = await import("../src/server-app.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { createPersistentRoomDefaultCapabilityPolicy, writePersistentRoomDefaultCapabilityPolicy } = await import("../src/persistent-room-workspace-policy.js");
try {
	const room = createPersistentAgentFromScaffoldInput({ displayName: "Invented Open Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
	writePersistentAgentThread(room, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	writePersistentRoomDefaultCapabilityPolicy(createPersistentRoomDefaultCapabilityPolicy({ agentId: room, root: folder, repoRoot: process.cwd() }));
	const headers = { ...SMOKE_AUTH_HEADERS, host: `127.0.0.1:${PORT}`, origin: `http://127.0.0.1:${PORT}`, "x-exxperts-local-action": "open-workspace-file" };
	const request = () => app.inject({ method: "POST", url: `/api/persistent-agents/${room}/workspace-open`, headers, payload: { conversationId: "invented-thread", path: "invented.txt" } });
	const success = await request();
	if (success.statusCode !== 202 || success.json().accepted !== true || dispatches !== 1 || types !== 3 || !launched || launched.executable !== fs.realpathSync(binary) || launched.cwd !== fs.realpathSync(cwd) || launched.shell !== false || launched.args.length !== 1 || launched.args[0] !== fs.realpathSync(path.join(folder, "invented.txt"))) throw new Error(`verified handoff was not bound to the checked values and effective file type: ${success.statusCode} ${success.body}`);
	changed = true; queries = 0;
	const refused = await request();
	if (refused.statusCode !== 403 || refused.json().code !== "association_unverified" || Number(dispatches) !== 1) throw new Error("changed association must cause zero further handoffs");
	changed = false;
	const desktop = path.join(applications, "invented.desktop");
	const writableBinary = path.join(folder, "invented-viewer");
	fs.writeFileSync(writableBinary, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 1, 2, 3, 4]), { mode: 0o755 });
	for (const [exec, workdir, extra] of [[`${binary} %F`, cwd, ""], [`${binary} %f %f`, cwd, ""], [`${binary} %f`, folder, ""], [`${writableBinary} %f`, cwd, ""], [`${binary} %f`, cwd, "DBusActivatable=true\n"], ["/bin/sh %f", cwd, ""]] as const) {
		queries = 0;
		fs.writeFileSync(desktop, `[Desktop Entry]\nType=Application\nName=Invented\nMimeType=text/plain;\nExec=${exec}\nPath=${workdir}\n${extra}`);
		const denied = await request();
		if (denied.statusCode !== 403 || denied.json().code !== "association_unverified" || Number(dispatches) !== 1) throw new Error(`unsafe association must not dispatch: ${denied.statusCode} ${denied.body}`);
	}
	fs.writeFileSync(desktop, `[Desktop Entry]\nType=Application\nName=Invented\nMimeType=text/plain;\nExec=${binary} %f\nPath=${cwd}\n`);
	queries = 0; changeFileAt = 1;
	const changedInput = await request();
	if (changedInput.statusCode !== 409 || changedInput.json().code !== "file_changed" || Number(dispatches) !== 1) throw new Error("file change during association lookup must not dispatch");
	queries = 0; changeFileAt = 3;
	const changedAtFinalLookup = await request();
	if (changedAtFinalLookup.statusCode !== 409 || changedAtFinalLookup.json().code !== "file_changed" || Number(dispatches) !== 1) throw new Error("file change during final association lookup must not dispatch");
	queries = 0; changeFileAt = 0; unavailable = true;
	const missingOpener = await request();
	if (missingOpener.statusCode !== 503 || missingOpener.json().code !== "opener_unavailable") throw new Error("unavailable dispatcher must report opener_unavailable");
	console.log("workspace checked open handoff smoke passed");
} finally {
	childProcess.execFile = originalExecFile; childProcess.spawn = originalSpawn; syncBuiltinESMExports();
	await app.close(); fs.rmSync(home, { recursive: true, force: true });
}
