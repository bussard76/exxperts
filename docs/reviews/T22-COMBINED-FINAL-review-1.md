# T22-COMBINED-FINAL review, round 1

Verdict: fail
Reviewed commit: b9c1e25cefe49fdf1c40fe5c097a45c8669e6fcf
Gates: Node 22 build passed; raw full smokes failed 377/379. The required Linux release build failed its file ceiling and produced no archive. Release and overall gate are blocked.
Ponytail: reviewed the composition delta, connected workspace and packaging paths, public browser tests and earlier independent source-series reviews. Expected load is one person using a local room. No functional defect was established in the exercised workspace flows; the required release production flow fails as described below.

What this change does: The combined product connects workspace listing and file previews to the Markdown editor, including local images and guarded saving. It also combines the approved dependency and notice changes for the two source series.

## Scope and architecture

The fetched product branch was exactly the reviewed SHA. The 70-path mixed product diff is against pinned upstream `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, also the merge-base with `origin/main`; the explicit Controller override prohibits merging fork main. Only `apps/web-ui/src/App.tsx` and `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts` differ from composition base `4417fabd063b7fdfbb8312d6ac2e177787d81acd`. No factory, report, review, spec, ADR or configuration paths occur in the product diff. The final composition delta remains level 1 within the approved shared contract; approved Series 1 and Series 2 routes, interfaces and dependencies were checked in their separate independent reviews and architecture conformance reports. Their historic evidence does not prove this combined release.

## Spec checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Issue 22 per-series lock deltas, normal install, signature and dependency-tree comparisons, Node floor and direct notices | Independent Series 1 and Series 2 reviews and conformance reports retain the per-series results and their baseline exceptions; normal-lifecycle `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed here. No new transitive licence research was required by the later decision. | Prior per-series evidence reviewed; actual combined release remains blocked below |
| Real listing and image producer to Markdown browser; local image, external and protocol-relative image requests, edit, conflict and Keep mine, failed-save retention, tabs, close and drag | `workspace-markdown-images-ui-smoke.ts` ran in actual Chromium with local server and invented data, passed on Node 22 in the full gate and on Node 20.6 separately. It exercises real routes and intercepts failed saves while requiring zero requests to the blocked image hosts. | Pass in exercised scenarios |
| Busy Save and Discard, Escape before and after PUT, idle Escape and exact disk/reopen bytes | `workspace-markdown-raw-ui-smoke.ts` passed on Node 22 in the full gate and separately on Node 20.6, using real browser, server and disk. Prior R2 review records red runs against the pre-fix implementation. | Pass in exercised scenarios |
| Series 1 previews, policy, tabs and composer | `workspace-series1-ui-smoke.ts` and `persistent-room-workspace-default-api-smoke.ts` passed with `SERIES_COMBINED=1` on both Node versions; both default standalone branches remain in the test source. | Pass in exercised scenarios |
| Node 20.6 minimum: runtime-first build, typechecks, combined browser and API | Runtime build, UI and scripts typechecks and the four named combined smokes passed, 4/4, on Node 20.6.0. | Pass for source; staged runtime evidence blocked by missing release archive |
| Node 22 full build and smokes | Build passed; raw suite 377/379, two failures independently reproduced and matched to pinned baseline as detailed below. | Raw gate failed; matching baseline evidence does not turn it green |
| Scripts and notices tests | `npm run test:scripts` passed 58/58 and `node --test scripts/pptx-notice.test.mjs` passed 1/1. | Pass for tests, not actual release artifact |
| Actual Linux release, checksum, bare-machine smoke, archive and desktop-prune contents, parent/child/browser and workbook parity | Real `scripts/bundle-release.mjs --target linux-x64` failed at 18,028 files against the 15,000 ceiling, before emitting an archive. | **Blocked**; no checksum, bare-machine smoke, artifact inventory, archive notice integrity, staged browser/parity or actual desktop-prune transform on the emitted archive can be claimed |
| Native platforms | Native Windows test waived by Sascha; native macOS build and acceptance remain with Front. | Not tested here; Linux results do not prove native Mac or Windows |
| Data, external effects, escaping | Inspected changed flows and fixtures use invented local data and fake providers. Word preview escapes serialized text and attributes and uses a sandbox; browser tests check external image requests. No real model call or real external-system change was identified in the checks performed. | Checked within review scope, not an exhaustive security audit |

