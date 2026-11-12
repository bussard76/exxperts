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
const lateEmpty = process.env.T20_NATIVE_EMPTY_LATE === "1";
const late = process.env.T20_NATIVE_LATE === "1" || lateEmpty;
const foreignOpener = process.env.T20_NATIVE_FOREIGN === "1";
const fallbackBounds = process.env.T20_NATIVE_BOUNDS_FALLBACK === "1";
const bounds = process.env.T20_NATIVE_BOUNDS === "1" || fallbackBounds;
const popup = process.env.T20_NATIVE_POPUP === "1" || bounds;
const armOnly = process.env.T20_NATIVE_ARM === "1" || popup || foreignOpener;
const active = process.env.T20_NATIVE_ACTIVE === "1" || dirty || (late && !lateEmpty) || armOnly;
const quit = process.env.T20_NATIVE_QUIT === "1";
const reloadKey = process.env.T20_NATIVE_RELOAD_KEY === "1";
const reload = process.env.T20_NATIVE_RELOAD === "1" || reloadKey;
const prepare = process.env.T20_NATIVE_PREPARE === "1" || active || quit || reload;
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
		await application.evaluate(({ BrowserWindow }, fixture) => {
			const window = BrowserWindow.fromId(fixture.id)!;
			const original = window.webContents.executeJavaScript.bind(window.webContents);
			(window as any).__t20Polls = 0;
			(window as any).__t20Prepares = 0;
			(window as any).__t20QuitPrepares = 0;
			(window as any).__t20ReloadPrepares = 0;
			(window as any).__t20Arms = 0;
			(window as any).__t20ActivePolls = 0;
			(window as any).__t20Permits = 0;
			(window as any).__t20OpaquePermit = false;
			(window as any).__t20PermitName = null;
			(window as any).__t20Registered = 0;
			(window as any).__t20RegisteredAck = 0;
			(window as any).__t20NoSession = 0;
			(window as any).__t20Prepared = 0;
			(window as any).__t20Completed = 0;
			(window as any).__t20AbortAck = 0;
			(window as any).__t20Commits = 0;
			(window as any).__t20Trace = [];
			(window.webContents as any).executeJavaScript = (script: string, ...args: unknown[]) => {
				if (script.includes("__exxpertsDocuments")) {
					(window as any).__t20Polls++;
					if (script.includes('"native-prepare"')) { (window as any).__t20Prepares++; (window as any).__t20Trace.push("prepare"); if (script.includes('"disposition":"quit"')) (window as any).__t20QuitPrepares++; if (script.includes('"disposition":"reload"')) (window as any).__t20ReloadPrepares++; }
					if (script.includes('"native-abort"')) (window as any).__t20Trace.push("abort");
					if (script.includes('"native-commit"')) (window as any).__t20Commits++;
					if (script.includes('"child-registered"')) (window as any).__t20Registered++;
					if (script.includes('"popup-permit"')) {
						(window as any).__t20Permits++;
						const match = script.match(/endpoint\.step\((.*)\) : null/);
						if (match) {
							const item = JSON.parse(match[1]).items[0];
							(window as any).__t20PermitName = item.permit?.frameName;
							(window as any).__t20OpaquePermit = /^exxperts-doc-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(item.permit?.frameName) && item.permit.frameName !== item.permit.permitId;
						}
					}
				}
				const result = (original as any)(script, ...args);
				const tracked = Promise.resolve(result).then((output: any) => {
					if (output?.status?.stamp?.roomId) (window as any).__t20ActivePolls++;
					if (script.includes('"child-registered"') && output?.items?.length === 0 && output?.sequence === output?.ack) (window as any).__t20RegisteredAck++;
					if (output?.items?.[0]?.kind === "no-session") (window as any).__t20NoSession++;
					if (output?.items?.[0]?.kind === "arm-popup") (window as any).__t20Arms++;
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
			await page.waitForLoadState("networkidle");
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
				const polls = await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20ActivePolls as number, owner);
				await waitUntil(() => application!.evaluate(({ BrowserWindow }, fixture) => (BrowserWindow.fromId(fixture.id) as any)?.__t20ActivePolls > fixture.polls, { id: owner, polls }), "the shell sees the edited draft generation");
			}
		}

		await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Polls >= 2, owner), "the real owner has been polled");
		if (active) await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20ActivePolls >= 2, owner), "the current room owner has been polled");
		if (armOnly) {
			await new Promise((resolve) => setTimeout(resolve, 1_000));
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Arms === 1, owner), "the real current owner arms one native popup");
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Permits === 1, owner), "the shell returns one native popup permit");
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20OpaquePermit === true, owner), "the popup selector contains only a fresh opaque UUID");
			if (foreignOpener) {
				assert(page, "the owner page is available for the foreign opener test");
				const selector = await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20PermitName as string, owner);
				const before = await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
				await page.evaluate((name) => {
					const frame = document.createElement("iframe");
					document.body.appendChild(frame);
					frame.contentWindow!.open("about:blank", name, "popup");
				}, selector);
				await page.waitForTimeout(500);
				assert(await application.evaluate(({ BrowserWindow }, fixture) => BrowserWindow.getAllWindows().length === fixture.before && (BrowserWindow.fromId(fixture.owner) as any).__t20Registered === 0, { before, owner }), "a subframe opener cannot register a native document child");
			} else if (popup) {
				assert(page, "the owner page is available for the popup");
				const selector = await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20PermitName as string, owner);
				let boundsStatePath = "";
				let expectedChildBounds: { x: number; y: number; width: number; height: number } | null = null;
				let originalMainBounds: { x: number; y: number; width: number; height: number } | null = null;
				let finalNativeChildBounds: { x: number; y: number; width: number; height: number } | null = null;
				if (bounds) {
					const geometry = await application.evaluate(({ app, BrowserWindow, screen }, id) => {
						const main = BrowserWindow.fromId(id)!;
						const bounds = main.getBounds();
						const display = screen.getDisplayNearestPoint({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 });
						return { userData: app.getPath("userData"), mainBounds: bounds, display: { id: display.id, bounds: display.bounds, workArea: display.workArea, scaleFactor: display.scaleFactor, rotation: display.rotation, internal: display.internal } };
					}, owner);
					boundsStatePath = path.join(geometry.userData, "window-state.json");
					originalMainBounds = geometry.mainBounds;
					const area = geometry.display.workArea;
					expectedChildBounds = fallbackBounds
						? { x: Math.round(area.x + (area.width - Math.min(900, area.width)) / 2), y: Math.round(area.y + (area.height - Math.min(700, area.height)) / 2), width: Math.min(900, area.width), height: Math.min(700, area.height) }
						: { x: area.x, y: area.y, width: area.width, height: area.height };
					fs.writeFileSync(boundsStatePath, JSON.stringify({
						bounds: geometry.mainBounds,
						maximized: false,
						documents: fallbackBounds
							? { schemaVersion: 1, bounds: { x: area.x, y: area.y, width: area.width, height: area.height }, maximized: false, source: "corrupt-test-record" }
							: { schemaVersion: 1, bounds: { x: area.x - 1000, y: area.y - 1000, width: area.width + 2000, height: area.height + 2000 }, maximized: false, source: "electron-normal-bounds" },
					}));
				}
				const foreign = await page.evaluate(() => window.open("about:blank", "exxperts-doc-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "popup") !== null);
				assert(!foreign, "an unsolicited native document popup is denied");
				const opened = await page.evaluate((name) => window.open("about:blank", name, "popup,width=900,height=700") !== null, selector);
				assert(opened, "the live permit opens one actual native child");
				await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20RegisteredAck === 1, owner), "the real owner accepts registration of the concrete child");
				const childId = await application.evaluate(({ BrowserWindow }, id) => {
					const parent = BrowserWindow.fromId(id)!;
					const child = BrowserWindow.getAllWindows().find((candidate: any) => candidate.webContents.opener === parent.webContents.mainFrame);
					return child?.id ?? null;
				}, owner);
				assert(childId !== null, "registration binds the actual top-frame opener and child");
				if (bounds) {
					const childWasPlaced = await Promise.race([
						waitUntil(() => application!.evaluate(({ BrowserWindow }, fixture) => {
						if (!fixture.bounds) return false;
						const child = BrowserWindow.fromId(fixture.id);
						if (!child?.isVisible()) return false;
						const actual = child.getBounds(), area = fixture.bounds;
						return actual.x === area.x && actual.y === area.y && Math.abs(actual.width - area.width) <= 1 && Math.abs(actual.height - area.height) <= 1;
						}, { id: childId, bounds: expectedChildBounds }), "the registered child is placed and shown after its owner acknowledges registration").then(() => true, () => false),
						new Promise<false>((resolve) => setTimeout(() => resolve(false), 5_000)),
					]);
					if (!childWasPlaced) {
						const state = await application.evaluate(({ BrowserWindow }, id) => ({ windows: BrowserWindow.getAllWindows().map((window: any) => ({ id: window.id, visible: window.isVisible(), bounds: window.getBounds(), url: window.webContents.getURL(), isChild: window.webContents.opener === BrowserWindow.fromId(id)!.webContents.mainFrame })) }), owner);
						throw new Error(`registered child placement timeout (${JSON.stringify(state)})`);
					}
					const restored = await application.evaluate(({ BrowserWindow }, id) => ({ visible: BrowserWindow.fromId(id)!.isVisible(), bounds: BrowserWindow.fromId(id)!.getBounds() }), childId);
					assert(restored.visible && restored.bounds.x === expectedChildBounds!.x && restored.bounds.y === expectedChildBounds!.y && Math.abs(restored.bounds.width - expectedChildBounds!.width) <= 1 && Math.abs(restored.bounds.height - expectedChildBounds!.height) <= 1, `the registered child restores validated current-workarea bounds before use (actual=${JSON.stringify(restored)}, expected=${JSON.stringify(expectedChildBounds)})`);
				}
				assert(await application.evaluate(({ BrowserWindow }, id) => { const prefs = BrowserWindow.fromId(id)!.webContents.getLastWebPreferences(); return prefs.sandbox === true && prefs.nodeIntegration === false && prefs.contextIsolation === true; }, childId), "the actual registered child keeps sandbox and context isolation");
				await application.evaluate(({ BrowserWindow, shell }, ids) => {
					const parent = BrowserWindow.fromId(ids.owner)!;
					(parent as any).__t20External = 0;
					(shell as any).openExternal = async () => { (parent as any).__t20External++; };
					void BrowserWindow.fromId(ids.child)!.webContents.executeJavaScript(`location.href = "https://example.invalid/"`);
				}, { owner, child: childId });
				await new Promise((resolve) => setTimeout(resolve, 300));
				assert(await application.evaluate(({ BrowserWindow }, ids) => BrowserWindow.fromId(ids.child)?.webContents.getURL() === "about:blank" && (BrowserWindow.fromId(ids.owner) as any)?.__t20External === 0, { owner, child: childId }), "registered child navigation cannot open an external URL");
				await application.evaluate(({ BrowserWindow }, fixture) => { void BrowserWindow.fromId(fixture.child)!.webContents.executeJavaScript(`location.href = "http://localhost:${fixture.port}/"`); }, { child: childId, port });
				await new Promise((resolve) => setTimeout(resolve, 300));
				assert(await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)?.webContents.getURL() === "about:blank", childId), "registered child cannot navigate even to another app page");
				if (bounds && expectedChildBounds && originalMainBounds) {
					const finalBounds = { x: expectedChildBounds.x + 12, y: expectedChildBounds.y + 18, width: Math.min(900, expectedChildBounds.width), height: Math.min(700, expectedChildBounds.height) };
					const immediateBounds = await application.evaluate(({ BrowserWindow }, fixture) => { const child = BrowserWindow.fromId(fixture.id)!; child.setBounds(fixture.bounds); return child.getBounds(); }, { id: childId, bounds: finalBounds });
					await new Promise((resolve) => setTimeout(resolve, 700));
					const actualFinalBounds = await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.getBounds(), childId);
					const windowState = await application.evaluate(({ BrowserWindow }, id) => ({ maximized: BrowserWindow.fromId(id)!.isMaximized(), fullscreen: BrowserWindow.fromId(id)!.isFullScreen(), normal: BrowserWindow.fromId(id)!.getNormalBounds() }), childId);
					finalNativeChildBounds = actualFinalBounds;
					const saved = JSON.parse(fs.readFileSync(boundsStatePath, "utf8")) as { bounds?: unknown; documents?: { schemaVersion?: number; bounds?: unknown; maximized?: boolean; source?: string } };
					assert(immediateBounds.x === finalBounds.x && immediateBounds.y === finalBounds.y && immediateBounds.width === finalBounds.width && immediateBounds.height === finalBounds.height && actualFinalBounds.x === finalBounds.x && actualFinalBounds.y === finalBounds.y && actualFinalBounds.width === finalBounds.width && actualFinalBounds.height === finalBounds.height && JSON.stringify(saved.bounds) === JSON.stringify(originalMainBounds) && saved.documents?.schemaVersion === 1 && JSON.stringify(saved.documents.bounds) === JSON.stringify(actualFinalBounds) && saved.documents.maximized === false && saved.documents.source === "electron-normal-bounds", `child movement updates only the existing documents state record (immediate=${JSON.stringify(immediateBounds)}, actual=${JSON.stringify(actualFinalBounds)}, window=${JSON.stringify(windowState)}, requested=${JSON.stringify(finalBounds)}, record=${JSON.stringify(saved)})`);
				}
				await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.close(), owner);
				await page.waitForTimeout(500);
				assert(await application.evaluate(({ BrowserWindow }, ids) => Boolean(BrowserWindow.fromId(ids.child)) && (BrowserWindow.fromId(ids.owner) as any)?.__t20Completed === 0, { owner, child: childId }), "a registered child cannot be mistaken for no-child evidence");
				await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.close(), childId);
				await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => !BrowserWindow.fromId(id), childId), "the concrete popup is actually closed");
				if (bounds && expectedChildBounds) {
					const saved = JSON.parse(fs.readFileSync(boundsStatePath, "utf8")) as { documents?: { bounds?: { x?: number; y?: number; width?: number; height?: number } } };
					assert(!!finalNativeChildBounds && saved.documents?.bounds?.x === finalNativeChildBounds.x && saved.documents.bounds.y === finalNativeChildBounds.y && saved.documents.bounds.width === finalNativeChildBounds.width && saved.documents.bounds.height === finalNativeChildBounds.height, `closing the registered child flushes its final normal bounds (record=${JSON.stringify(saved.documents)}, final=${JSON.stringify(finalNativeChildBounds)})`);
				}
				await page.waitForTimeout(300);
				assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Completed === 0, owner), "child destruction without a matching registered closure message cannot authorize no-child completion");
				const windowsBeforeReuse = await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
				await page.evaluate((name) => { window.open("about:blank", name, "popup"); }, selector);
				await page.waitForTimeout(300);
				assert(await application.evaluate(({ BrowserWindow }, count) => BrowserWindow.getAllWindows().length === count, windowsBeforeReuse), "a consumed native popup selector cannot create another child");
			}
		} else {
		if (quit) {
			await application.evaluate(({ app }) => {
				const original = app.quit.bind(app);
				(app as any).__t20QuitCalls = 0;
			(app as any).__t20ExitCalls = 0;
			app.exit = () => { (app as any).__t20ExitCalls++; };
			app.quit = () => { (app as any).__t20QuitCalls++; original(); };
			app.quit();
		}).catch(() => {});
		}
		else if (reloadKey) await application.evaluate(({ BrowserWindow }, id) => {
			const contents = BrowserWindow.fromId(id)!.webContents;
			contents.sendInputEvent({ type: "keyDown", keyCode: "R", modifiers: [process.platform === "darwin" ? "meta" : "control"] });
			contents.sendInputEvent({ type: "keyUp", keyCode: "R", modifiers: [process.platform === "darwin" ? "meta" : "control"] });
		}, owner);
		else if (reload) await application.evaluate(({ Menu, BrowserWindow }, id) => {
			const view = Menu.getApplicationMenu()?.items.find((item: any) => item.label === "View");
			const command = view?.submenu?.items.find((item: any) => item.role === "reload" || item.id === "documents-reload");
			if (!command) throw new Error("the View reload command is missing");
			command.click(undefined as any, BrowserWindow.fromId(id)!, BrowserWindow.fromId(id)!.webContents);
		}, owner);
		else await application.evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)!.close(), owner);
		if (late) {
			await waitUntil(() => application!.evaluate(({ BrowserWindow }, id) => typeof (BrowserWindow.fromId(id) as any)?.__t20Release === "function", owner), "the real prepare reply is held");
			await new Promise((resolve) => setTimeout(resolve, 2_300));
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Commits === 0, owner), "the outstanding preparation cannot commit");
			await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any).__t20Release(), owner);
			await new Promise((resolve) => setTimeout(resolve, 1_000));
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Commits === 0, owner), "a late prepared reply cannot revive native commit");
			if (lateEmpty) assert(await application.evaluate(({ BrowserWindow }, id) => Boolean(BrowserWindow.fromId(id)?.isVisible()) && (BrowserWindow.fromId(id) as any)?.__t20Commits === 0 && (BrowserWindow.fromId(id) as any)?.__t20AbortAck === 0, owner), "a late empty no-session reply keeps Quit prevented without commit or inferred abort acknowledgement");
			else assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20AbortAck === 1, owner), "the late prepared attempt is aborted and acknowledged");
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
		if (quit) {
			await new Promise((resolve) => setTimeout(resolve, 1_000));
			const emptyClose = await application.evaluate(({ BrowserWindow, app }, id) => ({ visible: Boolean(BrowserWindow.fromId(id)?.isVisible()), commits: (BrowserWindow.fromId(id) as any)?.__t20Commits, completed: (BrowserWindow.fromId(id) as any)?.__t20Completed, quitCalls: (app as any).__t20QuitCalls, exitCalls: (app as any).__t20ExitCalls }), owner);
			assert(emptyClose.commits === 1 && emptyClose.completed === 1 && emptyClose.quitCalls === 2 && emptyClose.exitCalls === 1, "a no-session quit commits, receives explicit no-child completion and continues exactly once");
		}
		if (reload) assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20ReloadPrepares === 1, owner), "the actual View reload uses a reload disposition");
		if (active && !dirty && !late) {
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Prepared === 1, owner), "the actual owner prepares the active clean room exactly once");
			assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20Completed === 1, owner), "the real owner completes only after the shell sends no-child evidence");
		}
		else if (!dirty && !late) assert(await application.evaluate(({ BrowserWindow }, id) => (BrowserWindow.fromId(id) as any)?.__t20NoSession === 1 && (BrowserWindow.fromId(id) as any)?.__t20Completed === 1, owner), "the actual owner returns the matching empty-session response and completes only after no-child evidence");
		if (!quit && !reload && !dirty && !late) assert(!(await application.evaluate(({ BrowserWindow }, id) => Boolean(BrowserWindow.fromId(id)?.isVisible()), owner)), "native close-to-hide continues only after matching completed evidence");
		}
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
