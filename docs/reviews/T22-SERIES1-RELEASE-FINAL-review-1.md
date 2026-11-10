# T22-SERIES1-RELEASE-FINAL independent review, round 1

Reviewed commit: e08834ab5260a54c1dec9ec8305c730a60ac3b62
Verdict: pass

What this change does: Series 1 adds a guarded workspace browser and read-only file previews, and packages its private document worker. This corrective delta reuses the bundled worker in the release and preserves the app and runtime notice files in the archive and desktop payload. The functional-only verdict is not a claim that the raw full gate was green or that native macOS was accepted.

## Scope and findings

No demonstrated functional defect under Sascha's functional-only review rule. No blocker or major finding. Ponytail review covered the product diff, connected workspace and bundling paths, the supplied tests and the actual staged flow, assuming the documented local single-user workload and untrusted file contents. I checked the approved Series 1 spec and shared contract, issue #22 and its Option C decision, the latest external worker report, and the previous passing independent review and architecture conformance on `7f90ed7f97e0c94dd1b2d44778ac9994bfc26c25`.

The comparison is the full mixed product diff against pinned upstream `461e6485bf932f5cba85ac3dde8e0104e47d5dec`: 48 paths, including non-Markdown files. The focused correction against `7f90ed7f97e0c94dd1b2d44778ac9994bfc26c25` changes six files in the existing private release/desktop packaging responsibility; it adds no dependency, route, durable store or public product contract. The preserved prior Series 1 conformance covers its already approved interfaces. The product diff contains no factory files, reports, reviews, specs, ADRs or agent configuration. Per the explicit immutable-source override, no main or combined merge was performed.

The root package allowlist adds exactly `NOTICE`, `runtime/LICENSE` and `runtime/NOTICE.md`; the desktop keep entries match the previously reviewed `da0c1ff` correction. Existing bundle, unknown-load, native-file, TypeScript-prune and notice guards remain. Koffi's earlier intentional move to shipped status and the generic non-shipping external guard's `tsx` replacement are documented in the prior independent review. The exact three source-byte pins for path-based room-lock/state-profile `createRequire` sites match the source and existing bundler review. The parser handles the covered literal escapes, aliases and computed sites; the independent public-prune fixtures rejected an escaped worker-only import before deletion and kept the consumer's same-named dependency while removing the nested worker-only copy. Existing tests exercise the public prune entry, absent mandatory dependencies, optional dependencies, loader forms, shared packages and worker fallback; the earlier retained escaped-import red evidence establishes the correction's regression case.

The actual archive's independently traversed retained root/workspace dependency graph covered 420 package paths and 766 dependency edges, including present optional and peer edges, with zero missing required packages or version mismatches after applying the upstream `basic-ftp` override; absent optional/platform peers are listed in `graph-check-overrides.log`. The first probe did not apply overrides and correctly remains recorded as a failed probe in `graph-check.log`; it identified the pre-existing override rather than a changed package. Actual archive registration of both installed `bluebird` and `lie` passed. This graph and observed-load review is not a claim that arbitrary hypothetical user-written dynamic selectors are product paths. The parser's initial selector probe also had an incorrect expectation about its return shape; the failed probe and corrected tests are retained.

The shared contract's listing, policy, symlink, denied-path and image flows were exercised through the real staged API; Chromium exercised tabs, selection, snapshot/reopen, reconnect, drag, room isolation, HTML isolation, PDF, Word, workbook and PPTX previews against the actual staged server with invented workspace data. The Word serializer escapes untrusted text and attributes; preview frames retain their sandbox and content policy. Tests used invented data, temporary homes and loopback/fake provider configuration; no model API, real account, real user data, external mutation or Docker was used. The unchanged archive smoke included the authorized public doctor health probe.

## Gates and raw failures

A normal-lifecycle `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` and runtime-first build passed. Node 22.23.4 ran one attributed, host-locked `npm run build && npm run smokes` on the clean pinned tree: build passed; **369/371 smokes passed, raw gate failed** (621 seconds wall time). Each failure was rerun exactly once alone on the same SHA and Node through the host gate:

