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
 } finally { await browser.close(); }
} finally { if (server) await stopSmokeServer(server); fs.rmSync(tempRoot, { recursive: true, force: true }); }
