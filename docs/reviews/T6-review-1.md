# T6 review, round 1

Verdict: pass
Reviewed commit: 9c2dfbb592275cd77a24f2538245e047af159b99
Gates: corrected full gate passed (375/375 smokes); first full gate failed (372/375) as recorded below; targeted browser checks passed.
Ponytail: reviewed the full diff and connected sidebar, styles, smoke and room setup; no product defect established. Expected load is one interactive local desktop user.

What this change does: It places the existing floating sidebar toggle after the room UI in document order, while leaving its existing no-drag styling in place. The new browser smoke checks the ordering and two cycles in each of two invented rooms.

## Spec checklist

| # | Requirement | Code | Test | Status |
| --- | --- | --- | --- | --- |
| 1 | Repeatedly close and reopen in rooms with and without a workspace | `apps/web-ui/src/main.tsx:36` | `apps/web-server/scripts/sidebar-reopen-ui-smoke.ts:22` | Chromium passes twice each; Front reports native pointer automation green on the reviewed fork SHA. Sascha hand-tested the equivalent product change at `56b66f9` and said on 2026-11-06 that the sidebar opens and closes; this is not a hand test of the fork SHA. |
| 2 | UI smoke fails on old code | `apps/web-server/scripts/sidebar-reopen-ui-smoke.ts:38` | Smoke failed at first ordering assertion when the old DOM order was restored in the running page; unchanged smoke passes on candidate. Developer also reported red on original code. | Ordering sensitivity confirmed, not a reproduction of native pointer interception. |
| 3 | Preview restores the file tree | Existing workspace rendering | Smoke waits for invented `notes.md` after both Chromium reopenings | Browser passes; Sascha's reported hand confirmation did not separately mention the file tree. |
| 4 | Keep title row draggable | Existing `apps/web-ui/src/styles/34-desktop-app.css` | `room-topbar-ui-smoke.ts` checks computed drag and geometry | Browser CSS passes; native window dragging remains unconfirmed. |

## Findings

### [resolved blocker] First full gate did not pass
- Where: first full gate log `.build/t6-full-gate.log`, `scripts/patch-mcp-adapter.mjs:2`, `apps/web-server/scripts/memory-search-index-smoke.ts:446`.
- Problem: The build passed but only 372/375 smokes passed. The reviewer's offline `npm ci --ignore-scripts` omitted the required adapter postinstall; the two MCP tests failed both in the full run and their first isolated runs. The memory index timing test failed at 1070 ms and passed alone. The unpatched setup is a reviewer error, not an established defect in this task; the timing cause is not established.
- Violates: `docs/review-protocol.md` requires a passing full gate.
- Fix: Run a fresh authorized full gate with normal postinstall applied and report the result without erasing this failure.
- Proving test: `GATE_SLOTS=1 /home/developer/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` on the reviewed commit merged with current main, with each failure rerun alone.

## Evidence

- Fetched main was `7fac9a1ffff5c4003728d759f0dbbf0d0808243e`, already an ancestor of the reviewed SHA. Temporary branch merge was already up to date. Fresh worktree had no previous build outputs; installed cached dependencies offline with scripts disabled and built runtime and UI for targeted tests. The missing postinstall invalidates the first gate setup.
- First full command used the exact authorized wrapper and default six-way smoke concurrency. Build passed; 372/375 passed in 649 seconds wall time. Full raw output is `.build/t6-full-gate.log`; original failure logs are `/tmp/exxperts-smoke-failures/{mcp-oauth-issuer-smoke,memory-search-index-smoke,persistent-room-mcp-scope-smoke}.297037.failed.log`.
- `mcp-oauth-issuer-smoke.ts`: full gate failed 18 checks; initial isolated run failed the same 18 checks. `persistent-room-mcp-scope-smoke.ts`: full gate and initial isolated run failed the override connector manifest assertion. After running the normal local `node scripts/patch-mcp-adapter.mjs` postinstall, each passed separately on the same commit. Isolated wrapper logs are `.build/t6-rerun-mcp-oauth.log`, `.build/t6-rerun-mcp-scope.log`, `.build/t6-postinstall-mcp-oauth.log`, and `.build/t6-postinstall-mcp-scope.log`.
- `memory-search-index-smoke.ts`: full gate failed the 10,000-note timing check at 1070 ms; isolated rerun passed. Log: `.build/t6-rerun-memory.log`. No cause is asserted.
- Skips observed in the full log: `persistent-room-localfiles-secret-floor-smoke.ts` skipped find cases because `fd` is absent and a case-rename grant on a case-sensitive disk; Windows-only short-name, trailing-dot and stream-name cases and macOS Finder details were not run on Linux. The runner also listed other-system-only portions in `artifact-export-smoke.ts`, `full-access-skills-folder-smoke.ts`, and `room-files-routes-smoke.ts`.
- Chromium was installed and used: gated `sidebar-reopen-ui-smoke.ts` passed two pointer cycles each with and without an invented folder and verified the file on both openings; gated `room-topbar-ui-smoke.ts` passed 74 checks. Both also passed within the full run. UI and script typechecks passed. Starting from the blurred active element in the entered collapsed room, three Tabs reached Show sidebar after Attach a file and Model; Shift-Tab returned to Model, Tab returned to Show, the visible focus outline was present, and Enter opened the sidebar in each room. This is one browser state, not a native accessibility audit.
- Front's reported automated native pointer result was green on `9c2dfbb`; Sascha's 2026-11-06 hand confirmation was on the equivalent product change at `56b66f9`. Neither report confirms native dragging of the remaining top row. Chromium hit testing and computed `-webkit-app-region` do not prove Electron native region calculation.
- Level 1 is consistent with the diff: no new export, dependency, route, store, import boundary or data flow. Demo rooms and mock gateway were used. No real data, services or model API were used. No screenshots captured; no binary committed. Foreign-network failures observed: 0.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | medium | `apps/web-server/scripts/sidebar-reopen-ui-smoke.ts:38` | Add a native Electron pointer and drag-region regression when a safe Mac test seam exists; the order guard does not reproduce the native failure. |
| tests | low | `apps/web-ui/src/main.tsx:36` | Add sequential keyboard focus coverage for the moved toggle, including longer room content. |

## Corrected full gate

The coordinator authorized a second full gate after the first result was committed and pushed. On temporary branch `t6-review-gate`, HEAD was exactly `9c2dfbb592275cd77a24f2538245e047af159b99`; current `origin/main` had already merged without changes. `node scripts/patch-mcp-adapter.mjs` confirmed the required patches were present, then the exact authorized full-gate command above passed: build succeeded, 375/375 smokes passed in 645 seconds wall time with default six-way parallelism, exit 0. Full raw output: `.build/t6-corrected-full-gate.log`. The earlier failed gate and its reruns remain recorded unchanged above; the two MCP tests and memory timing test also passed in this corrected parallel run. There were no failed smokes to rerun from the corrected gate and no observed foreign-network failure.

The corrected run reported the same `fd` and case-sensitive-filesystem skips and other-system-only portions as the first run. The sidebar and topbar browser smokes both actually ran and passed. Sascha's reported hand confirmation is for opening and closing the equivalent Mac change; native title-row dragging and explicit hand confirmation of the restored file tree remain acceptance checks, not claims of this review.
