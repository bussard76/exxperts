# Issue 11 developer report

## Architecture impact

Level 2: release and desktop packaging producers and the existing shelf worker fork seam. No new route, public export, runtime dependency, protocol, responsibility, or data flow. The passing spec review is `docs/reviews/T11-R2-architecture-spec.md`.

## Acceptance and self-review

- [x] Keep ExcelJS and both ceilings. The initial stream-reader substitution produced a 14,597-file Linux archive but a 3,124-file Linux desktop-pruned app, so it did not meet both ceilings. The fallback bundles ExcelJS's distributed browser build into the existing shelf worker with esbuild; the pruning tests retain packages shared by other consumers. `bundle-release.test.mjs` and `bundle-server.test.mjs` cover substitution, shared dependencies, and the bundled worker.
- [x] Build a fresh Linux x64 release with the real producer: `node scripts/bundle-release.mjs --target linux-x64 --out .build/t11-bundled` passed and recorded 13,412 files, below 15,000. The baseline failed at 18,031 files.
- [ ] Feed a freshly generated native archive to the real desktop producer and check both the staging folder and final desktop package. This Linux host cannot generate a native Windows or macOS archive and the desktop producer does not support Linux. Applying the real desktop pruner to the generated Linux archive passed at 1,887 app files, below 2,500, but is not a native desktop package.
- [ ] CI must run real producers, fail on either ceiling, and record both counts. The existing Linux and Windows CI archive producers enforce and log the release ceiling. A workflow change at local commit `1001f91` adds the Windows desktop producer and staged/final asset checks, but GitHub rejected its push because the OAuth token lacks `workflow` scope; it has not run on a Windows runner.
- [x] Exercise the actual `npm pack` tarball and clean lockfile-based install: the release producer runs `npm pack`, extracts it, uses `npm ci --omit=dev`, and checks its payload against the lockfile. Per coordinator direction this is the permitted install check; it does not establish the separately specified unlocked, freshly resolved ordinary tarball installation, since the dispatch forbids `npm install`.
- [x] Exercise the generated archive's packaged server route and adjacent bundled worker. `workspace-file-preview-smoke.ts --excel-child` passed through the attributed gate against the desktop-pruned Linux artifact with ten invented sheets, values on every sheet, a style, merged range, and cached formula result.
- [x] Check damaged workbook and security/bounds refusal through the packaged route. The same smoke asserts the `damaged_file` result and denied workspace access; its PDF/Word cases check input and complexity bounds.
- [x] Verify browser frame functionality against the generated artifact. `workspace-file-tabs-ui-smoke.ts` passed through the attributed gate against the packaged, desktop-pruned Linux server and its bundled worker, including workbook and frame UI.
- [x] Verify PPTX and Excalidraw frame bundles and `renderer-notices.txt` in the release archive; `tar -tzf` found both hashed frame entries, notices, server, and worker. The locally committed Windows CI step also checks the staged and final desktop trees, pending push and a native run.
- [x] Preserve worker PDF, Word, image, PDF raster, and PDF/DOCX shelf extraction. The packaged route smoke exercised PDF and Word preview plus direct IPC calls to the packaged shelf worker for PDF text, DOCX text, image decode, and PDF raster.
- [x] Preserve the existing request/result fields and other modes. The packaged route smoke uses the real parent validation and worker; the shelf IPC checks exercise the other modes. Existing script tests pass unchanged.
- [x] Run specified targeted checks and merge current origin/main, then rerun affected suites. UI and script typechecks passed; the merge reported already up to date; `npm run test:scripts` passed 57 tests after the merge. Attributed browser, packaged route/worker, and packaged network-denial gates passed.
- [x] Record files, tests, assumptions, debt candidates, and screenshot paths below.

## Checks and assumptions

- `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed with normal lifecycle scripts. The pre-existing `package-lock.json` modification remains untouched and is not part of this task.
- `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed.
- `npm run test:scripts` passed 57/57. The added pruning and bundling tests were observed failing before their implementations.
- Attributed gates passed `workspace-file-tabs-ui-smoke.ts`, `workspace-file-preview-smoke.ts --excel-child`, and `workspace-file-preview-smoke.ts --network-child` against the generated, desktop-pruned Linux artifact. A first malformed desktop-pruner invocation using a relative path failed; the real producer uses an absolute path, and the absolute-path invocation passed.
- CI YAML at local commit `1001f91` parsed, but the commit could not be pushed without OAuth `workflow` scope; the commit remains on local branch `bussard76/t11-dev`. Native Windows CI and native macOS/Windows packages were not run. No screenshots were captured.
- The final Linux producer ran before the last smoke-only test edits; those edits do not alter the packed product. The first push attempt was rejected without a reason and the retry succeeded. The separate workflow commit push was rejected for missing OAuth `workflow` scope. No network-related check failures occurred.
- Files changed on the pushed branch: `scripts/bundle-release-prune.mjs`, `scripts/bundle-release.test.mjs`, `scripts/bundle-server.mjs`, `scripts/bundle-server.test.mjs`, `apps/web-server/scripts/workspace-file-preview-smoke.ts`, `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`, and this report. The separate, unpushed local commit `1001f91` changes `.github/workflows/ci.yml`.
- Tests added: the two release-pruning tests, bundled-worker test, and packaged-route/worker assertions in the existing preview smoke.
- Assumption: the existing ExcelJS browser distribution preserves the preview behavior required by this task; the packaged workbook test exercises representative data but not every possible workbook.
- Debt candidates: verify the unlocked ordinary tarball installation when the no-`npm install` constraint permits it; review third-party licence attribution for the prebuilt ExcelJS browser distribution now embedded in the worker. Native packaging and the unpushed CI workflow remain acceptance gaps, not claimed passes.

## Graph experiment

Graph yes. Four tool calls preceded the first repository file change (the instructed spec-review merge); six preceded the first authored change, this report. The initial `graphify explain runWorkspacePreviewWorker` failed because the graph file was absent; the coordinator's requested `graphify update .` therefore ran after the first changes, not before them. The subsequent focused query identified the route import and worker call, verified with `rg`; graph output made no material difference to the implementation.
