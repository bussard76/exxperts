import { smallDocx } from "./workspace-preview-fixtures.js";
// Browser workspace acceptance with invented files and an offline model profile.
import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";

function inventedPdf(): Buffer {
	const stream = "0 0 0 rg 10 10 20 20 re f";
	const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Contents 4 0 R >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
	let body = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((object, index) => { offsets.push(body.length); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
	return Buffer.from(body + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`, "latin1");
}

assert(fs.existsSync(chromium.executablePath()), "Chromium is required for this browser check");
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-series1-ui-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
const folder = path.join(tempHome, "workspace");
for (const dir of [agentsRoot, agentDir, folder]) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(folder, "notes.md"), "# Invented note\n");
fs.writeFileSync(path.join(folder, "other.txt"), "Invented second file\n");
fs.writeFileSync(path.join(folder, "invented.pdf"), inventedPdf());
fs.writeFileSync(path.join(folder, "invented.docx"), await smallDocx());
const { default: ExcelJS } = await import("exceljs");
const workbook = new ExcelJS.Workbook();
workbook.addWorksheet("Invented sheet").getCell("A1").value = "Invented cell";
fs.writeFileSync(path.join(folder, "invented.xlsx"), Buffer.from(await workbook.xlsx.writeBuffer()));
fs.writeFileSync(path.join(folder, "invented.html"), "<p>Invented HTML</p>");
for (const name of ["old.xls", "old.doc", "macro.xlsm", "diagram.drawio"]) fs.writeFileSync(path.join(folder, name), "invented");
{
	const { default: JSZip } = await import("jszip");
	const zip = new JSZip();
	zip.file("[Content_Types].xml", `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);
	zip.file("ppt/presentation.xml", `<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500" type="screen16x9"/></p:presentation>`);
	zip.file("ppt/_rels/presentation.xml.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>`);
	zip.file("ppt/slides/slide1.xml", `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="4572000" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="2400"/><a:t>Invented slide</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`);
	fs.writeFileSync(path.join(folder, "invented.pptx"), await zip.generateAsync({ type: "nodebuffer" }));
}
fs.writeFileSync(path.join(folder, "image.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64"));
fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({ providers: { "fake-claude": { name: "Fake Claude", baseUrl: "http://127.0.0.1:9", api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] } } }));
fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }));
fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" }] }));
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }));
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;
const waitUntil = waitEvery(150, 20000);
async function api(pathname: string, init: AuthedFetchInit = {}) {
 const response = await authedFetch(`${baseUrl}${pathname}`, { ...init, headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers } });
 return { status: response.status, body: await response.json() };
}
let server: ChildProcessWithoutNullStreams | undefined;
try {
 server = spawn("npx", ["tsx", "src/index.ts"], { ...SMOKE_SERVER_SPAWN_TREE_OPTIONS, cwd: path.join(repoRoot, "apps/web-server"), env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot }) as NodeJS.ProcessEnv });
 await waitUntil(() => fetch(`${baseUrl}/healthz`).then(r => r.ok).catch(() => false), "server ready", 60000);
 const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Invented room", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
 assert.equal(created.status, 201);
 const id = String(created.body.agent.id);
 assert.equal((await api(`/api/persistent-agents/${encodeURIComponent(id)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) })).status, 200);
 const browser = await chromium.launch();
 try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
  await page.waitForLoadState("networkidle");
  const dismiss = page.locator(".whats-new-close"); if (await dismiss.count()) await dismiss.click();
  await page.locator(".persistent-agent-card").filter({ hasText: "Invented room" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
  const tree = page.locator(".sidebar-workspace-files");
  await tree.locator(".workspace-file-browser-file", { hasText: "notes.md" }).click({ timeout: 10000 });
  await page.locator(".workspace-preview-text").getByText("# Invented note").waitFor();
  assert.equal(await page.locator(".workspace-pane").getByRole("button", { name: /^(edit|save|download|print)$/i }).count(), 0);
  await tree.locator(".workspace-file-browser-file", { hasText: "other.txt" }).click();
  assert.equal(await page.locator(".workspace-tab").count(), 2);
  await page.locator(".workspace-tab").filter({ hasText: "other.txt" }).getByRole("button", { name: "Close other.txt" }).click();
  assert.equal(await page.locator(".workspace-tab[data-active=true]").count(), 1);
  const composer = page.locator(".composer-input textarea");
  await composer.fill("before after");
  await composer.evaluate((node: HTMLTextAreaElement) => { node.focus(); node.setSelectionRange(7, 7); });
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await tree.locator(".workspace-file-browser-file", { hasText: "notes.md" }).dispatchEvent("dragstart", { dataTransfer: transfer });
  await composer.dispatchEvent("drop", { dataTransfer: transfer });
  assert.equal(await composer.inputValue(), "before notes.mdafter", "drag inserts the relative file path at the composer caret");
  await tree.locator(".workspace-file-browser-file", { hasText: "image.png" }).click();
  await page.locator(".workspace-preview-image img[alt='image.png']").waitFor({ timeout: 5000 });
  await tree.locator(".workspace-file-browser-file", { hasText: "invented.pdf" }).click();
  await page.locator(".workspace-preview-pdf img[alt='Page 1']").waitFor({ timeout: 10000 });
  await tree.locator(".workspace-file-browser-file", { hasText: "invented.docx" }).click();
  await page.locator(".workspace-preview-word iframe").waitFor({ timeout: 10000 });
  await tree.locator(".workspace-file-browser-file", { hasText: "invented.xlsx" }).click();
  await page.locator(".workspace-spreadsheet").getByText("Invented cell", { exact: true }).waitFor({ timeout: 10000 });
  await tree.locator(".workspace-file-browser-file", { hasText: "invented.html" }).click();
  await page.frameLocator(".workspace-preview-html iframe").getByText("Invented HTML").waitFor({ timeout: 10000 });
  await tree.locator(".workspace-file-browser-file", { hasText: "invented.pptx" }).click();
  await page.frameLocator(".workspace-preview-content:not([hidden]) .workspace-preview-html iframe").getByText("Invented slide").waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Open in PowerPoint" }).waitFor({ timeout: 5000 });
  await tree.locator(".workspace-file-browser-file", { hasText: "old.xls" }).click();
  await page.getByText("This file type cannot be previewed here.").waitFor();
  assert.equal(await page.getByRole("button", { name: /Open in Excel/ }).count(), 0, "unsupported XLS never offers Open");
  await tree.locator(".workspace-file-browser-file", { hasText: "macro.xlsm" }).click();
  await page.getByRole("button", { name: "Open in Excel" }).waitFor();
  await tree.locator(".workspace-file-browser-file", { hasText: "old.doc" }).click();
  await page.getByText("Save this old .doc file as .docx to preview it here.").waitFor();
  assert.equal(await page.getByRole("button", { name: /Open in/ }).count(), 0);
 } finally { await browser.close(); }
} finally { if (server) await stopSmokeServer(server); fs.rmSync(tempRoot, { recursive: true, force: true }); }
