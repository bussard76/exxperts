# T22-COMBINED-REATTACH-FINAL review, round 1

Verdict: pass
Reviewed commit: 4d92276e4f3a0e20ad8eb329a555058237ac9264
Gates: Node 22.23.4 build passed; full smoke gate **failed raw**, 377/379, with two failures matching recorded pinned-upstream failures on the same Node version. Both failed again individually with the same diagnostics; the dated Node-comparison decision allows these pre-existing failures for disposition. The reattach regression passed in the full run and on Node 20.6.0. Fresh Linux release, desktop, browser/API and staged parity checks passed as described below.

What this change does: The combined product supplies workspace listings, previews and Markdown editing. The final private socket correction activates the selected standby conversation before a new turn begins, so a Stop save can succeed during cancellation.

Ponytail: Reviewed the product diff against pinned upstream, its public flows, connected turn and thread writes, and release pruning. Expected load is a person using a local room. No new demonstrated functional defect was found; the test and other previously identified hardening gaps below are debt under the functional-only rule.

## Scope and findings

The fetched head was the exact SHA above. The merge base with current `origin/main` was `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; the 74-path diff is mixed, not documentation-only. The binding source override prohibited merging main or other series into this immutable source. The focused delta from `5c7b1359e02a611e33ddf3cdf83431bf7dff7892` is exactly `apps/web-server/src/room-socket.ts` and `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts`, 12 insertions and 2 deletions. No factory, report, review, spec, ADR or config path occurs in the contribution. Series 1/2 conformance is retained; this final correction is level 1 and introduces no public route, dependency or new state.

No functional findings. The socket checks `assertPersistentAgentTurnCanBegin` before writing active state; the thread write retains the in-flight runtime-boundary guard. The subsequent begin checks again. The public test waits for standby, uses the fake gateway and real socket/thread routes, checks both Stop PUT statuses, verifies the retained cut and note, and still checks the whole answer on disconnect. The developer's `red-early22.log` records the earlier test failing with 409 `turn_running` while cancelling; `green22.log` records success after the fix. Its earlier unchanged timing attempts passed, so the red is a timing-dependent reproduction, not proof every run fails without the fix.

## Acceptance and verification

| Requirement | Evidence and result |
| --- | --- |
| Issue 22 lock, Node floor, supplied notices | Prior Series 1/2 independent lock and architecture evidence retained; normal `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` succeeded at Node 22 and 20.6. Fresh Node 20 runtime-first build and UI and scripts typechecks passed. An initial command used a nonexistent UI package script; the corrected `npx tsc --noEmit -p apps/web-ui/tsconfig.json` passed. |
| Shared listing, previews, images, editor and public producers | Node 22 full gate passed `workspace-series1-ui-smoke.ts`, `workspace-markdown-images-ui-smoke.ts`, `workspace-markdown-raw-ui-smoke.ts` and `persistent-room-workspace-default-api-smoke.ts`. These use invented workspaces and real routes/browser, including local images and zero external or protocol-relative image requests. Node 20 ran those four individually as part of 5/5 passing. |
| Save/Discard busy Escape on either side of PUT, ordinary Escape, exact bytes, reopening and autosave, 409/Keep mine, failed-save retention, tabs, close, drag and snapshots | Public real Chromium and disk/API assertions in the raw, image and Series 1 browser smokes passed on both Nodes. No browser skip is counted as a pass. |
| Detached landing, Stop cut/note, standby and keyed flows | Updated public reattach smoke passed in full Node 22 gate and separately on Node 20. Full gate also passed quick follow-up, standby and keyed/thread smokes. The fix retains guards before activation and the existing landing/merge paths. |
| Source and actual release parity | Actual staged browser source/output comparisons and staged workspace API passed on Node 22.23.4 and 20.6.0. Invented workbook responses from source, shipped source worker and bundled worker matched; the shipped worker bytes matched. The release smoke started the actual launcher on a free port with sanitized fake HOME and passed health, auth and UI checks. |
| Fresh Linux release and desktop | Real unchanged `bundle-release.mjs --target linux-x64` through the host lock succeeded. Emitted SHA-256 `c4e820b7ff7410ccc6a6c1d2b61ef202b5f91a05d9399b6c76de535048b720bb` verified; extracted regular files 13,605 <= 15,000. Unchanged archive smoke passed. Actual desktop transform retained 1,881 files and 64 packages, <= 2,500. |
| Notices and packaging | Source/archive/desktop `NOTICE`, `runtime/LICENSE`, `runtime/NOTICE.md` match byte for byte. ExcelJS, docx-preview, jsdom and PDF supplied licences match the archive; desktop keeps jsdom/PDF licence files and includes ExcelJS/docx-preview licence text in its generated inventory (existing generator trims trailing whitespace). PPTX renderer LICENSE and THIRD_PARTY_NOTICES match source, archive and desktop. No legal-sufficiency conclusion. The real release's installed-lock, native, unknown-load and prune checks passed; no dependency, lock or prune delta was introduced by this correction. Bluebird/lie preservation and graph guard gaps retain preceding independent review evidence. |
| Data and boundaries | Exercised fixtures use invented data, fake providers and isolated temporary homes. Image URL filtering and framed preview sandbox/CSP restrict untrusted content. No real model or account was used and no real system was modified. The unchanged doctor's expressly authorized read-only `https://example.com/` health probe succeeded. |
| Platforms | Linux checks above; Windows native waived. Native Mac build and human acceptance remain pending on 2026-11-11; neither is claimed as passed. |

