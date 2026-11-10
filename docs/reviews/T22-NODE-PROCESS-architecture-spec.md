# T22-NODE-PROCESS architecture spec

Verdict: change-spec

Spec: `~/controller-exxperts/specs/t22-node-process-dev.txt`, SHA-256 `eb2b189234a34789d8d81c3aaaa625a156d728b18bd5e2d1390125e253dbfe5b` (outside the repository; no repository commit); repository base `b1e7d8ceac9616df3049c4c1b8e8d16ebcf29a5d`.

Level: 1 is appropriate for the **recording scope**, subject to the missing impact statement below. The two existing process documents record already-decided policy; no product module, export, dependency, route, store, implementation, contract or data flow is added or changed by the documentation work. The underlying decisions are not being classified anew.

Decision: recorded by Sascha on 2026-11-10 in [issue #22 comment 6767407003](https://github.com/bussard76/exxperts/issues/22#issuecomment-6767407003) and `~/controller-exxperts/CONTROLLER.md` (Front events and question or escalation). The issue's own level-1 assessment concerns lock metadata per series, not this recording task. No new decision or ADR is needed for recording these decisions.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Record the Node-floor decision | `docs/coordinator.md` test stages; `docs/dev-workflow.md` test guidance | Human comparison of baseline and each series | Both documents must retain the same smoke, same error, same Node 20.6 or 22, pinned upstream baseline `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, and complete comparable evidence. A matching failure counts as passed only for that series; its PR description must identify pre-existing upstream behavior. A candidate-only failure is a real defect. Unavailable, skipped, incomplete or incomparable evidence remains unresolved. This is not a general relaxation of gates or unrelated tests. |
| Record escalation and delivery | Existing Controller and Front process in both documents | Ticket and recorded decisions checked before escalation; existing Orca messaging and append-only log | Apply ticket abort criteria and Sascha's recorded decisions first; escalate only unsettled questions and state the decisions checked and why they do not fit. Every `NEEDS-SASCHA` or `BLOCKED` Front event must be logged and the same question or blocker sent immediately via native `orca orchestration send` to `term_6eae3083-5398-4d94-85e5-57a8f00d7065`. Preserve existing status and fallback requirements. |
| Consistent ownership and traceability | Coordinator handbook and human workflow | Same signed implementation commit | Attribute both decisions to Sascha, 2026-11-10, and update both documents together. No production data, external writes, or implementation of messaging are in scope. |
| Outside-in and parallel interfaces | Existing operational documents, no new product feature or producer/consumer implementation | Existing human operational process | UI drafts, feature interfaces and logic diagram are not applicable to this documentation-only recording; no new shared implementation interface or parallel producer/consumer is specified, so an integration test is not applicable. Independent review and integration follow. |

## Prefactoring

None. The existing test-stage and Front/Controller process sections are the appropriate places to record the decisions.

## Findings

1. **Spec completeness — change-spec:** the Controller spec has no `## Architecture impact` for the override. Its initial level-1 line and prohibition on new exports, stores and data flows refer to the superseded implementation framing, while issue #22's own impact concerns lockfile work. Add an explicit impact section for this documentation-only recording naming level 1, the two owning process documents, existing human and messaging seams, and that the already-decided operational behavior is being recorded rather than newly introduced. `docs/architect-protocol.md` explicitly requires `change-spec` for missing or ambiguous impact. Preserve the exact decisions and scope; no additional design is needed.

Reviewed by: Worker Architect, Codex, 2026-11-10.
