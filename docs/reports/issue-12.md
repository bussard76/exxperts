# Issue 12: right pane hardening

## Architecture impact

Level 2: the existing App and sidebar icon export, pane renderers and room CSS retain their boundaries; no new exports, dependencies, routes, stores, contracts or data flows.

## Acceptance checklist

- [x] No toggle with no visible right pane; first file shows it — `workspace-file-tabs-ui-smoke.ts`.
- [x] Fold into one grid column, hide pane, retain tabs in DOM, expose collapsed label and aria state — `workspace-file-tabs-ui-smoke.ts`.
- [x] Unfold preserving tabs, active tab, picture zoom and scroll — `workspace-file-tabs-ui-smoke.ts` verifies image zoom and position and PDF scroll.
- [x] Opening another file while folded adds its tab and unfolds — `workspace-file-tabs-ui-smoke.ts` (two images).
- [x] Closing last tab while folded clears toggle and collapsed class; reopening works — `workspace-file-tabs-ui-smoke.ts` (dispatches the mounted tab close control).
- [x] Toggle works for Markdown, workspace preview, attachments, artifact and task run; maximized artifact hides toggle — `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts`, `right-pane-identity-ui-smoke.ts`.
- [x] At 1000px, 1600px and phone width with independently clean pane-width storage, controls remain reachable without overlap — `workspace-file-tabs-ui-smoke.ts`.
- [x] At 1000px and 1600px, toggle right edge is within 12px of the open pane left edge and never overlaps the gear — `workspace-file-tabs-ui-smoke.ts`; Sascha accepted commit `6b7a667`.
- [x] Tab, Enter and Space operate toggle; pane Escape behavior remains unchanged — `workspace-file-tabs-ui-smoke.ts` and `attachments-panel-ui-smoke.ts`.
- [x] Unsaved Markdown draft survives folding and unfolding — `workspace-file-tabs-ui-smoke.ts`.
- [x] While folded, different same-kind workspace file, artifact path and artifact task ID unfold and render selected content; metadata updates and selecting the same occupant do not falsely open — `workspace-file-tabs-ui-smoke.ts` and `right-pane-identity-ui-smoke.ts`. The distinct task-run transition is Controller-classified edge-case debt below.
- [x] Selected asset-row close preserves back-to-attachments behavior — `attachments-panel-ui-smoke.ts` opens and closes the selected folded gallery file.
- [x] Cancelled or failed guarded switch preserves draft and occupant; successful save or discard proceeds; folding does not trigger the guard — `workspace-file-tabs-ui-smoke.ts`.
- [x] Fold/unfold introduces no reads, authorization, server behavior or content path changes — `right-pane-identity-ui-smoke.ts` checks artifact reads; the diff adds no server or route changes.
- [x] Record item-by-item test evidence, checks, changed files, assumptions and debt; merge origin/main, rerun affected suites and push — this report and the checks below.

## Measurement

Graph: no. Seven tool calls preceded the first edited file; no graph was used, so it made no difference.

The gallery remains visible when its viewer is folded; `attachments-panel-ui-smoke.ts` covers switching to another gallery file and returning to Attachments.

## Verification and debt

`npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed after building the runtime prerequisite. `npm run test:scripts` passed 54 tests. The attributed browser gates for `workspace-file-tabs-ui-smoke.ts` and `attachments-panel-ui-smoke.ts` passed. The workspace browser gate passed with fresh storage at all three widths, the guarded save and conflict paths, image position and PDF scroll. The attachment gate passed the gallery switch, selected-row close and maximize checks. Initial browser runs failed because the fresh checkout lacked built runtime output; the runtime was built locally. One exploratory draft test failed because it waited for a conflict message inside the folded pane; the corrected test unfolds before checking the existing visible error. Two viewport test setup attempts timed out while the phone drawer was open; the corrected test closes it through its control. These failures were not classified as load or network flakes. Foreign-host network-failure reruns: 0.

The Controller classified the distinct-task-run-while-folded transition as edge-case debt: `App.tsx` projects only one `liveTask`, and `openAssetRow` is the only task-run selector. A task-run occupant has no `attachmentsView`, so opening it removes the Attachments surface containing that selector; there is no visible second task-run row to select while the first is folded. Proposed follow-up: reconsider the acceptance when multiple simultaneous selectable runs are supported; no product or architecture change is authorized here. `right-pane-identity-ui-smoke.ts` tests the supported live task's fold, unfold and progress update, plus both same-task different-path and different-task same-path transcript selections, and selecting an already-active artifact. `origin/main` was fetched and was already merged; all three affected browser suites, the two typechecks and `npm run test:scripts` passed afterward.

## Files, tests, assumptions and debt

Changed: `apps/web-ui/src/App.tsx`, `apps/web-ui/src/sidebar-collapse.tsx`, `apps/web-ui/src/styles/43-room-workspace.css`, `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`, `apps/web-server/scripts/attachments-panel-ui-smoke.ts`, `apps/web-server/scripts/right-pane-identity-ui-smoke.ts`, `docs/developer.md`, `docs/reviews/T12-R2-architecture-spec.md`, and this report. Added browser assertions to the existing suites and the new identity suite; no new dependency or export beyond the accepted base. Assumption: preserving the gallery when folding its file viewer repairs its existing chat-column role. The pre-existing `package-lock.json` modification remains uncommitted and untouched. No screenshots were captured. Debt candidate: a previously stored wide pane can squeeze the chat and its controls, as recorded in the architecture review; accepted out of scope. Full build and smokes are assigned to the Tester and wave and were not run.

## Self-review

- Visibility, fold, expand, state retention, closing and reopening: `workspace-file-tabs-ui-smoke.ts` checks the empty state, column, hidden mounted tabs, draft, active tab, image position, PDF scroll, reopening and the existing guard paths.
- Pane kinds, maximized viewer, Escape and keyboard: `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts` and `right-pane-identity-ui-smoke.ts` cover Markdown, workspace preview, Attachments, artifact and task run, including Enter, Space, Tab, Escape and maximize.
- Selection identity and privacy: `right-pane-identity-ui-smoke.ts` uses real transcript selections, verifies rendered content for changed paths and task IDs, checks same selection and task progress while folded, and checks no repeated artifact fetch from folding. The separate selected-row close and gallery behavior use `attachments-panel-ui-smoke.ts`. No new routes, dependencies, exports, server reads or authorization paths were added.
- Layout and position: `workspace-file-tabs-ui-smoke.ts` uses separate fresh browser contexts at 1000px, 1600px and phone width, checks the toggle and pane bounds, and verifies the accepted 12px and gear-clearance requirements.
- The Controller classified the otherwise untestable second live task-run selection as edge-case debt as explained above. The pre-existing lockfile change was preserved. No screenshots were taken; graphify was not run.

Final Developer checks: the attributed gate passed `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts` and `right-pane-identity-ui-smoke.ts` after the main merge; `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed, and `npm run test:scripts` passed 54 tests. Full build and smokes remain for the independent Tester and wave.

## Rework 1

Architecture impact: level 2 (existing right-pane UI boundary; no new export, dependency, route, or flow). Rebased `agents/t12-rework1` onto `origin/main` `f919c8a956090cfc7657b1a4d060c4855626d35a` without conflicts; upstream 0.15.2 topbar no-drag ordering, floating-toggle z-index and dialog-backdrop checks remain. Final fetch still found that main SHA. Original branch `agents/right-pane-collapse` remains at `189cd558aed56296d92e9aa0e5c1620e6a9597ba`; its sole dirty lockfile was saved as `t12-rework1-package-lock-20261109`, stash object `a2ef50cd385d3780b252a46c493754125db17d44`. The diff and stash patch both hash to `31a73a09769f493a74b6701456a3cd7af0250dfc` via `git hash-object --stdin`; the prior record did not contain a hash, so historical byte identity is not proven.

- Topbar: `room-topbar-ui-smoke.ts` on the built rebased baseline failed eight viewer-open cases by exactly 11px, reproducing the review. The accepted pane toggle is now the last glyph and sits 11px beyond the banner; the test retains its 1px tolerance around the appropriate offset and the original zero offset when absent. The same public browser smoke passed twice afterward, 78 checks each; `workspace-file-tabs-ui-smoke.ts` passed and retains the explicit 1000/1600px within-12px and no-gear-overlap assertions. No unrelated topbar assertions were removed.
- Memory: `memory-budget-refusal-ui-smoke.ts` passed three isolated attributed runs on the rebased built baseline; review recorded failure in the full run and repeated isolated runs at the enabled slider. The task diff does not modify the settings flow or this smoke; comparing the original head to the rebased head shows only desktop/sidebar CSS and unrelated shelf server changes in UI/server source. A passing rebased run does not establish why the earlier branch timed out, whether it affected a real user, or that an environmental cause existed. No functional fix or failing-first regression test is claimed, and the original full gate remains red and unresolved.
- Checks: UI workspace Vite build, UI and script typechecks, `npm run test:scripts` (54 passed), and attributed browser smokes `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts`, and `right-pane-identity-ui-smoke.ts` passed. The full build and smokes were not run, as assigned to Tester and wave. Foreign-host network failure reruns: 0. Graph: no; no graph was used for this rework, so it made no difference. No real services or real data were used.
