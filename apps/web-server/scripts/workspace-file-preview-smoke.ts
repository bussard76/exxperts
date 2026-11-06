// The preview route rejects invalid requests with safe, inert responses.
// Offline: the room's model is never asked. Throwaway HOME.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authedFetch, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webServerDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-file-tabs-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

const folder = path.join(tempHome, "Projects", "archive");
fs.mkdirSync(folder, { recursive: true });

// A provider at an address nobody answers: the room only has to open, never answer.
fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({
	providers: { "fake-claude": { name: "Fake Claude", baseUrl: "http://127.0.0.1:9", api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] } },
}, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [
	{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" },
] }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }, null, 2), { mode: 0o600 });

const waitUntil = waitEvery(150, 20_000);

async function api(pathname: string, init: AuthedFetchInit = {}): Promise<{ status: number; body: any }> {
	const response = await authedFetch(`${baseUrl}${pathname}`, { ...init, headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers } });
	const text = await response.text();
	return { status: response.status, body: text ? JSON.parse(text) : null };
}

let server: ChildProcessWithoutNullStreams | undefined;
const serverOutput: string[] = [];
try {
	server = spawn("npx", ["tsx", "src/index.ts"], {
		shell: process.platform === "win32",
		...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
		cwd: webServerDir,
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready", 60_000);

	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Archive", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, `the room is created, got ${created.status}`);
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, `the folder is saved, got ${saved.status} ${JSON.stringify(saved.body)}`);

	const response = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview`);
	assert(response.status === 400, `missing query is rejected, got ${response.status}`);
	assert(response.headers.get("cache-control") === "no-store", "errors cannot be cached");
	assert(response.headers.get("x-content-type-options") === "nosniff", "errors cannot be sniffed");
	assert(response.headers.get("content-security-policy") === "sandbox; default-src 'none'", "direct navigation remains inert");
	assert(JSON.stringify(await response.json()) === JSON.stringify({ code: "invalid_request", error: "Choose a valid workspace file to preview." }), "error uses the approved safe response");
	const missingConversation = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=missing-demo&path=book.xlsx`);
	assert(missingConversation.status === 404, "a nonexistent conversation cannot fall back to the room workspace");
	assert((await missingConversation.json()).code === "conversation_not_found", "missing conversation has the approved error code");
	const seeded = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/threads/demo-thread`, { method: "PUT", body: JSON.stringify({ state: "active", origin: "launcher", model: { provider: "fake-claude", model: "claude-fake" }, items: [] }) });
	assert(seeded.status === 200, `demo conversation exists, got ${seeded.status}`);
	const configured = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "custom", allowedToolNames: [] }, bashEnabled: false }) });
	assert(configured.status === 200, "workspace read can be disabled");
	const forbidden = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=book.xlsx`);
	assert(forbidden.status === 403 && (await forbidden.json()).code === "workspace_read_forbidden", "preview respects current workspace read permission");
	const restored = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "standard" } }) });
	assert(restored.status === 200, "workspace read restored");
	for (const file of ["../secret.xlsx", "/absolute.xlsx", "C:drive.xlsx", ".hidden.xlsx", "folder//book.xlsx"]) {
		const query = new URLSearchParams({ conversationId: "demo-thread", path: file });
		const invalid = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${query}`);
		assert(invalid.status === 400 && (await invalid.json()).code === "invalid_path", `invalid path rejected: ${file}`);
	}

	console.log("workspace-file-preview smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-4000));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
