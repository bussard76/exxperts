# T87 rebase implementation review, round 2

Verdict: pass
Reviewed commit: a3ad7b91c9573efe0d3b7e9e22c6f6c5bcfe89bd
Reviewed base: upstream v0.16.2 `b898e851813b4da0211e6a049e9537160391091f`
Functional verdict: pass for the exercised PR 87 flows; native acceptance remains unmeasured. Full Linux gate: fail (exit 1, 518/526). This functional verdict does not turn the gate green or establish the cause of unrelated smoke failures.

What this change does: It restores workspace browsing and previews on the pinned v0.16.2 base, using the current room protections. The round-two repairs expose supported POSIX colon names, restore stylesheet order, describe restart holders, and install the existing Windows folder-wait factory through server composition.

Ponytail review: Complete for all 75 paths in the exact target-relative contribution, at the product's single-user local-room scale. I inspected the nine changed server source paths, 33 server script paths, 19 UI source paths, UI auth smoke, four notice files, three root packaging/test scripts, four manifest/lock paths, and both fork reports; I traced the routes through the guarded file and parser paths and the browser consumers. The lock comparison found added feature closure without changes to existing package versions or resolved locations. The clarified dispatch sets the upstream target as the review base and excludes unrelated fork history; no fork-main merge was performed. No exploit development, load test, native-platform check, or additional test was performed during this review completion.

## Scope and evidence

| Requirement | Evidence | Result |
| --- | --- | --- |
| Exact pins and replay | Fetched origin; checked out the exact head; target `b898e851813b4da0211e6a049e9537160391091f` is an ancestor; source object `5fcffe1036b2d6f867d6583b29822c4985d36fba` exists. Excluding the two fork reports, the 73 target-relative product/test paths replay to `3f9ff3835b48e3b4fd79ffe331991ce9c8b7c04b`. Product/test paths match `82cfb40995de761edcc8f2d7f4fc8bf873b532b1`. | Pass |
| Listing repair and refusals | `validWorkspaceBrowserPath` is shared by routes and returned entries. `workspace-grant-parity-api-smoke.ts` passed parent listing, expansion and preview using invented colon names; URI refusals remain. `workspace-files-client-smoke.ts` and browser smoke passed. | Pass on Linux |
| Restart and styles | Workspace CSS follows ask-panel CSS; the restart inventory identifies preview requests, live box bindings and the startup-installed factory. The unchanged `restart-holders-smoke.ts` passed. | Pass |
| Windows wait composition | Route module stores one factory, refuses duplicate installation, calls it at each of four existing call sites, and refuses absent/undefined wait when Windows requires it. `room-socket.ts` installs the original function once at module initialization; `index.ts` imports socket before listening. The composition smoke passed absent, undefined, real, startup and shared cases with simulated platform state; on and broken use the existing singleton with protection off. Unknown/off/Mac and missing-owner refusal are covered. | Pass in Linux simulation |
| Existing wait and inventory assertions | `workspace-preview-folder-wait-smoke.ts` differs from its preceding version only in importing and installing the real factory; the blocking and parser-hold assertions remain. The original Windows import-inventory smoke is unchanged and passed. | Pass |
| Mac and shared behavior | Owner/generation checks and no-host-fallback are retained; boxed listing race/refusal, boxed preview, shared listing/race and shared-frame smokes passed. | Pass in simulation; native Mac unmeasured |
| Producer-to-consumer and isolation | Real local XLSX browser-to-parser rendered-cell and revocation smoke, real shared PPTX frame transfer, snapshot format and component smokes passed. HTML and presentation use opaque sandboxed frames; text is rendered as text. Open refusal and fake-dispatch handoff smokes passed. No real app launch, paid call, production data or Docker was used by this review. | Pass on Linux; native dispatch unmeasured |
| Assertions | Compared the two previously existing base test files against base: additions preserve their existing assertions. Compared all three round-two changed smoke files against round one: the parity fixture adds parent listing assertions, the wait test is setup-only, and the composition test is new. Existing client and Windows inventory assertions are unchanged. The public route assertions would fail if their corresponding listing or wait behavior were absent. | Pass within these comparisons |

