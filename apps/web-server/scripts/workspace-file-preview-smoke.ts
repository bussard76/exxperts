// The preview route rejects invalid requests with safe, inert responses.
// Offline: the room's model is never asked. Throwaway HOME.
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authedFetch, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";
import { smallDocx } from "./workspace-preview-fixtures.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webServerDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-file-tabs-"));
const malformedChild = process.argv.includes("--malformed-child");
const admissionChild = process.argv.includes("--admission-child");
const timeoutChild = process.argv.includes("--timeout-child");
const extraChild = process.argv.includes("--extra-child");
const crashChild = process.argv.includes("--crash-child");
const exitRaceChild = process.argv.includes("--exit-race-child");
const revokeChild = process.argv.includes("--revoke-child");
const replaceChild = process.argv.includes("--replace-child");
const badWordChild = process.argv.includes("--bad-word-child");
const networkChild = process.argv.includes("--network-child");
const fakeChild = malformedChild || admissionChild || timeoutChild || extraChild || crashChild || exitRaceChild || revokeChild || replaceChild || badWordChild || networkChild;
const spawnMarker = path.join(tempRoot, "preview-spawns");
const releaseMarker = path.join(tempRoot, "preview-release");
const networkMarker = path.join(tempRoot, "network-probes");
let validJpeg = "";
if (revokeChild || replaceChild) {
	const { createCanvas } = await import("@napi-rs/canvas");
	validJpeg = createCanvas(1, 1).toBuffer("image/jpeg", 82).toString("base64");
}
const preload = path.join(tempRoot, "fake-preview-child.cjs");
if (fakeChild) fs.writeFileSync(preload, `
const childProcess = require("node:child_process");
const { EventEmitter } = require("node:events");
const { syncBuiltinESMExports } = require("node:module");
const original = childProcess.fork;
const fs = require("node:fs");
let count = 0;
childProcess.fork = function(file, args, options) {
  if (${networkChild} || !String(file).endsWith("shelf-parse-worker.mjs") || !String(args[0]).includes("workspace-preview-v1")) return original.apply(this, arguments);
  if (${badWordChild} && JSON.parse(args[0]).kind !== "word") return original.apply(this, arguments);
  const child = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => { setImmediate(() => child.emit("close", 0, null)); return true; };
  count++;
  fs.appendFileSync(${JSON.stringify(spawnMarker)}, "x");
  if (${malformedChild}) setImmediate(() => child.emit("message", { ok: true, schemaVersion: 1, notices: [], result: { kind: "pdf", totalPages: 1, pages: [{ page: 1, mimeType: "image/jpeg", imageBase64: "AAAA", widthPx: 1, heightPx: 1 }] } }));
  else if (${crashChild}) setImmediate(() => { child.emit("exit", 1, null); child.emit("close", 1, null); });
  else if (${exitRaceChild}) setImmediate(() => { child.emit("exit", 0, null); setTimeout(() => child.emit("message", { ok: false, schemaVersion: 1, code: "renderer_unavailable" }), 20); });
  else if (${badWordChild}) setImmediate(() => child.emit("message", { ok: true, schemaVersion: 1, notices: [], result: { kind: "word", html: '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content=""><img src="https://example.invalid/attack"></head><body></body></html>' } }));
  else if (${revokeChild || replaceChild}) {
    const timer = setInterval(() => {
      if (!fs.existsSync(${JSON.stringify(releaseMarker)})) return;
      clearInterval(timer);
      child.emit("message", { ok: true, schemaVersion: 1, notices: [], result: { kind: "pdf", totalPages: 1, pages: [{ page: 1, mimeType: "image/jpeg", imageBase64: ${JSON.stringify(validJpeg)}, widthPx: 1, heightPx: 1 }] } });
    }, 10);
  }
  else if (${extraChild}) setImmediate(() => child.emit("message", { ok: false, schemaVersion: 1, code: "renderer_unavailable", extra: "unexpected" }));
  else if (count > (${admissionChild} ? 2 : 1)) setImmediate(() => child.emit("message", { ok: false, schemaVersion: 1, code: "renderer_unavailable" }));
  return child;
};
syncBuiltinESMExports();
if (${networkChild} && String(process.argv[1]).endsWith("shelf-parse-worker.mjs") && JSON.parse(process.argv[2]).kind === "word") {
  const install = (owner, key, label) => {
    let value = owner[key];
    Object.defineProperty(owner, key, { configurable: true, get: () => value, set: (next) => {
      let denied = false;
      try { next(); } catch { denied = true; }
      fs.appendFileSync(${JSON.stringify(networkMarker)}, label + ":control:" + denied + "\\n");
      value = function(...args) { fs.appendFileSync(${JSON.stringify(networkMarker)}, label + ":attempt\\n"); return next.apply(this, args); };
    } });
  };
  const http = require("node:http"), https = require("node:https"), net = require("node:net"), tls = require("node:tls"), dns = require("node:dns"), dgram = require("node:dgram"), http2 = require("node:http2");
  install(globalThis, "fetch", "fetch");
  install(globalThis, "WebSocket", "websocket");
  install(http, "request", "http");
  install(https, "request", "https");
  install(net, "connect", "socket");
  install(tls, "connect", "tls");
  install(dns, "lookup", "dns");
  install(dns.Resolver.prototype, "resolve4", "dns-resolver");
  install(dns.promises.Resolver.prototype, "resolve4", "dns-promise-resolver");
  install(dgram, "createSocket", "udp");
  install(http2, "connect", "http2");
}
`);
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

