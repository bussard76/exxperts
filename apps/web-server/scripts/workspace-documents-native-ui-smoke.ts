// Exercise the actual desktop shell and owner with isolated state and a fake feed.
// Set T20_NATIVE_STUCK=1 for the independent outstanding-exchange case.
import { _electron as electron, type ElectronApplication } from "playwright";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort } from "./smoke-server-process.js";
import { waitEvery } from "./smoke-wait.js";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "exxperts-documents-native-"));
const port = await freePort();
const stuck = process.env.T20_NATIVE_STUCK === "1";
const save = process.env.T20_NATIVE_SAVE === "1";
const lateAbort = process.env.T20_NATIVE_LATE_ABORT === "1";
const dirty = process.env.T20_NATIVE_DIRTY === "1" || save || lateAbort;
const late = process.env.T20_NATIVE_LATE === "1";
const active = process.env.T20_NATIVE_ACTIVE === "1" || dirty || late;
const quit = process.env.T20_NATIVE_QUIT === "1";
const prepare = process.env.T20_NATIVE_PREPARE === "1" || active || quit;
const feed = http.createServer((_request, response) => {
	response.writeHead(200, { "content-type": "application/json" });
	response.end(JSON.stringify({ tag_name: "v0.0.0", prerelease: false, draft: false }));
});
await new Promise<void>((resolve) => feed.listen(0, "127.0.0.1", resolve));
const address = feed.address();
assert(address && typeof address !== "string", "the fake update feed listens locally");
if (active) {
	const agent = path.join(scratch, ".exxperts", "agent");
	const app = path.join(scratch, ".exxperts", "app");
	fs.mkdirSync(agent, { recursive: true });
	fs.mkdirSync(app, { recursive: true });
	fs.writeFileSync(path.join(agent, "models.json"), JSON.stringify({ providers: { "openai-compatible": { name: "Synthetic Gateway", baseUrl: `http://127.0.0.1:${address.port}/v1`, api: "openai-completions", models: [{ id: "room-model", name: "Room Model", contextWindow: 128000, maxTokens: 16384 }] } } }));
	fs.writeFileSync(path.join(agent, "auth.json"), JSON.stringify({ "openai-compatible": { type: "api_key", key: "synthetic-native-key" } }));
	fs.writeFileSync(path.join(app, "openai-compatible-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible", providerId: "openai-compatible", label: "Synthetic Gateway", roomModels: [{ modelId: "room-model", label: "Room Model" }], maintenanceModel: "room-model" }));
	fs.writeFileSync(path.join(app, "persistent-agent-ai-profile.json"), JSON.stringify({ profileId: "openai-compatible" }));
}
let application: ElectronApplication | undefined;
try {
	application = await electron.launch({
		chromiumSandbox: true,
		executablePath: path.join(root, "apps/desktop/node_modules/electron/dist/electron"),
		args: [path.join(root, "apps/desktop/dist/main.js")],
		cwd: path.join(root, "apps/desktop"),
		env: { ...process.env, HOME: scratch, XDG_CONFIG_HOME: path.join(scratch, "config"), EXXPERTS_DESKTOP_SCRATCH_HOME: scratch, EXXPERTS_DESKTOP_SERVER_ROOT: root, EXXPERTS_DESKTOP_PORT: String(port), EXXPERTS_SERVER_BUNDLE: "1", EXXPERTS_DESKTOP_UPDATE_FEED: `http://127.0.0.1:${address.port}/feed` },
		timeout: 60_000,
	});
	const waitUntil = waitEvery(100, 30_000);
	await waitUntil(async () => application!.evaluate(({ BrowserWindow }, portNumber) => BrowserWindow.getAllWindows().some((window: any) => window.webContents.getURL().startsWith(`http://localhost:${portNumber}/`) && window.isVisible()), port), "the real desktop owner is visible");
	const owner = await application.evaluate(({ BrowserWindow }, portNumber) => {
		const window = BrowserWindow.getAllWindows().find((candidate: any) => candidate.webContents.getURL().startsWith(`http://localhost:${portNumber}/`));
		if (!window) throw new Error("no owner window");
		return window.id;
	}, port);
	if (prepare) {
		const page = application.windows().find((candidate) => candidate.url().startsWith(`http://localhost:${port}/`));
		if (active) {
			assert(page, "the real owner page is available");
			const workspace = path.join(scratch, "invented-workspace");
			if (dirty) { fs.mkdirSync(workspace); fs.writeFileSync(path.join(workspace, "invented.md"), "# Invented native draft\n"); }
			const created = await page.evaluate(async ({ dirty, workspace }) => {
				const response = await fetch("/api/persistent-agents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName: "Invented Native Room", userName: "Synthetic User", preferredUserAddress: "Synthetic User" }) });
				if (response.status !== 201) return response.status;
				if (dirty) {
					const body = await response.json();
					const configured = await fetch(`/api/persistent-agents/${body.agent.id}/workspace-default`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ root: workspace, workspaceAccessMode: "localFiles" }) });
					if (!configured.ok) return configured.status;
				}
				return response.status;
			}, { dirty, workspace });
			assert(created === 201, "the isolated native test creates an invented room");
			if (lateAbort) await page.addInitScript({ content: `const realTimeout = window.setTimeout; window.setTimeout = (callback, delay, ...args) => realTimeout(callback, delay === 1000 ? 30000 : delay, ...args);` });
			await page.reload();
			const dismiss = page.locator(".whats-new-close");
			if (await dismiss.count()) await dismiss.click();
			await page.locator(".persistent-agent-card").filter({ hasText: "Invented Native Room" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
			await page.locator(".sidebar-workspace-files").waitFor();
			if (dirty) {
				await page.locator(".sidebar-workspace-files .workspace-file-browser-file", { hasText: "invented.md" }).click();
				const editor = page.locator(".markdown-editor-tiptap .ProseMirror");
				await editor.getByText("Invented native draft").waitFor();
				await editor.click();
				await page.keyboard.type(" retained native edit");
			}
		}
		await application.evaluate(({ BrowserWindow }, fixture) => {
			const window = BrowserWindow.fromId(fixture.id)!;
			const original = window.webContents.executeJavaScript.bind(window.webContents);
			(window as any).__t20Polls = 0;
			(window as any).__t20Prepares = 0;
			(window as any).__t20QuitPrepares = 0;
			(window as any).__t20NoSession = 0;
			(window as any).__t20Prepared = 0;
			(window as any).__t20Completed = 0;
			(window as any).__t20AbortAck = 0;
			(window as any).__t20Commits = 0;
			(window as any).__t20Trace = [];
			(window.webContents as any).executeJavaScript = (script: string, ...args: unknown[]) => {
				if (script.includes("__exxpertsDocuments")) {
					(window as any).__t20Polls++;
					if (script.includes('"native-prepare"')) { (window as any).__t20Prepares++; (window as any).__t20Trace.push("prepare"); if (script.includes('"disposition":"quit"')) (window as any).__t20QuitPrepares++; }
					if (script.includes('"native-abort"')) (window as any).__t20Trace.push("abort");
					if (script.includes('"native-commit"')) (window as any).__t20Commits++;
				}
				const result = (original as any)(script, ...args);
				const tracked = Promise.resolve(result).then((output: any) => {
					if (output?.items?.[0]?.kind === "no-session") (window as any).__t20NoSession++;
					if (output?.items?.[0]?.kind === "completed") (window as any).__t20Completed++;
					if (output?.items?.[0]?.kind === "abort-ack") { (window as any).__t20AbortAck++; (window as any).__t20Trace.push("abort-ack"); }
					if (output?.items?.[0]?.kind === "guard-result" && output.items[0].result?.kind === "prepared") (window as any).__t20Prepared++;
					return output;
				});
				if (((fixture.late && script.includes('"native-prepare"')) || (fixture.lateAbort && script.includes('"native-abort"'))) && !(window as any).__t20Held) {
					(window as any).__t20Held = true;
					return new Promise((resolve, reject) => { (window as any).__t20Release = () => tracked.then(resolve, reject); });
				}
				return script.includes("__exxpertsDocuments") ? tracked : result;
			};
		}, { id: owner, late, lateAbort });
		await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Polls >= 2, owner), "the real owner has been polled");
		if (quit) await application.evaluate(({ app }) => app.quit()).catch(() => {});
		else await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.close(), owner);
		if (late) {
			await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => typeof (BrowserWindow.fromId(id) as any)?.__t20Release === "function", owner), "the real prepare reply is held");
			await new Promise((resolve) => setTimeout(resolve, 2_300));
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Commits === 0, owner), "the outstanding preparation cannot commit");
			await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20Release(), owner);
			await new Promise((resolve) => setTimeout(resolve, 1_000));
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Commits === 0, owner), "a late prepared reply cannot revive native commit");
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20AbortAck === 1, owner), "the late prepared attempt is aborted and acknowledged");
		} else if (dirty) {
			assert(page, "the owner page is available for the native prompt");
			const prompt = page.getByRole("dialog", { name: "Unsaved Markdown changes" });
			if (save) {
				let beginWrite!: () => void, releaseWrite!: () => void, finishWrite!: () => void, writes = 0;
				const started = new Promise<void>((resolve) => { beginWrite = resolve; });
				const released = new Promise<void>((resolve) => { releaseWrite = resolve; });
				const finished = new Promise<void>((resolve) => { finishWrite = resolve; });
				await page.route("**/workspace-markdown?*", async (route) => {
					if (route.request().method() !== "PUT") return route.continue();
					writes++;
					const response = await route.fetch();
					beginWrite();
					await released;
					await route.fulfill({ response }).catch(() => {});
					finishWrite();
				});
				try {
					await prompt.getByRole("button", { name: "Save and continue" }).click();
					await started;
					await new Promise((resolve) => setTimeout(resolve, 300));
					assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Completed === 0, owner), "native completion waits for the sent Save response");
					releaseWrite();
					await finished;
					await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Completed === 1, owner), "native Save reaches one matching completion");
					assert(writes === 1, "native Save issues exactly one workspace write");
				} finally { releaseWrite(); if (writes) await finished; await page.unroute("**/workspace-markdown?*"); }
			} else {
				await prompt.getByRole("button", { name: "Cancel", exact: true }).click();
				if (lateAbort) {
					await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => typeof (BrowserWindow.fromId(id) as any)?.__t20Release === "function", owner), "the actual abort acknowledgement is held");
					await new Promise((resolve) => setTimeout(resolve, 2_300));
					await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.close(), owner);
					await new Promise((resolve) => setTimeout(resolve, 300));
					assert(!(await prompt.isVisible()), "a missing abort acknowledgement reserves the shell against another close");
					await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20Release(), owner);
				}
				await new Promise((resolve) => setTimeout(resolve, 1_000));
				assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20AbortAck === 1, owner), "the native shell aborts a cancelled dirty action and receives its matching acknowledgement");
				assert((await page.locator(".markdown-editor-tiptap .ProseMirror").textContent())?.includes("retained native edit"), "native Cancel retains the actual edited draft");
				await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.close(), owner);
				try { await prompt.waitFor({ state: "visible", timeout: 5_000 }); }
				catch (error) { if (lateAbort) throw new Error(`late abort trace: ${JSON.stringify(await application!.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Trace, owner))}`, { cause: error }); throw error; }
				await prompt.getByRole("button", { name: "Cancel", exact: true }).click();
			}
		} else await new Promise((resolve) => setTimeout(resolve, 1_000));
		if (!dirty && !late) assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Prepares === 1, owner), "the actual native action sends exactly one owner prepare");
		if (quit) assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20QuitPrepares === 1, owner), "the actual Quit uses a quit disposition");
		if (active && !dirty && !late) {
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Prepared === 1, owner), "the actual owner prepares the active clean room exactly once");
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Completed === 1, owner), "the real owner completes only after the shell sends no-child evidence");
		}
		else if (!dirty && !late) assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20NoSession === 1, owner), "the actual owner returns the matching empty-session response");
		assert(await application.evaluate(({ BrowserWindow }, id) => Boolean(BrowserWindow.fromId(id)?.isVisible()), owner), "the staged no-session response cannot yet continue the native action");
	} else {
	// Fault the shell's actual outbound exchange, retaining its ordinary close entrypoint.
	await application.evaluate(({ BrowserWindow }, fault) => {
		const window = BrowserWindow.fromId(fault.id)!;
		(window as any).__t20Stuck = fault.stuck;
		const original = window.webContents.executeJavaScript.bind(window.webContents);
		(window as any).__t20Exchanges = 0;
		(window.webContents as any).executeJavaScript = (script: string, ...args: unknown[]) => {
			if (script.includes("__exxpertsDocuments")) {
				(window as any).__t20Exchanges++;
				if ((window as any).__t20Stuck) {
					const actual = Promise.resolve((original as any)(script, ...args)).catch(() => null);
					return new Promise((resolve, reject) => { (window as any).__t20Release = () => actual.then(resolve, reject); });
				}
				return Promise.resolve({ malformed: true });
			}
			return (original as any)(script, ...args);
		};
	}, { id: owner, stuck });
	await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Exchanges > 0, owner), "the shell polls the owner endpoint");
	await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.close(), owner);
	await new Promise((resolve) => setTimeout(resolve, stuck ? 2_300 : 500));
	assert(await application.evaluate(({ BrowserWindow }, id) => Boolean(BrowserWindow.fromId(id)?.isVisible()), owner), `${stuck ? "a stuck" : "a malformed"} owner exchange cannot authorize native close-to-hide`);
	if (stuck) {
		assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20Exchanges === 1, owner), "a stuck exchange never overlaps a second evaluation");
		await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20Release(), owner);
		await new Promise((resolve) => setTimeout(resolve, 500));
		assert(await application.evaluate(({ BrowserWindow }, id) => Boolean(BrowserWindow.fromId(id)?.isVisible()), owner), "a late owner reply cannot revive the expired native close");
	}
	}
} finally {
	if (application) {
		const ownedServers: number[] = [];
		if (process.platform === "linux") {
			try {
				const pids = execFileSync("fuser", ["-n", "tcp", String(port)], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split(/\s+/).filter(Boolean).map(Number);
				for (const pid of pids) {
					try {
						const args = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
						if (args.includes(path.join(root, "apps/web-server/dist/server.mjs"))) ownedServers.push(pid);
					} catch { /* The owned server may already have exited. */ }
				}
			} catch { /* The owned port may already have closed. */ }
		}
		await application.evaluate(({ app }) => app.exit(0)).catch(() => {});
		for (const pid of ownedServers) { try { process.kill(pid, "SIGTERM"); } catch { /* It already stopped. */ } }
		await application.close().catch(() => {});
	}
	await new Promise<void>((resolve) => feed.close(() => resolve()));
	fs.rmSync(scratch, { recursive: true, force: true });
}
