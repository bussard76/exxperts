// Supplemental owner-endpoint checks in a real browser. Native shell integration is separate.
import { chromium } from "playwright";
import { assert, baseUrl, openRoom, startRoomStateServer, stopRoomStateServer } from "./room-state-setup.js";
import { SMOKE_AUTH_TOKEN } from "./smoke-server-process.js";

let error: unknown;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
	await startRoomStateServer();
	const room = await openRoom("Invented Native Owner");
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
		const replay = endpoint.step({ items: [{ kind: "hello" }], ack: 0, sequence: 1, nativeSessionId, version: 1 });
		const changedReplay = endpoint.step({ ...hello, items: [{ kind: "hello", extra: true }] });
		const wrongVersion = endpoint.step({ ...hello, version: 2, sequence: 2 });
		const gap = endpoint.step({ ...hello, sequence: 3, ack: 1, items: [] });
		const request = { version: 1, nativeSessionId, sequence: 2, ack: 1, items: [{ kind: "native-prepare", binding: first?.status?.binding, nativeRequestId: "22222222-2222-4222-8222-222222222222", observedStamp: null, disposition: "hide" }] };
		const wrongBinding = endpoint.step({ ...request, items: [{ ...request.items[0], binding: { ...first?.status?.binding, ownerGeneration: first?.status?.binding?.ownerGeneration + 1 } }] });
		const malformedStamp = endpoint.step({ ...request, items: [{ ...request.items[0], observedStamp: {} }] });
		const noSession = endpoint.step(request);
		const noSessionReplay = endpoint.step(request);
		return { installed: true, enumerable: descriptor!.enumerable, first, replay, changedReplay, wrongVersion, gap, wrongBinding, malformedStamp, noSession, noSessionReplay };
	});
	assert(result.installed && result.enumerable === false, "the actual owner installs a non-enumerable synchronous endpoint");
	const first = result.first;
	assert(first?.version === 1 && first.sequence === 1 && first.ack === 1 && first.items?.length === 1 && first.items[0].kind === "hello", "a valid hello receives the owner's binding");
	assert(first.status?.binding?.nativeSessionId === "11111111-1111-4111-8111-111111111111" && first.status.binding.ownerId === first.items[0].ownerId && first.status.binding.ownerGeneration === first.items[0].ownerGeneration && first.status.stamp === null && first.status.child === null, "the live owner reports its exact binding and empty context");
	assert(JSON.stringify(result.replay) === JSON.stringify(first), "a repeated sequence returns the cached response");
	assert(result.changedReplay == null && result.wrongVersion == null && result.gap == null && result.wrongBinding == null && result.malformedStamp == null, "changed replays, invalid versions, sequence gaps, foreign bindings and malformed stamps produce no authorization");
	const noSession = result.noSession;
	assert(noSession?.sequence === 2 && noSession.ack === 2 && noSession.items?.length === 1 && noSession.items[0].kind === "no-session" && noSession.items[0].nativeRequestId === "22222222-2222-4222-8222-222222222222" && noSession.items[0].disposition === "hide" && JSON.stringify(noSession.items[0].binding) === JSON.stringify(first.status.binding), "a live empty owner explicitly confirms only the matching no-session request");
	assert(JSON.stringify(result.noSessionReplay) === JSON.stringify(noSession), "replayed no-session preparation does not repeat an effect");
	const dismiss = page.locator(".whats-new-close");
	if (await dismiss.count()) await dismiss.click();
	await page.locator(".persistent-agent-card").filter({ hasText: "Invented Native Owner" }).getByRole("button", { name: /^(Enter|Resume)$/ }).click();
	await page.locator(".sidebar-workspace-files").waitFor();
	const active = await page.evaluate(({ binding }) => {
		const endpoint = (window as any).__exxpertsDocuments;
		return endpoint.step({ version: 1, nativeSessionId: binding.nativeSessionId, sequence: 3, ack: 2, items: [{ kind: "native-prepare", binding, nativeRequestId: "33333333-3333-4333-8333-333333333333", observedStamp: null, disposition: "hide" }] });
	}, { binding: first.status.binding });
	const refusal = active?.items?.[0];
	assert(active?.sequence === 3 && refusal?.kind === "guard-result" && refusal.result?.kind === "refused" && refusal.result.reason === "invalidated" && refusal.result.correlation?.stamp?.roomId === room.roomId && refusal.result.correlation.stamp.conversationId === room.conversationId && refusal.result.correlation.requestId === "33333333-3333-4333-8333-333333333333" && refusal.result.correlation.action?.kind === "chat-close" && refusal.result.correlation.action.disposition === "hide" && JSON.stringify(refusal.binding) === JSON.stringify(first.status.binding), "a null observed stamp cannot report no-session for a current room");
	console.log("owner endpoint browser supplement: hello, replay and invalid inputs passed");
} catch (caught) { error = caught; }
finally { await browser?.close(); await stopRoomStateServer(error); }
if (error) throw error;