function onePagePdf(): Buffer {
	const stream = "BT /F1 24 Tf 40 700 Td (Invented preview) Tj ET";
	const objects = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
	];
	let body = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((object, index) => { offsets.push(body.length); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
	body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return Buffer.from(body, "latin1");
}

function multiplePagePdf(pageCount: number): Buffer {
	const objects: string[] = [];
	const kids = Array.from({ length: pageCount }, (_, index) => `${3 + index * 2} 0 R`).join(" ");
	objects.push("<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);
	for (let index = 0; index < pageCount; index++) {
		const content = "1 0 0 rg 10 10 180 80 re f";
		objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents ${4 + index * 2} 0 R >>`, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
	}
	let body = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((object, index) => { offsets.push(body.length); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
	return Buffer.from(body + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`, "latin1");
}


async function cssOnlyDocx(): Promise<Buffer> {
	const { default: JSZip } = await import("jszip");
	const zip = await JSZip.loadAsync(await smallDocx());
	let relations = await zip.file("word/_rels/document.xml.rels")!.async("string");
	relations = relations.replace(/<Relationship[^>]*TargetMode="External"\/>/g, "");
	zip.file("word/_rels/document.xml.rels", relations);
	let document = await zip.file("word/document.xml")!.async("string");
	document = document.replace(/<w:p><w:hyperlink r:id="rId2">.*?<\/w:p>/, "");
	const link = document.indexOf('r:link="rId3"');
	const first = document.lastIndexOf("<w:p>", link), last = document.indexOf("</w:p>", link);
	document = document.slice(0, first) + document.slice(last + 6);
	zip.file("word/document.xml", document);
	let styles = await zip.file("word/styles.xml")!.async("string");
	styles = styles.replace("Arial&lt;/style&gt;&lt;img src=&quot;https://example.invalid/css&quot;&gt;", "Arial; background: u\\72l(https://example.invalid/css)");
	zip.file("word/styles.xml", styles);
	return zip.generateAsync({ type: "nodebuffer" });
}

async function streamedDocx(): Promise<Buffer> {
	const { default: JSZip } = await import("jszip");
	const zip = await JSZip.loadAsync(await smallDocx());
	return zip.generateAsync({ type: "nodebuffer", streamFiles: true });
}

async function conflictingZipDocx(): Promise<Buffer> {
	const bytes = Buffer.from(await smallDocx());
	bytes.writeUInt32LE(bytes.readUInt32LE(18) + 1, 18);
	return bytes;
}

async function wrongImageTypeDocx(): Promise<Buffer> {
	const { default: JSZip } = await import("jszip");
	const zip = await JSZip.loadAsync(await smallDocx());
	zip.file("word/media/pixel.png", Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64"));
	return zip.generateAsync({ type: "nodebuffer" });
}

async function tooManyElementsDocx(): Promise<Buffer> {
	const { default: JSZip } = await import("jszip");
	const zip = await JSZip.loadAsync(await smallDocx());
	zip.file("word/custom.xml", `<root>${"<x/>".repeat(200_001)}</root>`);
	return zip.generateAsync({ type: "nodebuffer" });
}

async function oversizedTextDocx(): Promise<Buffer> {
	const { default: JSZip } = await import("jszip");
	const zip = await JSZip.loadAsync(await smallDocx());
	const document = await zip.file("word/document.xml")!.async("string");
	zip.file("word/document.xml", document.replace("</w:body>", `<w:p><w:r><w:t>${"x".repeat(16_777_217)}</w:t></w:r></w:p></w:body>`));
	return zip.generateAsync({ type: "nodebuffer" });
}

async function oversizedExpansionDocx(): Promise<Buffer> {
	const { default: JSZip } = await import("jszip");
	const zip = new JSZip();
	zip.file("word/document.xml", "x".repeat(1_000_000));
	return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

const folder = path.join(tempHome, "Projects", "archive");
fs.mkdirSync(folder, { recursive: true });
fs.writeFileSync(path.join(folder, "book.xlsx"), "invented");
fs.writeFileSync(path.join(folder, "report.docx"), await smallDocx());
fs.writeFileSync(path.join(folder, "streamed.docx"), await streamedDocx());
fs.writeFileSync(path.join(folder, "css-only.docx"), await cssOnlyDocx());
fs.writeFileSync(path.join(folder, "conflicting.docx"), await conflictingZipDocx());
fs.writeFileSync(path.join(folder, "wrong-image.docx"), await wrongImageTypeDocx());
fs.writeFileSync(path.join(folder, "expansion.docx"), await oversizedExpansionDocx());
fs.writeFileSync(path.join(folder, "elements.docx"), await tooManyElementsDocx());
if (!fakeChild) fs.writeFileSync(path.join(folder, "oversized-text.docx"), await oversizedTextDocx());
fs.writeFileSync(path.join(folder, "report.pdf"), onePagePdf());
fs.writeFileSync(path.join(folder, "pages.pdf"), multiplePagePdf(9));
fs.writeFileSync(path.join(folder, "too-many.pdf"), multiplePagePdf(201));
fs.writeFileSync(path.join(folder, "broken.pdf"), "invented broken data");
fs.writeFileSync(path.join(folder, "oversize.pdf"), "%PDF-");
fs.truncateSync(path.join(folder, "oversize.pdf"), 26_214_401);
fs.writeFileSync(path.join(folder, "old.doc"), "invented");
fs.writeFileSync(path.join(folder, "notes.txt"), "invented");
fs.symlinkSync(path.join(folder, "book.xlsx"), path.join(folder, "link.xlsx"));
fs.mkdirSync(path.join(folder, "directory.xlsx"));

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
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot, ...(fakeChild ? { NODE_OPTIONS: `--require=${preload}` } : {}) }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready", 60_000);

	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Archive", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, `the room is created, got ${created.status}`);
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, `the folder is saved, got ${saved.status} ${JSON.stringify(saved.body)}`);
	const invalidOpen = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-open`, { method: "POST", headers: { origin: baseUrl, "x-exxperts-local-action": "open-workspace-file" }, body: JSON.stringify({}) });
	assert(invalidOpen.status === 400 && invalidOpen.body.code === "invalid_request" && invalidOpen.body.error === "This file could not be opened in another program.", "local open rejects an invalid request with the approved safe response");
	for (const headers of [
		{ "x-exxperts-local-action": "open-workspace-file" },
		{ origin: "null", "x-exxperts-local-action": "open-workspace-file" },
		{ origin: "http://localhost:9123", "x-exxperts-local-action": "open-workspace-file" },
		{ origin: baseUrl },
		{ origin: baseUrl, "x-exxperts-local-action": "incorrect" },
	] as Record<string, string>[]) {
		const refused = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-open`, { method: "POST", headers, body: JSON.stringify({ conversationId: "demo-thread", path: "report.pdf" }) });
		assert(refused.status === 403, "local open requires its exact local origin and intent");
	}

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
	const openRequest = (body: unknown) => api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-open`, { method: "POST", headers: { origin: baseUrl, "x-exxperts-local-action": "open-workspace-file" }, body: JSON.stringify(body) });
	for (const [body, status, code] of [
		[{ conversationId: "demo-thread", path: "report.pdf", extra: true }, 400, "invalid_request"],
		[{ conversationId: "demo-thread", path: "../report.pdf" }, 400, "invalid_path"],
		[{ conversationId: "missing-demo", path: "report.pdf" }, 404, "conversation_not_found"],
		[{ conversationId: "demo-thread", path: "absent.xlsx" }, 404, "file_not_found"],
		[{ conversationId: "demo-thread", path: "link.xlsx" }, 403, "blocked_by_policy"],
		[{ conversationId: "demo-thread", path: "old.doc" }, 415, "unsupported_file_type"],
	] as const) {
		const refused = await openRequest(body);
		assert(refused.status === status && refused.body.code === code && refused.body.error === "This file could not be opened in another program.", `local open rejects ${code} safely`);
	}
	for (const file of ["../secret.xlsx", "/absolute.xlsx", "C:drive.xlsx", ".hidden.xlsx", "folder//book.xlsx"]) {
		const query = new URLSearchParams({ conversationId: "demo-thread", path: file });
		const invalid = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?${query}`);
		assert(invalid.status === 400 && (await invalid.json()).code === "invalid_path", `invalid path rejected: ${file}`);
	}

	const absent = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=absent.xlsx`);
	assert(absent.status === 404 && (await absent.json()).code === "file_not_found", "preview requires an existing guarded file");
	const link = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=link.xlsx`);
	assert(link.status === 403, "preview refuses a symlink as a policy restriction");
	const directory = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=directory.xlsx`);
	assert(directory.status === 400 && (await directory.json()).code === "not_file", "preview refuses a directory");
	const oldWord = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=old.doc`);
	assert(oldWord.status === 415 && (await oldWord.json()).code === "legacy_doc", "old Word files receive the approved error");
	const unsupported = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=notes.txt`);
	assert(unsupported.status === 415 && (await unsupported.json()).code === "unsupported_file_type", "unapproved types receive a controlled refusal");
	const pdfUrl = `${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=report.pdf`;
	if (admissionChild) {
		const first = new AbortController();
		const second = new AbortController();
		const pending = [authedFetch(pdfUrl, { signal: first.signal }).catch(() => null), authedFetch(pdfUrl, { signal: second.signal }).catch(() => null)];
		await waitUntil(() => fs.existsSync(spawnMarker) && fs.readFileSync(spawnMarker, "utf8").length === 2, "two preview children start");
		const busy = await authedFetch(pdfUrl);
		assert(busy.status === 503 && (await busy.json()).code === "preview_busy", "the third preview is refused without another child");
		first.abort(); second.abort();
		await Promise.all(pending);
		await waitUntil(async () => {
			const response = await authedFetch(pdfUrl);
			return response.status === 503 && (await response.json()).code === "renderer_unavailable";
		}, "aborted previews release their slots");
	} else if (revokeChild || replaceChild) {
		const pending = authedFetch(pdfUrl);
		await waitUntil(() => fs.existsSync(spawnMarker), "preview child starts before policy or file changes");
		if (revokeChild) {
			const revoked = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "custom", allowedToolNames: [] }, bashEnabled: false }) });
			assert(revoked.status === 200, "workspace read was revoked during rendering");
		} else fs.appendFileSync(path.join(folder, "report.pdf"), "changed");
		fs.writeFileSync(releaseMarker, "release");
		const response = await pending;
		const body = await response.json();
		assert(revokeChild ? response.status === 403 && body.code === "workspace_read_forbidden" : response.status === 409 && body.code === "file_changed", "stale preview cannot be returned after a policy or file change");
	} else if (crashChild || exitRaceChild) {
		const response = await authedFetch(pdfUrl);
		const body = await response.json();
		assert(crashChild ? response.status === 500 && body.code === "preview_failed" : response.status === 503 && body.code === "renderer_unavailable", "child exit and IPC are settled correctly");
	} else if (timeoutChild) {
		const timeout = await authedFetch(pdfUrl);
		assert(timeout.status === 504 && (await timeout.json()).code === "preview_timeout", "the worker deadline returns a timeout");
		const after = await authedFetch(pdfUrl);
		assert(after.status === 503 && (await after.json()).code === "renderer_unavailable", "the timed-out worker releases its slot");
	} else {
	const pdf = await authedFetch(pdfUrl);
	if (malformedChild || extraChild) {
		assert(pdf.status === 500 && (await pdf.json()).code === "preview_failed", "a malformed child envelope cannot become a successful preview");
	} else {
	assert(pdf.status === 200, `invented PDF is previewed, got ${pdf.status}`);
	const pdfBody = await pdf.json();
	assert(pdfBody.kind === "pdf" && pdfBody.totalPages === 1 && pdfBody.pages.length === 1, "every PDF page is returned");
	assert(pdfBody.pages[0].mimeType === "image/jpeg" && pdfBody.pages[0].widthPx > 0 && pdfBody.pages[0].heightPx > 0 && pdfBody.pages[0].imageBase64.length > 0, "the page is a raster image with dimensions");
	const canvasApi = await import("@napi-rs/canvas");
	const textPage = await canvasApi.loadImage(Buffer.from(pdfBody.pages[0].imageBase64, "base64"));
	const textCanvas = canvasApi.createCanvas(textPage.width, textPage.height);
	const textContext = textCanvas.getContext("2d");
	textContext.drawImage(textPage, 0, 0);
	const textPixels = textContext.getImageData(0, 0, textPage.width, textPage.height).data;
	let darkPixels = 0;
	for (let i = 0; i < textPixels.length; i += 4) if (textPixels[i] < 100 && textPixels[i + 1] < 100 && textPixels[i + 2] < 100) darkPixels++;
	assert(darkPixels > 20, "PDF text paints visible dark pixels");
	const word = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=report.docx`);
	if (badWordChild) {
		assert(word.status === 500 && (await word.json()).code === "preview_failed", "a Word result without the required CSP is rejected");
	} else {
	assert(word.status === 200, `invented Word document is previewed, got ${word.status}`);
	const wordBody = await word.json();
	assert(wordBody.kind === "word" && wordBody.html.includes("Invented heading") && wordBody.html.includes("Invented cell") && wordBody.html.includes("data:image/png;base64,") && wordBody.html.includes("External label"), "Word text, table and embedded image reach the real preview route");
	assert(!wordBody.html.includes("example.invalid") && !/href\s*=/.test(wordBody.html), "external Word links are inert");
	assert(wordBody.html.includes("&lt;script&gt;invented&lt;/script&gt;") && !wordBody.html.includes("<script>"), "script-like document text remains inert text");
	if (networkChild) {
		const probes = fs.readFileSync(networkMarker, "utf8");
		for (const name of ["fetch", "websocket", "http", "https", "socket", "tls", "dns", "dns-resolver", "dns-promise-resolver", "udp", "http2"]) assert(probes.includes(`${name}:control:true`), `${name} deny control executed`);
		assert(!probes.includes(":attempt"), "the document made no instrumented outbound attempt");
	}
	assert(wordBody.html.includes("External image blocked.") && wordBody.notices.some((notice: { code: string }) => notice.code === "external_resources_blocked"), "linked images become an inert placeholder and notice");
	const { JSDOM } = await import("jsdom");
	const wordDom = new JSDOM(wordBody.html);
	const heading = [...wordDom.window.document.querySelectorAll("span")].find((node) => node.textContent === "Invented heading");
	const cell = wordDom.window.document.querySelector("td");
	assert(heading && wordDom.window.getComputedStyle(heading).fontWeight === "bold" && wordDom.window.getComputedStyle(heading).color === "rgb(204, 34, 0)", "Word bold and color survive rendering");
	assert(cell && wordDom.window.getComputedStyle(cell).backgroundColor === "rgb(255, 255, 0)", "Word table shading survives rendering");
	const embeddedSrc = wordDom.window.document.querySelector("img")?.getAttribute("src") ?? "";
	const embedded = await canvasApi.loadImage(Buffer.from(embeddedSrc.split(",")[1] ?? "", "base64"));
	assert(embedded.width === 1 && embedded.height === 1, "the embedded image decodes with its invented dimensions");
	wordDom.window.close();
	const cssOnly = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=css-only.docx`);
	const cssBody = await cssOnly.json();
	assert(cssOnly.status === 200 && !cssBody.html.includes("example.invalid") && cssBody.notices.some((notice: { code: string }) => notice.code === "external_resources_blocked"), "escaped external CSS is blocked and announced even without external relationships");
	const streamed = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=streamed.docx`);
	assert(streamed.status === 200 && (await streamed.json()).kind === "word", "valid streamed ZIP descriptors are accepted");
	const conflicting = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=conflicting.docx`);
	assert(conflicting.status === 422 && (await conflicting.json()).code === "damaged_file", "conflicting local and central ZIP metadata is refused");
	const wrongImage = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=wrong-image.docx`);
	assert(wrongImage.status === 422 && (await wrongImage.json()).code === "damaged_file", "a mismatched embedded image is refused rather than rendered blank");
	const controlsBeforeElements = networkChild ? fs.readFileSync(networkMarker, "utf8") : "";
	const elements = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=elements.docx`);
	assert(elements.status === 413 && (await elements.json()).code === "preview_too_complex", "XML element work exceeds its budget");
	if (networkChild) assert(fs.readFileSync(networkMarker, "utf8") === controlsBeforeElements, "oversized XML is refused before renderer setup");
	if (!fakeChild) {
		const oversizedText = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=oversized-text.docx`);
		assert(oversizedText.status === 413 && (await oversizedText.json()).code === "preview_too_complex", "Word output exceeding its text budget is refused");
	}
	const expansion = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=expansion.docx`);
	assert(expansion.status === 413 && (await expansion.json()).code === "expanded_content_too_large", "excessive ZIP expansion is refused before rendering");
	const many = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=pages.pdf`);
	assert(many.status === 200, `multi-page PDF is previewed, got ${many.status}`);
	const manyBody = await many.json();
	assert(manyBody.totalPages === 9 && manyBody.pages.map((page: { page: number }) => page.page).join(",") === "1,2,3,4,5,6,7,8,9", "all nine pages remain ordered");
	const { createCanvas, loadImage } = await import("@napi-rs/canvas");
	const first = await loadImage(Buffer.from(manyBody.pages[0].imageBase64, "base64"));
	const canvas = createCanvas(first.width, first.height);
	const context = canvas.getContext("2d");
	context.drawImage(first, 0, 0);
	const pixel = context.getImageData(Math.floor(first.width / 2), Math.floor(first.height / 2), 1, 1).data;
	assert(pixel[0] > 200 && pixel[1] < 80 && pixel[2] < 80, "a PDF color landmark is painted");
	const over = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=too-many.pdf`);
	assert(over.status === 413 && (await over.json()).code === "preview_too_complex", "PDF page limit refuses the complete document");
	const broken = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=broken.pdf`);
	assert(broken.status === 422 && (await broken.json()).code === "damaged_file", "a damaged PDF has a controlled error");
	const oversized = await authedFetch(`${baseUrl}/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-preview?conversationId=demo-thread&path=oversize.pdf`);
	assert(oversized.status === 413 && (await oversized.json()).code === "file_too_large", "the PDF input cap is enforced");
	}
	}
	}
	console.log("workspace-file-preview smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-4000));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}

if (!fakeChild) {
	for (const testCase of ["--malformed-child", "--extra-child", "--bad-word-child", "--admission-child", "--revoke-child", "--replace-child", "--crash-child", "--exit-race-child", "--network-child", "--timeout-child"]) {
		const check = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), testCase], { encoding: "utf8", timeout: 90_000 });
		assert(check.status === 0, `${testCase} check failed: ${check.stderr || check.stdout}`);
	}
}
