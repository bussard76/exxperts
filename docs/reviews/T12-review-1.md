# T12 review, round 1

Verdict: pass
Reviewed commit: 189cd558aed56296d92e9aa0e5c1620e6a9597ba
Gates: **fail** (build passed; full smokes 376/378 passed). Browser pane flows: pass, 3/3 isolated after the full gate.
Ponytail: full diff and connected selection/render flow reviewed; no confirmed functional defect in the specified pane flows. Expected load: a local app used by one person.

What this change does: It adds a right-pane fold control while keeping its contents mounted. It unfolds on a change of occupant, including artifact task and path identity, without unfolding on metadata updates.

## Gate evidence

The diff from merge-base `2bf175596af63816bb95b2ffd9bfde8cf7caa66b` is mixed (code, tests and Markdown). A clean checkout of the reviewed head merged current origin/main without changes. The attributed full gate `npm run build && npm run smokes` ran once on that head: build passed; smokes **failed**, 376/378. Platform-specific test portions were not exercised on Linux (Windows short names and path cases, and macOS Finder details); one secret-floor smoke reported a skipped part. Foreign-host network-failure reruns: zero.

| Smoke | Parallel full gate | Isolated on reviewed SHA, jobs 1 | Clean current main `2bf175596af63816bb95b2ffd9bfde8cf7caa66b`, jobs 1 |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | FAIL | FAIL, same geometry assertion | PASS after build |
| `memory-budget-refusal-ui-smoke.ts` | FAIL, timeout waiting for enabled slider | FAIL, same timeout; a further rebuilt-head run also FAIL | PASS after build |

The topbar assertion at `apps/web-server/scripts/room-topbar-ui-smoke.ts:135` requires the last action glyph to end at the workspace banner edge within one pixel. When the viewer is open, the newly last action is the pane toggle; its glyph ends 11px beyond that edge in eight desktop configurations. The new placement at `apps/web-ui/src/styles/43-room-workspace.css:308` accounts for the difference and is part of the accepted layout; the pane-specific test checks reachability and non-overlap. The old assertion was not updated. This remains a failed gate, not a successful test.

The memory-budget failure is **unresolved**: the browser test reaches Room settings and waits for the saved-budget slider to become enabled, but times out at `apps/web-server/scripts/memory-budget-refusal-ui-smoke.ts:124`. It failed in the full run and two isolated branch runs, and passed once on main. This comparison raises a possible regression, but the captured evidence does not identify the cause or establish whether the disabled slider occurs for a real user rather than the fixture. The test and its settings implementation are unchanged by this diff. Investigate before integration; do not treat the gate as green or this timeout as a proven flake.

Post-gate browser checks, with invented data and fake services: `attachments-panel-ui-smoke.ts`, `right-pane-identity-ui-smoke.ts`, and `workspace-file-tabs-ui-smoke.ts` each passed in one attributed jobs-1 run on the reviewed SHA. No Docker or real model service was used.

## Spec checklist

Paths below are relative to `apps/web-server/scripts/` for tests and `apps/web-ui/src/` for code.

| # | Requirement | Code | Test | Status |
| --- | --- | --- | --- | --- |
| 1 | No button when pane absent; first file shows it | `App.tsx:8627`, `App.tsx:8824` | `workspace-file-tabs-ui-smoke.ts:280` | Pass |
| 2 | Fold to one column, hide pane but keep tabs, label and aria state | `App.tsx:8804`, `styles/43-room-workspace.css:306` | `workspace-file-tabs-ui-smoke.ts:285` | Pass |
| 3 | Unfold retains active tabs, zoom and scroll | same | `workspace-file-tabs-ui-smoke.ts:289`, `:779`, `:835` | Pass |
| 4 | Another same-kind workspace file opens and unfolds | `App.tsx:939` | `workspace-file-tabs-ui-smoke.ts:291` | Pass |
| 5 | Last tab close clears class and toggle; reopen works | `App.tsx:638`, `:8629` | `workspace-file-tabs-ui-smoke.ts:295` | Pass; close control invoked in DOM while hidden |
| 6 | Markdown, preview, attachments, artifact and task run; maximized artifact hides toggle | `App.tsx:8627`, `:8716`, `:8824` | `workspace-file-tabs-ui-smoke.ts`, `attachments-panel-ui-smoke.ts:225`, `right-pane-identity-ui-smoke.ts:65` | Pass |
| 7 | 1000px, 1600px, phone: reachable without overlap using fresh storage | `styles/43-room-workspace.css:306` | `workspace-file-tabs-ui-smoke.ts:229` | Pass for tested controls and pane bounds; old topbar assertion fails as above |
| 8 | Tab, Enter, Space and unchanged Escape | `App.tsx:8824` | `workspace-file-tabs-ui-smoke.ts:302`, `attachments-panel-ui-smoke.ts:236` | Pass |
| 9 | Unsaved draft survives folding without guard | `App.tsx:937`, `:8824` | `workspace-file-tabs-ui-smoke.ts:570` | Pass |
| 10 | Different artifact paths and task IDs unfold and render; same selection and metadata do not | `App.tsx:939`, `:7617`, `:8739` | `right-pane-identity-ui-smoke.ts:44` | Pass |
| 11 | Different live task-run ID unfolds | `App.tsx:939`, `:4856` | No reachable second live run selector; `right-pane-identity-ui-smoke.ts:71` covers one run and metadata | Code includes identity; unverified transition, debt below |
| 12 | Selected asset-row close returns to attachments | `App.tsx:4846`, `:4874` | `attachments-panel-ui-smoke.ts:322` | Pass |
| 13 | Cancel or failed guarded switch keeps draft; save or discard permits switch | `App.tsx:654`, `:4847` | `workspace-file-tabs-ui-smoke.ts:573`, `:614`, `:624`, `:645` | Pass; folded discard transition lacks direct assertion |
| 14 | Fold adds no read, authorization, server behavior or new content path | `App.tsx:937`, `:940` | `right-pane-identity-ui-smoke.ts:46` and diff inspection | Pass for artifact reads and inspected diff |
| 15 | Level 2, accepted export only, no new boundary, dependency or route | `sidebar-collapse.tsx:88`, `App.tsx:6` | Full diff and architecture spec | Pass |
| 16 | Invented data, no secrets or real external systems, escaped untrusted content | UI diff and added fixtures | Smoke fixture inspection; React rendering, no new interpolation into HTML | Pass for diff inspected |

The tests use real browser selection and rendered pane entry points. Without the toggle implementation, the first toggle assertion fails; with the earlier kind-only artifact key, the changed artifact path and same path in a different task do not unfold. The diff does not remove existing tests. The gallery exception leaves the gallery visible as documented in the report.

## Findings

No confirmed functional defects in the specified pane flows. The red gate and unresolved memory-budget comparison above require normal Controller disposition and are not represented as a passing gate.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/room-topbar-ui-smoke.ts:135` | Align the last-action geometry assertion with Sascha's accepted toggle position while keeping the remaining topbar checks. |
| tests | minor | `apps/web-server/scripts/memory-budget-refusal-ui-smoke.ts:124` | Diagnose the reproducible branch timeout against main and establish whether the real settings flow is affected before integration. |
| tests | minor | `apps/web-server/scripts/right-pane-identity-ui-smoke.ts:71` | Cover switching between distinct live task runs when a second selectable run exists. |
| tests | minor | `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts:641` | Exercise discard and pending selection directly while the pane is folded. |
| edge-case | minor | `apps/web-ui/src/App.tsx:932` | Clamp a previously stored wide pane when loading a narrower window; this squeezed layout is explicitly deferred by the architecture review. |
