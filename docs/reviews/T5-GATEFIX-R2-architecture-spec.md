# T5-GATEFIX-R2 architecture spec

Verdict: pass
Spec: `~/controller-exxperts/specs/t5-gatefix-dev.txt` and the `T5 gate visual corrections` decision in `~/controller-exxperts/decisions.md`, reviewed against `origin/main` 397034345dd38e57cb90e2f5666d8b35dff10b1f and prior review 793286b367adb25f180123fdb2b51c2bebc9e674. Issue #5 is context; the coordinator confirms this is the bounded gate correction.
Level: 1 confirmed. The changes are local to the existing composer smoke launch and viewer control implementation/styles, with no new exports, dependencies, routes, stores, contracts or data flows.
Decision: Controller recorded the grayscale launch and inline-vector choice; no further architecture decision or ADR is needed for the bounded work.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Composer comparison | `apps/web-server/scripts/consult-mention-smoke.ts`, rendered textarea and mirror | Test-only Chromium rasterisation; no production change. | Keep `ignoreDefaultArgs: ["--hide-scrollbars"]`, comparison geometry and every assertion. Diagnosis on Linux Chromium 148 shows `--disable-lcd-text` passing the four viewport/theme cases; aligned 0 versus shifted 1,823 on the diagnosed case. Preserve `off > 50`, `aligned * 20 < off`, and the 1 CSS px shift, and show the shifted control still detects displacement. This does not establish portability or a production rendering fix. |
| Viewer control ink | `apps/web-ui/src/components/ArtifactViewer.tsx` and existing viewer styles; existing buttons and their users | Only glyph representation changes; retain open-tab action and `disabled={!routeUrl}`, maximize toggle, `aria-pressed`, names, titles, click targets and sizes. | Use the selected inline vectors for open-tab and both maximize/restore meanings. Existing `room-topbar-ui-smoke.ts` measures the real rendered controls, at 100% and 125%, sidebar open/hidden, deck and long-name cases, against the unchanged 25 window-point centre and ±0.5 bound. Verify restore separately as directed below. |
| Evidence and ownership | Existing browser smokes, real UI and local synthetic server | Existing test-to-rendered-product seam; no new shared interface, privacy, storage or ownership changes. | Keep all assertions intact, use invented data and mocks, run focused checks through `gate`, and report hosts not verified. Tester and wave retain independent full build and smoke duties. Escalate if the bounded fix cannot pass or preserve behavior. |

## Prefactoring

None. Keep the launch setting and the vector replacements at their existing owners; a shared icon abstraction or new interface is unnecessary.

## Findings

No design-relevant issue remains. The following precision instructions are binding on the Developer:

1. The first two generic dispatch steps mention every Result and Observable acceptance item in issue #5, but the coordinator identifies that issue as context and the decision restricts this task to two gate failures. Record issue #5 items as context in the checklist, and implement and prove only the two bounded gate corrections. Do not claim issue #5 is implemented or the full integration checks passed by this developer stage; independent review and wave remain mandatory. The room-failure-status timeout remains unresolved, not a known load flake.
2. The unchanged topbar smoke checks the existing viewer controls but does not toggle maximize. Run it unchanged for its existing coverage and additionally verify both maximize and restore in the real rendered viewer, including accessible names, `aria-pressed`, action and appearance at 100% and 125%; do not report its existing checks alone as proof of restore. Keep the prescribed sidebar, deck and long-name smoke cases and report the evidence separately.
3. The prescribed direct-node test server differs from the current smoke harness: `consult-mention-smoke.ts` and `room-state-setup.ts` currently spawn `npx tsx src/index.ts`. Keep the topbar smoke and its assertions unchanged; a temporary, uncommitted harness adaptation or disposable checkout may direct its server to `node bin/exxperts-web.cjs --port <free-port> --no-open`, as in the diagnosis. Remove any disposable checkout before reporting. Do not commit changes outside the specified implementation surface or weaken tests.
4. Existing UI and smoke assertions supply the outside-in evidence for this correction; there is no `design/T5-GATEFIX/` export or logic diagram. The diagnosis establishes the first composer rasterisation cause only on its Linux host and confirms viewer fallback and padding contributions, not a validated cross-platform vector fix. Validate available supported hosts and disclose the rest. No parallel split or new shared producer/consumer contract is specified; if a split is introduced, fix its interface and exercise the real producer and consumer together before building against it.
5. No new empty, ambiguous or error data states arise; preserve the existing disabled open-tab state and maximize/restore states. Any need to expand scope or alter approved behavior goes back to the Controller.
