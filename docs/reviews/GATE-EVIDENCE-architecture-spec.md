# GATE-EVIDENCE architecture spec

Verdict: level-3
Spec: `docs/specs/gate-isolated-evidence.md` at `0ce1cf990fe530a5aa9f26270e2ada74c558d464` (`origin/agents/gate-isolated` when fetched).
Review base: `origin/main` at `c6ff24035cc430d266f9e5097315fa7168960085`.
Level: raised from proposed 2 to 3; a new versioned runner/controller protocol supplies authoritative integration evidence through a new process channel.
Decision: needed from Sascha in an accepted ADR; the Controller's selection for review is not that approval.

What this change does: The proposal separates smoke results from arbitrary smoke output and lets at most two parallel failures pass after successful individual reruns. Build success, full inventory, completion, commit identity, browser checks and the real push remain prerequisites. This is a specification review, not an implementation attestation.

## Architecture impact

The smoke-runner module (`scripts/run-smokes.mjs`) would produce a new versioned completion record. The Controller's integration module (`~/controller-exxperts/integ-wave.sh` and its supervisor) would consume that record to authorize reruns and a push. The seam adds descriptor ownership, framing, schema, identity, completion, exit and failure semantics across processes and across repository/controller ownership. That is a protocol and data-flow change under `AGENTS.md`, even without a product export, route, dependency or store.

`docs/architect-protocol.md` requires `level-3` until Sascha's accepted ADR records the decision. ADR-0001 adopted that rule; ADR-0002 and ADR-0003 approve unrelated workspace flows. The 2026-11-06 Controller decision at `decisions.md:59-60` selects this direction for independent review and explicitly calls for escalation if level 3. Sascha's isolated-pass rule (`docs/coordinator.md:43`, `decisions.md:56-57`) approves the gate outcome rule, not this new transport or an npm bypass. No maintained `ARCHITECTURE.md` exists; `factory.config.json` has architecture mode off, which does not waive spec review.

Only this review document is changed. No implementation, proposed ADR, hook, Controller script or product file is changed.

## Four explicit decisions