## Full gate and isolated results

The exact-source attributed command was `SERIES_COMBINED=1 FACTORY_CONFIG=/home/developer/controller-exxperts/factory.config.json ~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` on Node 22.23.4. Build passed; smokes finished **377/379**, 640 seconds wall time, and the raw gate exited 1. Each failure was rerun once on the same SHA and Node/context through the same host lock with `npm run smokes -- --jobs 1 <filename>`.

| Smoke | Parallel | Isolated | Evidence and disposition |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Failed | Failed | Eight simulated Mac alignment diagnostics are byte-identical to the recorded pinned-upstream `room-topbar-ui-smoke.3386522.failed.log`, with baseline Node 22.23.4 recorded in `logs/baseline-22.23.4-versions.log`. Upstream comparison allowance applies. |
| `consult-mention-smoke.ts` | Failed | Failed | Identical 1280 light picked-name diagnostic, 1045 differing pixels and 2048 one-pixel offsets, to pinned-upstream `consult-mention-smoke.3388597.failed.log` on Node 22.23.4. Upstream comparison allowance applies. |

The full gate reports one smoke with local skipped parts (`persistent-room-localfiles-secret-floor-smoke.ts`: fd find and case-rename on this filesystem) and four with other-platform-only parts (`artifact-export-smoke.ts`, `full-access-skills-folder-smoke.ts`, `persistent-room-localfiles-secret-floor-smoke.ts`, `room-files-routes-smoke.ts`). Windows-specific names and macOS Finder details were not run on Linux. These are not counted as platform passes. The raw gate remains failed even though the two documented upstream comparisons permit this review disposition.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts:714` | Assert the stored stopped note after landing before the second PUT as well, so the second save cannot repair a loss before the final GET. |
| tests | minor | `scripts/bundle-release-prune.mjs:85` | Reject a missing non-optional peer; prior independent fixture demonstrated the guard gap, with none missing in the measured installed graph. |
| tests | minor | `scripts/bundle-release-prune.mjs:205` | Reject relative paths into an omitted package; prior fixture demonstrated the future-change gap, with no such current product path found. |
| load | minor | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx` | Bound or virtualize large grids. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts` | Preserve the original file mode during atomic Markdown replacement. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Exercise skipped fd, case-insensitive and native-platform cases on suitable hosts. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF. |

## Evidence and limitations

Full logs, failure logs and isolated reruns, source diff and path inventory, checksum, extracted and desktop file inventories, release artifact, direct licence checks, staged comparison outputs and doctor log are under `~/controller-exxperts/evidence/t22-combined-reattach-final-independent-2026-11-10/`. The developer's red/green logs are under `~/controller-exxperts/evidence/t22-combined-reattach-r1/`; the immediately preceding fail review is `4c97715a193a906c9c5e1107fb9968caddab721c`. The earlier 5c artifact is historical, not substituted for this fresh build. No native Mac or Windows pass, publication, or release is claimed.
