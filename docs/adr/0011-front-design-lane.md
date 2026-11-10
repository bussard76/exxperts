# ADR-0011: A bounded Front design lane with tests after shaping

Status: proposed
Date: 2026-11-10
Decided by: Sascha pending acceptance
Architecture impact: level 3 — changes Front product-code responsibility and test-first ordering for one human-opened design lane; no product interface, dependency, store or transport is introduced by this ADR

## Context

The TFACTORY-UPDATE architecture review at `d04c54c63c6e7ce3a5c02e922615c917c39c1886` classified the design-lane addition in factory branch `6d41f63d0da8e0ea8a33723fd392ed804b7d46fe` as level 3. Front would write product code and postpone tests, while `AGENTS.md` requires tests first and the normal outside-in path builds a fake before product implementation. ADR-0001 adopted the factory and permits routine updates; ADR-0005 creates a different, bounded bug-fix lane that still requires TDD. Neither records this exception.

On 2026-11-10 the coordinator relayed Sascha's decision: Front may implement in the design lane, the pilot ended, English remains for all texts, and workers remain on OpenAI models. This is a relayed decision, not a verbatim quotation of Sascha or acceptance of this document. The exact scope below is proposed for his confirmation. Ending the pilot does not establish that startup, watchers or Mac-host automation were implemented.

Baseline: fork main `fb2ac7aaa5287659ea0da0ec306b60ab60126ac0`. This proposal changes only this ADR. ADR-0010 is reserved by a closed draft; 0011 follows the numbers found in history reachable from all fetched/local refs, with that reservation included.

## Options

### A. Permit a bounded design lane, then normal hardening (recommended)

Sascha opens one lane for one named surface on a separate branch. Front shapes that surface with him, then hands the exact branch to the Controller when Sascha says the surface is right. Tests for the lane's changed behavior follow in hardening, before independent review and integration.

This gives short feedback cycles on the actual surface and preserves independent integration checks. The tradeoff is a temporary branch with untested behavior and possible rework during hardening; the shortcut list and mandatory handoff make that work visible.

### B. Keep the existing fake-first and test-first order

Front prepares the fake, interfaces, logic and tickets; Developers implement with failing tests first. This keeps one workflow and discovers regressions earlier, but requires another implementation/review cycle for each visual adjustment that needs the real surface.

### C. Allow general Front implementation with optional hardening

This removes the named-surface bound or makes tests/review optional. It would be faster initially, but expands ownership and weakens the existing gate beyond the relayed decision. It is not recommended or authorized by this proposal.

## Decision

Pending Sascha's acceptance. Recommend option A with the following exact bounds; this proposed ADR grants no operational exception until accepted and reflected in the applicable rules.

1. **Entry and scope.** Only Sascha opens a lane, for one named surface. Front records his dated request, the surface and its branch. The exception applies to shaping that surface on that branch and ends with the lane. It can replace the clickable fake with the actual surface; it does not replace agreement on data/interfaces and logic where those are still open. Ambiguous scope or behavior returns to Sascha through Front.
2. **Ownership and approvals.** Front may write the surface's product code in this lane. Controller retains factory-worker coordination and integration; Front does not acquire those responsibilities. Change levels, protected-file rules and architecture approvals still apply: a new dependency, interface, responsibility, protocol or data flow requires the normal level check and any required approval before implementation. Opening a lane approves neither an unstated architectural change nor a wider product decision.
3. **Shaping and evidence.** Front makes bounded changes while Sascha judges the branch on a separate port in the permitted demo/test environment. Each round records what changed, what Front checked, what remains unchecked and whether a reload or restart is needed. Keep a running shortcut list in the branch report. Human testing does not authorize agents to access Sascha's real data, accounts or production systems.
4. **The test-first exception.** Tests for changed behavior may be deferred while Front shapes this surface. Existing assertions remain intact: none may be changed, skipped or deleted to accommodate the lane. Invented fixture data may gain a field. A broken test is reported to Sascha and listed as a shortcut. This is a change to ordering, not permission to discard tests, conceal a failure or call an unchecked branch ready for integration.
5. **Closure and handoff.** Only Sascha closes shaping by saying the surface is right. Front gives Controller a hardening ticket containing the named surface, branch and full SHA, dated opening/closure decisions, screenshots or signed-off design location, the shortcut list and all recorded decisions. Controller hardening depends on that exact handoff. An open or ambiguous lane stays out of integration; a shortcut list with no entries means explicitly that none were recorded, not that tests ran.
6. **Hardening order.** Controller prepares the normal task spec and Architecture impact from the handed-over branch and sign-off. A fresh Architect reviews the hardening spec before hardening work; this does not retrospectively prove a pre-build review of already shaped code. A Developer first adds the deferred behavior tests, verifies they detect the intended regressions, then fixes failures and pays the listed shortcuts needed for the specified flow. Subsequent behavior changes use TDD. If hardening needs a visible behavior change beyond the sign-off, Front obtains Sascha's decision rather than silently replacing it.
7. **Independent review and integration.** A fresh Tester who did not build the change reviews the full diff on current main plus the branch, including the changed flows against the sign-off and `ponytail-review`. Level-2/3 tasks also receive the normal fresh Architect conformance check. Passing review records, required checks and the normal integration wave remain prerequisites for main. Controller runs the existing gate commands and capacity/attribution rules; this ADR changes no gate, lock, review severity, round limit, debt/release rule or existing accepted handling of smoke outliers. Front's visual acceptance is not an independent Tester pass. A failed required gate still prevents integration under those existing rules.

