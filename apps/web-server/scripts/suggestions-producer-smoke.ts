import { assert, createRoom, putThread, reportDetachedFailure, startDetachedServer, stopDetachedServer, WsHarness } from "./persistent-room-detached-turn-setup.js";

try {
	await startDetachedServer();
	const room = await createRoom("Suggestion Room");
	const thread = "suggestion_thread";
	await putThread(room, thread, []);
	const socket = await WsHarness.connect(room, thread);
	await socket.waitFor((frame) => frame.type === "ready", "ready");
	socket.send({ type: "prompt", text: "What comes next?" });
	const invalidate = await socket.waitFor((frame) => frame.type === "answer_lifecycle" && frame.phase === "invalidate", "invalidation", 0, 5000);
	const complete = await socket.waitFor((frame) => frame.type === "answer_lifecycle" && frame.phase === "complete", "completion", invalidate, 5000);
	assert(socket.frames[complete].roomId === room && socket.frames[complete].threadId === thread && typeof socket.frames[complete].answerId === "string", "completion carries its room, thread and answer identity");
} catch (error) {
	reportDetachedFailure(error);
} finally {
	await stopDetachedServer();
}
