import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";

async function setup({ empty = false, controls = false } = {}) {
  const ownerSource = fs.readFileSync(new URL("../../web-ui/src/App.tsx", import.meta.url), "utf8");
  const start = ownerSource.indexOf('\tuseEffect(() => {\n\t\tif (!documentOwnerId || !document.documentElement.classList.contains("desktop-app")');
  const end = ownerSource.indexOf('\n\t}, [documentOwnerId]);', start);
  assert.ok(start >= 0 && end > start);
  const ownerCode = await transform(ownerSource.slice(start, end + '\n\t}, [documentOwnerId]);'.length), { loader: "ts" });
  const ref = (current) => ({ current });
  const window = {};
  const owner = { window, document: { documentElement: { classList: { contains: () => true } } }, useEffect: (fn) => fn(), documentOwnerId: "11111111-1111-4111-8111-111111111111", documentOwnerGenerationRef: ref(1), documentHostGenerationRef: ref(1), documentDraftGenerationRef: ref(1), checkpointContextRef: ref({ key: "room\0thread", roomId: "room", conversationId: "thread", generation: 1 }), unmountedRef: ref(false), personHasChanged: () => false, allocateDocumentId: () => controls ? "33333333-3333-4333-8333-333333333333" : null, setNativePopupReady() {}, noDocumentSession: () => empty, nativePopupRef: ref(null), markdownEditorPendingActionRef: ref(null), performance, markdownEditorRef: ref(null), documentSaveInFlightRef: ref(false), documentKeepMineInFlightRef: ref(false), documentWriteRef: ref(null), captureDocumentAdmission: (requestId) => ({ requestId, context: empty ? null : {}, ownerGeneration: 1, roomGeneration: 0 }), preparedDocumentAdmissionIsCurrent: () => true, markdownEditorPromptBusyRef: ref(false), markdownEditorPromptTimerRef: ref(null), setMarkdownEditorPrompt() {}, setMarkdownEditorPromptBusy() {}, documentChildRef: ref(null), nativeClosedChildPermitRef: ref(null), preparedDocumentAdmissionRef: ref(null), setMarkdownEditorFenced() {}, nativeGuardRef: ref(null), markdownEditorDirtyRef: ref(false), prepareDocumentAdmission: () => true };
  if (empty) owner.checkpointContextRef.current = { key: null, roomId: null, conversationId: null, generation: 0 };
  vm.runInNewContext(ownerCode.code, owner);
  const shellSource = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  const shellCode = await transform(`${shellSource}\nglobalThis.testShell = { startDocumentsPoll, requestDocumentsAction };`, { loader: "ts", format: "cjs" });
  const app = { setName() {}, getVersion: () => "1", setAboutPanelOptions() {}, isPackaged: true, requestSingleInstanceLock: () => false, quit() {} };
  const require = createRequire(import.meta.url);
  let tick;
  const shell = { exports: {}, process, console, URL, setTimeout, clearTimeout, setImmediate, setInterval: (fn) => { tick = fn; return 1; }, clearInterval() {}, require: (id) => id === "electron" ? { app } : id.startsWith("./") ? { payloadVersion: () => "test", SERVER_ORIGIN: "http://127.0.0.1:8790", ServerHandle: class {} } : require(id) };
  vm.runInNewContext(shellCode.code, shell);
  const received = [];
  const replies = [];
  let release;
  let hold = false;
  let hidden = false;
  let intercept = (input, result) => result;
  const win = { isDestroyed: () => false, hide: () => { hidden = true; }, webContents: { isDestroyed: () => false, getURL: () => "http://127.0.0.1:8790/", executeJavaScript: (expression) => {
    const input = JSON.parse(expression.match(/endpoint\.step\((.*)\) : null/)[1]);
    received.push(input);
    const result = window.__exxpertsDocuments.step(input);
    replies.push(result);
    if (hold) { hold = false; return new Promise((resolve) => { release = () => resolve(result); }); }
    return Promise.resolve(intercept(input, result));
  } } };
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  const stop = shell.testShell.startDocumentsPoll(win);
  await flush();
  return { owner, received, replies, tick: () => tick(), flush, stop, close: () => shell.testShell.requestDocumentsAction.get(win)("hide"), hold: () => { hold = true; }, release: () => release(), intercept: (fn) => { intercept = fn; }, hidden: () => hidden };
}

test("close samples the owner after an in-flight exchange settles", async () => {
  const { owner, received, replies, tick, flush, stop, close, hold, release, hidden } = await setup();
  try {
    hold(); tick(); await flush();
    owner.documentHostGenerationRef.current = 2;
    close();
    tick(); await flush();
    assert.equal(received.length, 2);
    release(); await flush();
    tick(); await flush();
    assert.deepEqual(received.map((input) => input.items[0]?.kind ?? "poll"), ["hello", "poll", "poll", "native-prepare"]);
    assert.equal(replies[2].status.stamp.hostGeneration, 2);
    assert.deepEqual(received[3].items[0].observedStamp, JSON.parse(JSON.stringify(replies[2].status.stamp)));
    assert.equal(hidden(), false);
  } finally { stop(); }
});