| Decision | Assessment | Required disposition |
|---|---|---|
| Descriptor isolation and cooperative same-user trust | Suitable in principle for preventing child stdout/stderr from being parsed as evidence. Existing child creation uses only descriptors 0–2 (`run-smokes.mjs:123-127`); a model probe confirms an explicitly excluded descriptor cannot be written through ordinary child output. This is channel separation, not cryptographic authentication or protection from malicious same-user code. | Retain the explicit threat-model limit in the ADR and implementation instructions. No stronger OS sandbox is necessary solely to prevent output spoofing. Same-user memory, `/proc` descriptor access, deliberate filesystem interference and a modified runner are not covered. |
| Direct runner versus npm invocation/environment | Not established as equivalent. An exact `scripts.smokes` string does not preserve npm's PATH, lifecycle variables, configured script shell, or pre/post scripts. The ordinary runner copies its environment into smokes. | Resolve finding 2 before build. Prefer keeping the actual npm lifecycle rather than copying selected npm variables and assuming equivalence. |
| Level 2 versus level 3 | Level 3 under the explicit protocol/data-flow rule. Calling a cross-process protocol private does not make it an implementation detail within one module. | Stop implementation; Controller escalates to Sascha for the accepted ADR described in finding 1. |
| Transient changes and unchanged-commit guarantees | Before/after checks establish observed HEAD/tree/inventory identity, not that all executed bytes came from that commit throughout the interval. The spec acknowledges this but acceptance item 5 promises every during-run modification is red. | Resolve finding 3: choose and record the cooperative limitation, or require an execution arrangement that prevents transient source changes. Do not claim the stronger guarantee from endpoint checks. |

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Accepted gate rule | Controller disposition | Full run → up to two individual reruns → integration decision | Spec lines 11, 21–23 match `coordinator.md:43`: zero failures passes; one/two require every named individual pass; third failure remains red. No attribution to host load is required or proved. |
| Build/smoke split | Build subprocess and runner supervisor | Two phase results under one host lock | Build must be the actual `npm run build`, exit zero independently, then unfiltered default-parallel smokes. Current root build is a five-workspace npm command chain. Do not split only on the first `&&`, or treat a smoke record as build success. |
| Full inventory | Runner discovery and independent Controller discovery | Commit tree → expected names → finished results | Current inventory is 375 direct `apps/web-server/scripts/*-smoke.ts` entries. Compute expectations from the commit's tracked tree, compare the execution directory, reject untracked/ignored extra smoke names, and recompute after phases. Do not hard-code 375. No full-run filters. |
| Unique exact names | Record validator and rerun selection | JSON basenames → one argument → actual selected results | Spec requires sorted unique basenames, counts, failed subset, and exact full/single selection. Preserve the current top-level discovery rule, reject path components, and quote names as arguments. The substring selector at runner lines 38–40 requires the Controller's uniqueness precheck; never rerun a broad stem. |
| Runner completion/exit | Runner process and supervisor | Actual close status plus record, independent of logs | Require every selected result, runner normal exit 0 with no failures or 1 with failures, and EOF. A record alone, signal, spawn error, missing result, invalid code or mismatch is red. Observe the runner's own status, not merely the encompassing shell/gate status. |
| Robust evidence channel | Controller-created channel and runner writer | Private IPC → bounded validated completion | No evidence output pathname is proposed: the parent owns a fresh pipe. Stdout, stderr, failure tails and existing log parsers must have no authority to make a red gate green. Identity and commit must match independently chosen expectations. See transport instructions below. |
| Host lock and fair gate | `full-gate.sh` and every full-gate caller | `gate` → fixed host `flock` → build and smokes | Current wrapper is `GATE_SLOTS=1 gate flock -F /tmp/factory-host-full-gate.lock ...`. Keep that same lock across build and parallel runner; each individual rerun also uses it. Do not add a second lock identity or bypass `gate`. Browser calls must also enforce `GATE_E2E_SLOTS=1`; the current wrapper only sets `GATE_SLOTS`. |
| Browser prerequisites | Integration wave's optional `E2E_CMD` | Smoke disposition → browser gate → push | Preserve the browser branch and propagate its failure. `factory.config.json` currently has empty `e2e`; no separate browser command is defined. The full smoke inventory includes browser smokes; aggregate JSON pass does not prove skipped browser paths executed. Preserve skip reporting and existing independent browser review obligations. |
| Same-commit reruns | Controller and runner | Expected merge SHA → full run and each individual run → pushed ref | Check HEAD, staged and unstaged tracked changes and inventory before/after each phase and before actual push, and fail on Git command errors. Bind every individual invocation to its own fresh identity and the original expected SHA. A successful rerun from another SHA/run/name cannot repair this run. Finding 3 limits what these checks prove. |
| Existing hooks and actual push | Integration wave and `.githooks/pre-push` | Validated result → real push with independent review gate | Keep both project and factory hooks. The dry-run precheck currently precedes task merges (`integ-wave.sh:25-26`) and cannot replace the final real push/hook (`:74`). Test rejection at the final push and bind the pushed object to the expected verified SHA. No hook edits or bypasses. |
| Evidence retention | Controller logs and validated records | Original and individual outcomes → reviewable report | Retain full parallel log, individual logs, raw/validated records, statuses, expected SHA and disposition in a fresh per-wave directory. Persistence errors must prevent push. Current `wave.mjs:20` reuses `/tmp/${PROJECT}-wave`; per-process run IDs do not prevent that directory overwriting earlier evidence. |
| Ordinary runner compatibility | Runner human output and child behavior | Results/retries/skips → unchanged public CLI/logs | Preserve exact summary, failure details, current interference/port retries and skip/other-platform notices (`run-smokes.mjs:227-278`). No descriptor mode is required for ordinary callers. Do not weaken existing tests or use old text parsers as fallback authority. |
| Targeted tests and portability | Runner command and complete wave entry point | Invented local fixtures only | Existing public-entry-point plan is appropriate but needs the revisions below. `test:scripts` explicitly lists four files; passing a filename appends it rather than replacing that list. A new script test must be deliberately registered or explicitly invoked. No new dependency is needed. |

## Prefactoring

None is justified before the decision. Preserve the runner's existing discovery, scheduling, retries and human reporting. If approved, derive the completion record once from its final result collection; keep validation and disposition in one Controller supervisor instead of adding several log parsers or a generic evidence framework. The two existing text parsers may remain diagnostic, but neither may authorize an exception pass.

## Findings

### 1. Blocker — the proposed protocol needs Sascha's level-3 decision

