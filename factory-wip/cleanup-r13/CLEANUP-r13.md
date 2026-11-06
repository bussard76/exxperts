# Cleanup safety rework R13

Developer stage; independent safety review is required before live use.

## Architecture impact

Level 1. Private identity checks and invocation-local evidence in the existing controller cleanup module; no public export, dependency, route, persistent store, protocol or data-flow change. The explicit controller-only override replaces generic issue/repository edits, branch/fetch/merge/commit/push, product checks and full gates.

## Assumptions and plan

The pre-agreed test seam is the public cleanup CLI with fake Orca, invented fixtures, temporary Git repositories and local bare remotes. No live cleanup (including dry mode), service, inbox body, other project or model API is used. Existing invocation-local host rejection is the smallest place to remember contradictions; no new service/inventory is needed on the direct route. Service completeness/honesty and serialized controller starts remain assumptions, and external writers remain unfenced.

1. Back up installed R12; reproduce cross-inventory opaque-ID ambiguity with a public failing test, then correlate the mappings already supplied by each route. Check actual worktree/ref/record and exact noise bytes, with absent/distinct-ID controls.
2. Reproduce transient dispatch/terminal contradictions, including release confirmation, then latch them through the existing host guard. Check initial/final/release observations for direct/released removal/noise/prune.
3. Reproduce duplicate-dispatch ambiguity across worker pages, then latch it; test paired historical/distinct controls.
4. Run all inherited and added isolated controller tests, reconcile their registrations, syntax/source preservation checks, review each requirement, install exactly the tested bytes, and provide report/diff for independent review.

## Result and Observable acceptance checklist

- [x] Read R12 review and prior independent findings; preserve the existing live-use deferral.
- [x] Back up installed script before changes (`CLEANUP-r13-tests/cleanup.original.mjs`).
- [x] Correlate optional opaque worktree ID/path associations between terminals and already-required worker/resource evidence, initially and finally, for both routes/all three actions.
- [x] Correlate cross-inventory terminal/worktree/worker-page associations without requiring an unused direct inventory.
- [x] Preserve absent optional IDs, distinct worktrees, historical rows and minimal direct receipts with paired legitimate controls.
- [x] Latch explicit dispatch and terminal mismatches invocation-wide, including transient initial/final observations and post-release confirmation.
- [x] Latch duplicate-dispatch identity contradictions across all worker pages; later valid reads must not authorize cleanup.
- [x] Public adversarial tests are red before each fix, preserve real disposable resources/records/exact noise bytes and require zero destructive counts.
- [x] All inherited parser/completeness/completion/data/noise/protected-ref/exact-lease/accounting guards remain, and all prior tests run unchanged.
- [x] Targeted controller suite, syntax, registration reconciliation and frozen-source checks pass; disclose reruns/debt.
- [x] Finish self-review with named proving tests, files changed, assumptions/debt, diff and source hashes; safely install tested candidate.
- [x] Prepare the final worker_done with concrete evidence and report path as the only remaining terminal action; fresh independent review/coordinator acceptance remain required before live use.

## Evidence and final self-review

Three focused public CLI red/green slices preceded the corresponding fixes. `red-cross-inventory.tap` fails because the target record is forgotten; `red-dispatch.tap` and `red-duplicate.tap` show an actual worktree removal call after initial contradictory evidence. The same named tests pass in `green-cross-inventory.tap`, `green-dispatch.tap` and `green-duplicate.tap` after each minimal fix. No inherited test or assertion changed.

The R12 independent reproductions rank the causes: (1) receipt-local association maps cannot reject cross-receipt opaque-ID/path collisions; (2) unlatched dispatch/terminal and duplicate-dispatch checks let later reads authorize actions; (3) a filesystem alias or receipt-parser defect could instead explain an identity collision, but the reproductions use canonical distinct Git worktrees, ordinary opaque IDs, and complete well-formed receipts. The red/green results confirm the first two causes without changing canonicalization or parsing.

The candidate replaces local association maps with one private invocation-local map per host, correlating only supplied associations across terminal inventories, optional worker/resource/workspace/terminal fields, worker pages and applicable worktree inventories. Omitted IDs/paths create no invented association. Mandatory worker-show dispatch/terminal correlations now feed the existing host guard; post-release confirmation uses the same check before accepting release, and duplicate dispatch rows latch that guard across a whole traversal. A guarded host cannot regain settlement on a later read. No extra inventory is required by the direct route, and no worktree inventory is newly demanded after the target has gone.

