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
- [x] Tab, Enter and Space operate toggle; pane Escape behavior remains unchanged — `workspace-file-tabs-ui-smoke.ts` and `attachments-panel-ui-smoke.ts`.
- [x] Unsaved Markdown draft survives folding and unfolding — `workspace-file-tabs-ui-smoke.ts`.
- [x] While folded, different same-kind workspace file, artifact path and artifact task ID unfold and render selected content; metadata updates and selecting the same occupant do not falsely open — `workspace-file-tabs-ui-smoke.ts` and `right-pane-identity-ui-smoke.ts`. The distinct task-run transition is Controller-classified edge-case debt below.
- [x] Selected asset-row close preserves back-to-attachments behavior — `attachments-panel-ui-smoke.ts` opens and closes the selected folded gallery file.
- [x] Cancelled or failed guarded switch preserves draft and occupant; successful save or discard proceeds; folding does not trigger the guard — `workspace-file-tabs-ui-smoke.ts`.
- [x] Fold/unfold introduces no reads, authorization, server behavior or content path changes — `right-pane-identity-ui-smoke.ts` checks artifact reads; the diff adds no server or route changes.
- [ ] Record item-by-item test evidence, checks, changed files, assumptions and debt; merge origin/main, rerun affected suites and push.

## Measurement

Graph: no. Seven tool calls preceded the first edited file; no graph was used, so it made no difference.

The gallery remains visible when its viewer is folded; `attachments-panel-ui-smoke.ts` covers switching to another gallery file and returning to Attachments.

## Current verification and blocker

`npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed after building the runtime prerequisite. `npm run test:scripts` passed 54 tests. The attributed browser gates for `workspace-file-tabs-ui-smoke.ts` and `attachments-panel-ui-smoke.ts` passed. The workspace browser gate passed with fresh storage at all three widths, the guarded save and conflict paths, image position and PDF scroll. The attachment gate passed the gallery switch, selected-row close and maximize checks. Initial browser runs failed because the fresh checkout lacked built runtime output; the runtime was built locally. One exploratory draft test failed because it waited for a conflict message inside the folded pane; the corrected test unfolds before checking the existing visible error. Two viewport test setup attempts timed out while the phone drawer was open; the corrected test closes it through its control. These failures were not classified as load or network flakes. Foreign-host network-failure reruns: 0.

The Controller classified the distinct-task-run-while-folded transition as edge-case debt: `App.tsx` projects only one `liveTask`, and `openAssetRow` is the only task-run selector. A task-run occupant has no `attachmentsView`, so opening it removes the Attachments surface containing that selector; there is no visible second task-run row to select while the first is folded. Proposed follow-up: reconsider the acceptance when multiple simultaneous selectable runs are supported; no product or architecture change is authorized here. `right-pane-identity-ui-smoke.ts` tests the supported live task's fold, unfold and progress update, plus both same-task different-path and different-task same-path transcript selections, and selecting an already-active artifact. The final merge of `origin/main` and affected-suite rerun remain pending.

## Files, tests, assumptions and debt

Changed: `apps/web-ui/src/App.tsx`, `apps/web-ui/src/sidebar-collapse.tsx`, `apps/web-ui/src/styles/43-room-workspace.css`, `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`, `apps/web-server/scripts/attachments-panel-ui-smoke.ts`, `apps/web-server/scripts/right-pane-identity-ui-smoke.ts`, `docs/developer.md`, `docs/reviews/T12-R2-architecture-spec.md`, and this report. Added browser assertions to the existing suites and the new identity suite; no new dependency or export beyond the accepted base. Assumption: preserving the gallery when folding its file viewer repairs its existing chat-column role. The pre-existing `package-lock.json` modification remains uncommitted and untouched. No screenshots were captured. Debt candidate: a previously stored wide pane can squeeze the chat and its controls, as recorded in the architecture review; accepted out of scope. Full build and smokes are assigned to the Tester and wave and were not run.
