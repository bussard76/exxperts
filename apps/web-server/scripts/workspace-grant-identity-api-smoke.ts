import crypto from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { authedFetch, freePort, type AuthedFetchInit, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, stopSmokeServer, waitForServer } from "./smoke-server-process.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "exxeta-workspace-default-api-home-"));
const tempAgentsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxeta-workspace-default-api-agents-"));
process.env.HOME = tempHome;
process.env.USERPROFILE = tempHome;
const smokeAppDir = path.join(tempHome, ".exxperts", "app");
fs.mkdirSync(smokeAppDir, { recursive: true });
fs.writeFileSync(
	path.join(smokeAppDir, "openai-compatible-ai-profile.json"),
	JSON.stringify({ profileId: "openai-compatible", providerId: "openai-compatible", label: "Synthetic Gateway", roomModels: [{ modelId: "gpt-5.5" }, { modelId: "claude-opus-4.6" }], maintenanceModel: "claude-opus-4.6" }, null, 2),
);
fs.writeFileSync(path.join(smokeAppDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible" }, null, 2));
process.env.EXXETA_PERSISTENT_AGENTS_ROOT = tempAgentsRoot;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webServerDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

async function requestJson(pathname: string, init: AuthedFetchInit = {}): Promise<{ status: number; body: any }> {
	const response = await authedFetch(`${baseUrl}${pathname}`, {
		...init,
		headers: {
			...(init.body ? { "content-type": "application/json" } : {}),
			...(init.headers ?? {}),
		},
	});
	const text = await response.text();
	return { status: response.status, body: text ? JSON.parse(text) : null };
}

// On this computer a saved folder's view carries the path the person chose, in
// its root's `path`, and nothing else does: that one field is checked, then
// left out of the search for any other path.
function assertNoPathLeak(value: unknown, label: string, blockedPaths: string[], savedRoot?: string): void {
	let shown = value;
	if (savedRoot !== undefined) {
		const roots: any[] = (value as any)?.policy?.roots ?? [];
		assert(roots.length === 1 && roots[0].path === savedRoot, `${label}: the view carries the saved folder's path, got ${JSON.stringify(roots)}`);
		shown = { ...(value as any), policy: { ...(value as any).policy, roots: roots.map(({ path: _path, ...root }) => root) } };
	}
	const serialized = JSON.stringify(shown);
	for (const blockedPath of blockedPaths) {
		assert(!serialized.includes(blockedPath), `${label}: response must not leak absolute path ${blockedPath}`);
	}
	assert(!serialized.includes("realpath"), `${label}: response must not expose realpath field`);
	assert(!serialized.includes('"path"'), `${label}: response must not expose raw path field`);
}

let server: ChildProcessWithoutNullStreams | null = null;
const serverOutput: string[] = [];

try {
	const productAppStateRoot = path.join(tempHome, ".exxperts", "app");
	const workspaceRoot = path.join(tempHome, "workspace-default-api");
	fs.mkdirSync(productAppStateRoot, { recursive: true });
	fs.mkdirSync(workspaceRoot, { recursive: true });

	server = spawn("npx", ["tsx", "src/index.ts"], {
		shell: process.platform === "win32",
		...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
		cwd: webServerDir,
		env: {
			...process.env,
			HOME: tempHome, USERPROFILE: tempHome,
			PORT: String(port),
			...SMOKE_SERVER_AUTH_ENV,
			EXXETA_HOME: repoRoot,
			EXXETA_PERSISTENT_AGENTS_ROOT: tempAgentsRoot,
		},
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitForServer(server, baseUrl, 15000);
	const { writePersistentAgentThread } = await import("../src/persistent-agents.js");
	const { resolvePersistentRoomCapabilityPolicy, resolvePersistentRoomEffectiveWorkspacePolicy, persistentRoomRuntimeCwdForEffectiveWorkspacePolicy } = await import("../src/persistent-room-workspace-policy.js");
	const model = { provider: "openai-compatible", model: "gpt-5.5", label: "GPT 5.5" };

	const created = await requestJson("/api/persistent-agents", {
		method: "POST",
		body: JSON.stringify({
			displayName: "Workspace Default API Smoke",
			userName: "Synthetic User",
			preferredUserAddress: "Synthetic User",
		}),
	});
	assert(created.status === 201, `create room should succeed without workspace default, got ${created.status}: ${JSON.stringify(created.body)}`);
	const agentId = String(created.body?.agent?.agentId ?? "");
	assert(agentId, "created room should return agentId");
	const encodedAgentId = encodeURIComponent(agentId);
	const agentRoot = path.join(tempAgentsRoot, agentId);
	const defaultPath = path.join(agentRoot, "runtime", "workspace-default.json");
	const sentinelSidecarPath = path.join(agentRoot, "runtime", "workspace-policies", "room_default.json");

	let getDefault = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`);
	assert(getDefault.status === 200, `initial default GET should succeed, got ${getDefault.status}`);
	assert(getDefault.body?.policy === null, "missing room default should return null");
	assert(!fs.existsSync(defaultPath), "missing room default should not create default sidecar");
	assert(!fs.existsSync(sentinelSidecarPath), "missing room default must not create room_default thread sidecar");
	writePersistentAgentThread(agentId, "demo-thread", { state: "standby", origin: "home", model, items: [] });
	const emptyListing = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-files?conversationId=demo-thread`);
	assert(emptyListing.status === 200 && emptyListing.body.root === null && emptyListing.body.path === "" && Array.isArray(emptyListing.body.entries) && emptyListing.body.entries.length === 0, "workspace listing returns an empty state when no folder is configured");

	const hash = crypto.createHash("sha256").update(fs.realpathSync(workspaceRoot)).digest("hex");
	const root = { id: "root_invented", displayLabel: "Invented folder", path: workspaceRoot, realpath: fs.realpathSync(workspaceRoot), basename: path.basename(workspaceRoot), pathHash: { algorithm: "sha256", value: hash }, source: "manual", grantedAt: "2026-01-01T00:00:00.000Z" };
	const validIdentity = { version: 1, kind: "fs-stat", platform: "linux", dev: "1", ino: "2", birthtimeNs: "3" };
	const fixture = { schemaVersion: 1, policyId: "invented-policy", agentId, conversationId: "room_default", workspaceAccessMode: "localFiles", roots: [{ ...root, identity: validIdentity }], modes: { read: true, write: true }, toolSelection: { kind: "standard" }, allowedToolNames: ["read", "ls", "find", "grep", "write", "edit"], deniedRoots: [], denySegments: [], denyFilenameGlobs: [], createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
	fs.mkdirSync(path.dirname(defaultPath), { recursive: true });
	for (const identity of [validIdentity, undefined, null, { ...validIdentity, version: 2 }, { ...validIdentity, ino: "02" }, { ...validIdentity, dev: "18446744073709551616" }, { ...validIdentity, extra: true }]) {
		fs.writeFileSync(defaultPath, JSON.stringify({ ...fixture, roots: [{ ...root, ...(identity === undefined ? {} : { identity }) }] }));
		const legacyThreadFile = path.join(agentRoot, "runtime", "workspace-policies", "demo-thread.json");
		if (identity === validIdentity) {
			fs.mkdirSync(path.dirname(legacyThreadFile), { recursive: true });
			fs.writeFileSync(legacyThreadFile, JSON.stringify({ ...fixture, conversationId: "demo-thread" }));
		}
		assert(resolvePersistentRoomCapabilityPolicy(agentId, "demo-thread", { persistentAgentsRoot: tempAgentsRoot }).source === "room-default", `fixture resolves from the configured test root: ${resolvePersistentRoomCapabilityPolicy(agentId, "demo-thread", { persistentAgentsRoot: tempAgentsRoot }).source}`);
		const effective = resolvePersistentRoomEffectiveWorkspacePolicy(agentId, "demo-thread", { persistentAgentsRoot: tempAgentsRoot });
		assert(!effective.workspaceToolsEnabled && !effective.bashEnabled && persistentRoomRuntimeCwdForEffectiveWorkspacePolicy(effective, repoRoot) === repoRoot, "unqualified root grants neither file tools nor commands nor a workspace working directory");
		const view = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`);
		assert(view.status === 200 && view.body.policy?.rootCount === 1 && view.body.folderRefused === true, `configured unqualified or malformed identity remains visible and refused: ${JSON.stringify(view)}`);
		assertNoPathLeak(view.body, "GET identity", [tempHome, tempAgentsRoot, repoRoot, workspaceRoot, agentRoot], workspaceRoot);
		assert(!JSON.stringify(view.body).includes("birthtimeNs") && !JSON.stringify(view.body).includes("fs-stat"), "identity never appears in the view");
		const files = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-files?conversationId=demo-thread`);
		assert(files.status >= 400 && !files.body?.entries, "configured refused root is not an empty listing");
		const before = fs.readFileSync(defaultPath, "utf8");
		const failed = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: workspaceRoot }) });
		assert(failed.status >= 400 && fs.readFileSync(defaultPath, "utf8") === before, "unqualified explicit selection refuses without modifying policy");
		const rewritten = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`, { method: "PUT", body: JSON.stringify({}) });
		assert(rewritten.status === 200, "settings-only rewrite retains configured policy");
		const stored = JSON.parse(fs.readFileSync(defaultPath, "utf8"));
		if (identity === validIdentity) {
			assert(JSON.stringify(stored.roots[0].identity) === JSON.stringify(validIdentity), "valid identity survives rewrite exactly");
			const legacy = JSON.parse(fs.readFileSync(legacyThreadFile, "utf8"));
			assert(legacy.access === "localFiles" && legacy.workspaceAccessMode === "bounded" && JSON.stringify(legacy.roots[0].identity) === JSON.stringify(validIdentity), "older-app conversation rewrite preserves identity exactly");
		}
		else assert(stored.roots[0].identity === null, "invalid or absent evidence remains unusable on rewrite");
		const after = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`);
		assert(after.body.folderRefused === true, "rewrite does not refresh identity or make grant usable");
	}
	fs.writeFileSync(defaultPath, "{broken");
	const broken = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`);
	assert(broken.status >= 400, "undecodable storage is distinct from absent policy");
	const brokenListing = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-files?conversationId=demo-thread`);
	assert(brokenListing.status >= 400 && !brokenListing.body?.entries, "undecodable storage does not manufacture an empty listing");
	fs.writeFileSync(defaultPath, JSON.stringify(fixture));
	await stopSmokeServer(server);
	server = spawn("npx", ["tsx", "src/index.ts"], {
		shell: process.platform === "win32", ...SMOKE_SERVER_SPAWN_TREE_OPTIONS, cwd: webServerDir,
		env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome, PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXETA_PERSISTENT_AGENTS_ROOT: tempAgentsRoot },
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitForServer(server, baseUrl, 15000);
	const restarted = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`);
	assert(restarted.status === 200 && restarted.body.policy?.rootCount === 1 && restarted.body.folderRefused === true, "restart retains and refuses an unqualified identity");
	assert(!JSON.stringify(restarted.body).includes("birthtimeNs"), "restart view keeps identity private");
	assert(JSON.stringify(JSON.parse(fs.readFileSync(defaultPath, "utf8")).roots[0].identity) === JSON.stringify(validIdentity), "restart does not refresh the stored identity");
	assert(!serverOutput.join("").includes("birthtimeNs") && !serverOutput.join("").includes("fs-stat"), "server logs do not expose private identity");
	console.log("workspace grant identity refusal smoke passed");
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempHome, { recursive: true, force: true });
	fs.rmSync(tempAgentsRoot, { recursive: true, force: true });
}
