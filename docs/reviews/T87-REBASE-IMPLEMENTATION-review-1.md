# T87 rebase implementation review, round 1

Verdict: fail
Reviewed commit: 49ba0bd6200dc83ae2ad4ebb90c8c7370539626a
Functional verdict: fail (listing omission below). Gate verdict: fail (21 smoke failures; isolated outcomes below).
Ponytail: fix the listing before shipping. Reviewed at the expected single-user local-room scale; no load test or exploit development was performed.

## Finding

### [major] The file browser omits supported POSIX names containing a colon

- Where: `apps/web-server/src/persistent-room-workspace-tools.ts:1939`.
- Problem: The listing drops every entry with a colon before it reaches the client. On Linux, an authorized invented `lesson 1: draft.txt` is a valid non-URI name, and its direct preview succeeds, but its parent listing does not include it. A person cannot select that file in the workspace browser; a similarly named directory cannot be expanded from its parent. The client validator already accepts this form.
- Violates: The listing contract requires entries for the chosen authorized root and the source feature's browser-to-preview flow. The candidate report at `docs/reports/pr87-rebase.md:45` and `:47` specifically describes supporting this POSIX name class. Its parity smoke checks direct preview and listing *inside* a colon-named directory, not whether the parent exposes the name.
- Fix: Apply the same platform-aware relative-path rules to listing entries, retaining non-URI POSIX colon names while still refusing URI-shaped and Windows-colon paths and preserving the fence and per-entry checks.
- Proving test: Through the public listing route on Linux, create an invented non-URI colon file and directory under a granted root; assert both occur in the parent listing, expand the directory and preview the file through the real browser/API, and retain URI and Windows refusals. An independent adapted public-route fixture failed on the parent-listing assertion with exit 1 (`/tmp/t87-colon-review.log`); the existing candidate smoke passes its narrower checks.

## Spec and protection checklist

| Requirement | Code and evidence | Status |
| --- | --- | --- |
| Pinned target and source, replay scope | Base `b898e851813b4da0211e6a049e9537160391091f` is an ancestor; source `5fcffe1036b2d6f867d6583b29822c4985d36fba` was compared at its source merge base. Excluding the two fork reports, all 71 changed product/test paths replay to tree `4ecfc5f61a9aa0391e4eaea53b0f823a60a02c3c`. No fork main merge, per dispatch. | Pass |
| Level 2 and scope | Four routes, approved dependencies and three in-process seams; no changes to upstream workspace policy, folder offer, room fence or room models. Dependencies checked against `cf976f79548380add5c8099941b3687305260a24` and its independent review `e057ec8e8088a82064b84beea57a50ebd5d4a11c`. | Pass within reviewed scope |
| Existing path-only grant and model behavior | `workspace-grant-parity-api-smoke.ts`, existing workspace policy/default and model smokes; normal selection, old grant, unfamiliar-field normalization and selected alias passed. Operation-local checks remain; same-path replacement between operations is expressly deferred to fork #25. | Pass on Linux |
| Current room, policy, folder and RoomBox owner at use | `room-settings-routes.ts`, `persistent-room-workspace-tools.ts`, `room-live-sessions.ts`; box listing race/refusal and boxed preview smokes passed with simulated Mac, including no host read on missing binding and invalidation before parse/return. | Pass in simulation; native Mac unmeasured |
| Bounded snapshots, parser and frame isolation | Snapshot routes recheck policy and identity; isolated worker receives private bytes; snapshot validation, PDF, Word, spreadsheet, PPTX frame and shared race smokes passed. | Pass on Linux |
| Explicit local open | `workspace-open-handoff-smoke.ts` and `workspace-open-refusal-smoke.ts` passed with invented desktop entries and fake dispatcher; checks include unknown/changed association, working directory and policy, and zero further handoffs on refusal. Mac/Windows resolver simulations refuse unbound working directories. | Pass in Linux simulation; native handoffs unmeasured |
| Listing, supported formats and browser flow | Real local invented XLSX to rendered cell with revocation and real shared PPTX frame tests passed. Listing loses valid colon entries as above. Other format, component and shared real-app smokes passed. | **Fail** for listing |
| Assertions and test intent | Compared `798e853` identity-only smoke and `3b57654` identity-era affected tests with final tests. Same-path cross-request replacement, identity qualification and policy-ID recovery cases were deferred; unrelated no-sidecar, empty-listing, path redaction and failed-read/retry assertions remain. Existing normal-selection and handoff tests would fail without the relevant routes/behavior. | Pass, except listing test gap above |
| Data and external effects | Tests use disposable invented fixtures and fake dispatch; no paid model API, production data, actual handoff, Docker gate or native platform run. Inspected render paths and isolation; no secrets identified. | Pass for reviewed evidence |

