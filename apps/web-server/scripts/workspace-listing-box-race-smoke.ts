import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
	let releasePending: (() => void) | undefined;
	let started: (() => void) | undefined;
	const arm = () => new Promise<void>((resolve) => { started = resolve; });
	let pause = false;
	let calls = 0;
	const fake = {
		spills: () => [],
		ownTemp: () => undefined,
		runFileProgram: async (call: { request: string }) => {
			calls++;
			if (pause) {
				started?.();
				await new Promise<void>((resolve) => { releasePending = resolve; });
			}
			const worker = fileURLToPath(new URL("../src/room-box/file-worker.mjs", import.meta.url));
			const result = spawnSync(process.execPath, [worker], { input: call.request });
			if (result.status !== 0) throw new Error("invented file worker failed");
			return { output: result.stdout, ended: "exit code 0", errorOutput: result.stderr };
		},
	} as any;
	const request = () => app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-files?conversationId=invented-thread`, headers: SMOKE_AUTH_HEADERS });
	const removeOld = registerWorkspaceBox(id, "invented-thread", fake, owner);
	const listed = await request();
	if (listed.statusCode !== 200 || listed.json().entries[0]?.name !== "invented.txt" || calls !== 2) throw new Error("the owning box must produce both listing snapshots");
	const removeDuplicate = registerWorkspaceBox(id, "invented-thread", fake, owner);
	const ambiguous = await request();
	if (ambiguous.statusCode !== 503 || ambiguous.json().code !== "box_failed" || calls !== 2) throw new Error("ambiguous owners must refuse before dispatch");
	removeDuplicate();
	writePersistentAgentThread(id, "other-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const other = await app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-files?conversationId=other-thread`, headers: SMOKE_AUTH_HEADERS });
	if (other.statusCode !== 503 || other.json().code !== "box_failed" || calls !== 2) throw new Error("another conversation must not borrow the box");
	removeOld();
	const remove = registerWorkspaceBox(id, "invented-thread", fake, owner);
	removeOld();
	const replacement = await request();
	if (replacement.statusCode !== 200 || Number(calls) !== 4) throw new Error("old cleanup must not remove a replacement");
	pause = true;
	const dispatched = arm();
	const response = app.inject({ method: "GET", url: `/api/persistent-agents/${id}/workspace-files?conversationId=invented-thread`, headers: SMOKE_AUTH_HEADERS });
	await dispatched;
	remove();
	releasePending?.();
	const result = await response;
	if (result.statusCode !== 503 || result.json().code !== "box_failed" || result.body.includes("invented.txt")) throw new Error(`invalidated box returned data: ${result.statusCode} ${result.body}`);
	const removeAgain = registerWorkspaceBox(id, "invented-thread", fake, owner);
	const dispatchedReplacement = arm();
	const replacing = request();
	await dispatchedReplacement;
	fs.renameSync(folder, `${folder}-old`);
	fs.mkdirSync(folder);
	fs.writeFileSync(path.join(folder, "invented.txt"), "different");
	releasePending?.();
	const replaced = await replacing;
	if (replaced.statusCode !== 409 || replaced.json().code !== "file_changed" || replaced.body.includes("invented.txt")) throw new Error(`replaced folder returned data: ${replaced.statusCode} ${replaced.body}`);
	fs.rmSync(folder, { recursive: true });
	fs.renameSync(`${folder}-old`, folder);
	const dispatchedRevocation = arm();
	const revoking = request();
	await dispatchedRevocation;
	deletePersistentRoomDefaultCapabilityPolicy(id);
	releasePending?.();
	const revoked = await revoking;
	if (revoked.statusCode !== 403 || revoked.json().code !== "grant_changed" || revoked.body.includes("invented.txt")) throw new Error(`revoked policy returned data: ${revoked.statusCode} ${revoked.body}`);
	removeAgain();
	console.log("listing discarded after owner invalidation, folder replacement, and policy revocation");
} finally {
	setRoomBoxForTests(null);
	await app.close();
	fs.rmSync(home, { recursive: true, force: true });
}
