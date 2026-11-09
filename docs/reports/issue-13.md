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
- [ ] Header/footer survive with margin-top and min-height — `--vml-child` proves header margin-top, footer margin-bottom, and both min-height; footer margin-top remains unresolved.
- [x] Sanitization rejects foreignObject contents, scripts, handlers, external URLs and active SVG — `--vml-child` and `workspace-file-tabs-ui-smoke.ts`.
- [ ] Existing parser limits, no-network policy, CSP, cancellation, refusal states and no-op RAF/cancel remain intact.
- [ ] Non-previewCode errors retain damaged_file and produce the exact bounded private diagnostic contract; no document content or raw stderr reaches logs.
- [ ] Real producer-to-parent captured-log tests cover unexpected errors with marker, known message, unknown name, malformed/chunked/duplicate stderr and ordering; OOM tail remains intact. `--diagnostic-child`, `--diagnostic-known`, `--diagnostic-unknown`, and `--diagnostic-stderr-{chunked,invalid,duplicate}` pass; OOM and all settlement cases still need checks.
- [ ] Targeted typechecks, affected suites and attributed browser gate pass; self-review each item with test evidence, merge current main, rerun affected suites and push.
- [ ] Sascha checks his own file on Mac after the wave; independent Tester and Architect reviews and full wave checks remain downstream.

## Graph experiment

Graph: yes, slot 3. Sixteen tool calls preceded the first authored file edit (the main merge itself changed tracked files at call 5 while Graphify was still running). Graphify made no difference: direct search found the relevant worker and parent, while the graph found no path between them.

## Assumptions and accepted debt

The public route and sandboxed browser are the approved test seams specified by T13-R3. First-page height and left-aligned page number remain accepted differences (Sascha: "lass es so"). No screenshots captured yet.

## Checks and progress

Initial merge hook typecheck failed because local runtime outputs were absent; `npm ci` and `cd runtime && npm run build` completed, and the merge succeeded with hooks enabled. The npm install command set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD but the project uses EXXETA_SKIP_BROWSER_INSTALL; its lifecycle printed a Chromium fetch message, so the approved skip setting must be used on any repeat. Existing package-lock.json modification predates this task and is not included.

Targeted route tests `--vml-child`, `--diagnostic-child`, `--diagnostic-known`, `--diagnostic-unknown`, `--diagnostic-stderr-chunked`, `--diagnostic-stderr-invalid`, and `--diagnostic-stderr-duplicate` passed. The attributed browser gate passed `workspace-file-tabs-ui-smoke.ts`. No screenshots captured.

Additional checks: UI and script typechecks passed; `npm run test:scripts` passed 54 tests; the UI-only Vite build passed. The full affected `workspace-file-preview-smoke.ts` initially failed because the fresh worktree lacked UI dist assets; after the UI-only build its rerun is in progress. Foreign-host network-failure reruns: 0. No full build or full smoke suite was run. The RAF diagnostic is flushed before the child posts its result.
