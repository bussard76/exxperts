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
- The invented Word route test failed with 503 before rendering and passed with the sandboxed renderer. `workspace-file-tabs-ui-smoke.ts` passed through `gate` with the Word fixture; deeper reference coverage and the final review remain open. One initial `npm ci` failed while the lock transition was incomplete; the corrected approved install passed.
- The Open route's invalid request and local-origin/path/permission tests failed before each corresponding route slice and passed afterward; a fake POSIX opener test also passed. UI, Windows and remaining Open controls remain open.
- The gated Open-button browser test timed out before the button existed and passed after the transferred local-context UI change. Dispatch in the browser test is mocked.
- `workspace-file-preview-smoke.ts --excel-child` failed before the OOXML producer, then passed for two sheets, stored formula result, fill, font and width after correcting a duplicate child declaration introduced during transfer. `npm run test:scripts -- scripts/bundle-server.test.mjs` passed 52 tests. Spreadsheet UI, remaining in-scope reference tests and number-format fidelity remain open.
- Spreadsheet browser smoke failed before the grid consumer and passed after transfer, including its empty, malformed, rich-text and merged-cell mocked responses. The real workbook browser case and reference comparison remain open.
- The complete reference `workspace-file-tabs-ui-smoke.ts` is present byte-for-byte and passed through `gate`, including the real generated `.xlsx`, `.xls`/`.xlsm` no-preview behavior, Word, PDF, image, dirty guards and Open controls. Before the scope-reset UI change it failed because `.xls` invoked the parser.
- The simulated Windows parent and native adapter checks failed before their corresponding implementation and passed afterward; the fake POSIX timeout test also passed. Bundle/prune script tests passed 53 tests. Real Windows and Electron opening remain Sascha's acceptance or later verification.
- The simulated stuck Windows opener test failed before bounded cleanup and passed after it. The desktop payload declaration-pruning test failed first and then passed as part of 54 script tests.

## Blocker: reference timeout test

The final reference `origin/agents/t4:apps/web-server/scripts/workspace-file-preview-smoke.ts` duplicates its `openTypes` dispatch loop inside the `timeoutChild` branch (lines 2154–2162). The corresponding files and fake POSIX opener are enabled only for `openChild` (lines 105–107 and 1268–1269), so transferring this in-scope test unchanged and running `npx tsx apps/web-server/scripts/workspace-file-preview-smoke.ts --timeout-child` fails with `ENOENT` reading `preview-spawns` before the preview timeout assertion; it cannot test the claimed behavior. The test patch was removed from the working tree after reproduction, not committed or weakened; the already existing fake Open test remains. The repository requires escalation when a test is wrong, and the dispatch requires every in-scope reference test, so coordinator direction is required before proceeding with the duplicate test.

Progress is pushed through the parent commit; all acceptance items remain open pending the remaining reference tests, self-review, final merge and checks. The original lockfile-only modification remains unstaged. No screenshots were captured; no full build or smokes were run. Known candidate debt includes broader spreadsheet number-format fidelity and real Windows/Electron verification.

## Final targeted verification and reference inventory (2026-11-06)

Focused results on `agents/t4-fresh-main`:

- `npx tsc --noEmit -p apps/web-ui/tsconfig.json`: passed.
- `npm run typecheck:scripts`: passed.
- `npx tsx apps/web-server/scripts/workspace-file-preview-smoke.ts`: passed.
- `npx tsx apps/web-server/scripts/workspace-markdown-images-smoke.ts`: passed.
- `npx tsx apps/web-server/scripts/workspace-file-preview-smoke.ts --open-child`: passed.
- `npx tsx apps/web-server/scripts/workspace-file-preview-smoke.ts --timeout-child`: passed; the preview 504 and slot-release 503 assertions remain, and the duplicate Open loop was removed as authorized. Valid dispatch coverage stays under `--open-child`.
- `GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate npx tsx apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`: passed, including the generated `.xlsx`, PDF, image, Word, tab close/reuse, dirty draft and Open UI cases.
- `npm run test:scripts -- scripts/bundle-server.test.mjs apps/desktop/scripts/prune-payload.test.mjs`: passed 54/54.
- An earlier invocation, `npm run test:scripts -- apps/web-server/scripts/workspace-file-preview-smoke.ts apps/web-server/scripts/workspace-markdown-images-smoke.ts scripts/bundle-server.test.mjs apps/desktop/scripts/prune-payload.test.mjs`, failed only because the configured runner calls `node --test` directly on TypeScript files. Exact errors: it could not resolve `apps/web-server/scripts/smoke-server-process.js` imported by `workspace-file-preview-smoke.ts`, and `apps/web-ui/src/components/WorkspaceImageExtension.js` imported by `workspace-markdown-images-smoke.ts`. Both are TypeScript source imports with no built `.js` artifacts in this worktree. The supported `tsx` invocations above passed. The bundle and prune suites passed alone (54/54); this was a runner mismatch, not a product assertion failure.

### Source-to-destination test inventory

The test-bearing in-scope reference files are `apps/web-server/scripts/workspace-file-preview-smoke.ts`, `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`, `apps/web-server/scripts/workspace-markdown-images-smoke.ts`, `scripts/bundle-server.test.mjs`, and `apps/desktop/scripts/prune-payload.test.mjs`. The first three are present here; the tabs smoke matches `origin/agents/t4` byte-for-byte, while preview smoke retains the PDF/image/Word/XLSX, read-policy, path/symlink, child lifecycle, local Open and Windows fake-adapter cases with the scope-invalid duplicate Open loop omitted from `--timeout-child`. Markdown image smoke retains route classification and resolver behavior. Bundle and prune tests include the preview worker packages, native opener worker, and declaration pruning.

Excluded reference tests and artifacts are all legacy `.xls` decoder/CFB/BIFF fixtures, generators and probes; SSF-only formatter controls; and checks which reject ExcelJS behavior expressly accepted as a known limitation by the scope decision (date rounding, partial returned sheets, DTD, encrypted workbook detection and merge resource cases). `.xls` and `.xlsm` UI no-preview/Open behavior remains tested. The original root/server `xlsx` package used by the unrelated attachment tool remains present. No test-count guard changes or padding tests were made. No binary screenshots were committed.

### Self-review against acceptance

- [x] R1: gated UI smoke opens PDF, image, Word and XLSX beside Markdown.
- [x] R2: gated UI smoke covers tab reuse and active tree state.
- [x] R3: gated UI smoke covers close behavior and Markdown dirty guards.
- [x] R4: real route and browser workbook fixtures cover two sheets, switching/scrolling, cached formula result and styling; formatter limitations are recorded as debt.
- [x] R5: invented Word fixture covers heading, styled text, table and image through isolated route and browser paths.
- [x] R6: UI checks contain no edit/save/download control; route and fake opener checks preserve original file bytes and access policy.
- [ ] A1: full build/smokes belongs to the independent Tester and wave; not run in this Developer stage.
- [x] A2: generated fixtures cover the requested workbook and Word visual features; no binary fixture is committed.
- [x] A3: route and browser assertions verify the stored formula result is shown instead of its expression.
- [ ] A4: local real-file acceptance belongs to Sascha and remains outstanding.
- [x] Open action: preview header action is locally authorized and fake-platform dispatch tests pass; real OS/Electron observation remains outstanding.

Developer checks complete. Remaining non-developer gates are the independent Tester/full build and smoke run, Sascha's real-file and OS/Electron acceptance, and independent review. Debt candidates: broader number-format fidelity and real Windows/Electron verification. No full build or full smokes were run by this worker as specified.
