# T11-R2 architecture spec

Verdict: pass

Spec: GitHub issue #11 and its Sascha decision comment, with the Controller's round-2 revision in the dispatch; repository base `2bf175596af63816bb95b2ffd9bfde8cf7caa66b`.

Level: 2 confirmed. This changes the existing release and desktop packaging producers and potentially the implementation at the existing worker fork seam. It introduces no route, public export, runtime dependency, protocol, responsibility or data flow.

Decision: Sascha's issue decision keeps ExcelJS; the Controller authorizes the ordered experiment and unchanged ceilings. The Controller must accept this level-2 review before build. If neither ordered approach meets both ceilings, stop and escalate with measured counts; raising ceilings or changing the agreed boundaries is not authorized.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow and evidence |
| --- | --- | --- |
| Packaging | `scripts/bundle-release.mjs`, `scripts/bundle-server.mjs`, `scripts/bundle-release-prune.mjs`; `apps/desktop/scripts/package.mjs` and `prune-payload.mjs` | Release builds and packs the app, installs it cleanly, bundles the server, and archives `exxperts/app/` and `exxperts/vendor/node/`; desktop extracts and prunes that same archive. `MAX_ARCHIVE_FILES=15000` and `DESKTOP_MAX_FILES=2500` stay fixed. No new runtime dependency. |
| Worker | `persistent-room-shelf-reading.ts` forks `apps/web-server/dist/shelf-parse-worker.mjs` adjacent to the bundled server; source is `apps/web-server/src/shelf-parse-worker.mjs` | Preserve JSON argv request `mode`, `kind`, `absolutePath`, `expected` (`dev`, `ino`, `size`, `mtimeMs`, `ctimeMs`) and `limits`; IPC v1 success has `ok`, `schemaVersion`, `notices`, `result`, and failure has `ok`, `schemaVersion`, `code`. The parent validates exact keys and workbook fields. All other worker modes remain operational. |
| Preview and privacy | `room-settings-routes.ts` GET `/api/persistent-agents/:id/workspace-preview`, worker and frame | Existing permission checks, snapshot checks, network denial, size and complexity limits, timeout and error codes remain unchanged; no real data or real service is needed. Empty, malformed, changed, denied and oversized inputs retain current behavior. |
| Acceptance | Fresh packed install, release archive and desktop package consumed by the real route and worker | Run an invented multi-sheet workbook with styles, merges and cached formula results through the packaged server route and forked worker, verify meaningful response values and frame behavior; also verify PDF, Word, image and shelf modes, both PPTX and Excalidraw frame bundles and `renderer-notices.txt`. CI fails on producer failures and either ceiling and records actual counts. |
| Outside-in | Existing preview and packaging modules | This is a defect in agreed behavior, with no new UI or changed contract. `docs/coordinator.md` sends such defects straight to build; a new `design/<feature>/` export and new interface/logic diagram are not required. Existing implementation and issue supply the unchanged interface. |

## Prefactoring

None needed. Keep the implementation behind the existing packaging and worker seams. First establish whether the unused unzipper stream-reader chain can be excluded or replaced without affecting `xlsx.load` and without a third-party runtime dependency; only if it cannot, bundle the existing worker with the already-installed esbuild. Do not infer bundling eliminates imports just because code is unused: prove the resulting artifact and runtime behavior.

## Findings

Binding Developer instructions, precision only:

1. The issue's abbreviated release command omits a required option. On a matching native target use `node scripts/bundle-release.mjs --target darwin-arm64 --out <fresh-dir>` (or the equivalent native target), and feed its freshly generated `exxperts-<version>-<target>.tar.gz` or `.zip` explicitly to `node apps/desktop/scripts/package.mjs --target <target> --archive <fresh-archive>`. Verify `apps/desktop/build/server/app/` and the final `apps/desktop/dist-app/` package; avoid `--skip-bundle` selecting an old payload. Release requires a host matching the target. CI must execute real packaging and fail on a nonzero producer or limit check, not just mock a counter; record the archive count and trimmed `app/` count separately.
2. Test the actual `npm pack` tarball in a clean install as well as the release and desktop artifacts. The release script uses a lockfile-based `npm ci --omit=dev`, whereas an ordinary tarball installation resolves dependencies afresh and can ignore root overrides; a working release tree alone does not prove the installed app. Check that the proposed pruning or substitution retains every package needed by other consumers and remains compatible with lock and payload checks.
3. The real producer-to-consumer check must use the generated artifacts, their packaged server and adjacent worker, not a source-tree worker or a mocked producer. Assert workbook output for each sheet, style, merge and cached formula; test a damaged workbook and a bound or security refusal through the route. Verify browser frame functionality and package presence of `apps/web-ui/dist/assets/pptx-frame-entry-*.js`, `excalidraw-frame-entry-*.js`, and `apps/web-ui/dist/renderer-notices.txt`; preserve worker PDF, Word, image, PDF raster, and PDF/DOCX shelf extraction. Keep existing regression checks intact.
4. The prescribed plan is sequential and its artifact is shared: packaging verification depends on the chosen implementation, and desktop packaging depends on the fresh release archive. If work is parallelized, preserve the existing exact request/result fields above and run the real producer-to-consumer check after integrating both sides.

Graph: yes. `graphify explain runWorkspacePreviewWorker` identified the route import, worker call and workbook validator, all verified with `rg`; the broad query was noisy and the directed packaging path was absent. It confirmed leads but did not materially improve this review, since source search had already located them.