The base assertions in the two modified existing test files were retained; the additional checks cover listing and package retention. Compared with the superseded identity checkpoint, same-path replacement and policy-ID recovery cases were removed under the explicit upstream grant-parity decision, while the unrelated no-sidecar, empty-list, redaction and failed-read/retry assertions remain. The source itself refuses selection of unsupported extensions before opening a tab; the test preserves that actual source behavior and the public route retains its unsupported response.

The approved Level-2 folder-wait amendment and the earlier RoomBox and upstream grant-parity reviews remain binding. This review found no new functional defect in the exercised PR 87 paths. It does not establish the native browser-to-owning-RoomBox acceptance path, actual Windows behavior, desktop handoffs, or cross-platform CI. Sascha's preview acceptance should include native Mac boxed XLSX/revocation and native Windows wait behavior.

## Linux setup and gate

`EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` completed normally, including the MCP adapter patch; Playwright Chromium 1248 was already installed. Local untracked links to this same project's fork `.githooks`, `tools`, and `factory.config.json` provide the configured hooks and gate attribution. These links are not part of the report commit. The pinned head was recorded before the gate; no implementation or test files were edited.

The standard host-lock command `GATE_TASK='T87-REBASE-IMPLEMENTATION' GATE_WORKER='t87-rebase-implementation-test2' GATE_ROLE='Tester' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' ~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` ran once. Build passed; smokes completed 518/526, exit 1. Three passing smokes reported skipped portions and eight reported portions only another OS runs. Complete exact output and exit: `/tmp/t87-tester-r2-full-gate.log`; individual original failure logs are under `/tmp/exxperts-smoke-failures/` with runner PID `3504803`.

Each failed smoke was unchanged against the target and rerun exactly once alone on the same head with the same attribution and host lock, using `npm run smokes -- --jobs 1 <filename>`. Full outputs and true exits: `/tmp/t87-tester-r2-reruns.log`. No isolated result reported a skip. The original gate remains failed.

| Smoke, full run | Isolated | Observed reason |
| --- | --- | --- |
| `settings-nothing-runs-out-ui-smoke.ts` fail | fail, exit 1 | At 390 px a model label extended two pixels past its column. |
| `room-edit-last-message-smoke.ts` fail | fail, exit 1 | Two mock-answer checks timed out after a command approval prompt. |
| `settings-look-skill-pages-ui-smoke.ts` fail | fail, exit 1 | Review strip measured 41 rather than 40 px. |
| `settings-look-ai-setup-ui-smoke.ts` fail | pass, exit 0 | Full run observed the open chevron's opposite rotation. |
| `settings-needed-field-words-ui-smoke.ts` fail | fail, exit 1 | Two rows moved one pixel instead of zero. |
| `room-topbar-ui-smoke.ts` fail | fail, exit 1 | Simulated Mac 125% zoom: maximize ink centered at 25.75 rather than the required row. |
| `settings-look-skills-ui-smoke.ts` fail | fail, exit 1 | Updating table returned two skill names where an empty array was expected. |
| `container-forward-smoke.ts` fail | fail, exit 1 | Loopback byte echo was empty. |

These are observations, not a claim that the candidate caused them; no base rerun was performed to establish that. The full run also passed the PR-specific public route, real-app browser, wait composition, wait overlap, restart-holder and Windows inventory checks listed above.

## Findings and debt candidates

No functional defect was established in the target-relative contribution. The full target-relative review is complete; native acceptance and the failed gate remain separate outstanding evidence.

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| load | medium | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx:124` | Render a bounded window of rows and columns: a valid 100,000-row, one-column sheet expands to at least 1.2 million table cells because the UI supplies 12 columns, potentially making the preview unresponsive; this is a code-based observation, not a measured load result. |
| tests | medium | Full gate | Investigate the seven isolated failures and reproduce against the appropriate base; retain the failed full gate until resolved. |
| tests | medium | Native Mac and Windows | Run the required real boxed browser acceptance and native Windows wait checks on the respective platforms. |
| security | medium | ExcelJS dependency closure | Track the recorded upstream uuid advisory and remediate under the dependency decision process. |
| edge-case | minor | Root Node engine declaration and retained jsdom | Align or qualify the existing Node engine floor: retained jsdom 29 requires a newer Node 20 than the declared minimum. |
