import childProcess from "node:child_process";
import { spawnSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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
let launchMode: "success" | "unavailable" | "failure" | "timeout" = "success", killed = 0;
let revokeAt = 0, revoke = () => {};
let launched: { executable: string; args: string[]; cwd: string; shell: unknown } | undefined;
const originalExecFile = childProcess.execFile, originalSpawn = childProcess.spawn;
childProcess.execFile = ((_file: unknown, args: string[], _options: unknown, callback: any) => {
	if (args[1] === "filetype") { types++; queueMicrotask(() => callback(null, "text/plain\n", "")); return new EventEmitter(); }
	queries++; queueMicrotask(() => { if (changeFileAt === queries) fs.writeFileSync(path.join(folder, "invented.txt"), `changed invented file ${queries}`); if (revokeAt === queries) revoke(); callback(null, changed && queries % 2 === 0 ? "other.desktop\n" : "invented.desktop\n", ""); });
	return new EventEmitter();
}) as typeof childProcess.execFile;
childProcess.spawn = ((executable: string, args: string[], options: any) => {
	dispatches++; launched = { executable, args, cwd: options.cwd, shell: options.shell };
	const child = new EventEmitter() as EventEmitter & { unref: () => void; kill: () => boolean };
	child.unref = () => {}; child.kill = () => { killed++; return true; };
	queueMicrotask(() => { if (launchMode === "unavailable" || launchMode === "failure") child.emit("error", Object.assign(new Error("synthetic failure"), { code: launchMode === "unavailable" ? "ENOENT" : "EIO" })); else if (launchMode === "success") child.emit("spawn"); });
	return child;
}) as typeof childProcess.spawn;
syncBuiltinESMExports();
const { app, PORT } = await import("../src/server-app.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { createPersistentRoomDefaultCapabilityPolicy, writePersistentRoomDefaultCapabilityPolicy } = await import("../src/persistent-room-workspace-policy.js");
const { setRoomBoxForTests } = await import("../src/room-box/box-available.js");
const { persistentRoomLiveSessions, registerWorkspaceBox } = await import("../src/room-live-sessions.js");
try {
	const room = createPersistentAgentFromScaffoldInput({ displayName: "Invented Open Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
	writePersistentAgentThread(room, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const policy = createPersistentRoomDefaultCapabilityPolicy({ agentId: room, root: folder, repoRoot: process.cwd() });
	writePersistentRoomDefaultCapabilityPolicy(policy);
	revoke = () => writePersistentRoomDefaultCapabilityPolicy({ ...policy, denySegments: [...policy.denySegments, "invented.txt"] });
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
	queries = 0; changeFileAt = 0; revokeAt = 3;
	const revokedAtFinalLookup = await request();
	if (revokedAtFinalLookup.statusCode !== 403 || Number(dispatches) !== 1) throw new Error("policy change during final lookup must not dispatch");
	writePersistentRoomDefaultCapabilityPolicy(policy); revokeAt = 0;
	queries = 0; launchMode = "unavailable";
	const missingOpener = await request();
	if (missingOpener.statusCode !== 503 || missingOpener.json().code !== "opener_unavailable") throw new Error("unavailable dispatcher must report opener_unavailable");
	launchMode = "success"; queries = 0;
	fs.writeFileSync(desktop, `[Desktop Entry]\nType=Application\nName=Invented\nMimeType=text/plain;\nExec=${binary} %u\nPath=${cwd}\n`);
	const uriOpen = await request();
	if (uriOpen.statusCode !== 202 || Number(dispatches) !== 3 || launched?.args.length !== 1 || launched.args[0] !== pathToFileURL(fs.realpathSync(path.join(folder, "invented.txt"))).href) throw new Error("URI placeholder must name exactly the authorized local file");
	queries = 0;
	fs.writeFileSync(desktop, `[Desktop Entry]\nType=Application\nName=Invented\nMimeType=text/plain;\nExec=${binary} --invented-mode %f\nPath=${cwd}\n`);
	const literalArgument = await request();
	if (literalArgument.statusCode !== 202 || Number(dispatches) !== 4 || Number(launched?.args.length) !== 2 || launched?.args[0] !== "--invented-mode" || launched.args[1] !== fs.realpathSync(path.join(folder, "invented.txt"))) throw new Error("unambiguous literal arguments must be bound and preserved");
	queries = 0; launchMode = "failure";
	const failed = await request();
	if (failed.statusCode !== 500 || failed.json().code !== "open_failed") throw new Error("dispatcher error must report open_failed");
	queries = 0; launchMode = "timeout";
	const originalTimeout = globalThis.setTimeout;
	globalThis.setTimeout = ((callback: (...args: any[]) => void, delay?: number, ...args: any[]) => originalTimeout(callback, delay === 10_000 ? 10 : delay, ...args)) as typeof setTimeout;
	try {
		const timeout = await request();
		if (timeout.statusCode !== 504 || timeout.json().code !== "open_timeout" || killed !== 3) throw new Error("timed-out dispatcher must be stopped and report open_timeout");
	} finally { globalThis.setTimeout = originalTimeout; }
	queries = 0; launchMode = "success";
	const beforeExecutableChange = dispatches, executableInode = fs.statSync(binary).ino, originalRead = fs.readSync;
	let executableChanged = false;
	fs.readSync = ((...args: any[]) => {
		const result = Reflect.apply(originalRead, fs, args);
		if (!executableChanged && queries === 3 && fs.fstatSync(args[0]).ino === executableInode) {
			executableChanged = true;
			fs.writeFileSync(binary, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 4, 3, 2, 1]));
		}
		return result;
	}) as typeof fs.readSync;
	try {
		const changedExecutable = await request();
		if (!executableChanged || changedExecutable.statusCode !== 403 || changedExecutable.json().code !== "association_unverified" || Number(dispatches) !== beforeExecutableChange) throw new Error("an executable changed while its identity is read must not dispatch");
	} finally { fs.readSync = originalRead; }
	queries = 0;
	const beforeLateChange = dispatches, originalLstat = fs.promises.lstat;
	let executableChangedLate = false;
	fs.promises.lstat = (async (...args: any[]) => {
		const result = await Reflect.apply(originalLstat, fs.promises, args);
		if (!executableChangedLate && queries === 3 && args[0] === folder) {
			executableChangedLate = true;
			fs.writeFileSync(binary, Buffer.from([0x7f, 0x45, 0x4c, 0x46, 9, 8, 7, 6]));
		}
		return result;
	}) as typeof fs.promises.lstat;
	try {
		const lateChange = await request();
		if (!executableChangedLate || lateChange.statusCode !== 403 || lateChange.json().code !== "association_unverified" || Number(dispatches) !== beforeLateChange) throw new Error("an executable changed after association lookup must not dispatch");
	} finally { fs.promises.lstat = originalLstat; }
	const koffi = (await import("koffi")).default, originalLoad = koffi.load;
	const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
	let launchServicesQueries = 0, bundleQueries = 0, windowsQueries = 0;
	koffi.load = ((_library: string) => ({ func: (signature: string) => {
		if (signature.includes("LSCopyDefaultApplicationURLForURL")) return () => { launchServicesQueries++; return 2; };
		if (signature.includes("CFURLCreateFromFileSystemRepresentation")) return () => 1;
		if (signature.includes("CFBundleCreate")) return () => 3;
		if (signature.includes("CFBundleCopyExecutableURL")) return () => { bundleQueries++; return 4; };
		if (signature.includes("CFURLGetFileSystemRepresentation")) return (_url: unknown, _resolve: unknown, buffer: Buffer) => { buffer.write("/invented/Viewer.app/Contents/MacOS/Viewer\0"); return 1; };
		if (signature.includes("CFRelease")) return () => {};
		if (signature.includes("GetSystemDirectoryW")) return (buffer: Buffer) => { const value = "C:\\Windows\\System32"; buffer.write(value, "utf16le"); return value.length; };
		if (signature.includes("AssocQueryStringW")) return (_flags: number, kind: number, _assoc: string, _verb: string, buffer: Buffer, length: number[]) => { windowsQueries++; const value = kind === 1 ? '"C:\\Invented\\Viewer.exe" "%1"' : "C:\\Invented\\Viewer.exe"; buffer.write(`${value}\0`, "utf16le"); length[0] = value.length + 1; return 0; };
		throw new Error(`unexpected synthetic native function: ${signature}`);
	} })) as typeof koffi.load;
	const owner = { connectionId: "native-owner", conversationId: "invented-thread" } as any;
	const box = { spills: () => [], ownTemp: () => undefined, runFileProgram: async (call: { request: string }) => {
		const worker = fileURLToPath(new URL("../src/room-box/file-worker.mjs", import.meta.url));
		const result = spawnSync(process.execPath, [worker], { input: call.request });
		if (result.status !== 0) throw new Error("synthetic boxed file worker failed");
		return { output: result.stdout, ended: "exit code 0", errorOutput: result.stderr };
	} } as any;
	try {
		Object.defineProperty(process, "platform", { ...platform, value: "darwin" });
		setRoomBoxForTests({ platform: "darwin", windows: null });
		persistentRoomLiveSessions.set(room, owner);
		const release = registerWorkspaceBox(room, "invented-thread", box, owner);
		try {
			const native = await request();
			if (native.statusCode !== 403 || native.json().code !== "association_unverified" || launchServicesQueries !== 1 || bundleQueries !== 1 || Number(dispatches) !== beforeLateChange) throw new Error("Mac must query Launch Services, resolve its bundle executable and refuse an unbindable launch directory without dispatch");
		} finally { release(); persistentRoomLiveSessions.delete(room); }
		Object.defineProperty(process, "platform", { ...platform, value: "win32" });
		setRoomBoxForTests({ platform: "win32", windows: "off" });
		const windows = await request();
		if (windows.statusCode !== 403 || windows.json().code !== "association_unverified" || windowsQueries !== 2 || Number(dispatches) !== beforeLateChange) throw new Error("Windows must query its effective open command and executable and refuse an implicit working directory without dispatch");
	} finally { koffi.load = originalLoad; setRoomBoxForTests(null); Object.defineProperty(process, "platform", platform); }
	console.log("workspace checked open handoff smoke passed");
} finally {
	childProcess.execFile = originalExecFile; childProcess.spawn = originalSpawn; syncBuiltinESMExports();
	await app.close(); fs.rmSync(home, { recursive: true, force: true });
}
