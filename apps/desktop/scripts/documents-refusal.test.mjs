import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";

test("a stale-stamp refusal is aborted without replay or native continuation", async () => {
  const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  const compiled = await transform(`${source}\nglobalThis.testShell = { startDocumentsPoll, requestDocumentsAction };`, { loader: "ts", format: "cjs" });
  const app = { setName() {}, getVersion: () => "1", setAboutPanelOptions() {}, isPackaged: true, requestSingleInstanceLock: () => false, quit() {} };
  const require = createRequire(import.meta.url);
  let tick;
  const context = { exports: {}, process, console, URL, setTimeout, clearTimeout, setImmediate, setInterval: (fn) => { tick = fn; return 1; }, clearInterval() {}, require: (id) => id === "electron" ? { app } : id.startsWith("./") ? { payloadVersion: () => "test", SERVER_ORIGIN: "http://127.0.0.1:8790", ServerHandle: class {} } : require(id) };
  vm.runInNewContext(compiled.code, context);
  const ownerId = "11111111-1111-4111-8111-111111111111";
  const stamp = { ownerId, ownerGeneration: 1, roomId: "invented-room", conversationId: "invented-thread", roomGeneration: 1, hostGeneration: 1, draftGeneration: 1 };
  const received = [];
  let hidden = false;
  const win = { isDestroyed: () => false, hide: () => { hidden = true; }, webContents: { isDestroyed: () => false, getURL: () => "http://127.0.0.1:8790/", executeJavaScript: async (expression) => {
    const input = JSON.parse(expression.match(/endpoint\.step\((.*)\) : null/)[1]);
    received.push(input);
    const binding = { nativeSessionId: input.nativeSessionId, ownerId, ownerGeneration: 1 };
    const current = input.sequence === 1 ? stamp : { ...stamp, hostGeneration: 2 };
    const item = input.items[0];
    let items = [];
    if (item?.kind === "hello") items = [{ kind: "hello", ownerId, ownerGeneration: 1 }];
    if (item?.kind === "native-prepare") items = [{ kind: "guard-result", binding, nativeRequestId: item.nativeRequestId, result: { kind: "refused", reason: "invalidated", correlation: { requestId: item.nativeRequestId, stamp: current, action: { kind: "chat-close", disposition: item.disposition } } } }];
    if (item?.kind === "native-abort") items = [{ kind: "abort-ack", binding, correlation: item.correlation }];
    return { version: 1, nativeSessionId: input.nativeSessionId, sequence: input.sequence, ack: input.sequence, status: { binding, stamp: current, child: null }, items };
  } } };
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  const stop = context.testShell.startDocumentsPoll(win);
  try {
    await flush();
    context.testShell.requestDocumentsAction.get(win)("hide");
    tick(); await flush();
    tick(); await flush();
    tick(); await flush();
    assert.deepEqual(received.map((input) => input.items[0]?.kind ?? "poll"), ["hello", "native-prepare", "native-abort", "poll"]);
    assert.equal(received[2].items[0].correlation.stamp.hostGeneration, 2);
    assert.equal(hidden, false);
  } finally { stop(); }
});
