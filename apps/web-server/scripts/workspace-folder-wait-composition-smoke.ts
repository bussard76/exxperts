import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import childProcess, { spawnSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import { SMOKE_AUTH_HEADERS, SMOKE_SERVER_AUTH_ENV } from "./smoke-server-process.js";

const mode = process.argv[2];
if (!mode) {
	for (const scenario of ["absent", "undefined", "real", "boot", "shared"]) {
		const child = spawnSync(process.execPath, ["--import", "tsx", process.argv[1], scenario], { encoding: "utf8", env: process.env, timeout: 90_000 });
		if (child.status !== 0) throw new Error(`${scenario} failed (${child.status}): ${child.stdout}\n${child.stderr}`);
		process.stdout.write(child.stdout);
	}
} else {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-wait-composition-"));
	const folder = path.join(home, "invented-folder");
	fs.mkdirSync(folder);
	fs.writeFileSync(path.join(folder, "invented.txt"), "example");
	fs.writeFileSync(path.join(folder, "invented.xlsx"), "invented workbook");
	fs.writeFileSync(path.join(folder, "invented.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64"));
	process.env.HOME = home; process.env.USERPROFILE = home;
	process.env.EXXETA_PERSISTENT_AGENTS_ROOT = path.join(home, "agents");
	Object.assign(process.env, SMOKE_SERVER_AUTH_ENV);
	const appDir = path.join(home, ".exxperts", "app"); fs.mkdirSync(appDir, { recursive: true });
	fs.writeFileSync(path.join(appDir, "openai-compatible-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible", providerId: "openai-compatible", label: "Synthetic Gateway", roomModels: [{ modelId: "invented" }], maintenanceModel: "invented" }));
	fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible" }));
	const originalExecFile = childProcess.execFile, originalSpawn = childProcess.spawn, originalFork = childProcess.fork;
	let associationCalls = 0, dispatches = 0, parsers = 0;
	childProcess.execFile = ((_file: unknown, _args: unknown, _options: unknown, callback: any) => { associationCalls++; queueMicrotask(() => callback(new Error("synthetic unavailable association"), "", "")); return new EventEmitter(); }) as typeof childProcess.execFile;
	childProcess.spawn = (() => { dispatches++; throw new Error("unexpected external dispatch"); }) as typeof childProcess.spawn;
	childProcess.fork = (() => { parsers++; throw new Error("unexpected parser"); }) as typeof childProcess.fork;
	syncBuiltinESMExports();
	if (mode === "shared") (await import("../src/server-hooks.js")).registerServerHooks({ roomFilesAreTheFolder: () => true });
	const { app, PORT } = await import("../src/server-app.js");
	const routes = await import("../src/room-settings-routes.js");
	const { setRoomBoxForTests } = await import("../src/room-box/box-available.js");
	const { folderWait, fileToolsWait } = await import("../src/room-box/windows/folder-wait.js");
	const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
	const { writePersistentRoomProtection, persistentRoomProtection } = await import("../src/persistent-room-protection.js");
	const { createPersistentRoomDefaultCapabilityPolicy, writePersistentRoomDefaultCapabilityPolicy } = await import("../src/persistent-room-workspace-policy.js");
	let calls = 0;
	try {
		if (mode === "undefined") routes.installWorkspaceFolderWait(() => { calls++; return undefined; });
		if (mode === "real" || mode === "shared") routes.installWorkspaceFolderWait(() => { calls++; return fileToolsWait(); });
		if (mode === "boot") await import("../src/room-socket.js");
		if (mode !== "absent") {
			let duplicate = false;
			try { routes.installWorkspaceFolderWait(fileToolsWait); } catch { duplicate = true; }
			if (!duplicate) throw new Error("duplicate factory installation must fail");
		}
		const id = createPersistentAgentFromScaffoldInput({ displayName: "Invented Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
		writePersistentAgentThread(id, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
		writePersistentRoomDefaultCapabilityPolicy(createPersistentRoomDefaultCapabilityPolicy({ agentId: id, root: folder, repoRoot: process.cwd(), displayLabel: "Invented" }));
		const headers = { ...SMOKE_AUTH_HEADERS, host: `127.0.0.1:${PORT}`, origin: `http://127.0.0.1:${PORT}`, "x-exxperts-local-action": "open-workspace-file" };
		const request = (kind: string) => kind === "open"
			? app.inject({ method: "POST", url: `/api/persistent-agents/${id}/workspace-open`, headers, payload: { conversationId: "invented-thread", path: "invented.txt" } })
			: app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-${kind}?conversationId=invented-thread${kind === "files" ? "" : `&path=invented.${kind === "image" ? "png" : (kind === "preview" && (mode === "absent" || mode === "undefined") ? "xlsx" : "txt")}`}`, headers });
		const kinds = ["files", "image", "preview", "open"];
		setRoomBoxForTests({ platform: "win32", windows: "on" });
		writePersistentRoomProtection(id, "off");
		if (persistentRoomProtection(id).state !== "off") throw new Error("fixture protection must be off");
		if (mode === "absent" || mode === "undefined") {
			let fileWork = 0;
			const originalOpen = fs.promises.open, originalOpendir = fs.promises.opendir;
			fs.promises.open = (async (...args: Parameters<typeof fs.promises.open>) => { if (String(args[0]).startsWith(folder)) fileWork++; return originalOpen(...args); }) as typeof fs.promises.open;
			fs.promises.opendir = (async (...args: Parameters<typeof fs.promises.opendir>) => { if (String(args[0]).startsWith(folder)) fileWork++; return originalOpendir(...args); }) as typeof fs.promises.opendir;
			try {
			const failures: string[] = [];
			for (const kind of kinds) {
				const response = await request(kind);
				const code = kind === "open" ? "opener_unavailable" : "workspace_unavailable";
				if (response.statusCode !== 503 || response.json().code !== code) failures.push(`${mode} ${kind}: ${response.statusCode} ${response.body}`);
			}
			if (mode === "undefined" && calls !== 4) throw new Error(`factory must be called once per operation: ${calls}`);
			if (fileWork || parsers || associationCalls || dispatches) failures.push(`refusal did work: ${fileWork}/${parsers}/${associationCalls}/${dispatches}`);
			if (failures.length) throw new Error(failures.join("\n"));
			} finally { fs.promises.open = originalOpen; fs.promises.opendir = originalOpendir; }
		} else if (mode === "shared") {
			if (fileToolsWait() !== undefined || (await request("open")).json().code !== "local_action_forbidden") throw new Error("shared server must use no wait and refuse local open");
		} else {
			for (const state of ["on", "broken"] as const) {
				setRoomBoxForTests({ platform: "win32", windows: state });
				if (fileToolsWait() !== folderWait) throw new Error(`${state} must return the singleton`);
				for (const kind of kinds) {
					const before = calls;
					const held = await new Promise<{ release: () => void }>((resolve) => { void folderWait.hold("command", [folder], undefined, async () => new Promise<void>((release) => resolve({ release }))); });
					const pending = request(kind);
					const settled = await Promise.race([pending.then(() => true), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 100))]);
					held.release();
					const response = await pending;
					if (settled || response.statusCode === 503 || (mode === "real" && calls !== before + 1)) throw new Error(`${state} ${kind} must wait once and continue: ${response.statusCode} ${response.body}`);
				}
			}
			setRoomBoxForTests({ platform: "win32", windows: null });
			const beforeUnknown = calls;
			for (const kind of kinds) {
				const unknown = await request(kind);
				if (unknown.statusCode !== 503 || unknown.json().code !== (kind === "open" ? "opener_unavailable" : "workspace_unavailable")) throw new Error(`unknown ${kind} must refuse`);
			}
			if (calls !== beforeUnknown) throw new Error("unknown must refuse before invoking the factory");
			setRoomBoxForTests({ platform: "win32", windows: "off" });
			if (fileToolsWait() !== undefined) throw new Error("off must use no wait");
			for (const kind of kinds) {
				const response = await request(kind);
				if (kind === "open" ? response.statusCode !== 403 : response.statusCode !== 200) throw new Error(`off ${kind} must continue without a wait: ${response.statusCode}`);
			}
			setRoomBoxForTests({ platform: "darwin", windows: null });
			if (fileToolsWait() !== undefined || (await request("preview")).json().code !== "box_failed") throw new Error("Mac without owner must refuse without host fallback");
		}
		console.log(`workspace folder wait composition ${mode}: ok`);
	} finally { childProcess.execFile = originalExecFile; childProcess.spawn = originalSpawn; childProcess.fork = originalFork; syncBuiltinESMExports(); setRoomBoxForTests(null); await app.close(); fs.rmSync(home, { recursive: true, force: true }); }
}
