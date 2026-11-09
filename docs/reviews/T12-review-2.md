# T12 review, round 2

Verdict: pass
Reviewed commit: dd5d916a7c885a86b20cafef2d0a778f6506a040
Gates: build pass; full smokes 379/379 pass with one partially skipped smoke; post-gate browser flows 3/3 pass.
Ponytail: reviewed the full diff and connected selection and render paths; no confirmed functional defect. Expected load is one person using the local app.

What this change does: It folds the right pane while keeping its contents mounted, and unfolds when a different occupant is opened. It adds browser coverage for the accepted control, its retained state, pane kinds and selection identity.

## Scope and gate evidence

Fetched `origin/agents/t12-rework1` at the reviewed SHA; its merge-base with `origin/main` was `f919c8a956090cfc7657b1a4d060c4855626d35a`. The actual diff contains TypeScript, CSS and Markdown, so it is mixed. A fresh temporary checkout at the reviewed SHA merged that main without conflicts or a new commit. After `npm ci`, the attributed full gate ran once on that exact SHA: build passed, 379/379 smokes passed, exit 0. No parallel failures required isolated disposition. `persistent-room-localfiles-secret-floor-smoke.ts` reported skipped find cases because fd was absent and a case-rename case on a case-sensitive disk; Windows and macOS-only portions of four smokes were also not exercised. Foreign-host network-failure reruns: zero.

After the full gate, the unchanged `memory-budget-refusal-ui-smoke.ts` passed once in isolation on the same SHA. The same-commit post-gate browser checks `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts`, and `right-pane-identity-ui-smoke.ts` passed 3/3 with invented data and a local fake service. No Docker or real model service was used.

### Earlier memory timeout

Round 1 (`docs/reviews/T12-review-1.md` on its separate review branch, commit `e63b52f9bfc4593cbae64f4a6142b338567d2e37`) recorded a red full gate at `189cd558aed56296d92e9aa0e5c1620e6a9597ba`: 376/378, with the topbar smoke failing its old geometry assertion and memory budget smoke timing out waiting for an enabled slider. Memory also timed out twice in isolated branch runs and passed once on the then-main baseline. The rework report records three isolated passes on the rebased baseline and updates the topbar assertion for the accepted position. None explains the old timeout or makes that old gate green.

In the settings flow, `RoomMaintenanceSection.tsx:67` clears the budget and fetches maintenance settings; the slider at `:242` stays disabled while the budget is null. A failed request also leaves it disabled and displays an error. The old evidence does not establish whether the request failed, stalled, or had another cause; this investigation and the new parallel and isolated passes do not establish the cause or prove the old symptom was environmental. The timeout remains unresolved debt and a preview acceptance item: open Room settings > Memory and confirm the saved budget loads and the slider can be changed.

## Spec checklist

Paths in the test column are under `apps/web-server/scripts/`; UI paths are under `apps/web-ui/src/`.

| # | Requirement | Code | Test | Status |
| --- | --- | --- | --- | --- |
| 1 | No button without pane; appears on first file | `App.tsx:8627`, `:8824` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| 2 | Fold to one column, hide pane, retain tabs, correct label and aria | `App.tsx:937`, `:8804`, `:8824`; `styles/43-room-workspace.css:306` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| 3 | Unfold retains tabs, active file, picture zoom/position and preview scroll | same | `workspace-file-tabs-ui-smoke.ts` | Pass |
| 4 | Opening another file while folded unfolds and adds tab | `App.tsx:939` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| 5 | Closing last folded tab clears toggle and class; reopening works | `App.tsx:8627`, `:8629` | `workspace-file-tabs-ui-smoke.ts` | Pass (close dispatched on mounted hidden control) |
| 6 | Markdown, preview, attachments, artifact and task run; no toggle for maximized artifact | `App.tsx:8627`, `:8628`, `:8824` | `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts`, `right-pane-identity-ui-smoke.ts` | Pass |
| 7 | Reachable, non-overlapping layout at 1000, 1600 and phone widths | `styles/43-room-workspace.css:308` | `workspace-file-tabs-ui-smoke.ts`, `room-topbar-ui-smoke.ts` | Pass with fresh width storage; known stored-width case below |
| 8 | Tab, Enter, Space and unchanged pane Escape | `App.tsx:8824` | `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts` | Pass |
| 9 | Unsaved Markdown draft survives | `App.tsx:937`, `:8824` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| 10 | Different artifact paths and task IDs unfold; same selection and metadata do not | `App.tsx:939`, `:4846` | `right-pane-identity-ui-smoke.ts` | Pass |
| 11 | Different live task-run ID unfolds | `App.tsx:939`, `:4856` | One live run and metadata checked in `right-pane-identity-ui-smoke.ts`; second selector unavailable | Unverified; debt below |
| 12 | Selected asset-row close returns to attachments | `App.tsx:4846`, `:4874` | `attachments-panel-ui-smoke.ts` | Pass |
| 13 | Guarded dirty switch cancel/failure preserves draft; save/discard proceeds | `App.tsx:4847` and workspace guard | `workspace-file-tabs-ui-smoke.ts` | Pass; folded discard lacks direct assertion |
| 14 | No new reads, authorization, server behavior or content path | `App.tsx:937` | `right-pane-identity-ui-smoke.ts` checks artifact reads; full diff inspection | Pass |
| 15 | Level 2; approved `PanelIcon` export only, no new boundary, dependency or route | `sidebar-collapse.tsx:88`, `App.tsx:6`; architecture spec | Full diff and import review | Pass |
| 16 | Invented data, no secrets, escaping and no real external effects | UI and smoke diff | Fixture and render inspection | Pass for changed paths |

The tests enter through the browser and real selection/render seam. Without the toggle, the first button assertion fails; without the expanded artifact key, changing artifact path or task ID while folded fails. The diff removes no tests. The change renders no new untrusted HTML, and uses React's normal escaping; the relevant threat is untrusted content from a web page, network request or room data, without machine write access.

## Findings

No confirmed functional defects. The old memory timeout remains unexplained and is not represented as an old-gate pass.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/memory-budget-refusal-ui-smoke.ts:124` | Capture the maintenance-settings response and visible error on a recurrence to diagnose the prior timeout; preview the real settings flow. |
| tests | minor | `apps/web-server/scripts/right-pane-identity-ui-smoke.ts:71` | Test switching between distinct live runs when a second selectable run exists. |
| tests | minor | `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts:641` | Exercise discard and pending selection directly while folded. |
| edge-case | minor | `apps/web-ui/src/App.tsx:932` | Clamp a stored wide pane on a narrower window, as deferred in the architecture review. |
| tests | minor | `apps/web-server/scripts/persistent-room-localfiles-secret-floor-smoke.ts` | Run the skipped find and case-rename checks in an environment with fd and a case-insensitive disk. |