**What this is:** Spec lines 7–15 introduce a versioned cross-process result channel consumed to authorize integration. The current runner emits only human-readable output and an exit status; `integ-wave.sh:48-67` diagnoses a failed aggregate run and always exits red.

**Problem:** The new protocol, authority of its record and execution flow are level 3 under the repository's written rule. Neither the Controller's proposed level-2 label nor the isolated-pass product rule is an accepted ADR for that protocol.

**Minimal revision:** Controller escalates one decision: recommended option A adopts the bounded runner/controller completion protocol, preserves npm semantics and existing gates/hooks, and explicitly scopes trust and source-consistency guarantees; option B retains the present red-on-ambiguity behavior without this protocol. An accepted ADR must contain Sascha's decision and date before build. Add a formal `## Architecture impact` section naming runner, Controller, transport and changed authority; reference that ADR. This review does not create or approve it.

**If skipped:** Implementation crosses a documented architecture boundary without the required decision. This blocks regardless of test quality.

### 2. Major — the proposed npm bypass does not preserve the verified command

**What this is:** Spec line 15 proposes checking only `scripts.smokes === "node scripts/run-smokes.mjs"`, then calling Node directly to preserve an extra descriptor.

**Problem:** npm adds local executable directories and lifecycle variables and runs `presmokes`/`postsmokes` when configured. A package with that exact `smokes` string and a failing `postsmokes` passes the proposed command-string check, but direct Node never runs the failure. On the inspected commit no pre/post smoke scripts exist; the environment difference already exists and is passed to children by `smokeEnv` (`run-smokes.mjs:109-116`). Existing smokes launch `npx` and other subprocesses; command spelling is not an environment-equivalence proof. An invented fixture reproduced all three differences without any install or network access.

**Minimal revision:** Prefer retaining `npm run smokes` and its lifecycle. For this Linux Controller, a possible reviewed transport is a parent-bound local IPC endpoint in a freshly created private directory, connected by the runner; remove its locator and identity from all smoke environments, enforce a single bounded completion and validate against the parent's expectations. It has the same cooperative-user limit and needs the ADR; it must replace the descriptor proposal explicitly, not be silently substituted. If direct invocation is retained instead, specify and prove the exact supported npm environment/configuration and lifecycle behavior, rejecting unsupported pre/post hooks or shell settings before running anything. Merely copying PATH and two npm variables is insufficient. Add actual entry-point fixtures for local binary resolution, lifecycle state and failing pre/post scripts.

**If skipped:** A verification command can be accepted even though its normal npm invocation fails or runs different subprocesses. Direct invocation equivalence remains unproved; this is not an attestation that today's suite fails.

### 3. Major decision gap — transient-edit acceptance exceeds the stated guarantee

**What this is:** Spec line 9 admits that restored interval changes evade observation; test item 5 at line 25 nevertheless requires every during-run HEAD/source/inventory change to make the gate red.

**Problem:** In an invented git repository, a tracked source file was changed, executed, then restored. HEAD and the tracked tree were identical and clean before and after, but Node executed the temporary content. Rechecking more frequently, adding a commit field, or using a fresh run ID does not prove continuous source identity. A full run and isolated rerun can therefore observe different source bytes at the same reported SHA if such writers are allowed. This is a contract inconsistency, not a demand to harden against hypothetical hostile users.

**Minimal revision:** Record one explicit choice with the architecture decision. Recommended within the cooperative design: require exclusive ownership of the execution checkout throughout all phases, no intentional tracked-source mutation by tests, and describe the evidence as observed commit/tree/inventory consistency; narrow item 5 accordingly and state the residual limit. That ownership rule excludes cooperative concurrent writers but does not technically prevent same-user interference. If the requirement is instead continuous identity of executed sources, specify an enforced immutable source view for runner/build/smokes/reruns, with writable build outputs kept separate, and review that wider execution flow before build. Do not silently mark transient-change tests as passing or assume Sascha accepted the limitation.

**If skipped:** The spec cannot be tested as written and its unchanged-commit claim is stronger than its mechanism establishes.

## Binding precision for the revised implementation spec

These clarify the existing requirements; they are not additional architecture blockers or findings about an implementation that does not exist.

