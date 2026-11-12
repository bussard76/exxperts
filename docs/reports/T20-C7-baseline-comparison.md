# C7 baseline comparison — read-only

Checked 2026-11-12 09:01 CET. No project source, exxeta/* branch, main, upstream PR or product service was changed.

| Type | PR87 head5fcffe1036b2d6f867d6583b29822c4985d36fba | Fork-main1f4b79b01ebd784b6c1116a0b78c42389eae1c24 |
| --- | --- | --- |
| PPTX | YES: replacement receives exact501 invented bytes once | YES: replacement receives exact501 invented bytes once |
| Excalidraw | NO / not implemented at this PR head; no renderer entry and route falls through415 | YES: replacement receives exact501 invented bytes once |
| HTML | NO for this specific frame-ready→snapshot counterexample; zero deliveries | NO for this specific counterexample; zero deliveries |

## Executed evidence

`env GATE_TASK=T20-C7-BASELINE GATE_WORKER=controller GATE_ROLE=Controller GATE_AGENT=codex GATE_MODEL=gpt-6.1-terra GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate node /home/developer/controller-exxperts/evidence/t20-c7-baseline-probe-2026-11-12.cjs` exited0. Chromium 148.0.7778.96. Five supported component/type cases completed with positive controls; Excalidraw on PR87 classified from absent code/route, not a fake supported case.

The probe reads exact TSX from git objects for each pinned commit, preserving component source unchanged and recording SHA256 in JSON. It bundles those actual React components using existing installed esbuild/React. Only the apiFetch import is replaced with local fetch to an invented fixture endpoint, and worker&url asset-emission imports are omitted (they merely request renderer build assets). No T20 code is present. It runs an actual opaque Chromium iframe under a CSP header, holds the genuine shell HTTP response, navigates its existing contentWindow.location to a local replacement while preserving src, and the replacement sends frame-ready. It verifies stable WindowProxy, unchanged src, event.origin=null and exact frame source. For all three affected runs it observes exactly one transferred501-byte ArrayBuffer equal to the original fixture and one initial content GET. Genuine shell delivery succeeds as a positive control; direct HTML executes its invented script as positive control. Both HTML negative controls receive zero buffers after readiness.

Scope is the actual baseline parent component's delivery behavior with controlled HTTP fixtures, not the full App, real authenticated route, actual PPTX/Excalidraw parser or native/browser-platform acceptance. The fixture shell captures bytes instead of invoking a parser. The server's real route dispatch and HTML direct-response behavior were separately inspected from pinned git source. No real data, outside requests, installs, host changes or exxeta-branch mutations. No test source was committed into the product.

The harness, like the T20 counterexample, uses privileged owner-parent authority to navigate before readiness; it does not show a product-reachable external attacker. A compromised parent already has access to its snapshot. This is a guarantee/identity regression comparison, not proof of an externally exploitable disclosure or a blanket HTML security verdict.

## Source evidence

For both commits, WorkspaceFramedPreview.tsx lines35–42 checks event.source===iframe.contentWindow and frame-ready, then transfers bytes to that proxy without a concrete-document proof. A navigated replacement keeps the proxy. A delivered ref prevents another copy after first delivery but does not authenticate the first recipient.

For both commits, WorkspaceHtmlPreview.tsx lines10–25 only does a metadata request and assigns iframe.src; it has no message/ArrayBuffer delivery listener. Real room-settings-routes.ts serves disk HTML directly for frame=1 (PR87 lines402–404, main405–407). Therefore this newly introduced T20 HTML shell delivery issue does not exist in these baseline HTML components. Approved one-opened-file self-navigation risk remains separate.

PR87 room-settings-routes.ts lines329–336 only selects PPTX; lines407–408 reject other unsupported formats. Its excalidraw-frame-entry.ts is absent. Fork-main lines335–342 select PPTX and Excalidraw through the same WorkspaceFramedPreview delivery pattern.

Files: `t20-c7-baseline-probe-2026-11-12.cjs`, `t20-c7-baseline-probe-results-2026-11-12.json`; hashes, browser version and all observations recorded. The local HTTP server and Chromium are closed by finally after the probe.

Raw executable probe and JSON observations are retained outside the product at `~/controller-exxperts/evidence/t20-c7-baseline-probe-2026-11-12.cjs` and `t20-c7-baseline-probe-results-2026-11-12.json`. This read-only evidence was prepared by the Controller before Sascha selected C7 review option B; it is not an independent product review.
