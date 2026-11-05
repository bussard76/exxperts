// A Markdown file opened from the workspace tree shows the images it links, and
// saving an edit leaves their Markdown as written. A file dragged from the tree
// onto the composer inserts its path.
// Offline: the room's model is never asked. Throwaway HOME.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { authedFetch, SMOKE_AUTH_TOKEN, SMOKE_SERVER_AUTH_ENV, SMOKE_SERVER_SPAWN_TREE_OPTIONS, smokeHomeEnv, stopSmokeServer, freePort, type AuthedFetchInit } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

{
	const p = typeof chromium?.executablePath === "function" ? chromium.executablePath() : "";
	if (!p || !fs.existsSync(p)) {
		console.log("workspace markdown images ui smoke skipped (Chromium not installed)");
		process.exit(0);
	}
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webServerDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webServerDir, "..", "..");
const port = await freePort();
const baseUrl = `http://127.0.0.1:${port}`;

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-markdown-images-"));
const tempHome = path.join(tempRoot, "home");
const agentsRoot = path.join(tempHome, ".exxperts", "app", "personalized-agents");
const agentDir = path.join(tempHome, ".exxperts", "agent");
const appDir = path.join(tempHome, ".exxperts", "app");
for (const dir of [agentsRoot, agentDir]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

const folder = path.join(tempHome, "Projects", "handbook");
fs.mkdirSync(path.join(folder, "docs", "img"), { recursive: true });
const ONE_PIXEL_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64");
fs.writeFileSync(path.join(folder, "docs", "img", "pixel.png"), ONE_PIXEL_PNG);
fs.writeFileSync(path.join(folder, "top pixel.png"), ONE_PIXEL_PNG);
const guide = path.join(folder, "docs", "guide.md");
const IMAGE_LINES = ["![near](img/pixel.png \"Near\")", "![above](<../top pixel.png>)", "![remote alt](https://images.invalid/remote.png)", "![relative alt](//images.invalid/relative.png)"];
fs.writeFileSync(guide, `# Guide\n\nFirst line\n\n${IMAGE_LINES.join("\n\n")}\n`);

// A provider at an address nobody answers: the room only has to open, never answer.
fs.writeFileSync(path.join(agentDir, "models.json"), JSON.stringify({
	providers: { "fake-claude": { name: "Fake Claude", baseUrl: "http://127.0.0.1:9", api: "anthropic-messages", models: [{ id: "claude-fake", name: "Claude Fake", input: ["text"], contextWindow: 200000, maxTokens: 32000 }] } },
}, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(agentDir, "auth.json"), JSON.stringify({ "fake-claude": { type: "api_key", key: "synthetic-claude" } }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "custom-ai-profiles.json"), JSON.stringify({ version: 1, profiles: [
	{ id: "custom-fake-claude", providerId: "fake-claude", label: "Fake Claude", roomModels: ["claude-fake"], learnModel: "claude-fake", reviewMemoryModel: "claude-fake" },
] }, null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(appDir, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "custom-fake-claude" }, null, 2), { mode: 0o600 });

const waitUntil = waitEvery(150, 15_000);

async function api(pathname: string, init: AuthedFetchInit = {}): Promise<{ status: number; body: any }> {
	const response = await authedFetch(`${baseUrl}${pathname}`, { ...init, headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers } });
	const text = await response.text();
	return { status: response.status, body: text ? JSON.parse(text) : null };
}

let server: ChildProcessWithoutNullStreams | undefined;
const serverOutput: string[] = [];
try {
	server = spawn(process.execPath, ["bin/exxperts-web.cjs", "--port", String(port), "--no-open"], {
		shell: process.platform === "win32",
		...SMOKE_SERVER_SPAWN_TREE_OPTIONS,
		cwd: repoRoot,
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready", 60_000);

	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Handbook", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, `the room is created, got ${created.status}`);
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, `the folder is saved, got ${saved.status} ${JSON.stringify(saved.body)}`);

	const browser = await chromium.launch();
	try {
		const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
		const page = await context.newPage();
		let externalRequests = 0;
		await page.route("**/images.invalid/**", async (route) => { externalRequests++; await route.abort(); });
		await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
		await page.waitForLoadState("networkidle");
		const dismiss = page.locator(".whats-new-close");
		if (await dismiss.count()) await dismiss.click();

		const card = page.locator(".persistent-agent-card").filter({ hasText: "Handbook" });
		await card.waitFor({ timeout: 10_000 });
		await card.getByRole("button", { name: /^(Enter|Resume)$/ }).click();

		const tree = page.locator(".sidebar-workspace-files");
		await tree.locator(".workspace-file-browser-directory", { hasText: "docs" }).click({ timeout: 15_000 });
		await tree.locator(".workspace-file-browser-file", { hasText: "guide.md" }).click({ timeout: 15_000 });

		const images = page.locator('.markdown-editor-tiptap .ProseMirror img[alt="near"], .markdown-editor-tiptap .ProseMirror img[alt="above"]');
		await waitUntil(async () => (await images.count()) === 2, "both images are in the editor");
		await waitUntil(() => images.evaluateAll((all) => all.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)), "both images have loaded");
		const sources = await images.evaluateAll((all) => all.map((img) => new URLSearchParams((img as HTMLImageElement).src.split("?")[1]).get("path")));
		assert(JSON.stringify(sources) === JSON.stringify(["docs/img/pixel.png", "top pixel.png"]), `images resolve against the file, got ${JSON.stringify(sources)}`);
		console.log("  ok  linked images show, near the file and above it");
		for (const mode of ["Edit", "Preview"]) {
			await page.getByRole("button", { name: mode, exact: true }).click();
			for (const alt of ["remote alt", "relative alt"]) {
				const image = page.locator(`.markdown-editor-tiptap img[alt="${alt}"]`);
				await image.waitFor({ state: "visible" });
				assert(!(await image.getAttribute("src")), `${alt} has no loadable source in ${mode}`);
			}
		}
		assert(externalRequests === 0, `external images made ${externalRequests} requests`);
		await page.getByRole("button", { name: "Edit", exact: true }).click();

		const anonymous = await fetch(`${baseUrl}${new URL(await images.first().evaluate((img) => (img as HTMLImageElement).src)).pathname}?conversationId=x&path=docs/img/pixel.png`);
		assert(anonymous.status === 401, `images need a session, got ${anonymous.status}`);
		console.log("  ok  images need a session");

		await page.locator(".markdown-editor-tiptap .ProseMirror p", { hasText: "First line" }).click();
		await page.keyboard.press("End");
		await page.keyboard.type(" edited");
		await page.keyboard.press("Control+s");
		await waitUntil(() => fs.readFileSync(guide, "utf8").includes("First line edited"), "the edit is saved");
		const written = fs.readFileSync(guide, "utf8");
		for (const line of IMAGE_LINES) assert(written.includes(line), `saving keeps ${line}, got: ${written}`);
		console.log("  ok  saving an edit keeps the images' Markdown");

		const composer = page.locator("textarea").first();
		await composer.fill("Read ");
		await tree.locator(".workspace-file-browser-file", { hasText: "guide.md" }).dragTo(composer);
		await waitUntil(async () => (await composer.inputValue()).includes("docs/guide.md"), "the dragged path is in the composer");
		console.log("  ok  a file dragged onto the composer inserts its path");
		await context.close();
	} finally {
		await browser.close();
	}
	console.log("workspace-markdown-images-ui smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-4000));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