- Name the supervisor, the descriptor/IPC handoff and its lifetime. Start reading concurrently with the runner, impose a numeric or inventory-derived byte bound, and bound waiting for EOF and process closure. Waiting for runner exit before draining can block once the record fills a pipe. On malformed/oversized input, cancellation, broken pipe or deadline, fail red and terminate/reap owned processes; never leave a gate lock held by a surviving process.
- Keep descriptor/locator/run identity out of smoke environments and descriptor maps at every child spawn, including retries. The current `smokeEnv` spreads the entire parent environment, so this needs explicit treatment and an assertion in a real runner fixture. A fresh identity correlates invocations; it is not a secret-based authentication proof.
- Specify one serialization/validation rule that really rejects duplicate keys, extra bytes, noninteger counts and invalid names. `JSON.parse` alone accepts duplicate keys. A deliberately canonical record format with exact reserialization comparison is one dependency-free option if the producer and contract require it. Base the size limit on full inventory, not today's count.
- Observe build exit, actual runner exit/signal, validated completion, supervisor completion, outer gate status and browser status separately. A normal runner exit 1 with a valid failed set is the only recoverable failure. A gate/supervisor error that also exits 1 must not be relabeled a smoke failure. Prefer the internal supervisor completing normally after classifying smoke results, with all outer gate failures remaining fatal.
- Define disposition for unknown/missing/extra inventory, symlink/nonregular smoke entries, duplicate names and ambiguous substring matches without changing ordinary discovery silently. Check both the commit inventory and actual execution directory, including ignored extra smoke files.
- Use unique per-wave and per-invocation names for persisted logs and records. Do not rely on `/tmp/${PROJECT}-wave`, shared runner failure-log filenames, or run IDs inside files to preserve prior evidence. A parent-owned pipe has no forgeable output pathname; if a file/IPC path replaces it, require fresh parent creation, exclusive ownership and no stale/symlink reuse, without claiming protection against hostile same-user code.
- Preserve the fixed lock path and normal hooks. Add `GATE_E2E_SLOTS=1` for browser callers. Test serialization using an isolated invented lock/gate fixture, not the live host lock. Do not alter protected hooks to accommodate the new evidence path.
- Bind the final pushed object/ref to the verified SHA, checking after browser gates and immediately before the actual push; let the actual push run all existing hooks. Never infer success from the earlier dry run, a printed summary, or a local fake-push command returning zero without checking the fake remote's resulting ref.

## Public-entry-point validation required after revision

The seven test-plan items cover the intended normal and rejection paths. Preserve them, with these specific clarifications:

1. Exercise the real runner command and complete wave entry point against a local invented remote; assert its resulting ref and that any allowed push follows build, full-run evidence, required individual evidence and browser completion.
2. Test zero/one/two/three parallel failures, each individual failure, wrong-name reruns and reused records. All individual successes must use the original expected SHA and fresh invocation identities; do not accept a previous invocation's successful record.
3. Force build failure after emitting fake success text; force runner spawn failure, signal, missing result, partial record then exit, valid record with contradictory exit, outer gate failure after valid runner evidence, and browser/final-hook rejection. None may push.
4. Inject forged completion JSON and runner-shaped multiline tails through actual child stdout/stderr. Verify the private channel separately, including descriptor/locator omission, oversize/extra data, duplicate keys/names, malformed UTF-8, stale run ID, incorrect version/count/subset/commit/inventory, held-open channel and consumer cancellation.
5. Synchronize persistent staged/unstaged edits, HEAD changes and extra/removed smoke files at phase barriers, including isolated reruns, browser completion and pre-push. Add a transient-edit fixture with the explicitly chosen expected result from finding 3; endpoint checks cannot be asserted to catch it.
6. Probe npm behavior and lifecycle as in finding 2; reject unsupported verify strings before partial execution. Assert default parallelism in the full run and one selected smoke in each isolated rerun. Use concurrent fake wrappers to show build and full runner share one lock, and individual/browser gates use the same host serialization convention.
7. Preserve ordinary CLI usage, summaries, failure details, retries and skip reports. Linux Controller scripts already rely on Bash, GNU `flock -F`, `mapfile` and `/proc`; do not present them as Windows/macOS tooling. Keep ordinary runner behavior portable, use argument arrays and proper path/URL handling, and disclose untested Windows inherited-handle behavior if descriptor mode is enabled there. A Controller-only evidence mode can fail explicitly on unsupported platforms without breaking the normal runner.

## Evidence and checks performed

