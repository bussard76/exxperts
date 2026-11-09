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

## CI run and parking decision — 2026-11-09

Sascha parked #11 on 2026-11-09: packaging for the other platforms is not his concern now; the upstream admin can handle it. The product's general behavior, especially #13 Word preview and #12 right pane, takes priority. Do not fix the two new platform CI causes and do not run a #11 gate. The Front agent closed draft PR #15. This section records the measurements and final CI evidence only; no product or workflow code changed for this decision.

### Recorded size measurements

| Artifact / platform | Measured count | Ceiling | Result / note |
|---|---:|---:|---|
| Linux x64 release archive | 13,408 files | 15,000 | Under ceiling |
| Windows x64 release archive | 13,477 files | 15,000 | Under ceiling |
| Windows desktop payload, before the install-script archive job failed | 13,474 -> 1,886 files | 2,500 | Under ceiling after pruning |
| Mac manual release archive | 13,349 files | 15,000 | Under ceiling |
| Mac manual desktop payload | 1,891 files | 2,500 | Under ceiling |

The task branch's `release-archive` job passed; the same check on fork `main` was reported at about 18,000 files. Sascha's separate Mac measurement reported app/ at 13,346 -> 1,889 files; it is retained as received.

### Closed CI run

GitHub Actions run `42597959949`, draft PR #15, head `7206335` (`bussard76/t11-ci-check`): **7 of 12 jobs passed and 5 failed**. Final conclusion: failure. The two current in-scope failure causes were:

- Playwright Chromium was absent in Windows `build-and-smoke`, Ubuntu `build-and-smoke`, and Windows archive icon generation.
- `workspace-file-preview-smoke.ts` reported `PDF text paints visible dark pixels` in Ubuntu `build-and-smoke` and the Linux archive preview-route check; this check passed on Workhorse2.

The macOS `build-and-smoke` job failed with Node JavaScript heap out of memory; it was reported as pre-existing and was not addressed. An earlier fork-main comparison separately cited an Ubuntu `importNodeOnlyProvider` rewrite failure, but that error was not present in the Ubuntu failure lines of this run. Keep that baseline note distinct from this run's evidence.

Per Sascha's parking decision, no fixes or #11 gates are requested. PR #15 is closed. No changes were sent to EXXETA.
