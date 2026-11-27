import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authedFetch, freePort, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, stopSmokeServer, waitForServer } from "./smoke-server-process.js";

const home = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-box-refusal-"));
const agents = path.join(home, "agents");
const folder = path.join(home, "invented-folder");
fs.mkdirSync(folder);
fs.writeFileSync(path.join(folder, "invented.txt"), "not for an unbound route");
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.EXXETA_PERSISTENT_AGENTS_ROOT = agents;
const appDir = path.join(home, ".exxperts", "app");
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, "openai-compatible-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible", providerId: "openai-compatible", label: "Synthetic Gateway", roomModels: [{ modelId: "invented" }], maintenanceModel: "invented" }));
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible" }));
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const server = spawn("npx", ["tsx", "src/index.ts"], {
	...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
	cwd: path.join(repo, "apps/web-server"),
	env: { ...process.env, PORT: String(port), EXXETA_HOME: repo, EXXPERTS_TEST_INTROSPECTION: "1", EXXPERTS_TEST_SHELL_PLATFORM: "darwin", ...SMOKE_SERVER_AUTH_ENV },
});
const output: string[] = [];
server.stdout.on("data", (chunk) => output.push(String(chunk)));
server.stderr.on("data", (chunk) => output.push(String(chunk)));
try {
	await waitForServer(server, base, 15000);
	const request = async (url: string, init: { method?: string; body?: string } = {}) => {
		const response = await authedFetch(base + url, { ...init, headers: { "content-type": "application/json" } });
		return { status: response.status, body: await response.json() as any };
	};
	const created = await request("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Invented Room", userName: "Example", preferredUserAddress: "Example" }) });
	if (created.status !== 201) throw new Error(`create room: ${created.status}`);
	const id = created.body.agent.agentId;
	const { writePersistentAgentThread } = await import("../src/persistent-agents.js");
	writePersistentAgentThread(id, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const configured = await request(`/api/persistent-agents/${id}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, displayLabel: "Invented", mode: "read-only" }) });
	if (configured.status !== 200) throw new Error(`configure room: ${configured.status} ${JSON.stringify(configured.body)}`);
	const listed = await request(`/api/persistent-agents/${id}/workspace-files?conversationId=invented-thread`);
	if (listed.status !== 503 || listed.body.code !== "box_failed" || JSON.stringify(listed.body).includes("invented.txt")) throw new Error(`unbound Mac must refuse: ${JSON.stringify(listed)}`);
	console.log("unbound Mac listing refused without data");
} catch (error) {
	console.error(output.join(""));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(home, { recursive: true, force: true });
}