Current new matrix: 363 registrations covering direct/released removal/noise/pruning; initial/final terminal mappings and then-valid receipts; independently supplied optional IDs; minimal receipts with unused inventories deliberately invalid; other-resource worker-page and worktree mappings; initial/pre-release/post-release/final dispatch/terminal mismatches; and same-page/multipage duplicate dispatches with historical/distinct-active controls. All 4,036 R12 registrations remain an exact byte-for-byte prefix of this harness. Final complete results are recorded below. No repository edits, commits or pushes are authorized under this override; the worktree is read-only handoff metadata only.

The complete new-test run passed **363/363**, exit 0, no skipped/cancelled/todo, in **125.313 seconds** (`CLEANUP-r13-tests/new-results.tap`, `new-results-summary.json`). Candidate and harness hashes stayed frozen. The complete inherited-plus-added run passed **4,399/4,399**, exit 0, no skipped/cancelled/todo, in **651.591 seconds** (`results.tap`, `results-summary.json`). All 4,036 inherited and 363 added registrations ran exactly once, with actual names/multiplicities reconciled against the manifest and frozen candidate/harness hashes.

| New family | Registrations |
| --- | ---: |
| Initial/final cross-inventory opaque IDs, absent/distinct controls | 37 |
| Independent optional-ID sources and minimal direct controls | 30 |
| Cross-page resource associations, historical/distinct/absent-path controls | 90 |
| Terminal versus worktree inventory associations and distinct controls | 12 |
| Initial/pre-release/post-release/final dispatch/terminal correlations | 73 |
| Same-page/multipage duplicate dispatches and historical/distinct controls | 121 |
| **Total added** | **363** |

## Binding-instruction and acceptance self-review

| Requirement | Named proving tests / evidence |
| --- | --- |
| R12 major 1: opaque terminal IDs correlate with target evidence on both routes/all actions at initial/final observations | `R13 cross-inventory <direct/released> <worktree/noise/prune> <initial/final> same-opaque then-valid`; actual second registered Git worktree; later consistent receipts cannot clear the collision |
| Every optional worker/resource/workspace/terminal association participates on direct route | `R13 direct association <action> <phase> worker/resource/workspace/terminal`; unused worker/worktree inventories deliberately return failure |
| Correlation reaches unrelated page rows and applicable worktree inventory rows | `R13 cross-page association <action> <phase> <first/middle/last> opaque-conflict/same-path-different-id`; `R13 cross-worktree association <worktree/noise> <phase> opaque-conflict/same-path-different-id` |
| Absent IDs, absent optional paths, distinct worktrees, historical rows and minimal direct receipts remain supported | Cross-inventory `distinct-opaque/no-id`; direct-association `minimal`; cross-page `historical-consistent/distinct-active/no-path`; cross-worktree `distinct-consistent`; inherited R11/R12 minimal/opaque/distinct/historical controls |
| R12 major 2: initial/pre-release/post-release/final terminal/dispatch contradictions latch host, both routes/all actions | `R13 dispatch correlation <route> <action> <initial/pre-release/release/final> terminal-handle/dispatch-id then-valid`; paired `consistent`; post-release rejection requires exit 1 and keeps records/resources despite later valid receipts |
| Duplicate dispatch identity on one page/across pages latches host | `R13 duplicate dispatch <action> <initial/final> <same-page/first-middle/first-last/middle-last> duplicate-target/duplicate-historical/conflicting-dispatch then-valid`; paired `historical-consistent/distinct-active` |
| Retention proves actual resource preservation and zero destructive counts | Existing `completionEvidenceCase` public fixture assertions check real temporary directory/bare ref, worker record, no removal call, zero removal/pruning/noise counts, exact dirty lock/cache bytes; no private cleanup function is exported or invoked |
| Test-first, smallest level-1 fix | Three focused red/green slices above; one private host-scoped map/helper replaces inventory-local association maps, existing host guard reused; no export/dependency/route/persistent-store/protocol/data-flow change |
| No weakening of inherited tests or fail-closed parser/completeness/completion guards | Byte-identical 4,036-registration R12 harness prefix; `source-preservation.json` confirms completeInventory-through-parser tail and lock/cache validators byte-identical to backup; final manifest reconciliation passed |
| Prior data/ref/noise/lease/accounting guards preserved | Inherited public cases: `ignored artifacts protect a worktree`, `a merged branch with unpushed commits is kept`, `the two protected branches are never removed`, forbidden-prefix tests, `a remote branch moved just before push survives the SHA lease`, parser/scanner/bounded/completeness families, `action errors retain partial success and before/after worktree counts`, `release is retried when its worktree was removed in an earlier cycle`; source for their mutation/authorization/accounting paths unchanged |
| Controller-only scope and data safety | Only this controller's script/analysis artifacts are changed; no issue/GitHub access, repository fetch/branch/merge/commit/push, dependency install, model API, real service/inbox body, other project, SSH, live cleanup (even dry), helper worker, product/browser/full gate, screenshot/binary or extra checkout |
| Review gate and worker lifecycle | Existing CONTROLLER.md live-use deferral untouched; this Developer provides evidence only; one worker_done under assigned task/dispatch is prepared as the final action |

