# TADR-0008 architecture conformance

Reviewed commit: 94c7b9b417744af69ab8b8eb83a950622ec83a04
Verdict: pass

## Architecture impact

Level 3: this process decision clarifies the protected change-level table and the Architect, coordinator and developer workflow guidance. It changes no product module, public export, dependency, contract, durable store, import boundary or data flow.

Decision authority is Sascha's dated acceptance in `~/controller-exxperts/inbox-done.md`, heading “Sascha ACCEPTS ADR-0008, option A, with one wording extension” (2026-11-10), recorded in accepted `docs/adr/0008-clarify-new-module.md`. The authorized sentence is:

> A new file alone is not a new module; a new module is a logically or technically wholly new topic that brings new dependencies or interfaces.

## Boundary review

Reviewed the pinned tip of `origin/agents/tadr-0008-accept` without merging anything. The complete task diff from `d6e267fe403be004a1108f544c9883294af0e97c` changes exactly five Markdown files.

| Check | Evidence | Result |
| --- | --- | --- |
| Accepted level-3 authority | ADR-0008 has `Status: accepted`, `Decided by: Sascha (2026-11-10)`, option A with the extension, and the acceptance quote. Decision and Consequences each contain the exact authorized sentence. | Pass |
| Protected level table | `AGENTS.md` adds that sentence only to the level-3 examples. Level 1, level 2, the existing level-3 triggers and the escalation requirement remain unchanged. | Pass |
| Consistent workflow guidance | `docs/architect-protocol.md`, `docs/coordinator.md` and `docs/dev-workflow.md` contain the exact sentence, including “or interfaces”, attributed to ADR-0008 and Sascha on 2026-11-10. Other level criteria remain separately assessed. | Pass |
| Preserved alternatives | ADR-0008's Options section is byte-for-byte unchanged from the task base. Its original option A lacks the extension deliberately; Decision and Consequences supply the accepted final wording, as authorized. | Pass |
| Product boundaries and outward effects | All changed paths are the five requested documents. No product code, manifest, lockfile, test, hook or guardrail changes occur in the committed task diff; no new export, contract, durable store, data flow, forbidden import or route to a real external system is introduced. | Pass |

## Protected-file sequence

The task contains exactly these three single-parent commits, in the requested order; each carries a DCO `Signed-off-by` trailer:

1. `cd1632e77e240f25b725952ff193c98b840c803d` changes only ADR-0008 to record acceptance and the extension. Its message cites ADR-0001, already accepted with a `Decided by:` line in the parent tree.
2. `6328b03bb412830ef52e9a07c3a3682933f5978e` changes only `AGENTS.md`. Its message cites ADR-0008, already accepted with Sascha's dated decision in the parent tree.
3. `94c7b9b417744af69ab8b8eb83a950622ec83a04` aligns only the three workflow documents and cites ADR-0008.

This sequence satisfies the documented protected-file rules. `core.hooksPath` is `.githooks`; the hooks and guardrail implementation are unchanged. Inspection establishes the committed sequence and eligible ADR references, not historical proof of how each builder command was invoked.

## Findings and review provenance

No architecture conformance blocker or unapproved architectural decision found. The resulting guidance implements the exact human-authorized clarification without deciding any additional classification exception.

Issue [#17](https://github.com/bussard76/exxperts/issues/17) and `docs/reviews/T17-18-RECLASS-architecture-spec.md` on `origin/agents/t17-18-reclass-specreview` provide context about RAW editing and reclassification of #17/#18. That report reviewed `028012127b8686ac0215fe30a4f3d3c3bb2af742` and passed those product changes at level 1; it is **not** an architecture spec approval of the separate level-3 ADR-0008 change. No separate TADR-0008 architecture spec review is present in the reviewed tree or supplied as approval. This is a process-evidence gap, not evidence of an unauthorized decision: conformance passes against Sascha's explicit later acceptance and the actual five-file change; this report does not retroactively claim a pre-build spec pass.

The independent Tester report `docs/reviews/TADR-0008-review-1.md` at `f6cc23625a49a8ef81083ef6f2592ede83234db0` records `Verdict: pass` for the same full reviewed SHA. It remains on `origin/agents/tadr-0008-review-1`; it was read without merging it into this review branch. Integration and inclusion of both reports remain Controller-owned.

## Verification and limits

Read the full task diff, acceptance record, ADR template and adoption ADR, protected-file rules and implementation, relevant protocols, issue #17, prior reclassification report and independent Tester report. Focused read-only assertions passed for the pinned SHA, exact wording across all five files and both ADR sections, preserved options, exact changed-path scope, ordered commits, sign-offs and ADR reference eligibility. `git diff --check d6e267fe403be004a1108f544c9883294af0e97c..94c7b9b417744af69ab8b8eb83a950622ec83a04` passed.

No build, full suite, gate command, graph generation, product logic edge-case hunt, security audit or load test was run for this documentation-only, read-only conformance task. No new debt candidate was identified. The initial plain `gh issue view 17 --repo bussard76/exxperts` failed on GitHub's deprecated Projects field; an explicit JSON field selection succeeded. `ARCHITECTURE.md` is absent, consistent with the Architect protocol's stated configuration.

`package-lock.json` appeared modified after the branch switch despite an initially clean status. It was left untouched and excluded from the report commit; all scope and dependency conclusions use committed Git objects. Only this report is written and committed; no additional checkout was created.
