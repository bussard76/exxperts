# TFACTORY-UPDATE architecture spec

Verdict: level-3
Spec: dispatched TFACTORY-UPDATE factory-update review, task_08a256020c9c / ctx_59806ed02b38, including coordinator messages msg_d0c234f5588e and msg_5a99c7376467; issue #20 is explicitly not this task.
Reviewed commit: 6d41f63d0da8e0ea8a33723fd392ed804b7d46fe
Branch reviewed: origin/agents/factory-update-0.1.10
Comparison main: fb2ac7aaa5287659ea0da0ec306b60ab60126ac0
Merge base: 3fe7bc75ad43199f9becde9ef85d99e876051b55
Level: 3, raised for the Front design lane's changed responsibilities and test-first exception; the bounded guardrail update alone fits level 1.
Decision: Sascha's 2026-11-10 adoption decision was supplied by the coordinator and is acknowledged. An accepted ADR recording this level-3 exception is still missing. ADR-0001 covers factory adoption and routine updates, not every later change to protected workflow rules.

What this change does: Updates the factory manifest from 0.1.4 to 0.1.10, tightens existing Git checks, and adds signed-off design comparisons to reviews. Follow-up commits authorize a Front design lane and record a server-only Front with Mac work assigned per case.

## Architecture impact

- Owning modules: existing factory guardrails, factory update metadata and coordination/review documentation. No product routes, public exports, dependencies, allowed imports or product stores change.
- Existing Git interfaces stay hook subcommands, the Git pre-push update records and review files. Additional refusal conditions enforce the existing review/protection policy; they introduce no new transport or review authority.
- The design lane is different: Front gains product-code ownership for a named surface, then transfers the branch to Controller hardening; tests move after shaping. This changes responsibilities and the protected TDD/outside-in process. Documentation-only implementation does not remove the level-3 trigger. ADR-0008 changes only the meaning of a new module, not these other triggers.
- ADR-0005 explicitly records a prior workflow exception as level 3 and preserves TDD; its slim lane excludes protected files and non-bug tasks. It does not authorize this lane.
- There is no maintained `ARCHITECTURE.md`; `factory.config.json` keeps `architecture.mode: off`. No architecture document or stewardship activation is needed.

## Evidence and comparison scope

Read the complete target/main and merge-base diffs, all three task commits and their DCO sign-offs, AGENTS, architecture/review protocols, developer guide, coding standards, accepted ADR-0001/0005/0008, hooks and their guardrail implementation, manifest, factory configuration, both workflow documents and the existing TFRONT-SERVER reports on main. Used `codebase-design` and `ponytail-review` vocabulary/checks; policy findings were checked against the actual text rather than treated as speculative implementation bugs.