## Files, reproduction, assumptions and debt candidates

Persistent deliverables are the installed `~/controller-exxperts/cleanup.mjs`, this report, `analysis/CLEANUP-r13.diff`, and `analysis/CLEANUP-r13-tests/` with the R12 backup, tested candidate, inherited/added public harness, reproducible runner/adapters, manifests and TAP/source-verification evidence. No repository file is changed and no commit/push is made under the explicit override. Read-only workspace metadata: branch `bussard76/cleanup-r13`, HEAD `c6ff24035cc430d266f9e5097315fa7168960085`.

Run all isolated controller tests with `python3 ~/controller-exxperts/analysis/CLEANUP-r13-tests/run-suite.py`; run only additions with `CLEANUP_TEST_PATTERN='^R13'` before that command. The runner partitions registrations over four local Node processes (no helper agents), verifies all 4,036 inherited names/multiplicities and uniqueness, reconciles actual TAP names against the manifest, and freezes candidate/harness hashes. Direct unpartitioned reproduction is `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 FACTORY_CONFIG= node --test ~/controller-exxperts/analysis/CLEANUP-r13-tests/safety.test.mjs`.

External writers remain unfenced: controller starts and cleanup must be serialized, and another process may change state after the last observation. The exact SHA lease protects only its named remote branch. Service completeness/honesty and the meaningful scope/pagination returned by worker-list remain trusted; the recorded run cannot reveal omitted owners/runs. Legacy opaque IDs without any supplied path keep their established exact-ID semantics. Canonicalization uses the configured host's POSIX/GNU realpath semantics, including missing historical leaf paths; alternate mount aliases remain outside this proof. No real-service or SSH compatibility claim is made.

These are existing `edge-case/security` acceptance limits/debt candidates for coordinator consideration, not fixes added to this task. No new limit, dependency or unrelated debt file is introduced. No unexpected timeout, load, environment or network failure occurred in the new-test run; no flaky rerun was needed. The complete run also had zero unexpected failures and zero environment/load/network retries; installation verification passed. Fresh independent safety review and coordinator acceptance are required before live use.


## Final verification and installation

The three intentional red diagnostics are the only expected failures captured during implementation. Every new test passed in the focused 363-registration run, and the frozen complete run passed all **4,399 registrations**. No test was weakened, skipped, deleted or loosened. No unexpected timeout, foreign-load, environment or network failure occurred; retry count is **zero**.

Syntax checks passed for the candidate, final harness, four adapters, pending install and installed script; Python runner parsing passed. `source-preservation.json` verifies the byte-identical inherited harness prefix, canonical ID/path validation, completeness/completion/parser tail, lock/cache validators and action/accounting paths. `verification.json` verifies complete manifest reconciliation, original backup hash, frozen source hashes and installed/tested byte equality.

The installed original was compared byte-for-byte with its backup immediately before preparing the replacement and again before the atomic rename. A same-directory pending file was written using the original script permissions, fsynced and syntax checked, then atomically renamed over the installed script. Installed bytes equal tested bytes and the pending file is gone. No invocation of live cleanup, even dry mode, was used for installation verification.

| Source | SHA-256 |
| --- | --- |
| Installed / tested candidate | `80c7707f9147a079019dc5a3c45cfada5d815a887debd105bb185f8255f95403` |
| Original R12 backup | `ce29185833778dbc23235ec52aa2bb8eba2510ff6054d03512132dabf34423d6` |
| Final inherited/added harness | `5314b286346d7bf664e9f2682d10ddf78d1acf6096a8da5ca72063ae345ecd0f` |

`analysis/CLEANUP-r13.diff` contains the complete production-script diff plus harness/runner changes relative to R12. Reproduction artifacts, focused red/green evidence, final TAP/manifest/summary and source-preservation/verification JSON remain under `analysis/CLEANUP-r13-tests/` for the independent reviewer. The temporary catalog and pending installation were removed; every fixture removes its invented repositories and local bare remotes in teardown. No extra project checkout, binary, screenshot, dependency install or repository mutation was created.

All Developer-stage acceptance items and binding instructions are satisfied. The workspace branch and HEAD remain the read-only metadata recorded above, and the repository worktree remains clean. Under the explicit controller-only override, no branch creation/fetch/merge/commit/push occurred. Fresh independent safety review and coordinator acceptance of the stated limits remain required before any live use; this Developer report does not claim that review or authorize live cleanup.
