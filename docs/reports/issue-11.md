# Issue 11 developer report

## Architecture impact

Level 2: release and desktop packaging producers and the existing shelf worker fork seam; no new route, public export, runtime dependency, protocol, responsibility, or data flow. The passing spec review is `docs/reviews/T11-R2-architecture-spec.md`.

## Acceptance checklist

- [ ] Keep ExcelJS and both existing file ceilings; first test substitution of the unused unzipper stream-reader chain, then try bundling the worker with the existing esbuild only if substitution fails. Escalate with measured counts if neither meets both ceilings.
- [ ] Build a fresh native-target release archive with the real producer, record its file count, and stay at or below 15,000 files.
- [ ] Feed that fresh archive to the real desktop producer; verify the staged `apps/desktop/build/server/app/` and final `apps/desktop/dist-app/` package, record the trimmed app count, and stay at or below 2,500 files.
- [ ] Add CI coverage that runs real packaging and fails on producer failures or either ceiling, recording both counts.
- [ ] Test an actual `npm pack` tarball in a clean install, preserving dependencies required by other consumers and compatibility with lock and payload checks.
- [ ] From generated artifacts, exercise the packaged server route and adjacent forked worker with an invented multi-sheet workbook; assert each sheet, styles, merges, and cached formula values.
- [ ] Exercise a damaged workbook and a bounds or security refusal through the packaged route; preserve existing empty, malformed, changed, denied, oversized, timeout, permission, snapshot, network, and complexity behavior.
- [ ] Verify browser frame functionality and packaged PPTX and Excalidraw frame bundles and `renderer-notices.txt`.
- [ ] Preserve worker PDF, Word, image, PDF raster, and PDF/DOCX shelf extraction modes and existing regression checks.
- [ ] Preserve the existing worker JSON request and IPC v1 success/failure fields, validation, and other worker modes.
- [ ] Run the specified targeted typechecks, affected suites, and browser specs through the attributed gate; merge current origin/main and rerun affected suites.
- [ ] Self-review every checklist item and binding instruction with named proving tests, and report changed files, tests, assumptions, debt candidates, and screenshot paths.

## Initial findings

The worktree is on `bussard76/t11-dev`; local `main` is already checked out in another worktree, and workers must not push to main. A pre-existing modification to `package-lock.json` was left untouched. The host is Linux x64: `bundle-release.mjs` requires the release target to match the host, while `apps/desktop/scripts/package.mjs` accepts only `darwin-arm64` or `win-x64`. The required fresh native release-to-desktop producer chain therefore needs a macOS arm64 or Windows x64 host.

Graph experiment: five tool calls before this first changed file. `graphify explain runWorkspacePreviewWorker` could not run because `graphify-out/graph.json` was absent, so graph output made no difference; `rg` verified the worker and producer locations.

Tests: not run; implementation has not started. Screenshots: none. Debt candidates: none assessed.