The supplied factory design-lane link was read without writing to that repository, then pinned at [outside-in.md, b636fd5697292cf00101b608137c8f0d2741c925](https://github.com/bussard76/agentic-factory/blob/b636fd5697292cf00101b608137c8f0d2741c925/docs/outside-in.md#the-design-lane-shaping-the-real-surface-together). It describes the TDD suspension, bounded surface, human closure and handoff to hardening. It is evidence, not permission to import other upstream policy or access real data.

The target predates TFRONT-SERVER's integration. Apparent deletions of its two review files and pilot section in a direct main-to-target diff are not authored deletions: the merge-base task diff changes six files and deletes none. However, `git merge-tree --write-tree origin/main HEAD` exits 1 with real conflicts in `docs/coordinator.md` and `docs/dev-workflow.md`; its diagnostic tree is `63b7cc1cd884f5bc90ba2d09701a0fd5223cda10`. No merge was applied to the branch or worktree. Do not overwrite main with the stale tree or describe it as already mergeable.

## Fit checklist

| Requirement | Owning module and interface | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Disagreement is reported | `AGENTS.md:44` | Worker reports concerns to coordinator | Fits existing scope and escalation duties; does not override levels, safety or stop conditions. Routine ADR-0001 update. |
| Clone-local standard symlinks stay uncommitted | `tools/factory-guardrails.mjs:59` | Index mode 120000 and staged target text → refusal if `.git/factory/` occurs | Empty/no-matching paths continue; normal file handling remains. No symlink layout is activated by this diff. |
| Alternate agent rules receive protection | `tools/factory-guardrails.mjs:31`, `:104` | `AGENTS.factory.md` → existing ADR/review requirements | No such file or new configuration appears. Protecting the alternate spelling is an existing guard's extension, not adoption of a new rules source. |
| Branch cannot remove its own review coverage | `tools/factory-guardrails.mjs:120` | Local configured main plus prior remote-tree main → gated branch selection | Unusable/absent prior config falls back to `main`; zero remote SHA uses local MAIN. Existing review-file format and ancestor checks remain. |
| Unknown remote history is refused | `tools/factory-guardrails.mjs:127` | Git ref record → local commit existence check → fetch-first refusal | Applies to existing branch refs, including worker branches. Deleted refs are skipped. This checks local Git objects; it performs no network operation. |
| Signed-off design is reviewed | `docs/review-protocol.md:17` | Repo design exports → rendered flow check and review finding | Missing controls/flows fail; cosmetic differences go to Front acceptance. Refines existing functional-only review; does not add a new review stage. |
| Manifest and project overrides | `.factory/manifest.json:2`, `:9`, `:14`–`:20` | Factory baseline hashes coexist with project-specific files | Review protocol and guardrail SHA-256 prefixes match their recorded new hashes. AGENTS remains `user`; custom coordinator/debt/architecture/workflow content need not equal upstream baseline hashes. Do not replace them to force equality. |
| English and OpenAI-only decisions | `AGENTS.md:88`, `:92`; `docs/coordinator.md:47`, `:63`; `docs/dev-workflow.md:177` | Project rules override factory defaults | English UI/demo rule and OpenAI-only quota decisions remain. Configured Claude fallback is unchanged and still forbidden by policy. New German design-lane prose needs correction under the supplied all-texts-English decision. |
| Front design lane | `docs/coordinator.md:15`; `docs/dev-workflow.md:60` | Human opens named surface → Front branch → human sign-off → Controller hardening → independent review/gate/wave | Level 3; findings 1 and 2 below. Existing fixture/assertion protections and normal main gate are retained. |
| Front and Mac ownership | `docs/coordinator.md:134`; workflow location/transport statements | One server Front assigns Mac work per case; no Mac host configured | Supplied decision acknowledged. Manual `MAC-TASK <date> <what>` convention is a process record, not an implemented queue/watcher or new remote-control interface. Align contradictory current statements. |
| Ticket completion by wave | `docs/dev-workflow.md:105` | Final wave branch / post-push Controller completes ticket | Existing integration responsibility is clarified; no new ticket schema or executable steering code in this tree. |

The manifest also changes hashes for external Controller/Front/server assets. Those assets are not tracked in this repository tree; only `.factory/manifest.json` exists under `.factory/` here. Their installation or runtime behavior is not proven by this SHA or by this review. No external Controller files, real data, logs, private environment or other project's files were read.

## Interfaces, states and outside-in evidence

The existing pre-push record is `<local-ref> <local-sha> <remote-ref> <remote-sha>`, one record per line. Review producers still supply `Verdict: pass` and `Reviewed commit: <40-character SHA>`; the consumer still checks ancestry and the pushed tree. Protected-file commits still cite an accepted ADR present in the index with a nonempty `Decided by:` line. All three task commits cite accepted ADR-0001; the initial protected-file change satisfies the mechanical citation rule, but the citation cannot establish that ADR's semantic coverage of the later design-lane exception.

No product feature or signed-off screens are built by this task, so a new `design/<feature>/` export or clickable fake is unnecessary. For this process change the relevant outside-in evidence is the local role/flow documentation and the pinned design-lane source. The existing workflow table/diagrams still show fake → sign-offs → build; they do not reconcile the new shaping path or its explicit exception to `AGENTS.md:48` and `docs/coordinator.md:24`.

Record the lane's exact handoff facts locally: named surface, branch and full SHA, human opening/closure decisions with date, screenshots/sign-off location and shortcut list. No new machine-readable envelope is necessary. If scope or data/logic is ambiguous, return to Front/Sascha clarification rather than assume sign-off; stages 2/3 and architecture approvals still apply. An open lane or failed hardening cannot enter main. A broken assertion is reported and preserved. Use invented data and an isolated test/demo instance; a separate port is not permission to access private data or real accounts.

No parallel implementation with shared product fields is introduced here. Later hardening depends on the exact shaped branch and explicit handoff, not merely a chat message. No new producer/consumer test is required for a manual Mac task convention; do not claim an automated queue, acknowledgement, watcher or delivery guarantee. Existing empty-log and unavailable-Mac limitations must remain accurate, unless explicitly superseded by an authorized implementation task.

## Prefactoring

None. Keep changes in the existing guardrail module and process documents. No new library, module, configuration option, messaging transport or Mac host is justified. The missing work is decision recording and consistent process scope, not a product refactor.

## Findings

### 1. Level 3: record the design-lane exception in an accepted ADR

- Where: `docs/coordinator.md:15`, `docs/dev-workflow.md:60`, `AGENTS.md:48`, `docs/adr/0001-adopt-agentic-factory.md`, `docs/adr/0005-slim-lane-for-level-1-bug-fixes.md`.
- Problem: Front now writes product code and defers tests, while protected AGENTS still requires failing tests first for every behavior and the outside-in rule still requires the fake/sign-offs before building. ADR-0001 enables routine updates and immediate process records; it is not an accepted decision for every new responsibility or exception. No accepted design-lane ADR exists at the reviewed SHA. The task also lacks its own recorded `## Architecture impact`; this report supplies the assessment, not retroactive pre-build evidence.
- Required change: Controller records the already supplied 2026-11-10 decision in the repository ADR template, with accepted status, dated Sascha decision and the exact authorized exception. Reconcile the protected TDD rule and local workflow/diagrams under that ADR, including when normal architecture review remains required. Do not infer approval for any additional upstream policy.
- Options: A, recommended: record the bounded lane as accepted by Sascha, then align its rules and handoff. B: split/defer the lane and integrate only the routine guardrail/review update under ADR-0001, leaving existing TDD/roles intact. This review does not ask Sascha to choose again where his actual decision already establishes A; obtain his exact decision text through Front for the durable record.
- Proving check: focused ADR/rule/flow diff shows one consistent lane, accepted decision coverage and the stated impact; independent review and level-3 conformance still follow. An existing accepted ADR reference passing a hook is not this check.

### 2. Reconcile the current location, pilot and lane decisions on current main

- Where: `docs/coordinator.md:3`, `:15`, `:134`; `docs/dev-workflow.md:18`, `:35`, `:60`, `:161`, `:190`; both merge-tree conflicts.
- Problem: the new decision says there is one Front on the server, while the branch opening/workflow still place Front on the human's machine and call the server arrangement an alternative. The supplied decision says the pilot ended, but main's pilot record and the new design-lane rule have not been reconciled. The design-lane addition is German despite the supplied English-for-all-texts constraint; the newly adopted lane is not marked with its decision date in the process text. The latest Mac decision appears only in the coordinator handbook, contrary to its same-change workflow-sync rule.
- Required change: builder resolves the two conflicts against the pinned main and preserves TFRONT review history. Update operational location/flow statements for the supplied server-only and ended-pilot decisions; retain historical decisions marked superseded. Keep the project-specific Mac path and per-case worker assignment, no host configuration, no pairing or private data transfer. Record the supplied decisions/date in both process documents and write new prose in English. No wholesale translation of unrelated existing German text is requested.
- Proving check: a clean three-way comparison has no conflicts and both documents agree on current topology, human-owned lane entry/exit, Mac worker ownership, remaining automation limits and normal integration gates. An independent reviewer checks the resolution; this Architect does not resolve it.

## Debt candidates

| Category | Severity | Where | Proposal |
|---|---|---|---|
| tests | minor | `tools/factory-guardrails.mjs:59`, `:120`–`:149` | No changed regression tests accompany these checks in this repository diff. Add a focused temporary-Git-repository test through the actual hooks and real review-file producer/consumer, covering standard symlinks, alternate rules protection, renamed main, missing remote objects and ordinary reviewed pushes. This gap does not itself fail architecture review. |

No product functional defect, new dependency, forbidden import or newly enabled real external effect was established by source inspection. The level-3 verdict is for the changed workflow contract and missing accepted ADR, not speculative edge cases or missing tests.

## Verification and limits

This is an independent retrospective specification review of already authored commits, not proof that a pre-build review occurred. The original dispatch named 1f5f6bdc389b94ee06f31dda3a7e619100bd2470; coordinator updates explicitly replaced it with c8696ca8cb13e7cb3d8e3d8a2a1fa79cbdedf8c0 and finally the full reviewed SHA above. Only the final SHA receives this verdict.

Source/diff/history, hash and non-applying merge-tree checks completed. No test suites, full gates, live pilot exercises, real model calls or real data access; no tests added. Only this report is changed and committed. The unrelated `package-lock.json` worktree modification is left untouched and excluded. No additional checkout was created. Builder corrections, accepted ADR recording, independent Tester review and level-3 conformance remain before integration.