## Linux gates and setup

Clean checkout of the exact SHA; `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` exited 0 with normal postinstall, including the MCP adapter patch and explicit Chromium-download skip. The existing Playwright Chromium 1248 cache was present. `core.hooksPath=.githooks` was configured but the upstream target has no hook directory; same-project fork `.githooks`, `tools` and `factory.config.json` were linked locally for gate attribution and normal report hooks, and are not staged. The developer's earlier ordinary commits with missing hooks are not represented as hook passes.

The unchanged host-lock gate was run once on the reviewed SHA, with `GATE_TASK='T87-REBASE-IMPLEMENTATION' GATE_WORKER='t87-rebase-implementation-test1' GATE_ROLE='Tester' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' ~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'`. Build passed; smokes finished **504/525**, gate exit **1**. Complete log: `/tmp/t87-tester-full-gate.log`; runner's individual failure logs are under `/tmp/exxperts-smoke-failures/`. Three passing smokes reported skipped portions, and eight reported portions for another OS; none establishes native macOS or Windows results.

Every failed smoke was rerun alone at the same HEAD through the same attributed host lock, executing `npm run smokes -- --jobs 1 <smoke-filename>` inside `bash -c` (the filename was passed as a positional parameter). Full rerun log with individual true exits: `/tmp/t87-tester-reruns.log`. The original full-gate verdict stays failed even when an isolated run passed.

| Original failure (all exit 1) | Isolated exit |
| --- | ---: |
| `settings-nothing-runs-out-ui-smoke.ts` | 1 |
| `team-room-pages-smoke.ts` | 1 |
| `room-edit-last-message-smoke.ts` | 1 |
| `settings-look-skill-pages-ui-smoke.ts` | 1 |
| `light-colours-ui-smoke.ts` | 0 |
| `buttons-look-ui-smoke.ts` | 1 |
| `settings-look-ai-setup-ui-smoke.ts` | 0 |
| `settings-needed-field-words-ui-smoke.ts` | 1 |
| `room-topbar-ui-smoke.ts` | 1 |
| `settings-look-skills-ui-smoke.ts` | 1 |
| `step-cards-smoke.ts` | 1 |
| `consult-mention-smoke.ts` | 1 |
| `answer-display-smoke.ts` | 1 |
| `remote-settings-readonly-smoke.ts` | 0 |
| `answer-table-frame-smoke.ts` | 1 |
| `restart-holders-smoke.ts` | 1 |
| `windows-box-request-smoke.ts` | 1 |
| `thinking-row-smoke.ts` | 1 |
| `memory-v2-copy-smoke.ts` | 1 |
| `page-styles-smoke.ts` | 1 |
| `container-forward-smoke.ts` | 1 |

The isolated `team-room-pages-smoke.ts` ended in Node heap exhaustion; no migration cause established. Several deterministic failures (`buttons-look`, `step-cards`, `consult-mention`, `answer-display`, `answer-table-frame`, `thinking-row`, `memory-v2-copy`, `page-styles`) report that `43-room-workspace.css` precedes `43-ask-panel.css` out of the required name order. `restart-holders` reports the two new in-memory holders absent from its inventory; `windows-box-request` reports an import inventory mismatch. Other failures and their output are preserved in the logs, without assuming a product cause. `light-colours`, `settings-look-ai-setup` and `remote-settings-readonly` passed alone; 18 reruns failed.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/workspace-grant-parity-api-smoke.ts:126` | Extend the public fixture to assert the parent lists the supported colon file and directory, then select through the browser. |
| style | minor | `apps/web-ui/src/styles.css` | Put the new workspace stylesheet in the established ordered list and keep the existing order checks. |
| tests | minor | `apps/web-server/src/persistent-room-shelf-reading.ts`, `apps/web-server/src/room-live-sessions.ts` | Document the two new restart holders in the existing inventory and run its unchanged smoke. |
| tests | minor | `apps/web-server/src/room-settings-routes.ts` | Reconcile the existing Windows import inventory with the new folder-wait import and rerun its unchanged smoke. |

Native Mac real browser-to-owning-RoomBox XLSX/revocation, native Windows behavior, native desktop dispatch, and cross-platform CI remain unmeasured. No merge into fork main, unrelated edits, audit or retro was performed.
