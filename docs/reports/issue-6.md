# Issue 6 developer report

## Gate isolated follow-up — 2026-11-06

Sascha's decision limits this follow-up to controller wave handling and process documentation. Issue 6 was already integrated at c61bba4; the historical issue checklist and evidence below are retained, and its feature work is not repeated.

### Architecture impact

Level 1: existing controller wave handling and process documentation; no new public export, dependency, route, store, or product data flow is authorized.

### Acceptance checklist

- [x] Historical Result: sidebar closes and reopens repeatedly with and without a workspace folder. This is the already-integrated issue, not new work in this follow-up.
- [x] Historical Observable: UI smoke exercises two collapse/reopen cycles; see the original report below.
- [ ] Historical Observable: Sascha's macOS Electron preview acceptance; see the original report below.
- [ ] Full build must pass before any failed smoke can be accepted.
- [ ] Identify the complete, exact set of parallel smoke failures; rerun each individually on the unchanged integration commit and preserve both results.
- [ ] Permit push only for zero failures, or one or two parallel failures with all individual reruns passing; three or more, missing or ambiguous evidence, changed commit, non-smoke failure, or individual failure remains red.
- [ ] Preserve serialized host full gates, all tests and hooks; no live wave or full gate in this task.
- [ ] Test the wave public entry point with fake commands and temporary repositories: zero, one, two and three failures, individual failure, build failure, ambiguous log, changed commit and push gating.
- [ ] Update `docs/coordinator.md` and `docs/dev-workflow.md` together in one commit, citing Sascha's 2026-11-06 decision.
- [ ] Back up the controller-only wave script and provide its full diff for independent review before use.
- [ ] Run requested targeted checks, merge current origin/main, rerun affected suites, complete this report and push the task branch.

### Blocker and self-review

The existing `scripts/run-smokes.mjs` writes arbitrary failure output after its summary and emits no final runner completion marker. The controller's `smoke-failures.mjs` explicitly marks every failed run unresolved because it cannot verify that the failure tail is complete. `integ-wave.sh` appends its own marker only after the verification command exits, which does not establish that the runner itself finished rather than an interruption or later non-smoke failure. Its configurable `VERIFY_CMD` also does not separately establish build success. Thus exact complete extraction and the build prerequisite cannot be proven from the present combined log; treating it as green would violate the fail-closed rule. The task explicitly requires escalation when exact extraction cannot be proven from the real runner format. No controller script or process documentation has been changed; independent review remains mandatory before any future use.

Assumption: the current checked-in runner format and existing controller parser are the relevant production evidence. No new tests or screenshots were added, and no live gate was run. The only follow-up file changed is this report. Debt candidate: the human-readable runner output lacks independently verifiable completion evidence; any remedy requiring a runner contract or new data flow needs the coordinator's architectural decision.

## Architecture impact

Level 1: existing sidebar and layout CSS; no new public boundary, dependency, route, store, or data flow.

## Acceptance checklist

