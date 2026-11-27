import assert from "node:assert/strict";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { WorkspaceImagePreview } from "../src/components/WorkspaceImagePreview.js";

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://localhost/" });
const originalFetch = globalThis.fetch;
Object.assign(globalThis, { React, window: dom.window, document: dom.window.document, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
sessionStorage.setItem("exxperts-auth-redirect", String(Date.now()));
globalThis.fetch = (async () => new Response("{}", { status: 401, headers: { "content-type": "application/json" } })) as typeof fetch;
const root = createRoot(document.getElementById("root")!);
try {
	await act(async () => { root.render(React.createElement(WorkspaceImagePreview, { agentId: "invented-room", conversationId: "invented-thread", path: "invented.png" })); await new Promise((resolve) => setTimeout(resolve, 0)); });
	assert.match(document.body.textContent ?? "", /Sign in to preview this file\./);
	assert.equal(document.querySelector("img"), null);
	console.log("workspace image sign-in notice passed");
} finally {
	await act(async () => root.unmount());
	globalThis.fetch = originalFetch;
	dom.window.close();
}
