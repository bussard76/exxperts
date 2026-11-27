import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
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

const { app, PORT } = await import("../src/server-app.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { registerServerHooks } = await import("../src/server-hooks.js");
const { classifyRemoteRoute } = await import("../src/remote-route-policy.js");
try {
	for (const route of ["workspace-files", "workspace-preview", "workspace-image"]) {
		if (classifyRemoteRoute("GET", `/api/persistent-agents/:id/${route}`) !== "read") throw new Error(`${route} must use the existing remote read protection`);
	}
	if (classifyRemoteRoute("POST", "/api/persistent-agents/:id/workspace-open") !== "local") throw new Error("open must remain computer-local");
	const room = createPersistentAgentFromScaffoldInput({ displayName: "Invented Open Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
	writePersistentAgentThread(room, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const headers = { ...SMOKE_AUTH_HEADERS, host: `127.0.0.1:${PORT}`, origin: `http://127.0.0.1:${PORT}`, "x-exxperts-local-action": "open-workspace-file" };
	const body = { conversationId: "invented-thread", path: "invented.txt" };
	const call = (h: Record<string, string>, payload: Record<string, unknown> = body) => app.inject({ method: "POST", url: `/api/persistent-agents/${room}/workspace-open`, headers: h, payload });
	const wrongOrigin = await call({ ...headers, origin: "http://example.invalid" });
	if (wrongOrigin.statusCode !== 403 || !["local_action_forbidden", "local_request_required"].includes(wrongOrigin.json().code)) throw new Error(`wrong origin must be refused: ${wrongOrigin.statusCode} ${wrongOrigin.body}`);
	const proxied = await call({ ...headers, "x-forwarded-for": "127.0.0.1" });
	if (proxied.statusCode !== 403 || !["local_action_forbidden", "reverse_proxy_unsupported"].includes(proxied.json().code)) throw new Error(`proxy headers must be refused: ${proxied.statusCode} ${proxied.body}`);
	const noIntent = await call({ ...SMOKE_AUTH_HEADERS, host: headers.host, origin: headers.origin });
	if (noIntent.statusCode !== 403 || noIntent.json().code !== "local_action_forbidden") throw new Error("missing intent must be refused");
	const wrongHost = await call({ ...headers, host: "example.invalid:8787" });
	if (wrongHost.statusCode < 400 || wrongHost.body.includes('"accepted":true')) throw new Error("unapproved host must be refused");
	const duplicateOrigin = await app.inject({ method: "POST", url: `/api/persistent-agents/${room}/workspace-open`, headers: { ...headers, origin: [headers.origin, headers.origin] } as any, payload: body });
	if (duplicateOrigin.statusCode < 400 || duplicateOrigin.body.includes('"accepted":true')) throw new Error("duplicate origin must be refused");
	const invalid = await call(headers, { ...body, extra: true });
	if (invalid.statusCode !== 400 || invalid.json().code !== "invalid_request") throw new Error("extra body fields must be refused");
	const pathRefusal = await call(headers, { ...body, path: "../invented.txt" });
	if (pathRefusal.statusCode !== 400 || pathRefusal.json().code !== "invalid_path") throw new Error("unsafe paths must be refused");
	const absent = await call(headers);
	if (absent.statusCode !== 404 || absent.json().code !== "workspace_not_found") throw new Error("an absent selection must be refused");
	const hash = crypto.createHash("sha256").update(fs.realpathSync(folder)).digest("hex");
	const root = { id: "invented", displayLabel: "Invented", path: folder, realpath: fs.realpathSync(folder), basename: path.basename(folder), pathHash: { algorithm: "sha256", value: hash }, source: "manual", grantedAt: "2026-01-01T00:00:00.000Z" };
	const policy = { schemaVersion: 1, policyId: "invented-policy", agentId: room, conversationId: "room_default", workspaceAccessMode: "localFiles", roots: [root], modes: { read: true, write: true }, toolSelection: { kind: "standard" }, allowedToolNames: ["read", "ls", "find", "grep", "write", "edit"], deniedRoots: [], denySegments: [], denyFilenameGlobs: [], createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
	const policyFile = path.join(home, "agents", room, "runtime", "workspace-default.json");
	fs.mkdirSync(path.dirname(policyFile), { recursive: true });
	fs.writeFileSync(policyFile, JSON.stringify(policy));
	const unverified = await call(headers);
	if (unverified.statusCode !== 403 || unverified.json().code !== "association_unverified" || unverified.body.includes('"accepted":true')) throw new Error("a path-only grant cannot dispatch an unverified association");
	registerServerHooks({});
	const shared = await call(headers);
	if (shared.statusCode !== 403 || shared.json().code !== "local_action_forbidden") throw new Error("shared servers cannot invoke a local handoff");
	console.log("workspace open refusal smoke passed");
} finally {
	await app.close();
	fs.rmSync(home, { recursive: true, force: true });
}