- [ ] Result: the sidebar closes and opens repeatedly in a room with a workspace folder and in one without.
- [ ] Observable: a UI smoke collapses and reopens twice and fails on today's code.
- [ ] Observable: on preview, collapse and reopen restores the file tree (Sascha's macOS Electron acceptance remains necessary).

## Investigation

Assumption: browser UI interaction is the available public test seam; Chromium cannot establish native Electron drag-region hit-testing. Historical upstream web results are not an upstream macOS Electron comparison. No confirmed root cause yet.

The newest fork issue comment reports a visible, unresponsive toggle after entering a room already collapsed on macOS Electron at main `7267ac7`. No macOS or Electron is available here. Historical `T6-browser.md` observed two successful Chromium cycles in upstream web and feature web; those are not a comparison in macOS Electron and do not determine whether upstream has the native defect. `T6-postmain.md` notes that the floating button already has `no-drag` and z-index 40 above the drag strip at 20; neither static CSS nor web hit-testing establishes native drag behavior. Root cause remains unconfirmed; no speculative product fix was made.

The new `sidebar-reopen-ui-smoke.ts` enters two invented rooms initially collapsed, clicks Show then Hide twice, checks the invented `notes.md` after each reopen, and checks the floating button's centre hit and computed no-drag in the mac look. On current main it passes, so it does **not** satisfy the requirement that a smoke fail on today's native bug. Chromium does not perform Electron native drag-region or traffic-light hit-testing; this is not a native reproduction or proof of a fix. No screenshots were captured.

## Checks and self-review

- Result: `sidebar-reopen-ui-smoke.ts` passes two cycles in both rooms in Chromium mac look; macOS Electron behavior remains unverified and the reported failure remains unresolved.
- Observable smoke: same smoke passes on current code; no red-capable test for the native symptom was established. The initial gated run failed because runtime build artifacts were missing; after the targeted runtime build the smoke passed on its first rerun.
- Preview file tree: the same smoke sees invented `notes.md` after both browser reopenings; Sascha must verify the actual Electron preview after a confirmed fix.
- `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts`: passed after building runtime. The first attempt passed UI typechecking but script typechecking failed on missing runtime build artifacts.
- `npm run build` in `runtime` and `npm run build --workspace @exxeta/pi-web-ui`: passed to prepare the targeted browser run. No full build or full smoke suite was run. No existing script unit suites were affected by the new browser smoke.
- Scope: level 1, no product code changed. Files: this report and the new browser smoke. Tests added: `sidebar-reopen-ui-smoke.ts`. Assumption: 1280×800 and mac CSS class provide useful web evidence only. Debt candidate (tests): native two-cycle room/folder regression needs a macOS Electron seam and reproducible failure. No browser was installed and no real data or model API was used.
- Remaining blocker: native input delivery, geometry, and upstream comparison need evidence from Sascha's macOS Electron client; request the click point, window size and zoom, whether the window moves, and whether a click reaches the control. Until then a cause, a fix, and the issue's native acceptance cannot be established.

### Follow-up: native drag-region investigation

The desktop dependency specifies Electron `^43.8.3`; the window uses one `BrowserWindow`, `hiddenInset`, and traffic lights at (18,18), with no `WebContentsView` in its implementation. [Electron 43.8.3's documentation](https://github.com/electron/electron/blob/v43.8.3/docs/tutorial/custom-window-interactions.md) says drag regions suppress pointer events and describes the experimental `ELECTRON_DEBUG_DRAGGABLE_REGIONS` overlay. This could show whether the native region covers the control on Sascha's Mac; it has not been run here. [Electron's documented macOS change](https://github.com/electron/electron/blob/main/docs/breaking-changes.md) says CSS layering affects overlapping drag and no-drag regions from Electron 23 onward, so a computed `no-drag` value by itself is insufficient to prove native click delivery.

The smoke now uses a macOS desktop user agent from page startup, exercising the actual desktop-class and zoom initialization rather than adding the class after the room loads. The gated smoke passes again. As a sensitivity check, temporarily adding a CSS rule that changed the floating button's computed region to `drag` made it fail at the first folder-room cycle with `region: drag` (button rectangle x 87, y 11, 28×28); the rule was removed. This shows that one CSS invariant is tested, not that the smoke reproduces the real failure or native region calculation. No native cause is established; awaiting Mac evidence remains necessary.

### Native observation on main

Sascha's fork issue comment reports macOS Electron at 1728×1050 points and unchanged zoom: the draggable-region overlay covers the visible collapsed toggle around (101,24), with no cut-out. Accessibility activation opens it, while a pointer click is not delivered; the expanded header toggle has a cut-out and its pointer click closes the sidebar. This establishes native drag interception and an intact accessible activation path at that point; it does not yet identify why the floating no-drag region is absent. Upstream macOS Electron and other zooms remain untested. Both the drag strip and the room topbar overlap that position, so distinguishing their native effect is needed before choosing a minimal fix. Native confirmation of any fix remains outstanding.

### Proposed fix and acceptance self-review

Sascha's later native comparison found that the same floating toggle opens on Home but not in a room at the same point; the room adds a draggable topbar. He also reproduced the problem in the installed upstream 0.15.1 app. That supports an upstream release defect, but current upstream `main` has not been tested on macOS. No writes were made to EXXETA.

`apps/web-ui/src/main.tsx` now renders the existing floating affordance after `App`, keeping it after the room topbar in document order. The topbar remains draggable, and the button retains its existing no-drag style and location. [Electron 43.8.3's region conversion](https://github.com/electron/electron/blob/v43.8.3/shell/browser/ui/drag_util.cc) folds the reported rectangles in order, adding drag rectangles and subtracting no-drag rectangles. The hypothesis that Chromium reports these particular rectangles in document order is not yet verified natively; Sascha must test the candidate. This supersedes the earlier statement that no product change was made.

- Result: `sidebar-reopen-ui-smoke.ts` performs two real browser pointer cycles per room with and without an invented folder, starting collapsed, and checks the invented file returns; passes after the change. Native behavior after the change still needs Sascha's check.
- Observable smoke: the added ordering check failed on the original code at the first folder-room cycle and passes after the move. It is a guard for the candidate's document ordering, not a native input test or proof that the original Mac failure is fixed. The test also verifies computed no-drag, centre hit-testing and a draggable room topbar.
- Preview: `sidebar-reopen-ui-smoke.ts` verifies file restoration twice in Chromium. Mac Electron preview and actual drag-region cut-out remain for Sascha.
- Typechecks: `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed with the candidate. Targeted `room-topbar-ui-smoke.ts` passed 74 checks through gate, including room header geometry and draggable CSS. Targeted browser checks were rerun after merging `origin/main`; see final check result below.
- Files changed: `apps/web-ui/src/main.tsx`, `apps/web-server/scripts/sidebar-reopen-ui-smoke.ts`, this report. No new dependency, public export, route, store, or data flow; architecture level 1. No full gate, Electron session, browser installation, or screenshot on this host. Assumption: reported native draggable regions follow the relevant document order. Debt candidate (tests): a native two-cycle room/folder regression must establish actual Electron pointer input and region ordering.
- Final post-merge gated rerun: `sidebar-reopen-ui-smoke.ts` passed; `room-topbar-ui-smoke.ts` passed 74 checks. No load or network failures occurred in these runs.
