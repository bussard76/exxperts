# T22-BUFFERS-DECISION architecture spec

Verdict: pass

Spec: dispatched task and Controller scope in the worker prompt, reviewed against repository base `cad3d431cd93015c7ac1d178fcb86ef483f41d9a` and [issue #22 comment 6768017405](https://github.com/bussard76/exxperts/issues/22#issuecomment-6768017405).

Level: 1, confirmed. This records a direct decision in existing Controller/process documentation; it changes no product code, dependency implementation, route, module, interface or data flow. No ADR is required.

Decision: Sascha, 2026-11-10, in the linked comment, superseding both previous buffers decisions. Upstream decides whether to accept the contribution; this task does not decide legal sufficiency or authorize an upstream write.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Decision and candidate | Existing Controller process documentation, `docs/coordinator.md` and `docs/dev-workflow.md` | Human-readable record of an existing decision | Record together that the prerelease trial and alternatives and licence-source research stop; Series 1 retains stable `exceljs@4.4.0` and `exceljs → unzipper → binary → buffers@0.1.1` on the `cc36c88` line with the PPTX fix. The candidate lockfile confirms the named versions and chain. |
| Disclosure and ownership | Same documents; Series 1 PR description consumed by upstream | Sascha's decision specifies the disclosure; upstream decides acceptance | Both documents must require the Series 1 PR description to state that `buffers@0.1.1` has no licence field in registry metadata. Do not claim legal sufficiency or imply permission to contribute. |
| History and existing requirements | Coordinator decision history and workflow summary | Preserve historical decisions and current process | Explicitly mark the previous buffers choice superseded wherever present; retain superseded history in the coordinator and remove superseded operative rules from the workflow. At this base neither document contains a buffers-specific prior choice. Preserve Node comparison, security, integrity, artifact, test and review requirements. The general priority for licences must not be read as resuming buffers research. |
| States, privacy and ownership | Existing documentation and Controller ownership | No new runtime states, personal data or operational seam | Missing or incomparable Node evidence remains unresolved; series-only failures remain defects. No real data, installs, tests, actual contribution or EXXETA write is authorized by this task. |
| Outside-in and parallel work | Existing process documents | No new feature or shared product interface | Feature design exports, interface fields, logic diagram and real producer/consumer integration test do not apply to recording this decision. Both documents must be updated together; independent review remains required. |

## Prefactoring

None. The existing decision history and workflow summary own these records.

## Findings

No design-relevant findings. The Developer should retain all conditions in the checklist in both documents, including the supersession and the existing gate requirements, and avoid turning the registry metadata observation into a legal conclusion.

Reviewed by: Worker Architect, Codex, 2026-11-10.