## Findings

### [blocker] Combined Linux release cannot be produced

- Where: `scripts/bundle-release.mjs:389`; combined production dependency payload in `package-lock.json` and package manifests.
- Problem: The real release command on the reviewed commit completed its build and package install but counted 18,028 staged files against the enforced 15,000-file ceiling, then exited 1 without an archive. Its installed tree matched the lock for 579 packages; node_modules retained 16,539 files after the existing prune. The earlier Series 2-only release is not the combined artifact.
- Violates: The required actual Linux release build and archive acceptance flow. This is a release and overall gate blocker; it does not establish a defect in the workspace flows exercised above.
- Fix: Diagnose the combined production payload and make the existing safe pruning meet the existing ceiling without removing required runtime files or notices. Do not raise the ceiling as a substitute.
- Proving test: On the corrected immutable candidate, run the real release build under the host lock; independently verify the emitted checksum, run the real bare-machine archive smoke, inspect the actual archive and desktop-pruned payload and exercise the staged parent/child, browser and workbook parity paths.

## Full gate and isolated results

The one complete attributed Node 22.23.4 gate at the reviewed SHA used `SERIES_COMBINED=1` and the explicit Controller config. It finished 377/379 in 641 seconds wall time, with a nonzero exit. Each failure was rerun once alone through the same host lock, same SHA and combined context:

| Smoke | Parallel | Same-SHA isolated | Pinned baseline evidence |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Fail: eight simulated Mac top-bar alignment diagnostics, new-tab ink 26.50 versus row 25, with maximize 25.75 at 125% | Fail with the same eight diagnostics | Same smoke, diagnostics and Node 22.23.4 in `t22-series2-final-independent-review/room-topbar-ui-smoke.3386522.failed.log` |
| `consult-mention-smoke.ts` | Fail: 1280 light picked-name alignment, 1045 differing pixels and 2048 one-pixel offsets | Fail with the same diagnostic | Same smoke, diagnostic and Node 22.23.4 in `t22-series2-final-independent-review/consult-mention-smoke.3388597.failed.log` |

The raw full-gate failure is retained. The matching-baseline decision applies to those individually evidenced smoke diagnostics, not to release, packaging or notices. The historical `key-refused-setup-smoke.ts` passed in this full run.

The gate reported one smoke with locally skipped cases: `persistent-room-localfiles-secret-floor-smoke.ts` skipped `fd` find cases because `fd` was unavailable and the case-rename grant because the disk is case-sensitive. Four smokes had platform-only cases not run here: Windows 8.3 short names in `full-access-skills-folder-smoke.ts`; Windows `.mcp.json.`, `.git.`, trailing-dot, space and stream key names in `persistent-room-localfiles-secret-floor-smoke.ts`; and macOS Finder details in `room-files-routes-smoke.ts` and `artifact-export-smoke.ts`. These cases are not claimed as passes.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| load | minor | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx` | Bound or virtualize large displayed grids, as identified in the independent Series 1 review. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts` | Preserve the original file mode during atomic Markdown replacement. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Exercise the skipped fd, case-insensitive and native-platform cases on suitable hosts. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF. |

## Evidence and provenance

Logs, full failed-smoke outputs and path inventory are retained outside the contribution checkout in `~/controller-exxperts/evidence/t22-combined-independent-final-2026-11-10/`. The source branch is unchanged, the temporary checkout was removed, and this review does not claim a release, native acceptance or sendability. The R2 developer's original cherry-pick and push preceded successful pre-commit prerequisites; later independent hook checks do not retroactively establish pre-commit execution, as recorded in its report. This review commit uses the restored unchanged main hooks and normal signed-off commit and push.
