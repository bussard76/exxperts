// The real transcript and Attachments selectors drive the folded pane. All data is invented.
import fs from "node:fs";
import path from "node:path";
import { chromium, type WebSocketRoute } from "playwright";
import { agentsRoot, assert, baseUrl, MODEL, openRoom, requestJson, startRoomStateServer, stopRoomStateServer, waitUntil } from "./room-state-setup.js";
import { SMOKE_AUTH_TOKEN } from "./smoke-server-process.js";
import { closeBrowser } from "./smoke-close-context.js";

let error: unknown;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	await startRoomStateServer();
	const room = await openRoom("Invented Studio");
	for (const name of ["alpha.html", "beta.html"]) {
		const response = await requestJson(`/api/persistent-agents/${room.roomId}/files`, { method: "POST", body: JSON.stringify({ filename: name, contentBase64: Buffer.from(`<h1>${name}</h1>`).toString("base64") }) });
		assert(response.status === 200 || response.status === 201, `upload ${name}: ${response.status}`);
	}
	const artifact = (name: string) => ({ relativePath: `files/${name}`, extension: ".html", bytes: 20 });
	const task = (taskId: string, id: string, artifacts: ReturnType<typeof artifact>[]) => ({ kind: "task", id, taskId, template: "deck", templateLabel: "Deck", title: id, summary: "Invented", artifacts, generatedAt: "2026-10-01T10:00:00.000Z", transferred: true });
	const ledgerDir = path.join(agentsRoot, room.roomId, "runtime", "task-ledger");
	fs.mkdirSync(ledgerDir, { recursive: true });
	for (const [id, artifacts] of [["tsk-first", [artifact("alpha.html"), artifact("beta.html")]], ["tsk-second", [artifact("beta.html")]]] as const) {
		fs.writeFileSync(path.join(ledgerDir, `${id}.json`), JSON.stringify({ schemaVersion: 1, taskId: id, roomId: room.roomId, conversationId: room.conversationId, templateId: "deck", templateVersion: 1, title: "Invented task", startedAt: "2026-10-02T10:00:00.000Z", endedAt: "2026-10-02T10:05:00.000Z", outcome: "ok", artifacts }));
	}
	const saved = await requestJson(`/api/persistent-agents/${room.roomId}/threads/${room.conversationId}`, { method: "PUT", body: JSON.stringify({ state: "active", origin: "home", model: MODEL, items: [task("tsk-first", "First task", [artifact("alpha.html"), artifact("beta.html")]), task("tsk-second", "Second task", [artifact("beta.html")])] }) });
	assert(saved.status === 200, `seed conversation: ${saved.status}`);
	browser = await chromium.launch();
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
	let client: WebSocketRoute | undefined;
	await context.routeWebSocket(/\/ws\?/, (socket) => { client = socket; socket.connectToServer(); });
	const page = await context.newPage();
	let artifactReads = 0;
	page.on("request", (request) => { if (request.method() === "GET" && new URL(request.url()).pathname.startsWith("/api/artifacts/")) artifactReads++; });
	await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
	await page.waitForLoadState("networkidle");
	if (await page.locator(".whats-new-close").count()) await page.locator(".whats-new-close").click();
	await page.locator(".persistent-agent-card").filter({ hasText: "Invented Studio" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
	await waitUntil(() => !!client, "room websocket");
	const tasks = page.locator(".task-item");
	await tasks.nth(1).waitFor();
	const first = tasks.nth(0);
	const second = tasks.nth(1);
	const viewer = page.locator("aside.artifact-viewer");
	await first.getByTitle("Open alpha.html").click();
	await viewer.waitFor();
	await page.waitForLoadState("networkidle");
	const readsBeforeFold = artifactReads;
	await page.getByRole("button", { name: "Hide right pane" }).click();
	await page.getByRole("button", { name: "Show right pane" }).click();
	await page.waitForTimeout(300);
	assert(artifactReads === readsBeforeFold, "folding and unfolding does not read the artifact again");
	await page.getByRole("button", { name: "Hide right pane" }).click();
	await first.getByTitle("Open alpha.html").click();
	assert(await page.getByRole("button", { name: "Show right pane" }).count() === 1, "reselecting the same artifact stays folded");
	await first.getByTitle("Open beta.html").click();
	await page.getByRole("button", { name: "Hide right pane" }).waitFor();
	await viewer.getByRole("tab", { name: "beta.html", selected: true }).waitFor();
	assert((await viewer.locator("iframe").getAttribute("src"))?.includes("/tsk-first/beta.html"), "another artifact of the same task unfolds");
	await viewer.frameLocator("iframe").getByText("beta.html", { exact: true }).waitFor();
	await page.getByRole("button", { name: "Hide right pane" }).click();
	await second.getByTitle("Open beta.html").click();
	await page.getByRole("button", { name: "Hide right pane" }).waitFor();
	assert((await viewer.locator("iframe").getAttribute("src"))?.includes("/tsk-second/beta.html"), "same path of another task unfolds");
	await viewer.frameLocator("iframe").getByText("beta.html", { exact: true }).waitFor();
	await viewer.getByRole("button", { name: "Close artifact viewer" }).click();
	await page.locator(".attachments-entry").click();
	await page.getByRole("button", { name: "Hide right pane" }).click();
	assert(await page.locator(".attachments-panel").evaluate((node) => getComputedStyle(node).display) === "none", "attachments panel folds");
	await page.getByRole("button", { name: "Show right pane" }).click();
	client!.send(JSON.stringify({ type: "task_started", taskId: "tsk-live", template: "deck", templateLabel: "Deck", title: "Invented live run" }));
	const live = page.locator(".att-card").filter({ hasText: "Invented live run" });
	await live.locator(".att-open").click();
	const run = page.locator('aside[aria-label="Task run view"]');
	await run.waitFor();
	await page.getByRole("button", { name: "Hide right pane" }).click();
	client!.send(JSON.stringify({ type: "task_delta", taskId: "tsk-live", delta: "Invented progress" }));
	await waitUntil(async () => (await run.textContent())?.includes("Invented progress") === true, "task progress received");
	assert(await page.getByRole("button", { name: "Show right pane" }).count() === 1, "task metadata update leaves the run folded");
	await page.getByRole("button", { name: "Show right pane" }).click();
	assert(await run.isVisible(), "task run unfolds");
	await context.close();
	console.log("right-pane-identity-ui smoke: ok");
} catch (caught) {
	error = caught;
	console.error(`right-pane-identity-ui smoke FAILED: ${(caught as Error).message}`);
	process.exitCode = 1;
} finally {
	if (browser) await closeBrowser(browser).catch(() => {});
	await stopRoomStateServer(error);
}