| Smoke | Parallel result | Isolated result | Pinned upstream comparison |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Failed, eight simulated Mac ink-alignment diagnostics | Failed, same eight: new-tab 26.50 vs 25 points, and maximize 25.75 at 125% | Same smoke and exact diagnostics on Node 22.23.4, `~/controller-exxperts/evidence/t22-series2-final-independent-review/room-topbar-ui-smoke.3386522.failed.log` |
| `consult-mention-smoke.ts` | Failed, 1280 light picked-name alignment | Failed, same 1,045 differing pixels and one-pixel-off count 2,048 | Same smoke and exact diagnostic on Node 22.23.4, `~/controller-exxperts/evidence/t22-series2-final-independent-review/consult-mention-smoke.3388597.failed.log` |

Sascha's same-smoke, same-error, same-Node baseline decision applies to these two inherited diagnostics; it does not turn the raw gate into a pass or waive build, release or notice checks. Full output and isolated raw outputs are preserved in the evidence directory below. The suite reported one smoke with partial skips (`persistent-room-localfiles-secret-floor-smoke.ts`: no `fd`, and case-rename on this case-sensitive disk); Windows-only short-name, trailing-dot, space and stream cases and macOS Finder details were not run. Four smokes reported platform-only cases not run. The source-tree Series 1 browser smoke passed.

Node 20.6.0 runtime-first build, UI and scripts typechecks, and 85 script/notice tests passed. Actual archive browser, public API and workbook worker parity passed on both Node 20.6 and 22.23.4. The earlier Series 1 Node comparison remains historical evidence, including its matched baseline failures and npm 9 signature-key expiry; it is not represented as fresh execution here.

## Actual Linux release

The real `scripts/bundle-release.mjs --target linux-x64 --out ...` ran through the host lock on the unchanged SHA and produced an archive of **13,527 files**, below the unchanged 15,000 ceiling; independent extraction confirmed the count. Archive size was 155,497,485 bytes and SHA-256 `c9c44289f33597dffa5e91e23ff44323f6c1f86226ad9a57fb44624f80e9d507`; the emitted checksum verified. Different archive bytes from the developer's build are not asserted to be reproducible-build failure. The actual source and dist worker entries have identical SHA-256 `669218b6f06fdb23fe5089244cf5ea924470a2982225e6387ffd546400acb53a`, and an invented workbook gave identical results through original source, shipped source fallback and bundled worker.

The actual desktop transform retained 1,881 files and 64 packages, below its 2,500 ceiling; `NOTICE`, `runtime/LICENSE` and `runtime/NOTICE.md` matched source before and after the transform. Extracted direct ExcelJS, docx-preview, PDF and PPTX notices matched their supplied source bytes. This is a byte-preservation check, not a legal sufficiency conclusion. The unchanged sanitized-home archive smoke passed vendored Node, native canvas, version, doctor, authenticated server, health and teardown. On a passing doctor step the unchanged smoke suppresses doctor output, so the presence or absence of a network warning is not observable from that output.

Native Windows testing is explicitly waived. Native macOS build and human acceptance remain pending for 2026-11-11; no native Mac or Windows acceptance is claimed. No publish, tag, workflow dispatch, upstream write or combined-series acceptance was performed.

## Debt candidates

| Category | Severity | Proposal |
| --- | --- | --- |
| load | minor | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx`: bound or virtualize the displayed grid; a valid 100,000-row, one-column sheet can render 1.2 million cells because the view uses at least 12 columns. This is retained from the earlier independent review. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts`: remove the extra blank line at EOF reported by `git diff --check` in a later scoped cleanup. |

Evidence: `~/controller-exxperts/evidence/t22-series1-release-final-independent-2026-11-10/`, including complete full-gate, isolated, release, checksum, archive smoke, desktop, staged browser/API, Node 20, parity, dependency graph and negative-probe logs. The clean checkout was at the reviewed SHA before and after testing; pre-existing lockfile noise in the assigned worktree was preserved outside the temporary checkout. No implementation file was changed for testing.
