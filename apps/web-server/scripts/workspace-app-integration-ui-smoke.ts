// Home, New room: Create room enters the new room on its conversation model
// with the cursor in the composer. The create answer carries the room's model
// rows the way GET .../status does; Home enters only when the conversation
// row has a model that can run, so without them the new card just waited.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import * as XLSX from "xlsx";
import { runWorkspaceSpreadsheetSnapshot } from "../src/persistent-room-shelf-reading.js";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";

const waitUntil = waitEvery(150);

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

// A machine without Chromium cannot run a browser assertion at all; skip
// whole, the same way remote-settings-readonly-smoke does.
{
	const p = typeof chromium?.executablePath === "function" ? chromium.executablePath() : "";
	if (!p || !fs.existsSync(p)) {
		console.log("create room opens smoke skipped (Chromium not installed)");
		process.exit(0);
	}
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webServerDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-create-opens-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

let server: ChildProcessWithoutNullStreams | undefined;
const serverOutput: string[] = [];

try {
	// One signed-in synthetic provider; nothing here sends a message to it.
	fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({
		providers: {
			"fake-claude": { name: "Fake Claude", baseUrl: "http://127.0.0.1:9", api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] },
		},
	}, null, 2), { mode: 0o600 });
	fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }, null, 2), { mode: 0o600 });
	fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [
		{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" },
	] }, null, 2), { mode: 0o600 });
	fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }, null, 2), { mode: 0o600 });

	server = spawn("npx", ["tsx", "src/index.ts"], {
		shell: process.platform === "win32",
		...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
		cwd: webServerDir,
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready");

	// The create answer: the status carries the model rows, conversation set.
	const createdRes = await authedFetch(`${baseUrl}/api/persistent-agents`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName: "Api Room", userName: "Synthetic User" }) });
	assert(createdRes.status === 201, `create answers 201, got ${createdRes.status}`);
	const created = await createdRes.json() as { status?: { models?: { conversation?: { effective?: { provider?: string; model?: string } }; memory?: unknown } } };
	const effective = created.status?.models?.conversation?.effective;
	assert(effective?.provider === "fake-claude" && effective.model === "claude-fake", `the create answer carries the conversation model, got ${JSON.stringify(created.status?.models)}`);
	assert(created.status?.models?.memory, "the create answer carries the memory row too");

	const fakeWorkbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(fakeWorkbook, XLSX.utils.aoa_to_sheet([["Invented cell"]]), "Example");
	const parsed = await runWorkspaceSpreadsheetSnapshot(Buffer.from(XLSX.write(fakeWorkbook, { type: "buffer", bookType: "xlsx" })), new AbortController().signal);
	assert(parsed.ok && parsed.result, "invented workbook was parsed");
	const browser = await chromium.launch();
	try {
		const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
		const page = await ctx.newPage();
		let unsupportedRequests = 0;
		await page.route("**/api/persistent-agents/**/workspace-files?**", async (route) => {
			const url = new URL(route.request().url()), id = decodeURIComponent(url.pathname.split("/")[3]), conversationId = url.searchParams.get("conversationId");
			const entries = ["invented.xlsx", "notes.txt", "sketch.excalidraw", "old.doc", "old.xls", "macro.xlsm", "diagram.drawio", "diagram.dio", "auth.png", "lesson 1: draft.txt"].map((name) => ({ name, relativePath: name, kind: "file", bytes: 42, modifiedAt: "2026-01-01T00:00:00.000Z", extension: name.slice(name.lastIndexOf(".")) }));
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ agentId: id, conversationId, root: { displayLabel: "Invented workspace", basename: "invented" }, path: "", entries }) });
		});
		await page.route("**/api/persistent-agents/**/workspace-preview?**", async (route) => {
			const url = new URL(route.request().url()), id = decodeURIComponent(url.pathname.split("/")[3]), conversationId = url.searchParams.get("conversationId");
			const selected = url.searchParams.get("path");
			if (selected === "sketch.excalidraw") unsupportedRequests++;
			const body = selected === "notes.txt" || selected === "lesson 1: draft.txt" ? { schemaVersion: 1, agentId: id, conversationId, path: selected, kind: "text", notices: [], text: selected === "notes.txt" ? "Invented notes" : "Invented colon name" } : { schemaVersion: 1, agentId: id, conversationId, path: "invented.xlsx", kind: "spreadsheet", notices: parsed.notices, workbook: parsed.result!.workbook };
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
		});
		await page.route("**/api/persistent-agents/**/workspace-open", async (route) => { await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ code: "association_unverified", error: "Cannot open." }) }); });
		await page.route("**/api/persistent-agents/**/workspace-image?**", async (route) => { await route.fulfill({ status: 401, contentType: "application/json", body: "{}" }); });

		await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
		await page.waitForLoadState("networkidle");
		const dismiss = page.locator(".whats-new-close");
		if (await dismiss.count()) await dismiss.click();

		await page.getByRole("button", { name: "Create a new room" }).click();
		const form = page.locator(".create-room-overlay .create-room-form");
		await form.waitFor({ timeout: 10000 });
		await form.locator(".create-room-field").filter({ hasText: "Room name" }).locator("input").fill("Browser Room");
		await form.locator(".create-room-field").filter({ hasText: "Your name" }).locator("input").fill("Synthetic User");
		await form.getByRole("button", { name: "Create room" }).click();

		// The room opens: its composer is there and holds the cursor.
		const composer = page.locator(".composer-box textarea").first();
		await composer.waitFor({ timeout: 15000 });
		await waitUntil(() => composer.evaluate((el) => document.activeElement === el), "the composer holds the cursor", 10_000);
		assert(await page.locator(".create-room-overlay").count() === 0, "the create dialog is closed");
		assert(await page.getByText("Browser Room").count() > 0, "the open room is the new one");
		await page.getByRole("button", { name: "invented.xlsx", exact: true }).click({ timeout: 10000 });
		await page.getByText("Invented cell", { exact: true }).waitFor({ timeout: 10000 });
		const open = page.getByRole("button", { name: "Open in Excel" });
		await open.click({ timeout: 10000 });
		await page.getByRole("alert").getByText("This file could not be opened in another program.").waitFor({ timeout: 10000 });
		await page.setViewportSize({ width: 390, height: 844 });
		const pane = await page.locator(".workspace-pane").boundingBox();
		assert(pane && pane.x >= 0 && pane.x + pane.width <= 390 && pane.width >= 350, `workspace remains usable on a phone: ${JSON.stringify(pane)}`);
		await page.getByRole("button", { name: "Close invented.xlsx" }).click();
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.getByRole("button", { name: "sketch.excalidraw", exact: true }).click();
		assert(await page.getByRole("button", { name: "Close sketch.excalidraw" }).count() === 0 && unsupportedRequests === 0, "unsupported selection opens no tab and requests no preview");
		for (const name of ["old.doc", "old.xls", "macro.xlsm", "diagram.drawio", "diagram.dio"]) {
			await page.getByRole("button", { name, exact: true }).click();
			await page.getByText(name.endsWith(".doc") ? "Save this old .doc file as .docx to preview it here." : "This file type cannot be previewed here.", { exact: true }).waitFor({ timeout: 10000 });
			const action = page.locator(".workspace-pane .workspace-open-action button");
			if (name.endsWith(".doc") || name.endsWith(".xls")) assert(await action.count() === 0, `source hides open action for ${name}`);
			else await action.waitFor({ timeout: 10000 });
			await page.getByRole("button", { name: `Close ${name}` }).click();
		}
		await page.getByRole("button", { name: "lesson 1: draft.txt", exact: true }).click();
		await page.getByText("Invented colon name", { exact: true }).waitFor({ timeout: 10000 });
		await page.getByRole("button", { name: "Close lesson 1: draft.txt" }).click();
		await page.evaluate(() => sessionStorage.setItem("exxperts-auth-redirect", String(Date.now())));
		await page.getByRole("button", { name: "auth.png", exact: true }).click();
		await page.getByText("Sign in to preview this file.", { exact: true }).waitFor({ timeout: 10000 });
		await page.getByRole("button", { name: "Close auth.png" }).click();
		await page.getByRole("button", { name: "notes.txt", exact: true }).click();
		await page.getByText("Invented notes", { exact: true }).waitFor({ timeout: 10000 });

		await ctx.close();
	} finally {
		await browser.close();
	}
	console.log("workspace app integration mock smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-6000));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
