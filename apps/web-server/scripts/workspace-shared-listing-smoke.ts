import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { SMOKE_AUTH_HEADERS, SMOKE_SERVER_AUTH_ENV } from "./smoke-server-process.js";

const home = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-box-race-"));
const folder = path.join(home, "invented-folder");
fs.mkdirSync(folder);
fs.writeFileSync(path.join(folder, "invented.txt"), "example");
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.EXXETA_PERSISTENT_AGENTS_ROOT = path.join(home, "agents");
Object.assign(process.env, SMOKE_SERVER_AUTH_ENV);
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
	for (const route of ["workspace-files", "workspace-image", "workspace-preview"]) {
		const bad = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/${route}?conversationId=invented-thread&path=~invented.png`, headers: SMOKE_AUTH_HEADERS });
		if (bad.statusCode !== 400 || bad.json().code !== "invalid_path") throw new Error(`${route} refuses a tilde path as invalid`);
	}
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
	const objects = ["1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n", "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n", "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents 4 0 R >>\nendobj\n", "4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\n"];
	let pdfBody = "%PDF-1.4\n";
	const offsets = objects.map((object) => { const at = pdfBody.length; pdfBody += object; return at; });
	const xrefAt = pdfBody.length;
	pdfBody += `xref\n0 5\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
	fs.writeFileSync(path.join(shelf, "invented.pdf"), pdfBody);
	const pdf = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.pdf`, headers: SMOKE_AUTH_HEADERS });
	if (pdf.statusCode !== 200 || pdf.json().kind !== "pdf" || pdf.json().pages?.[0]?.mimeType !== "image/jpeg") throw new Error(`shared PDF preview failed: ${pdf.statusCode}`);
	const doc = new JSZip();
	doc.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
	doc.file("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
	doc.file("word/document.xml", '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Invented paragraph</w:t></w:r></w:p></w:body></w:document>');
	fs.writeFileSync(path.join(shelf, "invented.docx"), await doc.generateAsync({ type: "nodebuffer" }));
	const word = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.docx`, headers: SMOKE_AUTH_HEADERS });
	if (word.statusCode !== 200 || word.json().kind !== "word" || !word.json().html?.includes("Invented paragraph")) throw new Error(`shared Word preview failed: ${word.statusCode}`);
	fs.writeFileSync(path.join(shelf, "invented.html"), "<p>Invented page</p><script>1</script>");
	const html = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.html`, headers: SMOKE_AUTH_HEADERS });
	if (html.statusCode !== 200 || html.json().kind !== "html" || html.json().html !== "<p>Invented page</p><script>1</script>") throw new Error("shared HTML JSON preview failed");
	const htmlFrame = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.html&frame=1`, headers: SMOKE_AUTH_HEADERS });
	if (htmlFrame.statusCode !== 200 || !String(htmlFrame.headers["content-type"]).startsWith("text/html") || !String(htmlFrame.headers["content-security-policy"]).includes("sandbox allow-scripts") || !String(htmlFrame.headers["content-security-policy"]).includes("connect-src 'none'") || !htmlFrame.body.includes("Invented page")) throw new Error("HTML frame uses the opaque, network-denying sandbox");
	const deckBytes = Buffer.from("invented presentation bytes");
	fs.writeFileSync(path.join(shelf, "invented.pptx"), deckBytes);
	const deck = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.pptx`, headers: SMOKE_AUTH_HEADERS });
	if (deck.statusCode !== 200 || !deck.rawPayload.equals(deckBytes) || !String(deck.headers["content-type"]).startsWith("application/octet-stream")) throw new Error("presentation bytes use the bounded snapshot");
	const deckFrame = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.pptx&frame=1`, headers: SMOKE_AUTH_HEADERS });
	if (deckFrame.statusCode !== 200 || !deckFrame.body.includes('<div id="slides">') || !String(deckFrame.headers["content-security-policy"]).includes("sandbox allow-scripts") || !String(deckFrame.headers["content-security-policy"]).includes("connect-src 'none'")) throw new Error("presentation frame has its isolated renderer and CSP");
	const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64");
	fs.writeFileSync(path.join(shelf, "invented.png"), imageBytes);
	const image = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-image?conversationId=invented-thread&path=invented.png`, headers: SMOKE_AUTH_HEADERS });
	if (image.statusCode !== 200 || !image.rawPayload.equals(imageBytes) || !String(image.headers["content-type"]).startsWith("image/png") || image.headers["x-content-type-options"] !== "nosniff") throw new Error("image route returns guarded bytes with security headers");
	const imageOther = await app.inject({ method: "GET", url: `/api/persistent-agents/${other}/workspace-image?conversationId=invented-thread&path=invented.png`, headers: SMOKE_AUTH_HEADERS });
	if (imageOther.statusCode < 400 || imageOther.rawPayload.equals(imageBytes)) throw new Error("another room cannot read this image");
	const missingImageThread = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-image?conversationId=missing-thread&path=invented.png`, headers: SMOKE_AUTH_HEADERS });
	if (missingImageThread.statusCode !== 404 || missingImageThread.json().code !== "conversation_not_found") throw new Error("an image requires an existing conversation");
	const unsupportedImage = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-image?conversationId=invented-thread&path=example.txt`, headers: SMOKE_AUTH_HEADERS });
	if (unsupportedImage.statusCode !== 400 || unsupportedImage.json().code !== "unsupported_file_type") throw new Error("image route refuses non-image extensions");
	const largeImage = fs.openSync(path.join(shelf, "large.png"), "w");
	try { fs.ftruncateSync(largeImage, 20_971_521); } finally { fs.closeSync(largeImage); }
	const refusedImage = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-image?conversationId=invented-thread&path=large.png`, headers: SMOKE_AUTH_HEADERS });
	if (refusedImage.statusCode !== 413 || refusedImage.json().code !== "file_too_large") throw new Error("image route enforces the 20 MiB bound");
	fs.writeFileSync(path.join(shelf, "encoded.txt"), Buffer.from([0x66, 0x80, 0x6f]));
	const encoded = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=encoded.txt`, headers: SMOKE_AUTH_HEADERS });
	if (encoded.statusCode !== 200 || encoded.json().text !== "f\ufffdo") throw new Error("text preview decodes invalid UTF-8 with replacement");
	const largeFile = fs.openSync(path.join(shelf, "large.txt"), "w");
	try { fs.ftruncateSync(largeFile, 16_777_217); } finally { fs.closeSync(largeFile); }
	const large = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=large.txt`, headers: SMOKE_AUTH_HEADERS });
	if (large.statusCode !== 413 || large.json().code !== "file_too_large") throw new Error("text preview refuses a file over its bound");
	for (const [extension, limit] of [["json", 16_777_216], ["md", 16_777_216], ["html", 16_777_216], ["htm", 16_777_216], ["xlsx", 26_214_400], ["pdf", 26_214_400], ["docx", 26_214_400], ["pptx", 26_214_400]] as const) {
		const name = `large.${extension}`;
		const fd = fs.openSync(path.join(shelf, name), "w");
		try { fs.ftruncateSync(fd, limit + 1); } finally { fs.closeSync(fd); }
		const tooLarge = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=${name}`, headers: SMOKE_AUTH_HEADERS });
		if (tooLarge.statusCode !== 413 || tooLarge.json().code !== "file_too_large") throw new Error(`${extension} preview must refuse a file over its bound`);
	}
	const legacy = await app.inject({ method: "GET", url: `/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.doc`, headers: SMOKE_AUTH_HEADERS });
	if (legacy.statusCode !== 415 || legacy.json().code !== "legacy_doc") throw new Error("legacy Word preview must return its specified guidance code");
	console.log("workspace shared shelf listing smoke passed");
} finally {
	await app.close();
	fs.rmSync(home, { recursive: true, force: true });
}
