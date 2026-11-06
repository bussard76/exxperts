// Private Windows dispatcher. It fails closed until the native adapter is ready.
import path from "node:path";

let received = false;
process.on("message", (message) => {
	if (received) return;
	received = true;
	const valid = message && typeof message === "object" && !Array.isArray(message)
		&& Object.keys(message).length === 1 && typeof message.path === "string" && message.path.length > 0
		&& !message.path.includes("\0") && /^[A-Za-z]:\\/.test(message.path)
		&& path.win32.isAbsolute(message.path) && !message.path.slice(2).includes(":");
	process.send?.({ accepted: false, code: valid ? "opener_unavailable" : "open_failed" }, () => process.disconnect?.());
});
