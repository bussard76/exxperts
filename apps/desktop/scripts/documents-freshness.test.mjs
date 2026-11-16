import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { transform } from "esbuild";

test("close samples the owner after an in-flight exchange settles", async () => {
  const ownerSource = fs.readFileSync(new URL("../../web-ui/src/App.tsx", import.meta.url), "utf8");
  const start = ownerSource.indexOf('\tuseEffect(() => {\n\t\tif (!documentOwnerId || !document.documentElement.classList.contains("desktop-app")');
  const end = ownerSource.indexOf('\n\t}, [documentOwnerId]);', start);
  assert.ok(start >= 0 && end > start);
  const ownerCode = await transform(ownerSource.slice(start, end + '\n\t}, [documentOwnerId]);'.length), { loader: "ts" });
  const ref = (current) => ({ current });
  const window = {};
  const owner = { window, document: { documentElement: { classList: { contains: () => true } } }, useEffect: (fn) => fn(), documentOwnerId: "11111111-1111-4111-8111-111111111111", documentOwnerGenerationRef: ref(1), documentHostGenerationRef: ref(1), documentDraftGenerationRef: ref(1), checkpointContextRef: ref({ key: "room\0thread", roomId: "room", conversationId: "thread", generation: 1 }), unmountedRef: ref(false), personHasChanged: () => false, allocateDocumentId: () => null, nativePopupRef: ref(null), markdownEditorPendingActionRef: ref(null), performance, markdownEditorRef: ref(null), documentSaveInFlightRef: ref(false), documentKeepMineInFlightRef: ref(false), documentWriteRef: ref(null), captureDocumentAdmission: (requestId) => ({ requestId }), preparedDocumentAdmissionRef: ref(null), setMarkdownEditorFenced() {}, nativeGuardRef: ref(null), markdownEditorDirtyRef: ref(false), prepareDocumentAdmission: () => true };
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
  const win = { isDestroyed: () => false, hide: () => { hidden = true; }, webContents: { isDestroyed: () => false, getURL: () => "http://127.0.0.1:8790/", executeJavaScript: async (expression) => {
    const input = JSON.parse(expression.match(/endpoint\.step\((.*)\) : null/)[1]);
    received.push(input);
    const result = window.__exxpertsDocuments.step(input);
    replies.push(result);
    if (hold) { hold = false; return new Promise((resolve) => { release = () => resolve(result); }); }
    return result;
  } } };
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  const stop = shell.testShell.startDocumentsPoll(win);
  try {
    await flush();
    hold = true; tick(); await flush();
    owner.documentHostGenerationRef.current = 2;
    shell.testShell.requestDocumentsAction.get(win)("hide");
    tick(); await flush();
    assert.equal(received.length, 2);
    release(); await flush();
    tick(); await flush();
    assert.deepEqual(received.map((input) => input.items[0]?.kind ?? "poll"), ["hello", "poll", "poll", "native-prepare"]);
    assert.equal(replies[2].status.stamp.hostGeneration, 2);
    assert.deepEqual(received[3].items[0].observedStamp, JSON.parse(JSON.stringify(replies[2].status.stamp)));
    assert.equal(hidden, false);
  } finally { stop(); }
});
