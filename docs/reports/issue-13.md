# Issue 13 developer report

## Architecture impact

Level 2: existing Word worker and parent stderr boundary; no new modules, exports, dependencies, routes or IPC fields. The passing T13-R3 architecture review binds this work.

## Result and observable acceptance checklist

- [x] Invented VML in body, header, footer and text box passes public route and browser as HTML, not damaged_file — `workspace-file-preview-smoke.ts --vml-child` and `workspace-file-tabs-ui-smoke.ts`.
- [x] Anchored drawings retain distinct left/top offsets — `workspace-file-preview-smoke.ts --vml-child`.
- [x] VML line becomes a double-border div with no SVG — `workspace-file-preview-smoke.ts --vml-child`.
- [x] Rotation survives while URL styles are rejected — `workspace-file-preview-smoke.ts --vml-child`.
- [x] Header page-relative horizontal offset subtracts pgMar left — `workspace-file-preview-smoke.ts --vml-child`.
- [x] Saved page-break markers form sections; no markers leave a long page — `workspace-file-preview-smoke.ts --vml-child`.
- [x] Header and footer retain their generated placement margins and min-height — `--vml-child` asserts header margin-top, footer margin-bottom and both min-height. The Controller clarified that these are the intended properties; no layout change is required.
- [x] Sanitization rejects foreignObject contents, scripts, handlers, external URLs and active SVG — `--vml-child` and `workspace-file-tabs-ui-smoke.ts`.
- [x] Existing parser limits, no-network policy, CSP, cancellation and refusal states remain intact — complete `workspace-file-preview-smoke.ts`. `--vml-child` checks that scheduled RAF callbacks do not execute; source inspection confirms the no-op cancel remains in place.
- [x] Non-previewCode errors retain damaged_file and produce the bounded private diagnostic contract without document content or raw stderr — `--diagnostic-child`, `--diagnostic-known`, `--diagnostic-unknown` and the `--diagnostic-stderr-*` cases.
- [x] Real producer-to-parent captured-log tests cover unexpected errors with marker, known message and unknown name — `--diagnostic-child`, `--diagnostic-known`, `--diagnostic-unknown`. Parent validation, split chunks and settlement are exercised by `--diagnostic-stderr-{chunked,invalid,duplicate}` and `--exit-race-child`; `word-diagnostic-oom-smoke.ts` checks OOM-tail classification and ordinary crashes through `runShelfParseWorker`.
- [x] Targeted typechecks, affected suites and attributed browser gate pass; each item has its test above. Current origin/main was merged before the passing checks and was unchanged on the final fetch; push is recorded by the branch history.
Sascha checks his own file on Mac after the wave; independent Tester and Architect reviews and full wave checks remain downstream.

## Graph experiment

Graph: yes, slot 3. Sixteen tool calls preceded the first authored file edit (the main merge itself changed tracked files at call 5 while Graphify was still running). Graphify made no difference: direct search found the relevant worker and parent, while the graph found no path between them.

## Assumptions and accepted debt

The public route and sandboxed browser are the approved test seams specified by T13-R3. First-page height and left-aligned page number remain accepted differences (Sascha: "lass es so"). No screenshots captured yet.

## Checks and progress

Initial merge hook typecheck failed because local runtime outputs were absent; `npm ci` and `cd runtime && npm run build` completed, and the merge succeeded with hooks enabled. The npm install command set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD but the project uses EXXETA_SKIP_BROWSER_INSTALL; its lifecycle printed a Chromium fetch message, so the approved skip setting must be used on any repeat. Existing package-lock.json modification predates this task and is not included.

Targeted route tests `--vml-child`, `--diagnostic-child`, `--diagnostic-known`, `--diagnostic-unknown`, `--diagnostic-stderr-chunked`, `--diagnostic-stderr-invalid`, and `--diagnostic-stderr-duplicate` passed. The attributed browser gate passed `workspace-file-tabs-ui-smoke.ts`. No screenshots captured.

Additional checks: UI and script typechecks passed; `npm run test:scripts` passed 54 tests; the UI-only Vite build passed. The full affected `workspace-file-preview-smoke.ts` initially failed because the fresh worktree lacked UI dist assets; after the UI-only build its complete rerun passed, including isolated child cases. Foreign-host network-failure reruns: 0. No full build or full smoke suite was run. The RAF diagnostic is flushed before the child posts its result.

The branch includes the seven source commits, the current origin/main and the T13-R3 review branch. A subsequent fetch found no new origin/main commits. The only uncommitted file is the pre-existing package-lock.json modification. The Controller clarified that the renderer-generated footer bottom margin and header top margin are the intended placement properties; `--vml-child` verifies those values and both minimum heights.

## Files and test evidence

- `apps/web-server/src/shelf-parse-worker.mjs` emits and flushes only the reviewed fixed diagnostic values; `persistent-room-shelf-reading.ts` validates the complete bounded line, suppresses duplicates and retains its bounded OOM tail.
- `workspace-preview-fixtures.ts`, `workspace-file-preview-smoke.ts` and `workspace-file-tabs-ui-smoke.ts` add invented VML, route, real producer-to-parent, hostile stderr and browser coverage. `word-diagnostic-oom-smoke.ts` checks the public shelf parser's OOM and normal-crash refusals. All are under `apps/web-server/scripts/`.
- This report records the scope, checks, clarification and accepted visual debt. No screenshots were captured or committed.

Self-review: the seven base changes remain intact; no new exports, routes, dependencies, IPC result fields or parser limit changes were introduced. The diagnostics use only the allowed ASCII names and messages, buffer bounded lines, suppress duplicate complete diagnostics, wait for stderr flush before sending the child result, and log only after the stderr stream closes. The pre-existing lockfile modification was not staged. The Mac acceptance and independent reviews are not Developer-stage checks.

Final verification after merging current origin/main (already up to date): `workspace-file-preview-smoke.ts`, `word-diagnostic-oom-smoke.ts` and the attributed `workspace-file-tabs-ui-smoke.ts` browser gate all passed again. The seven supplied commits predate their tests; the new route fixture verifies their combined behavior, but a pre-change red run of each individual commit was not performed.
