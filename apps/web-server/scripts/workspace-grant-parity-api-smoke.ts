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

	fs.writeFileSync(path.join(workspaceRoot, "invented.txt"), "invented");
	const save = (root: string) => requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`, { method: "PUT", body: JSON.stringify({ root }) });
	const listing = () => requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-files?conversationId=demo-thread`);
	const selected = await save(workspaceRoot);
	assert(selected.status === 200, `valid folder selection succeeds: ${selected.status} ${JSON.stringify(selected.body)}`);
	assertNoPathLeak(selected.body, "PUT selected default", [tempHome, tempAgentsRoot, repoRoot, workspaceRoot, agentRoot], workspaceRoot);
	const raw = JSON.parse(fs.readFileSync(defaultPath, "utf8"));
	assert(raw.roots[0].pathHash.value === crypto.createHash("sha256").update(fs.realpathSync(workspaceRoot)).digest("hex") && !("identity" in raw.roots[0]), "selection stores the upstream path-only grant");
	let visible = await listing();
	assert(visible.status === 200 && visible.body.entries.some((item: { name: string }) => item.name === "invented.txt"), "selected folder lists through the guarded route");
	const textPreview = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-preview?conversationId=demo-thread&path=invented.txt`);
	assert(textPreview.status === 200 && textPreview.body.kind === "text" && textPreview.body.text === "invented", "selected path-only grant reads through the guarded preview route");
	if (process.platform === "linux") {
		const name = "lesson 1: draft.txt";
		fs.writeFileSync(path.join(workspaceRoot, name), "invented colon name");
		const colonPreview = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-preview?conversationId=demo-thread&path=${encodeURIComponent(name)}`);
		assert(colonPreview.status === 200 && colonPreview.body.text === "invented colon name", "a non-URI POSIX filename containing a colon is readable through the guarded route");
		const directory = "unit 1: draft";
		fs.mkdirSync(path.join(workspaceRoot, directory));
		fs.writeFileSync(path.join(workspaceRoot, directory, "invented.txt"), "invented");
		const colonListing = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-files?conversationId=demo-thread&path=${encodeURIComponent(directory)}`);
		assert(colonListing.status === 200 && colonListing.body.entries.some((entry: { name: string }) => entry.name === "invented.txt"), "a non-URI POSIX directory containing a colon is listed through the guarded route");
		for (const route of ["workspace-files", "workspace-image", "workspace-preview"]) {
			const uri = await requestJson(`/api/persistent-agents/${encodedAgentId}/${route}?conversationId=demo-thread&path=${encodeURIComponent("file:invented.txt")}`);
			assert(uri.status === 400 && uri.body.code === "invalid_path", `${route} must still refuse URI paths`);
		}
	}
	const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64");
	fs.writeFileSync(path.join(workspaceRoot, "invented.png"), image);
	const imageResponse = await authedFetch(`${baseUrl}/api/persistent-agents/${encodedAgentId}/workspace-image?conversationId=demo-thread&path=invented.png`);
	assert(imageResponse.status === 200 && Buffer.from(await imageResponse.arrayBuffer()).equals(image), "selected path-only grant reads the guarded image route");
	if (process.platform === "linux") {
		const name = "image 1: draft.png";
		fs.writeFileSync(path.join(workspaceRoot, name), image);
		const colonImage = await authedFetch(`${baseUrl}/api/persistent-agents/${encodedAgentId}/workspace-image?conversationId=demo-thread&path=${encodeURIComponent(name)}`);
		assert(colonImage.status === 200 && Buffer.from(await colonImage.arrayBuffer()).equals(image), "a non-URI POSIX image name containing a colon is readable through the guarded route");
	}
	raw.roots[0].unfamiliar = { future: true };
	fs.writeFileSync(defaultPath, JSON.stringify(raw));
	const legacy = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`);
	assert(legacy.status === 200 && legacy.body.policy?.rootCount === 1 && !JSON.stringify(legacy.body).includes("unfamiliar"), "upstream normalization ignores unknown grant fields");
	assertNoPathLeak(legacy.body, "GET path-only default", [tempHome, tempAgentsRoot, repoRoot, workspaceRoot, agentRoot], workspaceRoot);
	visible = await listing();
	assert(visible.status === 200 && visible.body.entries.some((item: { name: string }) => item.name === "invented.txt"), "older path-only grant lists through the guarded route");
	if (process.platform !== "win32") {
		const alias = path.join(tempHome, "invented-alias");
		fs.symlinkSync(workspaceRoot, alias, "dir");
		const pickedAlias = await save(alias);
		assert(pickedAlias.status === 200, `upstream accepts an eligible folder alias: ${pickedAlias.status}`);
		const aliasRaw = JSON.parse(fs.readFileSync(defaultPath, "utf8"));
		assert(aliasRaw.roots[0].path === alias && aliasRaw.roots[0].realpath === fs.realpathSync(workspaceRoot), "alias preserves selected and canonical paths");
		visible = await listing();
		assert(visible.status === 200 && visible.body.entries.some((item: { name: string }) => item.name === "invented.txt"), "eligible alias lists through the guarded route");
	}
	fs.writeFileSync(defaultPath, "{broken");
	const undecodable = await requestJson(`/api/persistent-agents/${encodedAgentId}/workspace-default`);
	assert(undecodable.status === 200 && undecodable.body.policy === null, "upstream treats an undecodable policy as absent");
	console.log("workspace upstream grant parity smoke passed");
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempHome, { recursive: true, force: true });
	fs.rmSync(tempAgentsRoot, { recursive: true, force: true });
}
