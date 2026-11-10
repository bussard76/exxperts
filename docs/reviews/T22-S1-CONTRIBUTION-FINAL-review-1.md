# T22-S1-CONTRIBUTION-FINAL review, round 1

Reviewed commit: 6dffcd539bdb41cec6d1895cf30ac0677d09843e
Verdict: pass
Gates: Node 22 build passed; full smoke gate failed raw, 368/371. The one parallel-only failure passed alone and the other two failures match the pinned upstream diagnostics on the same Node version. The recorded decision permits this disposition; it does not make the raw gate green.

What this change does: Series 1 adds a guarded workspace tree, read-only previews and tabs, with a private bundled preview worker and release packaging. The focused correction activates a standby conversation before a new turn so a stopped answer can be saved during cancellation.

Ponytail: Reviewed the mixed product diff, connected guards, socket/thread writes, preview and bundling paths and public tests, assuming a local single-user workload and untrusted document contents. No demonstrated functional defect under the functional-only rule. Security, load and test gaps are debt below; the attacker considered is a web page or untrusted file without write access to the machine.

## Scope and architecture

The fetched fork branch was exactly the reviewed SHA. The full 50-path diff is against pinned upstream and actual merge-base `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; it is mixed, with no factory, report, review, spec, ADR or agent configuration paths. The four-path delta from independent Series 1 review `e08834ab5260a54c1dec9ec8305c730a60ac3b62` contains the private socket activation and public Stop test, plus two test contexts enabled only by `SERIES_COMBINED=1`. `SERIES_COMBINED` was unset in every standalone check. The immutable-source instruction forbids merging main or the other series. Existing approved level 2 Series 1 boundaries and conformance remain applicable; the focused correction adds no export, dependency, route, durable store or contract.

I read issue 22 and its decisions, the Series 1 specification and shared contract, the previous independent Series 1 and combined reviews and the external finalization report. The current guard runs before the active-thread write and the turn begin repeats it; the existing thread write retains its runtime boundary guard. The public test waits for standby, begins a new turn, checks both cancellation and settled PUT responses, and checks the stopped cut/note and a whole answer after connection loss. Developer's historical `s1-stop-red.log` reproduced 409 before the correction. The second PUT precedes the final landed-content check; see the test debt below.

## Acceptance and evidence

| Requirement | Evidence and result |
| --- | --- |
| Workspace listing, permissions, denied paths, symlinks, image and preview routes | `persistent-room-workspace-default-api-smoke.ts` and `remote-capability-smoke.ts` passed the Node 22 full run; the public default API smoke also passed Node 20 and against the actual staged server on both Nodes. Invented workspaces and fake services were used. |
| Series 1 previews, tabs, snapshots and drag | Real Chromium `workspace-series1-ui-smoke.ts` passed on both source Nodes and against the staged server on both; no browser skip was counted as a pass. The Series 1 standalone Markdown behavior stayed read-only. The workbook worker parity probe compared an invented workbook across original source, shipped fallback and bundled worker. |
| Stop, stale and keyed turn boundaries | `persistent-room-detached-turn-reattach-smoke.ts` passed in the full Node 22 run and alone on Node 20; the existing quick-follow-up and keyed/thread smokes passed in the full run. The new public test asserts both Stop saves and the landed result. |
| Node floor and issue 22 | Normal `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` and runtime-first build passed on Node 22.23.4 and 20.6.0; Node 20 UI and scripts typechecks and all three targeted public smokes passed. Install warnings are retained. Lock/signature and baseline comparisons from earlier issue 22 evidence are historical, not a fresh signature success; npm 9 signature-key expiry and prior audit limitations remain unresolved. |
| Release, desktop and notices | Fresh real Linux release and actual transformed desktop checks are below. The packaging test suite passed 83/83 and the PPTX notice test passed 2/2. Supplied direct package licences and PPTX notice bytes were checked, without a legal-sufficiency claim or separate transitive research. |
| Boundaries and data | Reviewed preview handling includes sandboxed frames and guarded paths; tests use invented data, loopback and fake providers. The unchanged archive doctor probe to example.com was authorized. No real model API, account, production mutation, publish, tag or upstream write was used. |

## Full gate and isolation

The attributed host-locked command on the exact SHA was `npm run build && npm run smokes` on Node 22.23.4. Build passed; the complete log reports **368/371**, 623 seconds wall time, exit 1. Each failed smoke was rerun exactly once alone through the same host lock with Node 22.23.4 and the standalone environment after restoring the clean Node 22 install. Raw parallel and isolated logs are retained.

| Smoke | Full run | Isolated | Disposition |
| --- | --- | --- | --- |
| `artifact-html-render-sandbox-smoke.ts` | Screenshot capture protocol error | Passed 1/1 | One parallel-only failure; permitted by the at-most-two rule. |
| `consult-mention-smoke.ts` | Failed, 1045 differing pixels and 2048 one-pixel offsets | Failed with same diagnostic | Same smoke, error and Node as pinned upstream `consult-mention-smoke.3388597.failed.log`. |
| `room-topbar-ui-smoke.ts` | Failed, eight simulated Mac alignment diagnostics | Failed with same eight diagnostics | Exact diagnostic lines match pinned upstream `room-topbar-ui-smoke.3386522.failed.log` on Node 22.23.4. |

Baseline version provenance is `~/controller-exxperts/evidence/t22-series2-final-independent-review/logs/baseline-22.23.4-versions.log`; the baseline comparison applies only to the two named failures. One smoke had skipped portions (`persistent-room-localfiles-secret-floor-smoke.ts`, including missing `fd` and case-rename on this disk); four reported other-platform-only portions (`artifact-export-smoke.ts`, `full-access-skills-folder-smoke.ts`, `persistent-room-localfiles-secret-floor-smoke.ts`, `room-files-routes-smoke.ts`). These are not platform passes.

## Fresh Linux artifact

The unchanged release script ran through the attributed host lock and produced SHA-256 `ae0a24757e0b6503a1e5a18835da7e94b4045cfbff0e7163bfd0596e984c5f0b`; its emitted checksum verified. Independent extraction counted **13,527 regular files**, within 15,000. The unchanged archive smoke passed sanitized-home native canvas, version, doctor, auth, UI, health and teardown. The actual desktop transform retained **1,881 files**, within 2,500; `NOTICE`, `runtime/LICENSE` and `runtime/NOTICE.md` matched source before and after. Direct ExcelJS, docx-preview, jsdom and PDF supplied licences matched archive bytes and desktop bytes or the existing whitespace-trimmed generated inventory; PPTX notices matched source, archive and desktop. Shipped source and dist worker hashes both equal `669218b6f06fdb23fe5089244cf5ea924470a2982225e6387ffd546400acb53a`; real installed Bluebird and Lie resolved and loaded. Release build and packaging tests exercised the existing native, unknown-load, installed-lock and prune checks.

Native Windows verification is waived, not passed. Native macOS build and human acceptance remain pending on the recomputed combination on 2026-11-11. Standalone evidence does not establish combined readiness. Earlier lock signature evidence remains historical as noted above.

## Findings

No functional blocker or major demonstrated.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts:718` | Assert landed stopped content before the second PUT so a later save cannot repair a loss before the final GET. |
| tests | minor | `scripts/bundle-release-prune.mjs:85` | Reject a missing non-optional peer; retain the prior independent negative-probe evidence. |
| tests | minor | `scripts/bundle-release-prune.mjs:205` | Reject relative paths into an omitted package; retain the prior independent negative-probe evidence. |
| load | minor | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx` | Bound or virtualize large spreadsheet grids. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Exercise skipped fd, case-insensitive and native-platform cases on suitable hosts. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF in a scoped cleanup. |

Evidence: `~/controller-exxperts/evidence/t22-s1-contribution-final-independent-2026-11-10/` contains source SHA, path inventory, complete gate and raw failure logs, isolated reruns, release and checksum, archive and desktop counts, notice checks, Node and staged browser/API/worker logs. The fresh evidence does not replace the historical issue 22 lock and signature audit.