The sequence is: Sascha opens a named surface → Front shapes and records shortcuts → Sascha signs off → exact branch becomes a Controller hardening ticket → Architect spec review → Developer adds tests and hardens → independent Tester → Architect conformance for level 2/3 → existing integration gate/wave → main. Required architecture decisions precede any affected implementation, including during shaping.

## Consequences

- The protected TDD rule needs a narrow reference to this exception; outside the named lane, failing tests still precede behavior changes. ADR-0005's bug-fix lane keeps its own criteria and ordering.
- Front temporarily combines conversation and implementation. Reviewer independence is preserved by the Controller handoff and fresh Tester; Front cannot review its own work into main. Deferred tests and shortcuts are explicit hardening work, not silently accepted permanent debt. Other debt follows the existing functional-only review and release rules.
- After acceptance, align `AGENTS.md`, the Architect protocol where needed, coordinator handbook and human workflow, including their diagrams and the dated decision. The existing factory branch conflicts with current main in both workflow documents; resolve and review those conflicts without losing TFRONT-SERVER history. This ADR is no substitute for the factory update's remaining reviews and conformance.
- Preserve English for all texts, UI and invented demo data, and the OpenAI-only worker/quota decision. Preserve no real model calls during development/tests, no real-data access by workers and no outward effects. The external factory's general wording grants no additional permission.
- The separately relayed server-only Front/Mac-worker decision remains separate: there is one server Front; Mac work is defined per case for a Mac worker, with no Mac host configuration yet. This ADR creates no Mac Front, queue, watcher, host configuration, pairing or data-transfer permission.
- This proposal neither accepts every upstream factory policy nor changes product modules, imports, public exports, routes, storage, dependencies, capacity, models or architecture mode. Ending the pilot is not evidence that automation exists.

## Slicing

1. **Proposal and acceptance, level 3.** Commit only this proposed ADR citing ADR-0001. Front presents option A and obtains acceptance of the exact scope, recording Sascha's actual words and date before changing its status to accepted. Acceptance check: the proposed/accepted state and decision text are unambiguous; no agent is named as the decider.
2. **Rule alignment, level 3; depends on acceptance.** In a separately reviewed change, reconcile the protected TDD exception, Front/Controller responsibilities, hardening order and workflow diagrams with this ADR, citing it once accepted. Preserve the separate server/Mac decision and existing gates. Acceptance check: all affected rules describe the same bounded lane, no unresolved merge conflicts and no unapproved policy changes; independent review and conformance pass.
3. **Each use, level checked per task; depends on aligned rules.** Sascha opens a named surface and Front supplies the exact handoff to Controller hardening. Acceptance check: dated entry/exit and branch evidence exist, deferred tests and specified flows are checked, the builder is not the Tester, required conformance passes and the existing wave gate authorizes integration. This ADR opens no particular product lane by itself.
