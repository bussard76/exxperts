import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as XLSX from "xlsx";
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
	const preview = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=example.txt`, headers: SMOKE_AUTH_HEADERS });
	if (preview.statusCode !== 200 || preview.json().kind !== "text" || preview.json().text !== "invented" || preview.json().agentId !== room) throw new Error(`shared text preview failed: ${preview.statusCode} ${preview.body}`);
	if (preview.headers["cache-control"] !== "no-store" || preview.headers["x-content-type-options"] !== "nosniff" || preview.headers["content-security-policy"] !== "sandbox; default-src 'none'") throw new Error("text preview must retain its security headers");
	const refused = await app.inject({ method: "GET", url: `/api/persistent-agents/${other}/workspace-preview?conversationId=invented-thread&path=example.txt`, headers: SMOKE_AUTH_HEADERS });
	if (refused.statusCode < 400 || refused.body.includes("invented\"")) throw new Error("a different room cannot preview the file");
	const unsupported = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=sketch.excalidraw`, headers: SMOKE_AUTH_HEADERS });
	if (unsupported.statusCode !== 415 || unsupported.json().code !== "unsupported_file_type") throw new Error("unsupported preview retains the specified response");
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Invented cell"]]), "Example");
	fs.writeFileSync(path.join(shelf, "book.xlsx"), XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
	const spreadsheet = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=book.xlsx`, headers: SMOKE_AUTH_HEADERS });
	if (spreadsheet.statusCode !== 200 || spreadsheet.json().kind !== "spreadsheet" || spreadsheet.json().workbook?.sheets?.[0]?.cells?.[0]?.text !== "Invented cell") throw new Error(`shared workbook preview failed: ${spreadsheet.statusCode} ${spreadsheet.body}`);
	fs.writeFileSync(path.join(shelf, "encoded.txt"), Buffer.from([0x66, 0x80, 0x6f]));
	const encoded = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=encoded.txt`, headers: SMOKE_AUTH_HEADERS });
	if (encoded.statusCode !== 200 || encoded.json().text !== "f\ufffdo") throw new Error("text preview decodes invalid UTF-8 with replacement");
	const largeFile = fs.openSync(path.join(shelf, "large.txt"), "w");
	try { fs.ftruncateSync(largeFile, 16_777_217); } finally { fs.closeSync(largeFile); }
	const large = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=large.txt`, headers: SMOKE_AUTH_HEADERS });
	if (large.statusCode !== 413 || large.json().code !== "file_too_large") throw new Error("text preview refuses a file over its bound");
	console.log("workspace shared shelf listing smoke passed");
} finally {
	await app.close();
	fs.rmSync(home, { recursive: true, force: true });
}