- Read the complete pinned specification, current runner, root npm scripts, `factory.config.json`, worker/coordinator/review/architect rules, ADR-0001 through ADR-0003, `.githooks/pre-push`, its project hook, and the factory review-gate code. Read issue #6 via `gh issue view 6 --repo bussard76/exxperts --json number,title,body`; it concerns the already-integrated sidebar bug and is overridden by this review-only assignment. No issue implementation/report checklist was created.
- Read Controller `integ-wave.sh`, `full-gate.sh`, `smoke-failures.mjs`, `isolated-smoke-result.mjs`, `wave.mjs`, `docs-only.sh` and relevant `decisions.md` entries. Current text failure parser unconditionally marks failure-tail completeness unresolved (`smoke-failures.mjs:47-48`); the wave always exits 1 after its diagnostic rerun loop (`integ-wave.sh:67`). The isolated parser still relies on human output. None is an authenticated completion mechanism.
- Inspected installed npm 10.9.9 source (`@npmcli/run-script/lib/make-spawn-args.js:32-47`, `set-path.js:19-29`, `npm/lib/commands/run-script.js:121-141`) on Node 22.23.4 rather than assuming npm semantics.
- Ran `python3 .build/gate-evidence-review/probes.py`: three asserted isolated probe groups passed (including a failing lifecycle check). `npm-vs-direct`: npm ran PRE and POST and exposed event `smokes` plus local-bin PATH, direct Node did none of these; with a failing post script npm exited 7 while direct Node exited 0. `transient-edit`: identical clean before/after state, temporary content executed. `descriptor-model`: child descriptor 3 closed while forged stdout/stderr did not enter the runner's channel. These are model/contract probes, not tests of the unimplemented proposal; temporary invented package/git directories were removed automatically. The probe script remains ignored under `.build/` for reproducibility on this host.
- `git diff --check`: passed before report commit. No dependencies installed, no paid/model/external service calls, no full build/smoke gate, no live wave, no host-lock experiment, no product/browser suite, and no screenshots. No other checkout was created.

Controller file SHA-256 values at inspection (these files are outside git review scope and may subsequently change):

| File under `~/controller-exxperts/` | SHA-256 |
|---|---|
| `integ-wave.sh` | `ec8ae6c8915fa16758f30c01fa92ae9b5625830a6bfc6d0874696bc671c5757c` |
| `full-gate.sh` | `cb6b0b5f1dfcae41db2d89b956e9b4d9129f22000d5d6575524f0cd4b2011a01` |
| `smoke-failures.mjs` | `94783cba272983ec9f45d12e0e5338f0efc6e13c6c2077249085cac7e80c6c07` |
| `isolated-smoke-result.mjs` | `9b38ebd25b199eb81dfa8563dbabaf7b48779afc30371ab69a691c720fd6957a` |

## Self-review and handoff

| Assignment | Result |
|---|---|
| Independent architecture/spec review only; do the work personally | Met; no helpers, implementation or live gates. |
| Review exact target and connected runner/Controller/npm code | Met; target/base SHAs and Controller file hashes recorded above. |
| Decide all four explicit review questions | Met; four-decision table and findings 1–3. |
| Scrutinize split, inventory, exit, names, channel, locks/hooks, reruns, tests and portability | Met; fit checklist, binding precision and public-entry-point validation. |
| Identify exact blockers and minimal revisions | Met; level-3 escalation, npm equivalence and source-consistency contract gap. |
| Read-only except findings file, invented fixtures only | Met; only this report is tracked; `.build/` contains an ignored probe script, no real data. |
| Commit signed off and push own review branch | Required delivery action; report commit and push receipt supplied in worker_done. |

Assumptions: one Linux Controller host; cooperating reviewed code, not hostile same-user processes; repository source and Controller scripts inspected at the revisions/hashes above. These are review assumptions, not newly recorded Sascha decisions. No new permanent tests are added because no behavior is implemented.

Debt candidates for the Controller: synchronize `docs/dev-workflow.md` with the accepted at-most-two isolated-pass rule already in `docs/coordinator.md`; do not treat this earlier documentation omission as approval of the new protocol. Windows/macOS evidence transport validation remains unperformed, not passing evidence. These are follow-ups, separate from the architecture and functional specification blockers.

Verdict: obtain the level-3 ADR decision and resolve findings 2 and 3 before implementation. Not checked: actual producer/consumer implementation, full gates or supported-platform execution; no such success is claimed.
