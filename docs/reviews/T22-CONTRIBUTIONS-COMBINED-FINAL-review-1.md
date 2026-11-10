# T22-CONTRIBUTIONS-COMBINED-FINAL review, round 1

Reviewed commit: 13aa3c8f3930f310141379de1e85990f3d440d7d
Verdict: pass
Gates: Node 22.23.4 build passed; full smoke gate **failed raw**, 377/379, exit 1. Both failures repeated alone and match the same smoke, error and Node version on pinned upstream; the specified upstream comparison permits a functional-only pass, not a green raw gate. Fresh Linux release, Node 20/22 public flows and staged checks passed as detailed below.

What this change does: The combined product supplies a guarded workspace tree, file previews, tabs and Markdown editing. It also activates a selected standby conversation before starting a turn, so the stopped answer can be saved while cancellation is in progress.

Ponytail: Reviewed the mixed contribution against its pinned upstream base, including connected listing, policy, image, preview, editor, turn and release paths and their public tests. The expected workload is one person using a local room, including paired-device access; untrusted content can come from a web page or document without write access to the machine. No demonstrated functional defect was found. The hardening and test gaps below are debt under the functional-only rule.

## Scope and composition

The fetched head was the exact SHA above, with ordered parents `6dffcd539bdb41cec6d1895cf30ac0677d09843e` and `c156379b90f540c01695d6118d26647a7b67b106`, and tree `773702791d7205880c0d096718a957d42f82bdaa`. The tree is byte-identical to `4d92276e4f3a0e20ad8eb329a555058237ac9264`. The merge-base with current `origin/main` is `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; the 74-path diff is mixed and contains no factory, review, report, spec, ADR or configuration path. The nine Series 1/2 conflict paths match the source-preparation record; the shared routes, editor, previews, styles and lock reconcile the two parents. The previously approved Series 1 and 2 level 2 conformance and the focused level 1 private changes remain applicable. No new public route, dependency or durable store was introduced by the final activation correction.

The immutable-composition instruction prohibits a main merge into the source. A read-only merge simulation against fetched `origin/main` `bac9a699080c1bd2c60d5bf1cc1558573110c3ad` found conflicts in `NOTICE`, `apps/desktop/scripts/prune-payload.test.mjs`, three Markdown image/RAW smoke files, `persistent-room-shelf-reading.ts`, `persistent-room-workspace-files.ts`, `persistent-room-workspace-markdown-files.ts`, `remote-route-policy.ts`, `room-settings-routes.ts`, `apps/web-ui/package.json`, `App.tsx`, `MarkdownEditorPane.tsx`, `MarkdownSearchBar.tsx`, `WorkspaceFramedPreview.tsx`, `in-room-chat.tsx`, `styles.css`, `styles/43-room-workspace.css`, `docs/developer.md`, `docs/workspace-and-bash.md`, `package-lock.json`, `scripts/bundle-server.mjs` and `scripts/bundle-server.test.mjs`. The review and gates use the exact branch on its own base; no temporary merge or checkout was made.

I read issue #22 through the GitHub issue API because `gh issue view 22` failed on GitHub's deprecated Projects field, the shared contract and Controller decisions, source-preparation report and source-only diffs, original conformance, prior combined review, and both new standalone reviews. Those standalone results are separate; neither replaces this combined check. The source-preparation report correctly leaves its cancelled combined Developer Chromium run and unstarted Node 22 checks pending; the fresh checks below supply this review's evidence.

## Acceptance and evidence

| Requirement | Evidence and result |
| --- | --- |
| Listing, tree, policy, denials, symlinks, images and previews | The real workspace default API smoke and Series 1 Chromium smoke passed in the Node 22 full run and independently on both Nodes. They exercise invented temporary workspaces and the real routes, including preview, tree, permissions and image handling. The same browser and API checks passed against the extracted release on both Nodes. |
| Tabs, identity, snapshots and drag | `workspace-series1-ui-smoke.ts` passed against source and staged servers on both Nodes; the Markdown image browser smoke also exercises drag to the composer and real listing/image producers. |
| Markdown local images and no external image requests | `workspace-markdown-images-ui-smoke.ts` passed on both Nodes against source and extracted release; its real browser assertions include blocked external and protocol-relative image requests and local image bytes. |
| RAW, save, discard, Escape, draft and conflict | `workspace-markdown-raw-ui-smoke.ts` and image UI smoke passed on both Nodes against source and extracted release. They cover ordinary and busy Escape before/after PUT, exact disk bytes and reopen, autosave, 409/Keep mine, failed-save retention and later edits during a save. |
| Standby, Stop, landing and turn guards | The public `persistent-room-detached-turn-reattach-smoke.ts` passed in the Node 22 full run and on both Nodes separately. It exercises standby to new turn, Stop PUT during cancellation and after landing, cut/note and whole answer on disconnect; the full suite also passed existing quick-follow-up and keyed/thread checks. The source-preparation red logs record the original 409 on both standalone candidates. |
| Node floor and install | Node 20.6.0 and 22.23.4 normal `npm ci` with `EXXETA_SKIP_BROWSER_INSTALL=1`, runtime-first build, UI `npx tsc --noEmit -p apps/web-ui/tsconfig.json`, scripts typecheck, 83/83 script tests and UI build passed. Seven selected public smokes passed on Node 20 and five on Node 22 with explicit Chromium cache; no browser skip counted as a pass. The initial full-gate install used `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` instead of the project's own skip variable; its log shows the postinstall invoking Playwright, and the pre-existing cache contained Chromium. The later fresh installs used the project-specific skip; this setup noise is retained. |
| Release, desktop and notices | The unchanged real Linux x64 release script and archive smoke passed under the host lock. SHA-256 `cb530661f73052e074fd7ec17e9e8baff32f6f0c979f703f267f069f017d1d81` verified; 13,605 extracted regular files are within 15,000. The actual desktop transform has 1,881 files, within 2,500. Source, archive and desktop `LICENSE`, `NOTICE`, `runtime/LICENSE` and `runtime/NOTICE.md` match byte for byte. Supplied direct package licences and PPTX notice bytes were checked in the archive and desktop, including the existing whitespace-trimmed bundled inventory; no legal-sufficiency or transitive-research claim is made. The unchanged bare-machine archive smoke passed native canvas, version, doctor, auth, UI, health and teardown. Source, shipped source and bundled workbook worker responses match on both Nodes; shipped worker bytes match. |
| Boundaries and data | Tests use invented files, fake providers, isolated temporary homes and loopback. Preview frames use sandbox/CSP and the editor resolves local images through the guarded endpoint. No real account, model or user data was used. The unchanged doctor performed the expressly authorized read-only example.com probe. |
| Platforms | Linux evidence above. Native Windows is waived, not passed. Native Mac build and Sascha's human acceptance remain pending for 2026-11-11 after the three independent results; neither is claimed here. |

## Full gate and isolation

The attributed, host-locked full command was `npm run build && npm run smokes`, with `SERIES_COMBINED=1` and `FACTORY_CONFIG=/home/developer/controller-exxperts/factory.config.json`. The recorded commit before execution was the reviewed SHA. Build passed; all 379 smokes completed, **377/379** passed, 643 seconds on the clock, raw exit 1. Each failed smoke was run once alone on the same SHA and Node 22.23.4 under the same lock and combined context.

| Smoke | Parallel | Isolated | Comparison and disposition |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Fail | Fail, 0/1 | The eight simulated Mac row diagnostics match pinned-upstream `room-topbar-ui-smoke.3386522.failed.log` on Node 22.23.4. |
| `consult-mention-smoke.ts` | Fail | Fail, 0/1 | The 1280 light picked-name diagnostic matches pinned-upstream `consult-mention-smoke.3388597.failed.log`: 1,045 differing pixels and 2,048 one-pixel offsets, on the same Node. |

The pinned baseline version is recorded in `evidence/t22-series2-final-independent-review/logs/baseline-22.23.4-versions.log`. The full gate reports one smoke with skipped parts (`persistent-room-localfiles-secret-floor-smoke.ts`) and four with parts for another platform (`artifact-export-smoke.ts`, `full-access-skills-folder-smoke.ts`, `persistent-room-localfiles-secret-floor-smoke.ts`, `room-files-routes-smoke.ts`). These are not platform passes. The raw failure remains visible despite the allowed final disposition.

## Findings

No functional blocker or major demonstrated in the reviewed and exercised flows.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts:714` | Assert the landed cut and note before the second PUT so that save cannot repair an earlier loss unnoticed. |
| tests | minor | `scripts/bundle-release-prune.mjs:85` | Reject a missing non-optional peer; prior independent fixture demonstrated the guard gap, with none missing in the measured installed graph. |
| tests | minor | `scripts/bundle-release-prune.mjs:205` | Reject a relative import into an omitted package; retain a negative fixture for the guard. |
| load | minor | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx` | Bound or virtualize large grids. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts` | Preserve the original file mode during atomic replacement. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Exercise skipped fd, case-insensitive and native-platform cases on suitable hosts. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF. |

## Evidence and limitations

Full raw logs, isolated failure logs, versions, source and merge-resolution diffs, conflict simulation, checksum, inventories, fresh artifact, notice checks and staged browser/API/worker results are under `~/controller-exxperts/evidence/t22-contributions-combined-final-independent-2026-11-10/`. The prior `4d92276` artifact and gate are historical only. No publication, tag, workflow dispatch, real-system mutation or native Mac/Windows pass is claimed.
