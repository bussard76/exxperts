# T22-S2-PORT developer report

## Architecture impact
Level 1, as independently reviewed: existing Markdown editor module, internal task helper and toolbar, and editor CSS. No new public package export, dependency, route, store, permissions or data flow. Baseline `cdc3d5c29b7cfd959051b5594f50cef94e3211de`; product and test candidate `25c5d99cc906ba9379351d00968ff721b3787fa1`. This report-only commit follows that tested candidate; Controller owns the combined candidate with the independent lock delta.

## Acceptance and self-review

- [x] Editable, monospaced RAW with existing save, dirty, autosave, conflict and read-only machinery: `workspace-markdown-raw-ui-smoke.ts` types, autosaves, compares file bytes, checks reload and read-only; existing `workspace-markdown-images-ui-smoke.ts` checks dirty navigation and paired-device policy.
- [x] RAW/Edit/Preview and exact-source round trips: `workspace-markdown-raw-ui-smoke.ts` checks unsupported formatting, no-change round trip, Preview, current rich edits, later saves, failed-save retention, actual Keep mine, Reload, a held PUT and clean external replacement. `workspace-markdown-images-ui-smoke.ts` checks navigation with later edits and discard.
- [x] Task cycles, selected mixed lines, indentation, active state and disabled controls: `markdown-raw-tasks-smoke.ts` checks single, nested, mixed, blank and boundary selections and repeat cycles; `workspace-markdown-raw-ui-smoke.ts` checks visible toolbar, selection and active state. RAW disables Undo, Redo, paragraph, H1–H3, blockquote, bold, italic, strike, inline code, link, bullet and numbered lists, Find, Insert table and Copy; Tasks stays enabled subject to write permission.
- [x] Edit checkboxes save both directions: `workspace-markdown-raw-ui-smoke.ts` clicks both and verifies on-disk Markdown, then observes it in RAW.
- [x] Geometry: `workspace-markdown-raw-ui-smoke.ts` preserves 1280x900, >=500px and body-minus-60px height, and <=3px checkbox center offset assertions.
- [x] The five source changes are in order, retain original author and sign-offs, and touch only the six reviewed product/test paths. Compared the final five non-CSS files against `0280121`, before adding targeted test evidence; CSS diff against Series 2 is confined to the specified editor selectors. No manifest or lock changes.
- [x] Targeted checks below; no full gate or merge of main/review branches, per Controller override. Existing route/image/tab/drag/navigation coverage is in `workspace-markdown-images-ui-smoke.ts` and the listed route smokes. Combined Series 1+2 evidence and full independent gate remain Controller/Tester responsibilities.

## Checks

At product/test candidate `25c5d99cc906ba9379351d00968ff721b3787fa1`, Node 22.23.4:

- `npm ci` passed with lifecycle scripts; `npm run build` in `runtime` passed; `npm run build -w apps/web-ui` passed. The browser-skip environment was mistakenly set to `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` rather than this repo's `EXXETA_SKIP_BROWSER_INSTALL=1`, so postinstall invoked `playwright install chromium`; this departed from the dispatch instruction and is recorded here. No real model API was called.
- `npx tsc --noEmit -p apps/web-ui/tsconfig.json` and `npm run typecheck:scripts` passed; scripts typecheck was rerun after the final test additions.
- `npm run test:scripts`: 49 passed. `node --import tsx apps/web-server/scripts/markdown-raw-tasks-smoke.ts` passed.
- `persistent-room-workspace-files-smoke.ts`, `persistent-room-workspace-markdown-files-smoke.ts`, `workspace-markdown-images-smoke.ts`, and `workspace-markdown-notices-smoke.ts` passed with `node --import tsx`.
- Attributed `gate node --import tsx apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts` and `gate node --import tsx apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts` passed with Chromium, invented files and local mock data; neither skipped. No screenshots captured.
- Test-first evidence: baseline RAW browser test failed waiting for the missing textbox; task helper test failed on the missing module; height assertion failed at 32px of a 66px body; alignment failed at 11.046875px; revised helper test failed on missing `isTaskLine`. The corresponding source fixes then passed the final helper and browser checks. The first browser attempt could not start because runtime was unbuilt; after runtime build it produced the intended baseline failure.
- `git diff --check` passed. No full `npm run build && npm run smokes` and no combined-candidate or Node 20 check were run. Clean standalone UI/runtime builds passed on the existing lock, but they do not prove the final full build or the independent lock correction.

## Files, assumptions and debt

Changed product/test files: `apps/web-ui/src/components/MarkdownEditorPane.tsx`, `MarkdownEditorToolbar.tsx`, `apps/web-ui/src/markdown-raw-tasks.ts`, `apps/web-ui/src/styles/43-room-workspace.css`, `apps/web-server/scripts/markdown-raw-tasks-smoke.ts`, and `workspace-markdown-raw-ui-smoke.ts`; this report is separate. Added targeted browser evidence for conflict recovery, held PUT edits, external replacement, both checkbox directions, Preview and rich-to-RAW transitions. Assumption: the Controller's product-only override supersedes issue #22's lock, licence and Node matrix work here. No screenshot files were created. Existing debt from the architecture review remains: Delete table visibility, native-platform/case-insensitive/fd coverage and separate RAW design export. Browser nested-task selection is covered by the helper test rather than a dedicated browser scenario.

Graph: no; the task specified an exact source port and no graph assignment. Five tool calls preceded the first report edit; no graph was used.

## Preserved work
Before switching, HEAD was `fb2ac7aaa5287659ea0da0ec306b60ab60126ac0` and status was `## bussard76/t22-s2-port` with ` M package-lock.json`. At Controller direction the existing lock rewrite was preserved as stash object `3b07619e3a0484a05b55bc1c813f179182efbecf` (named `T22-S2-PORT preserve unowned lock rewrite`); it was not popped, discarded or applied to this branch.

## T22-S2-PORT-R2 rework checklist

- [x] Reproduce clean external replacement with noncanonical Markdown through workspace GET/PUT; save without editing, switch modes and check exact bytes.
- [ ] Preserve the adopted source until a real rich edit; a clean save must not write it.
- [ ] Discard a draft, save and verify exact source.
- [ ] Run targeted browser and helper checks and both typechecks; report the tested SHA and product-only scope.
- [ ] Self-review, sign and push the branch without merging main or changing lockfiles.

Red evidence: attributed RAW browser smoke at product head `ad43a3727f90675523152aecd2b3d5c1427bae6d` failed at `clean save and mode switches retain the exact external source` after real workspace GET/PUT.
