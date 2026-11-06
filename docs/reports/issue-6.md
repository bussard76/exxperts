# Issue 6 developer report

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
