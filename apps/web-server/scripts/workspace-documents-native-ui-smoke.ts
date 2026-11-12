// Exercise the actual desktop shell and owner with isolated state and a fake feed.
// Set T20_NATIVE_STUCK=1 for the independent outstanding-exchange case.
import { _electron as electron, type ElectronApplication } from "playwright";
import fs from "node:fs";
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
const feed = http.createServer((_request, response) => {
	response.writeHead(200, { "content-type": "application/json" });
	response.end(JSON.stringify({ tag_name: "v0.0.0", prerelease: false, draft: false }));
});
await new Promise<void>((resolve) => feed.listen(0, "127.0.0.1", resolve));
const address = feed.address();
assert(address && typeof address !== "string", "the fake update feed listens locally");
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
} finally {
	if (application) await application.close().catch(() => {});
	await new Promise<void>((resolve) => feed.close(() => resolve()));
	fs.rmSync(scratch, { recursive: true, force: true });
}
