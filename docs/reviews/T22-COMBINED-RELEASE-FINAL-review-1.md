# T22-COMBINED-RELEASE-FINAL review, round 1

Verdict: fail
Reviewed commit: 5c7b1359e02a611e33ddf3cdf83431bf7dff7892
Gates: Node 22.23.4 build passed; full smokes failed 376/379. One failure also failed in isolation and did not reproduce on the pinned upstream baseline; the required gate is not passed. The independently built Linux release and the staged checks below passed.

What this change does: The combined product adds workspace listing and previews alongside the Markdown editor, with local images, guarded saving and conflict handling. The final correction prunes dependencies used exclusively by the bundled spreadsheet worker and retains release notices.

Ponytail: Reviewed the mixed product diff against `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, connected callers, public-route and browser tests, release pruning and the prior independent review. The expected load is one person using a local room. The reproducible stopped-message loss below is a functional defect; the prune guard gaps are debt candidates under the functional-only rule.

## Scope and architecture

The fetched source branch was the exact reviewed SHA. Its delta from `b9c1e25cefe49fdf1c40fe5c097a45c8669e6fcf` contains only `scripts/bundle-release-prune.mjs`, `scripts/bundle-release.test.mjs`, and `scripts/pptx-notice.test.mjs`; all three match `e08834ab5260a54c1dec9ec8305c730a60ac3b62` byte for byte. The complete 72-path mixed product diff is against the pinned upstream; it contains no factory, spec, report, review, ADR or factory config paths. The approved Series 1 and 2 contract is level 2 and retains its prior architecture conformance; the private packaging correction is level 1, with no new dependency, route or public contract. The already-declared TypeScript development parser is used by the private build. The explicit override prohibited merging fork main into the candidate.

## Findings

### [blocker] A saved stopped answer can lose its Stop note

- Where: public thread PUT/GET exercised by `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts:699`; the save and landing merge paths include `apps/web-server/src/room-thread-routes.ts:171` and `apps/web-server/src/thread-items-by-id.ts:136`.
- Problem: After aborting a real scripted local answer, the test PUTs an assistant item with text `slow part 1. slow part 2.\n\n_Stopped._` and `stoppedAt: 25`. The subsequent GET returned that item's `stoppedAt: 25` and `landed: true`, but its text was only `slow part 1. slow part 2.`; the saved note disappeared. This occurred in the full suite and in the same-SHA isolated rerun. The test exercises the public route with an invented room and fake gateway. This establishes the loss, not the precise race or a proven changed line responsible for it.
- Violates: The functional-only data-loss rule and the thread merge invariant that a saved Stop note is retained. The unchanged test passed once on pinned upstream under the same Node version; that is not evidence that upstream can never exhibit a timing race, but it does not supply the required same-error baseline allowance.
- Fix: Diagnose the save/landing interaction and retain the page's saved Stop note along with the cut when the answer lands. Preserve the existing public route and merge behavior for other cases.
- Proving test: The existing public `persistent-room-detached-turn-reattach-smoke.ts` must pass both alone and in a complete gate; verify the PUT and subsequent GET retain both `stoppedAt` and the note.

## Spec and acceptance checks

| Requirement | Evidence | Status |
| --- | --- | --- |
| Issue 22 lock and Node floor; approved Series 1/2 scope | Prior independent Series 1/2 reviews and conformance; this exact candidate passed normal `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci`. | Prior series evidence retained; no fresh full per-series signature audit claimed. |
| Listing and previews, actual Markdown editor, local images, zero external/protocol-relative image requests, edits, conflicts/Keep mine, failed-save retention, tabs, close, drag, policy and snapshots | Real route and Chromium `workspace-markdown-images-ui-smoke.ts`, `workspace-series1-ui-smoke.ts` and `persistent-room-workspace-default-api-smoke.ts` passed with `SERIES_COMBINED=1` on Node 22 and Node 20.6; they use invented workspaces. | Pass for exercised scenarios. |
| Save/Discard and Escape before and after PUT, ordinary Escape, exact bytes and reopen | Real browser/disk `workspace-markdown-raw-ui-smoke.ts` passed on both Node versions. Existing tests use public entry points and assert resulting disk and UI state; their actions and assertions would fail without the editor and guard behavior. | Pass for exercised scenarios. |
| Full Node 22 build and all smokes | One attributed full gate at exact SHA: 376/379, 641 seconds wall clock. Three failures and isolated outcomes are below. | **Failed; no allowance for the reattach failure.** |
| Node 20.6 minimum | Runtime-first build, UI and scripts typechecks, and the four affected combined smokes passed 4/4. Source and staged browser/API and workbook comparisons also passed on Node 20.6. | Pass for tested Linux paths. |
| Release artifact, checksums, notices, actual desktop prune and bare-machine smoke | Attributed real `bundle-release.mjs --target linux-x64` emitted an archive with 13,605 extracted files, SHA-256 `a72864c630ac18a0f25799fb588ffd343882acc018176c529e4e0783b2b051b9`; emitted checksum verified. Unchanged bare-machine smoke passed. The actual desktop transform retained 1,881 files and 64 packages, below 2,500. `NOTICE`, `runtime/LICENSE` and `runtime/NOTICE.md` match source bytes in archive and desktop; direct ExcelJS, docx-preview and jsdom licences match in archive, and PPTX renderer licence/notices match source, archive and desktop. Desktop keeps jsdom's licence, and its bundled licence inventory includes ExcelJS's exact licence bytes and docx-preview licence text with trailing whitespace trimmed by the existing generator. | Pass for measured Linux artifact; no legal sufficiency claim. |
| Worker and real workbook/browser parity | Shipped source and dist workers are byte-identical; invented workbook responses match original source, shipped source and bundled worker. Actual staged server/browser workbook payloads match source browser payloads on Node 22 and 20.6, and staged API passed both. The installed launcher selects the bundled server when available and keeps its source fallback. | Pass for exercised scenarios. |
| Closure, imports and native checks | Actual release's existing installed-lock, server/worker unknown-load, native and TypeScript checks passed. Reviewed root/optional/dependency closure, nested resolution, protected runtime/MCP, Bluebird and lie and actual CLI chain; supplied literal, escaped, alias and computed tests exercise public prune. Independent negative fixtures found the future-change gaps below. | Current build passes; guard gaps recorded as debt. |
| Data, escaping and external effects | Reviewed public-flow fixtures use invented data and fake providers; Word and framed previews use escaped/validated content and sandbox boundaries, and image tests assert no external image requests. No model API or external mutation was used. The unchanged doctor performed the expressly authorized public read-only probe. | Checked within review scope. |
| Platforms | Linux checks above; native Windows was waived. Native macOS build and human acceptance are scheduled for 2026-11-11 and were not run here. | Pending macOS; no native success claimed. |

## Full gate and isolated outcomes

The full command was `SERIES_COMBINED=1 FACTORY_CONFIG=/home/developer/controller-exxperts/factory.config.json ~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'`, with the requested task/worker/Tester/codex/model gate attribution. Each failure was rerun once on the same SHA and Node 22.23.4, same combined context, through the host lock using `npm run smokes -- --jobs 1 <filename>`. Raw full gate remains failed.