test("changed stamp after sampling aborts once and a later close takes a new sample", async () => {
  const h = await setup();
  try {
    h.intercept((input, result) => {
      if (input.sequence === 2) h.owner.documentHostGenerationRef.current = 2;
      return result;
    });
    h.close(); h.tick(); await h.flush();
    h.tick(); await h.flush();
    assert.equal(h.replies[2].items[0].result.reason, "invalidated");
    assert.equal(h.replies[3].items[0].kind, "abort-ack");
    assert.deepEqual(h.received[3].items[0].correlation, JSON.parse(JSON.stringify(h.replies[3].items[0].correlation)));
    h.tick(); await h.flush();
    assert.deepEqual(h.received.map((input) => input.items[0]?.kind ?? "poll"), ["hello", "poll", "native-prepare", "native-abort", "poll"]);
    h.close(); h.tick(); await h.flush();
    assert.equal(h.received[5].items.length, 0);
    assert.equal(h.received[6].items[0].kind, "native-prepare");
    assert.notEqual(h.received[2].items[0].nativeRequestId, h.received[6].items[0].nativeRequestId);
    assert.equal(h.received[6].items[0].observedStamp.hostGeneration, 2);
    assert.equal(h.hidden(), false);
  } finally { h.stop(); }
});

for (const [name, damage] of [
  ["missing", () => null],
  ["malformed", (_input, result) => ({ ...result, status: { ...result.status, stamp: {} } })],
  ["mismatched session", (_input, result) => ({ ...result, nativeSessionId: "22222222-2222-4222-8222-222222222222" })],
  ["mismatched binding", (_input, result) => ({ ...result, status: { ...result.status, binding: { ...result.status.binding, ownerGeneration: 2 } } })],
  ["throwing", () => { throw new Error("invented failure"); }],
]) {
  test(`${name} fresh status fails closed`, async () => {
    const h = await setup();
    try {
      h.intercept(damage);
      h.close(); h.tick(); await h.flush();
      h.tick(); await h.flush(); h.tick(); await h.flush();
      assert.deepEqual(h.received.map((input) => input.items[0]?.kind ?? "poll"), ["hello", "poll"]);
      assert.equal(h.hidden(), false);
    } finally { h.stop(); }
  });
}

test("timed-out sample and its late response never prepare", async () => {
  const h = await setup();
  try {
    h.hold(); h.close(); h.tick(); await h.flush();
    await new Promise((resolve) => setTimeout(resolve, 2100));
    h.release(); await h.flush(); h.tick(); await h.flush();
    assert.deepEqual(h.received.map((input) => input.items[0]?.kind ?? "poll"), ["hello", "poll"]);
    assert.equal(h.hidden(), false);
  } finally { h.stop(); }
});

test("empty status reserves and commits the correlated no-session action", async () => {
  const h = await setup({ empty: true });
  try {
    h.close(); h.tick(); await h.flush();
    assert.equal(h.received[2].items[0].observedStamp, null);
    assert.equal(h.replies[2].items[0].kind, "no-session");
    const correlation = JSON.parse(JSON.stringify(h.replies[2].items[0].correlation));
    assert.deepEqual(JSON.parse(JSON.stringify(h.owner.window.__exxpertsDocuments.step(h.received[2]))), JSON.parse(JSON.stringify(h.replies[2])));
    h.tick(); await h.flush();
    assert.equal(h.replies[3].items[0].kind, "committed");
    assert.deepEqual(h.received[3].items[0].correlation, correlation);
    h.tick(); await h.flush();
    assert.equal(h.received[4].items[0].child, null);
    assert.equal(h.replies[4].items[0].kind, "completed");
    assert.equal(h.hidden(), true);
  } finally { h.stop(); }
});

test("queued owner control in the fresh sample is processed without an extra sample", async () => {
  const h = await setup({ controls: true });
  try {
    h.close(); h.tick(); await h.flush();
    assert.equal(h.replies[1].items[0].kind, "arm-popup");
    assert.deepEqual(h.received.map((input) => input.items[0]?.kind ?? "poll"), ["hello", "poll", "native-prepare"]);
    assert.deepEqual(h.received[2].items[0].observedStamp, JSON.parse(JSON.stringify(h.replies[1].status.stamp)));
    assert.equal(h.hidden(), false);
  } finally { h.stop(); }
});

test("empty reservation rejects wrong abort and replays matching abort", async () => {
  const h = await setup({ empty: true });
  try {
    h.close(); h.tick(); await h.flush();
    const reply = h.replies[2].items[0];
    const binding = JSON.parse(JSON.stringify(reply.binding));
    const correlation = JSON.parse(JSON.stringify(reply.correlation));
    const abort = { version: 1, nativeSessionId: binding.nativeSessionId, sequence: 4, ack: 3, items: [{ kind: "native-abort", binding, correlation }] };
    const wrong = structuredClone(abort);
    wrong.items[0].correlation.requestId = "44444444-4444-4444-8444-444444444444";
    assert.equal(h.owner.window.__exxpertsDocuments.step(wrong), null);
    const ack = h.owner.window.__exxpertsDocuments.step(abort);
    assert.equal(ack.items[0].kind, "abort-ack");
    assert.deepEqual(JSON.parse(JSON.stringify(h.owner.window.__exxpertsDocuments.step(abort))), JSON.parse(JSON.stringify(ack)));
    assert.equal(h.hidden(), false);
  } finally { h.stop(); }
});
