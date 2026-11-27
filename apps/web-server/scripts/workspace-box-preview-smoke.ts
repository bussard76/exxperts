import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import * as XLSX from "xlsx";
import { fileURLToPath } from "node:url";
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

const { app } = await import("../src/server-app.js");
await import("../src/server-hooks.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { createPersistentRoomDefaultCapabilityPolicy, deletePersistentRoomDefaultCapabilityPolicy, writePersistentRoomDefaultCapabilityPolicy } = await import("../src/persistent-room-workspace-policy.js");
const { setRoomBoxForTests } = await import("../src/room-box/box-available.js");
const { persistentRoomLiveSessions, registerWorkspaceBox } = await import("../src/room-live-sessions.js");
const { runWorkspaceSpreadsheetSnapshot } = await import("../src/persistent-room-shelf-reading.js");
const originalFork = childProcess.fork;

try {
	const created = createPersistentAgentFromScaffoldInput({ displayName: "Invented Room", userName: "Example", preferredUserAddress: "Example" });
	const id = created.agent.id;
	if (!id) throw new Error("missing created room id");
	writePersistentAgentThread(id, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const policy = createPersistentRoomDefaultCapabilityPolicy({ agentId: id, root: folder, repoRoot: process.cwd(), displayLabel: "Invented" });
	writePersistentRoomDefaultCapabilityPolicy(policy);
	setRoomBoxForTests({ platform: "darwin", windows: null });
	const owner = { connectionId: "owner", conversationId: "invented-thread" } as any;
	persistentRoomLiveSessions.set(id, owner);
	let calls = 0;
	let pause = false, started: (() => void) | undefined, release: (() => void) | undefined;
	const fake = {
		spills: () => [],
		ownTemp: () => undefined,
		runFileProgram: async (call: { request: string }) => {
			calls++;
			if (pause) { started?.(); await new Promise<void>((resolve) => { release = resolve; }); }
			const worker = fileURLToPath(new URL("../src/room-box/file-worker.mjs", import.meta.url));
			const result = spawnSync(process.execPath, [worker], { input: call.request });
			if (result.status !== 0) throw new Error("invented file worker failed");
			return { output: result.stdout, ended: "exit code 0", errorOutput: result.stderr };
		},
	} as any;
	const removeOld = registerWorkspaceBox(id, "invented-thread", fake, owner);
	const preview = await app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-preview?conversationId=invented-thread&path=invented.txt`, headers: SMOKE_AUTH_HEADERS });
	if (preview.statusCode !== 200 || preview.json().text !== "example" || calls === 0) throw new Error(`the owning box must supply preview bytes: ${preview.statusCode} ${preview.body}`);
	removeOld();
	const before = calls;
	const originalOpen = fs.promises.open;
	let hostOpens = 0;
	(fs.promises as any).open = async (...args: Parameters<typeof fs.promises.open>) => { if (String(args[0]).startsWith(folder + path.sep)) hostOpens++; return originalOpen(...args); };
	let missing;
	try { missing = await app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-preview?conversationId=invented-thread&path=invented.txt`, headers: SMOKE_AUTH_HEADERS }); }
	finally { (fs.promises as any).open = originalOpen; }
	if (missing.statusCode !== 503 || missing.json().code !== "box_failed" || calls !== before || hostOpens !== 0 || missing.body.includes("example")) throw new Error("an unbound box must fail before a boxed or host read");
	const request = () => app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-preview?conversationId=invented-thread&path=invented.txt`, headers: SMOKE_AUTH_HEADERS });
	const remove = registerWorkspaceBox(id, "invented-thread", fake, owner);
	pause = true;
	let armed = new Promise<void>((resolve) => { started = resolve; });
	let pending = request(); await armed; remove(); release!();
	const invalidated = await pending;
	if (invalidated.statusCode !== 503 || invalidated.json().code !== "box_failed" || invalidated.body.includes("example")) throw new Error("owner invalidation must suppress in-flight bytes");
	const removeAgain = registerWorkspaceBox(id, "invented-thread", fake, owner);
	armed = new Promise<void>((resolve) => { started = resolve; });
	pending = request(); await armed; deletePersistentRoomDefaultCapabilityPolicy(id); release!();
	const revoked = await pending;
	if (revoked.statusCode !== 403 || revoked.json().code !== "grant_changed" || revoked.body.includes("example")) throw new Error("policy revocation must suppress in-flight bytes");
	removeAgain();
	writePersistentRoomDefaultCapabilityPolicy(policy);
	const removeOnPolicyChange = registerWorkspaceBox(id, "invented-thread", fake, owner);
	armed = new Promise<void>((resolve) => { started = resolve; });
	pending = request(); await armed;
	writePersistentRoomDefaultCapabilityPolicy({ ...policy, denySegments: [...policy.denySegments, "invented"] });
	release!();
	const changedPolicy = await pending;
	if (changedPolicy.statusCode !== 403 || changedPolicy.json().code !== "grant_changed" || changedPolicy.body.includes("example")) throw new Error("a changed policy must suppress in-flight bytes even when its fingerprint fields stay the same");
	removeOnPolicyChange();
	writePersistentRoomDefaultCapabilityPolicy(policy);
	fs.writeFileSync(path.join(folder, "invented.xlsx"), "invented workbook");
	let parserCalls = 0;
	childProcess.fork = (() => { parserCalls++; throw new Error("parser must not start"); }) as typeof childProcess.fork;
	syncBuiltinESMExports();
	const removeBeforeParser = registerWorkspaceBox(id, "invented-thread", fake, owner);
	armed = new Promise<void>((resolve) => { started = resolve; });
	const parsing = app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-preview?conversationId=invented-thread&path=invented.xlsx`, headers: SMOKE_AUTH_HEADERS });
	await armed; removeBeforeParser(); release!();
	const stopped = await parsing;
	if (stopped.statusCode !== 503 || stopped.json().code !== "box_failed" || parserCalls !== 0) throw new Error("invalidated owner must stop before the parser starts");
	childProcess.fork = originalFork; syncBuiltinESMExports();
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Invented cell"]]), "Example");
	const workbookBytes = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
	fs.writeFileSync(path.join(folder, "invented.xlsx"), workbookBytes);
	const parsed = await runWorkspaceSpreadsheetSnapshot(workbookBytes, new AbortController().signal);
	if (!parsed.ok || !parsed.result) throw new Error("invented workbook must parse");
	let workerStarted: (() => void) | undefined, workerRelease: (() => void) | undefined;
	childProcess.fork = (() => {
		const child = new EventEmitter() as EventEmitter & { stderr: PassThrough; kill: () => boolean };
		child.stderr = new PassThrough(); child.kill = () => { queueMicrotask(() => child.emit("close", 0, null)); return true; };
		workerRelease = () => child.emit("message", { ok: true, schemaVersion: 1, notices: parsed.notices, result: parsed.result });
		workerStarted?.(); return child;
	}) as unknown as typeof childProcess.fork;
	syncBuiltinESMExports();
	pause = false;
	const removeDuringParser = registerWorkspaceBox(id, "invented-thread", fake, owner);
	const workerReady = new Promise<void>((resolve) => { workerStarted = resolve; });
	const pendingWorker = app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-preview?conversationId=invented-thread&path=invented.xlsx`, headers: SMOKE_AUTH_HEADERS });
	await workerReady; removeDuringParser(); workerRelease!();
	const staleWorker = await pendingWorker;
	if (staleWorker.statusCode !== 503 || staleWorker.json().code !== "box_failed" || staleWorker.body.includes("Invented cell")) throw new Error("owner invalidation during parsing must suppress the worker result");
	console.log("boxed preview uses its owner and refuses a missing binding");
} finally {
	childProcess.fork = originalFork; syncBuiltinESMExports();
	setRoomBoxForTests(null);
	await app.close();
	fs.rmSync(home, { recursive: true, force: true });
}
