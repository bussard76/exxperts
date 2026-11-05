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
import { pairDevice, remoteRequest } from "./smoke-pairing.js";
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
fs.mkdirSync(path.join(folder, "Library", "LaunchAgents"), { recursive: true });
fs.writeFileSync(path.join(folder, "Library", "LaunchAgents", "example.md"), "protected");
fs.mkdirSync(path.join(folder, "node_modules", "hidden"), { recursive: true });
fs.writeFileSync(path.join(folder, "node_modules", "hidden", "secret.md"), "hidden");
fs.symlinkSync(path.join(folder, "docs"), path.join(folder, "shortcut"));
fs.writeFileSync(path.join(folder, "docs", "other.md"), "# Other\n");
const guide = path.join(folder, "docs", "guide.md");
const IMAGE_LINES = ["![near](img/pixel.png \"Near\")", "![above](<../top pixel.png>)", "[![badge](img/pixel.png)](https://example.invalid)", "[text ![mixed](img/pixel.png)](https://example.invalid)", "![encoded](../top%20pixel.png)", "![remote alt](https://images.invalid/remote.png)", "![relative alt](//images.invalid/relative.png)"];
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
		env: smokeHomeEnv(tempHome, { PORT: String(port), ...SMOKE_SERVER_AUTH_ENV, EXXETA_HOME: repoRoot, EXXPERTS_CODING_AGENT_DIR: agentDir, EXXETA_PERSISTENT_AGENTS_ROOT: agentsRoot, EXXPERTS_REMOTE_TEST_ADDRESS: "::1" }) as NodeJS.ProcessEnv,
	});
	server.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
	server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
	await waitUntil(() => fetch(`${baseUrl}/healthz`).then((r) => r.ok).catch(() => false), "server ready", 60_000);

	const created = await api("/api/persistent-agents", { method: "POST", body: JSON.stringify({ displayName: "Handbook", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
	assert(created.status === 201, `the room is created, got ${created.status}`);
	const agentId = String(created.body?.agent?.id ?? "");
	const saved = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(saved.status === 200, `the folder is saved, got ${saved.status} ${JSON.stringify(saved.body)}`);

	const remoteEnabled = await api("/api/remote/enable", { method: "POST" });
	assert(remoteEnabled.status === 200, "mock remote listener enabled");
	const exposed = await api("/api/remote/rooms/exposure", { method: "POST", body: JSON.stringify({ id: agentId, exposed: true }) });
	assert(exposed.status === 200, "demo room exposed to mock devices");
	const devices = [await pairDevice(port, "Demo reader", "read-only"), await pairDevice(port, "Demo writer", "full")];
	const matrixQuery = (route: string, file: string) => `/api/persistent-agents/${encodeURIComponent(agentId)}/${route}?${new URLSearchParams({ conversationId: "matrix-test", path: file })}`;
	const originalContent = fs.readFileSync(guide, "utf8");
	for (const [tools, canList, canRead, canWrite, bash] of [
		[[], false, false, false, true],
		[[], false, false, false, false],
		[["ls"], true, false, false],
		[["read"], false, true, false],
		[["write"], false, false, false],
		[["read", "write"], false, true, true],
	] as const) {
		const configured = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "custom", allowedToolNames: tools }, bashEnabled: bash === true }) });
		assert(configured.status === 200, `configure matrix tools ${tools}`);
		const listing = await api(matrixQuery("workspace-files", ""));
		assert(listing.status === 200 && Boolean(listing.body.root) === canList, `tree permission for ${tools}`);
		const markdown = await api(matrixQuery("workspace-markdown", "docs/guide.md"));
		assert((markdown.status === 200) === canRead, `Markdown read permission for ${tools}`);
		const image = await authedFetch(`${baseUrl}${matrixQuery("workspace-image", "docs/img/pixel.png")}`);
		assert((image.status === 200) === canRead, `image read permission for ${tools}`);
		const revision = `sha256:${(await import("node:crypto")).createHash("sha256").update(originalContent).digest("hex")}`;
		const put = await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: originalContent, revision }) });
		assert((put.status === 200) === canWrite, `Markdown write permission for ${tools}`);
		assert(fs.readFileSync(guide, "utf8") === originalContent, `matrix preserves content for ${tools}`);
		for (const [index, device] of devices.entries()) {
			const headers = { Cookie: device.cookie };
			const remoteTree = await remoteRequest(port, matrixQuery("workspace-files", ""), { headers });
			assert(remoteTree.status === 200 && Boolean(JSON.parse(remoteTree.body).root) === canList, `device ${index} tree permission for ${tools}`);
			const remoteMarkdown = await remoteRequest(port, matrixQuery("workspace-markdown", "docs/guide.md"), { headers });
			assert((remoteMarkdown.status === 200) === canRead, `device ${index} Markdown permission for ${tools}`);
			const remoteImage = await remoteRequest(port, matrixQuery("workspace-image", "docs/img/pixel.png"), { headers });
			assert((remoteImage.status === 200) === canRead, `device ${index} image permission for ${tools}`);
			const remoteWrite = await remoteRequest(port, matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ content: originalContent, revision }) });
			assert((remoteWrite.status === 200) === (index === 1 && canWrite), `device ${index} write permission for ${tools}`);
			assert(fs.readFileSync(guide, "utf8") === originalContent, `device ${index} preserves content for ${tools}`);
		}
	}
	const restored = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ toolSelection: { kind: "standard" } }) });
	assert(restored.status === 200, "restore standard tools");

	const policyPath = path.join(agentsRoot, agentId, "runtime", "workspace-default.json");
	const storedPolicy = JSON.parse(fs.readFileSync(policyPath, "utf8"));
	storedPolicy.modes.write = false;
	fs.writeFileSync(policyPath, JSON.stringify(storedPolicy));
	const inconsistentRevision = `sha256:${(await import("node:crypto")).createHash("sha256").update(originalContent).digest("hex")}`;
	const normalizedWrite = await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: originalContent, revision: inconsistentRevision }) });
	assert(normalizedWrite.status === 200, "selected writer enables writes despite a stale stored flag");
	for (const [index, device] of devices.entries()) {
		const response = await remoteRequest(port, matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", headers: { Cookie: device.cookie, "content-type": "application/json" }, body: JSON.stringify({ content: originalContent, revision: inconsistentRevision }) });
		assert((response.status === 200) === (index === 1), "normalized writer still respects the paired device capability");
	}
	assert(fs.readFileSync(guide, "utf8") === originalContent, "normalization test preserves file contents");
	storedPolicy.modes.read = false;
	fs.writeFileSync(policyPath, JSON.stringify(storedPolicy));
	const disabledTree = await api(matrixQuery("workspace-files", ""));
	assert(disabledTree.status === 200 && disabledTree.body.root === null, "disabled read mode hides the tree");
	for (const route of ["workspace-markdown", "workspace-image"]) {
		const file = route === "workspace-image" ? "docs/img/pixel.png" : "docs/guide.md";
		const local = await authedFetch(`${baseUrl}${matrixQuery(route, file)}`);
		assert(local.status !== 200, `disabled read mode denies local ${route}`);
		for (const device of devices) {
			const remote = await remoteRequest(port, matrixQuery(route, file), { headers: { Cookie: device.cookie } });
			assert(remote.status !== 200 && !remote.body.includes(originalContent), `disabled read mode denies paired ${route}`);
		}
	}
	const disabledPut = await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: "overwrite", revision: inconsistentRevision }) });
	assert(disabledPut.status !== 200 && fs.readFileSync(guide, "utf8") === originalContent, "disabled read mode denies writes");
	for (const device of devices) {
		const remoteTree = await remoteRequest(port, matrixQuery("workspace-files", ""), { headers: { Cookie: device.cookie } });
		assert(remoteTree.status === 200 && JSON.parse(remoteTree.body).root === null, "disabled read mode hides tree from paired devices");
		const remotePut = await remoteRequest(port, matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", headers: { Cookie: device.cookie, "content-type": "application/json" }, body: JSON.stringify({ content: "overwrite", revision: inconsistentRevision }) });
		assert(remotePut.status !== 200 && fs.readFileSync(guide, "utf8") === originalContent, "disabled read mode denies paired writes");
	}
	storedPolicy.modes.read = true;
	fs.writeFileSync(policyPath, JSON.stringify(storedPolicy));

	const alias = path.join(tempHome, "workspace-alias");
	const other = path.join(tempHome, "workspace-other");
	fs.mkdirSync(other);
	fs.symlinkSync(folder, alias);
	const aliasGrant = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: alias, workspaceAccessMode: "localFiles" }) });
	assert(aliasGrant.status === 200, "grant alias root");
	fs.unlinkSync(alias);
	fs.symlinkSync(other, alias);
	const aliasTree = await api(matrixQuery("workspace-files", ""));
	assert(aliasTree.status !== 200 || aliasTree.body.root === null, "retargeted grant must not list the old root");
	const aliasRead = await api(matrixQuery("workspace-markdown", "docs/guide.md"));
	assert(aliasRead.status !== 200, "retargeted grant must not read the old root");
	const aliasImage = await authedFetch(`${baseUrl}${matrixQuery("workspace-image", "docs/img/pixel.png")}`);
	assert(aliasImage.status !== 200, "retargeted grant must not read images");
	const aliasWrite = await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: "overwrite", revision: `sha256:${(await import("node:crypto")).createHash("sha256").update(originalContent).digest("hex")}` }) });
	assert(aliasWrite.status !== 200 && fs.readFileSync(guide, "utf8") === originalContent, "retargeted grant must not write the old root");
	for (const device of devices) {
		for (const [route, file] of [["workspace-files", ""], ["workspace-markdown", "docs/guide.md"], ["workspace-image", "docs/img/pixel.png"]]) {
			const response = await remoteRequest(port, matrixQuery(route, file), { headers: { Cookie: device.cookie } });
			assert(response.status !== 200 || (route === "workspace-files" && JSON.parse(response.body).root === null), "device cannot read retargeted grant");
			assert(!response.body.includes(folder) && !response.body.includes(originalContent), "device response hides workspace path and content");
		}
	}
	const resetGrant = await api(`/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-default`, { method: "PUT", body: JSON.stringify({ root: folder, workspaceAccessMode: "localFiles" }) });
	assert(resetGrant.status === 200, "restore workspace root");

	const rootListing = await api(matrixQuery("workspace-files", ""));
	assert(rootListing.status === 200 && rootListing.body.root.basename === "handbook" && rootListing.body.path === "", "tree root shape");
	assert(rootListing.body.entries.every((entry: any) => !["node_modules", "shortcut"].includes(entry.name)), "tree hides denied entries and symlinks");
	fs.mkdirSync(path.join(folder, "empty"));
	const emptyListing = await api(matrixQuery("workspace-files", "empty"));
	assert(emptyListing.status === 200 && emptyListing.body.entries.length === 0, "empty directory");
	assert((await api(matrixQuery("workspace-files", "../other"))).status === 400, "tree rejects traversal");
	const routeRead = await api(matrixQuery("workspace-markdown", "docs/guide.md"));
	assert(routeRead.status === 200 && routeRead.body.content === originalContent && routeRead.body.encoding === "utf-8" && routeRead.body.bytes === Buffer.byteLength(originalContent) && /^sha256:[a-f0-9]{64}$/.test(routeRead.body.revision) && routeRead.body.readOnly === false, "Markdown response fields");
	for (const [file, expected] of [["../guide.md", 400], ["docs/guide.txt", 400], ["docs/missing.md", 404]] as const) {
		assert((await api(matrixQuery("workspace-markdown", file))).status === expected, `Markdown invalid ${file}`);
	}
	for (const [name, bytes, expected] of [["limit.md", Buffer.alloc(128 * 1024, 65), 200], ["big.md", Buffer.alloc(128 * 1024 + 1, 65), 413], ["binary.md", Buffer.from([65, 0]), 415], ["invalid.md", Buffer.from([255]), 415]] as const) {
		fs.writeFileSync(path.join(folder, name), bytes);
		assert((await api(matrixQuery("workspace-markdown", name))).status === expected, `Markdown validation ${name}`);
	}
	for (const body of [{ content: 3, revision: routeRead.body.revision }, { content: "ok", revision: "bad" }]) {
		assert((await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify(body) })).status === 400, "invalid write body");
	}
	const missingWrite = await api(matrixQuery("workspace-markdown", "docs/missing.md"), { method: "PUT", body: JSON.stringify({ content: "new", revision: routeRead.body.revision }) });
	assert(missingWrite.status === 404 && !fs.existsSync(path.join(folder, "docs", "missing.md")), "PUT does not create a file");
	const changed = await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: originalContent + "change", revision: routeRead.body.revision }) });
	assert(changed.status === 200 && changed.body.content === originalContent + "change" && changed.body.revision !== routeRead.body.revision, "PUT returns replacement and revision");
	const stale = await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: "stale", revision: routeRead.body.revision }) });
	assert(stale.status === 409 && stale.body.currentRevision === changed.body.revision && fs.readFileSync(guide, "utf8") === originalContent + "change", "stale PUT retains current bytes and revision");
	assert((await api(matrixQuery("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: originalContent, revision: changed.body.revision }) })).status === 200, "restore demo content");
	for (const [extension, type] of [["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["gif", "image/gif"], ["webp", "image/webp"], ["svg", "image/svg+xml"]]) {
		fs.writeFileSync(path.join(folder, `demo.${extension}`), ONE_PIXEL_PNG);
		const response = await authedFetch(`${baseUrl}${matrixQuery("workspace-image", `demo.${extension}`)}`);
		assert(response.status === 200 && response.headers.get("content-type")?.startsWith(type), `image content type ${extension}`);
		assert(response.headers.get("content-security-policy") === "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:" && response.headers.get("x-content-type-options") === "nosniff" && response.headers.get("referrer-policy") === "no-referrer" && response.headers.get("cache-control") === "no-store", "image security headers");
	}
	fs.writeFileSync(path.join(folder, "large.png"), ONE_PIXEL_PNG);
	fs.truncateSync(path.join(folder, "large.png"), 20 * 1024 * 1024 + 1);
	assert((await authedFetch(`${baseUrl}${matrixQuery("workspace-image", "large.png")}`)).status === 413, "oversized image rejected");
	for (const [file, expected] of [["../demo.png", 400], ["missing.png", 404], ["notes.txt", 400], ["node_modules/hidden/x.png", 403]] as const) {
		assert((await authedFetch(`${baseUrl}${matrixQuery("workspace-image", file)}`)).status === expected, `image validation ${file}`);
	}

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
		assert(written === originalContent.replace("First line", "First line edited"), `saving preserves every original byte apart from the edit: ${JSON.stringify(written)}`);
		console.log("  ok  saving an edit keeps the images' Markdown");

		await page.route("**/workspace-markdown?**", async (route) => {
			if (route.request().method() === "PUT") await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "mock save failure" }) });
			else await route.continue();
		});
		const paragraph = page.locator(".markdown-editor-tiptap .ProseMirror p", { hasText: "First line edited" });
		await paragraph.click();
		await page.keyboard.press("End");
		await page.keyboard.type(" draft");
		await page.locator(".markdown-editor-error").waitFor({ state: "visible" });
		assert((await paragraph.textContent())?.includes(" draft"), "failed save retains the draft");
		await page.unroute("**/workspace-markdown?**");
		fs.writeFileSync(guide, written.replace("First line edited", "First line external"));
		await page.locator(".markdown-editor-save").click();
		await page.locator(".markdown-editor-conflict").waitFor({ state: "visible" });
		assert((await paragraph.textContent())?.includes(" draft"), "conflict retains the draft");
		await page.getByRole("button", { name: "Keep mine" }).click();
		await waitUntil(() => fs.readFileSync(guide, "utf8").includes("First line edited draft"), "keep mine saves the draft");
		await page.route("**/workspace-markdown?**", async (route) => {
			if (route.request().method() === "PUT") await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "mock save failure" }) });
			else await route.continue();
		});
		await paragraph.click();
		await page.keyboard.press("End");
		await page.keyboard.type(" unsaved");
		await tree.locator(".workspace-file-browser-file", { hasText: "other.md" }).click();
		const prompt = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
		await prompt.getByRole("button", { name: "Cancel" }).click();
		assert((await paragraph.textContent())?.includes(" unsaved"), "cancel retains draft");
		await tree.locator(".workspace-file-browser-file", { hasText: "other.md" }).click();
		await prompt.getByRole("button", { name: "Save and continue" }).click();
		await page.locator(".markdown-editor-error").waitFor({ state: "visible" });
		assert((await paragraph.textContent())?.includes(" unsaved"), "failed navigation save retains editor and draft");
		await tree.locator(".workspace-file-browser-file", { hasText: "other.md" }).click();
		await prompt.getByRole("button", { name: "Discard changes" }).click();
		await page.getByRole("complementary", { name: "Markdown editor: other.md" }).waitFor();
		await page.unroute("**/workspace-markdown?**");
		await tree.locator(".workspace-file-browser-file", { hasText: "guide.md" }).click();
		const reopened = page.locator(".markdown-editor-tiptap .ProseMirror p", { hasText: "First line edited draft" });
		await reopened.waitFor();
		await page.route("**/workspace-markdown?**", async (route) => {
			if (route.request().method() === "PUT") await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "mock save failure" }) });
			else await route.continue();
		});
		await reopened.click();
		await page.keyboard.press("End");
		await page.keyboard.type(" reload draft");
		await page.locator(".markdown-editor-error").waitFor({ state: "visible" });
		await page.unroute("**/workspace-markdown?**");
		fs.writeFileSync(guide, fs.readFileSync(guide, "utf8").replace("First line edited draft", "First line latest"));
		await page.locator(".markdown-editor-save").click();
		await page.locator(".markdown-editor-conflict").waitFor({ state: "visible" });
		await page.getByRole("button", { name: "Reload", exact: true }).click();
		await page.locator(".markdown-editor-tiptap .ProseMirror p", { hasText: "First line latest" }).waitFor();
		console.log("  ok  failed saves, conflicts, reload and navigation retain or discard drafts as chosen");

		const composer = page.locator("textarea").first();
		await composer.fill("Read ");
		await tree.locator(".workspace-file-browser-file", { hasText: "guide.md" }).dragTo(composer);
		await waitUntil(async () => (await composer.inputValue()).includes("docs/guide.md"), "the dragged path is in the composer");
		console.log("  ok  a file dragged onto the composer inserts its path");

		const imageUrl = new URL(await images.first().evaluate((img) => (img as HTMLImageElement).src));
		const conversationId = imageUrl.searchParams.get("conversationId")!;
		const treeRoute = (relative: string) => `/api/persistent-agents/${encodeURIComponent(agentId)}/workspace-files?${new URLSearchParams({ conversationId, path: relative })}`;
		for (const denied of ["node_modules", "node_modules/hidden", "shortcut/img"]) {
			const response = await api(treeRoute(denied));
			assert(response.status !== 200, `direct listing of ${denied} must be denied`);
		}
		const fileRoute = (route: string, relative: string) => `/api/persistent-agents/${encodeURIComponent(agentId)}/${route}?${new URLSearchParams({ conversationId, path: relative })}`;
		const protectedRoute = fileRoute("workspace-markdown", "Library/LaunchAgents/example.md");
		const protectedFile = await api(protectedRoute);
		assert(protectedFile.status === 200, "protected file is readable");
		const blockedWrite = await api(protectedRoute, { method: "PUT", body: JSON.stringify({ content: "overwritten", revision: protectedFile.body.revision }) });
		assert(blockedWrite.status === 403 && fs.readFileSync(path.join(folder, "Library", "LaunchAgents", "example.md"), "utf8") === "protected", "write restrictions prevent replacement of a protected file");
		const remoteProtected = await remoteRequest(port, protectedRoute, { method: "PUT", headers: { Cookie: devices[1].cookie, "content-type": "application/json" }, body: JSON.stringify({ content: "overwritten", revision: protectedFile.body.revision }) });
		assert(remoteProtected.status === 403 && fs.readFileSync(path.join(folder, "Library", "LaunchAgents", "example.md"), "utf8") === "protected", "paired writer cannot replace a protected file");
		const beforeSwap = await api(fileRoute("workspace-markdown", "docs/guide.md"));
		assert(beforeSwap.status === 200, "Markdown is readable before the root changes");
		const replacement = path.join(tempHome, "replacement");
		fs.mkdirSync(path.join(replacement, "docs", "img"), { recursive: true });
		fs.writeFileSync(path.join(replacement, "docs", "guide.md"), "replacement private");
		fs.writeFileSync(path.join(replacement, "docs", "img", "pixel.png"), ONE_PIXEL_PNG);
		fs.renameSync(folder, `${folder}-original`);
		fs.symlinkSync(replacement, folder);
		for (const url of [treeRoute(""), fileRoute("workspace-markdown", "docs/guide.md"), fileRoute("workspace-image", "docs/img/pixel.png")]) {
			const response = await authedFetch(`${baseUrl}${url}`);
			const body = await response.text();
			assert(response.status !== 200 || (!body.includes("replacement private") && !body.includes("guide.md") && !body.includes("PNG")), "retargeted root must not expose replacement data");
		}
		const attempt = await api(fileRoute("workspace-markdown", "docs/guide.md"), { method: "PUT", body: JSON.stringify({ content: "overwrite", revision: beforeSwap.body.revision }) });
		assert(attempt.status !== 200 && fs.readFileSync(path.join(replacement, "docs", "guide.md"), "utf8") === "replacement private", "retargeted root must not be written");
		await context.close();
	} finally {
		await browser.close();
	}
	console.log("workspace-markdown-images-ui smoke: ok");
} catch (error) {
	console.error(serverOutput.join("").slice(-4000).replace(/token=[^\s]+/g, "token=<redacted>"));
	throw error;
} finally {
	await stopSmokeServer(server);
	fs.rmSync(tempRoot, { recursive: true, force: true });
}
