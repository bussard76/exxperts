# TADR-0008 architecture spec

Verdict: pass
Reviewed commit: 94c7b9b417744af69ab8b8eb83a950622ec83a04
Spec: `docs/adr/0008-clarify-new-module.md` at the reviewed commit, together with Sascha's 2026-11-10 acceptance in `~/controller-exxperts/inbox-done.md`, heading “Sascha ACCEPTS ADR-0008, option A, with one wording extension”.
Level: 3, confirmed — this changes the protected classification guidance and development protocol, although it changes no product architecture.
Decision: recorded in accepted ADR-0008, `Decided by: Sascha (2026-11-10), option A with the extension "or interfaces"`; no additional human decision is needed for this scope.

## Review timing and scope

This is an independent **retrospective spec review after implementation**, commissioned to address the evidence gap identified in architecture conformance commit `7c9007b9a51aa50886920ed81440a04e9d7eadf8`. It assesses whether the authorized specification is consistent, bounded and implementable under current policy. It cannot retroactively establish a pre-build review or change the chronology required by `docs/architect-protocol.md`. The missing pre-build evidence remains a historical process gap; this pass must not be represented as evidence that the build waited for an Architect.

The specification is the accepted ADR plus the explicit human instruction, rather than issue #17. Issue [#17](https://github.com/bussard76/exxperts/issues/17), the connected Markdown editor helper and its consumer explain why the terminology needed clarification; their product implementation and reclassification are outside this task. The separate level-1 review of #17/#18 does not approve this level-3 process change.

## Architecture impact

The owning area is repository governance: the ADR records authority, `AGENTS.md` supplies the binding level table, and the Architect, coordinator and developer workflow documents carry aligned instructions. The seam is the classification rule agents and people consume before work is dispatched or implemented. No product module, public export, dependency, route, allowed import, durable store or data flow changes. `ARCHITECTURE.md` is absent and `factory.config.json` sets `architecture.mode` to `off`; no maintained product architecture baseline is assumed.

The exact authorized sentence is:

> A new file alone is not a new module; a new module is a logically or technically wholly new topic that brings new dependencies or interfaces.

The acceptance explicitly requires this extension and three ordered commits. It does not delegate future level-3 decisions, waive other level triggers, or reclassify a specific product task.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or disposition |
| --- | --- | --- | --- |
| Exact, implementable specification | Accepted ADR Decision, Consequences and Slicing; dated human acceptance | Human decision becomes a bounded five-file documentation change | Exact sentence includes “or interfaces”; targets, order, attribution and validation are specified. The ADR's explicit architecture-impact field defines level and scope. No unresolved design choice prevents implementation. |
| Authority and protected files | ADR-0001 adoption rules; ADR-0008; `AGENTS.md` protected table | Accept the decision before changing the binding table | Accepted ADR-0008 records Sascha, date, option and extension. Options remain unchanged from the proposal on main at `d6e267fe403be004a1108f544c9883294af0e97c`; the original option A is historical proposal text, with the final wording unambiguously in Decision and Consequences. |
| Classification bounds | Level table and all three process documents | Readers assess the module definition alongside every other existing level criterion | Existing level-1/2 examples, level-3 triggers and escalation instruction remain unchanged. “Wholly new topic” and “interfaces” require judgment, not an automatic filename or TypeScript-export rule. No additional exception is authorized. |
| Empty, ambiguous and error states | Existing Architect and coordinator classification process | Missing or ambiguous impact returns `change-spec`; level 3 awaits an accepted human decision | Existing handling remains in force. A future borderline classification is assessed on its facts; inventing an exhaustive classifier is outside scope. There is no new runtime input, empty response, error protocol or persistence state to specify. |
| Ownership and privacy | Sascha decides; Controller coordinates; independent reviewers assess | Only governance text changes | No reassignment of authority, real data, secret, model call, external destination or product write path is introduced. The accepted decision does not authorize product or EXXETA writes. |
| Outside-in evidence | Governance ADR and existing workflow, rather than a new product feature | Decision → classification table → process guidance | `design/` contains only its README at the reviewed head. No new UI, data interface or executable logic is specified, so feature screens, a clickable fake and a feature logic diagram do not apply. The existing workflow Mermaid diagram still requires Architect review before building and is consistent with this specification; the actual timing gap is reported above. |
| Dependencies and parallel work | ADR Slicing and the explicit acceptance | Acceptance → protected table → three aligned process documents | The slices are sequential, not parallel producer/consumer implementations. Exact shared text and each target are fixed. No new shared data fields or executable producer/consumer contract requires an integration test; comparison of the authority and every consuming document is the relevant check. |

## Protected-file sequence and verification

Independent inspection confirms exactly these three single-parent commits, each DCO signed:

1. `cd1632e77e240f25b725952ff193c98b840c803d`: only ADR-0008 acceptance, citing ADR-0001, already accepted with a dated decision in the parent tree.
2. `6328b03bb412830ef52e9a07c3a3682933f5978e`: only the level-3 table in `AGENTS.md`, citing ADR-0008, already accepted in the parent tree.
3. `94c7b9b417744af69ab8b8eb83a950622ec83a04`: only the three process documents, citing ADR-0008 and attributing the clarification to Sascha on 2026-11-10.

Read-only assertions passed for the pinned head, exact five-file scope, wording in both ADR sections and all four consumers, unchanged options, ordered single-parent commits, per-commit paths, DCO trailers and prior accepted ADR references. `git diff --check d6e267fe403be004a1108f544c9883294af0e97c..94c7b9b417744af69ab8b8eb83a950622ec83a04` passed. The unchanged hooks and `tools/factory-guardrails.mjs` support this protected-file sequence; `core.hooksPath` is `.githooks`. Git history proves the resulting sequence and eligible references, not the historical invocation of hooks.

## Prefactoring

None needed. Updating the accepted decision and its existing consumers is sufficient. No new abstraction, classifier, dependency or product refactor belongs in this task.

## Findings

No design-relevant inconsistency, unapproved decision or remaining specification change is required. **Pass at level 3 with accepted authority** is appropriate: `level-3` would request an outstanding human decision, which is already recorded here. Preserve the exact wording, scope, existing escalation rules and sequential slicing; this pass grants no broader classification exception.

The retrospective timing is the remaining process limitation, not a defect in the authorized design. The Controller owns integration and truthful reporting of that limitation. Existing conformance `7c9007b9a51aa50886920ed81440a04e9d7eadf8` and independent Tester report `f6cc23625a49a8ef81083ef6f2592ede83234db0` both assess the same implementation head; they were read as evidence and are not replaced by this spec assessment. No new debt candidate was identified.

## Verification limits and report changes

Only this report is written and committed. No tests were added, and no build, test suite, full gate or product behavior check was run, as directed. No additional checkout was created. The pre-existing unstaged `package-lock.json` modification was left untouched and excluded; all scope and dependency conclusions use committed objects. Assumption: the supplied dated Controller inbox acceptance is the authorized human decision record, consistent with the accepted ADR and this dispatch.
