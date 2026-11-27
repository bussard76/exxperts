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

const { registerServerHooks } = await import("../src/server-hooks.js");
registerServerHooks({ roomFilesAreTheFolder: () => true });
const { app } = await import("../src/server-app.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { persistentRoomShelfDirPath } = await import("../src/persistent-room-shelf.js");
try {
	const room = createPersistentAgentFromScaffoldInput({ displayName: "Invented Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
	writePersistentAgentThread(room, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const shelf = persistentRoomShelfDirPath(room);
	fs.mkdirSync(shelf, { recursive: true });
	fs.writeFileSync(path.join(shelf, "example.txt"), "invented");
	fs.writeFileSync(path.join(shelf, ".internal"), "hidden");
	const list = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-files?conversationId=invented-thread`, headers: SMOKE_AUTH_HEADERS });
	if (list.statusCode !== 200 || list.json().entries.length !== 1 || list.json().entries[0].name !== "example.txt") throw new Error(`shared shelf listing must show only the permitted file: ${list.statusCode} ${list.body}`);
	const other = createPersistentAgentFromScaffoldInput({ displayName: "Other Invented Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
	writePersistentAgentThread(other, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const empty = await app.inject({ method: "GET", url: `/api/persistent-agents/${other}/workspace-files?conversationId=invented-thread`, headers: SMOKE_AUTH_HEADERS });
	if (empty.statusCode !== 200 || empty.json().entries.length !== 0 || empty.body.includes("example.txt")) throw new Error("an empty room cannot list another room's shelf");
	const missing = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-files?conversationId=missing-thread`, headers: SMOKE_AUTH_HEADERS });
	if (missing.statusCode !== 404 || missing.body.includes("example.txt")) throw new Error("a missing conversation cannot list the shelf");
	const nested = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-files?conversationId=invented-thread&path=folder%2Fchild`, headers: SMOKE_AUTH_HEADERS });
	if (nested.statusCode < 400) throw new Error("shared shelf does not allow nested paths");
	console.log("workspace shared shelf listing smoke passed");
} finally {
	await app.close();
	fs.rmSync(home, { recursive: true, force: true });
}
