import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { chromium } from "playwright";
import { SMOKE_AUTH_HEADERS } from "./smoke-server-process.js";

const home = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-shared-frame-"));
process.env.HOME = home;
process.env.USERPROFILE = home;
process.env.EXXETA_PERSISTENT_AGENTS_ROOT = path.join(home, "agents");
process.env.EXXPERTS_AUTH_TOKEN = "exxperts-smoke-pinned-auth-token";
const appDir = path.join(home, ".exxperts", "app");
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(path.join(appDir, "openai-compatible-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible", providerId: "openai-compatible", label: "Synthetic Gateway", roomModels: [{ modelId: "invented" }], maintenanceModel: "invented" }));
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible" }));
const zip = new JSZip();
	zip.file("[Content_Types].xml", `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);
	zip.file("ppt/presentation.xml", `<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500" type="screen16x9"/></p:presentation>`);
	zip.file("ppt/_rels/presentation.xml.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>`);
	zip.file("ppt/slides/slide1.xml", `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="4572000" cy="914400"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="2400"/><a:t>Invented slide</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`);
const pptx = await zip.generateAsync({ type: "nodebuffer" });

const { registerServerHooks } = await import("../src/server-hooks.js");
registerServerHooks({ roomFilesAreTheFolder: () => true });
const { app } = await import("../src/server-app.js");
await import("../src/room-settings-routes.js");
const { createPersistentAgentFromScaffoldInput, writePersistentAgentThread } = await import("../src/persistent-agents.js");
const { persistentRoomShelfDirPath } = await import("../src/persistent-room-shelf.js");
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	const room = createPersistentAgentFromScaffoldInput({ displayName: "Invented Frame Room", userName: "Example", preferredUserAddress: "Example" }).agent.id;
	writePersistentAgentThread(room, "invented-thread", { state: "standby", origin: "home", model: { provider: "openai-compatible", model: "invented", label: "Invented" }, items: [] });
	const shelf = persistentRoomShelfDirPath(room);
	fs.mkdirSync(shelf, { recursive: true });
	fs.writeFileSync(path.join(shelf, "invented.pptx"), pptx);
	const base = await app.listen({ host: "127.0.0.1", port: 0 });
	browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({ extraHTTPHeaders: SMOKE_AUTH_HEADERS });
	await page.goto(`${base}/invented-test-parent`);
	await page.evaluate((url) => {
		const frame = document.createElement("iframe");
		frame.setAttribute("sandbox", "allow-scripts");
		(window as any).frameEvents = [];
		window.addEventListener("message", async (event) => {
			if (event.source !== frame.contentWindow) return;
			(window as any).frameEvents.push(event.data?.kind);
			if (event.data?.kind === "frame-ready") {
				const bytes = await (await fetch(url)).arrayBuffer();
				frame.contentWindow!.postMessage(bytes, "*", [bytes]);
			}
		});
		frame.src = url + "&frame=1";
		document.body.appendChild(frame);
	}, `${base}/api/persistent-agents/${room}/workspace-preview?conversationId=invented-thread&path=invented.pptx`);
	await page.waitForFunction(() => (window as any).frameEvents.includes("frame-rendered"), undefined, { timeout: 20000 });
	await page.frameLocator("iframe").getByText("Invented slide").waitFor({ timeout: 10000 });
	console.log("shared route presentation frame browser smoke passed");
} finally {
	await browser?.close();
	await app.close();
	fs.rmSync(home, { recursive: true, force: true });
}
