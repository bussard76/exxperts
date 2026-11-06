# Issue 4 developer report

## Architecture impact

Level 2: the approved workspace preview route, parsing, dependencies and preview Open action; existing workspace access and read-only boundaries remain in force.

## Acceptance checklist

- [ ] R1: PDF, image, Word and `.xlsx` files open as separate tabs beside Markdown.
- [ ] R2: Reopening activates the existing tab and marks the active tree file.
- [ ] R3: Tabs close; closing the active tab selects a neighbour and closing the last closes the pane.
- [ ] R4: Every workbook sheet is reachable; switching, scrolling, cached results and basic styling work.
- [ ] R5: Word text, tables and images retain their basic look.
- [ ] R6: Previews cannot edit, save or download files.
- [ ] A1: Full build and smokes pass, including both workspace preview smokes (independent Tester and wave); developer runs targeted checks.
- [ ] A2: Invented workbook and Word fixtures prove specified visual features.
- [ ] A3: Formula cells display stored results, not formulas.
- [ ] A4: Sascha checks real Excel and Word files locally, sheet switching and tab reactivation.
- [ ] Approved preview Open button opens the original locally and follows the access and remote-device rules.

Scope assumption: `.xls` and `.xlsm` retain the no-preview sentence and Open button. The 52 old-format tests ended with the scope decision and never existed on main. No binaries or screenshots will be committed; captures, if any, remain untracked under `.build/screenshots/`.

## Progress

- `workspace-markdown-images-smoke.ts` failed on the missing preview route classification, then passed after classifying preview GET as read and Open POST as local. Routes and acceptance items remain incomplete.
- `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` and the runtime build passed; the first smoke attempt could not find the unbuilt runtime. No screenshots captured.
- `workspace-file-preview-smoke.ts` first received 404 for the preview route; the transferred initial route now returns the tested safe error response. Rendering and access guards remain to be implemented.
- `workspace-file-preview-smoke.ts` now covers existing conversation, read permission, invalid paths, the workspace resolver, symlink refusal and unsupported formats; each transferred assertion failed before its corresponding implementation and passed after it. Successful previews and post-render rechecks remain open.
- `workspace-file-tabs-ui-smoke.ts` timed out waiting for the image before the image tab implementation; after the UI build, the gated browser smoke passed. This covers the initial image/Markdown tab, reuse, tree marking and close flow; other formats and fuller tab cases remain open.
- The gated browser smoke now checks the dirty Markdown guard when switching to an image; its wording assertion failed before the change and passed after it.
- The invented PDF route test failed with 503 before the renderer; `workspace-file-preview-smoke.ts` and the gated `workspace-file-tabs-ui-smoke.ts` passed after transfer. PDF scroll and broader fidelity tests remain to be transferred.
- PDF scrolling assertion in the gated browser smoke failed before the layout correction and passed afterward.