| Smoke | Parallel | Isolated | Disposition |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Fail, eight simulated Mac alignment diagnostics | Fail, same eight diagnostics | Matches the recorded pinned upstream same-smoke/same-error/Node 22.23.4 evidence in `t22-series2-final-independent-review/room-topbar-ui-smoke.3386522.failed.log`. |
| `consult-mention-smoke.ts` | Fail, 1280 light picked-name alignment: 1045 differing pixels, 2048 one-pixel offsets | Fail, same diagnostic | Matches pinned upstream evidence `t22-series2-final-independent-review/consult-mention-smoke.3388597.failed.log` on the same Node version. |
| `persistent-room-detached-turn-reattach-smoke.ts` | Fail, stopped answer lost its note | Fail, same assertion and fields | No allowance: pinned upstream `461e6485bf932f5cba85ac3dde8e0104e47d5dec` passed the isolated smoke after normal install, runtime-first build and build on Node 22.23.4. |

The full gate logged locally skipped `fd` find cases and a case-rename grant on the case-sensitive filesystem in `persistent-room-localfiles-secret-floor-smoke.ts`. Windows 8.3 names, Windows trailing-dot/space/stream cases and macOS Finder details in the recorded four smokes were not run on Linux. These are not claimed as passes. Doctor's required checks passed; optional Chromium and no configured MCP server warnings were captured, and the authorized outbound health probe succeeded.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `scripts/bundle-release-prune.mjs:85` | Treat a non-optional peer as required: a public-prune negative fixture with a missing required peer was accepted; the current installed graph inventory found none missing among 583 reachable packages. |
| tests | minor | `scripts/bundle-release-prune.mjs:205` | Reject relative paths into an omitted package: an independent fixture loaded `../node_modules/exceljs/index.js`, but prune removed the target; current product scan found no such path. |
| load | minor | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx` | Bound or virtualize large displayed grids, as in the earlier independent review. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts` | Preserve original file mode during atomic Markdown replacement. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Exercise skipped fd, case-insensitive and native-platform cases on suitable hosts. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF. |

## Evidence and provenance

Complete logs, three full parallel failure files, isolated logs and full failure files, baseline install/build/smoke log, negative fixtures, checksum, file inventories, artifact and staged parity outputs are retained in `~/controller-exxperts/evidence/t22-combined-release-final-independent-2026-11-10/`. The exact-head source tree was clean before and after tests; setup lockfile noise in the original worktree was preserved. The archive is independent of the developer's earlier artifact and has its own checksum. The review does not claim a green full gate, native acceptance, release, or publication.
