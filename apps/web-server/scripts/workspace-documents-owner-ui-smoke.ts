// Supplemental owner-endpoint checks in a real browser. Native shell integration is separate.
import { chromium } from "playwright";
import { assert, baseUrl, startRoomStateServer, stopRoomStateServer } from "./room-state-setup.js";
import { SMOKE_AUTH_TOKEN } from "./smoke-server-process.js";

let error: unknown;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	await startRoomStateServer();
	browser = await chromium.launch();
	const page = await browser.newPage();
	await page.goto(`${baseUrl}/auth/session?token=${SMOKE_AUTH_TOKEN}`);
	await page.waitForLoadState("networkidle");
	const result = await page.evaluate(() => {
		const descriptor = Object.getOwnPropertyDescriptor(window, "__exxpertsDocuments");
		const endpoint = descriptor?.value;
		if (!endpoint || typeof endpoint.step !== "function") return { installed: false };
		const nativeSessionId = "11111111-1111-4111-8111-111111111111";
		const hello = { version: 1, nativeSessionId, sequence: 1, ack: 0, items: [{ kind: "hello" }] };
		const first = endpoint.step(hello);
		const replay = endpoint.step(hello);
		const wrongVersion = endpoint.step({ ...hello, version: 2, sequence: 2 });
		const gap = endpoint.step({ ...hello, sequence: 3, ack: 1, items: [] });
		return { installed: true, enumerable: descriptor!.enumerable, first, replay, wrongVersion, gap };
	});
	assert(result.installed && result.enumerable === false, "the actual owner installs a non-enumerable synchronous endpoint");
	const first = result.first;
	assert(first?.version === 1 && first.sequence === 1 && first.ack === 1 && first.items?.length === 1 && first.items[0].kind === "hello", "a valid hello receives the owner's binding");
	assert(first.status?.binding?.nativeSessionId === "11111111-1111-4111-8111-111111111111" && first.status.binding.ownerId === first.items[0].ownerId && first.status.binding.ownerGeneration === first.items[0].ownerGeneration && first.status.stamp === null && first.status.child === null, "the live owner reports its exact binding and empty context");
	assert(JSON.stringify(result.replay) === JSON.stringify(first), "a repeated sequence returns the cached response");
	assert(result.wrongVersion == null && result.gap == null, "invalid versions and sequence gaps produce no authorization");
	console.log("owner endpoint browser supplement: hello, replay and invalid inputs passed");
} catch (caught) { error = caught; }
finally { await browser?.close(); await stopRoomStateServer(error); }
if (error) throw error;
