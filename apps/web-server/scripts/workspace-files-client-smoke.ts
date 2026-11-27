import assert from "node:assert/strict";
import { listWorkspaceFiles } from "../../web-ui/src/workspace-files-api.js";

const originalFetch = globalThis.fetch;
const entry = (name: string) => ({ name, relativePath: name, kind: "file", bytes: 8, modifiedAt: "2026-01-01T00:00:00.000Z", extension: ".txt" });
let name = "lesson 1: draft.txt";
globalThis.fetch = (async () => new Response(JSON.stringify({ agentId: "invented-room", conversationId: "invented-thread", root: { displayLabel: "Invented", basename: "invented" }, path: "", entries: [entry(name)] }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
try {
	const listing = await listWorkspaceFiles("invented-room", "invented-thread");
	assert.equal(listing.entries[0].relativePath, "lesson 1: draft.txt");
	name = "file:invented.txt";
	await assert.rejects(listWorkspaceFiles("invented-room", "invented-thread"), /Invalid workspace listing/);
	console.log("workspace file client path validation passed");
} finally { globalThis.fetch = originalFetch; }
