# T22-NODE-PROCESS architecture spec, round 2

Verdict: pass

Spec: `~/controller-exxperts/specs/t22-node-process-dev.txt`, SHA-256 `ec044955b2e51214834a781d8364cec475a99ebeb5ef7c500f34231d0644fa2c` (outside the repository; no repository commit); repository base `b1e7d8ceac9616df3049c4c1b8e8d16ebcf29a5d`.

Level: 1, confirmed for recording the two already-made decisions in the two existing process documents. The added `## Architecture impact` identifies existing Controller ownership, the existing Orca and log seam, the two documents and the absence of new implementation, interfaces or flows. This resolves round 1; it does not classify or alter the underlying decisions.

Decision: Sascha, 2026-11-10, as recorded in [issue #22 comment 6767407003](https://github.com/bussard76/exxperts/issues/22#issuecomment-6767407003) and `~/controller-exxperts/CONTROLLER.md` (Front events and question or escalation). No new decision or ADR is needed to record these decisions.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Node-floor no-worse comparison | `docs/coordinator.md` and `docs/dev-workflow.md`; human review of series evidence | Compare each series against the pinned upstream baseline for the same smoke, error and Node version | Issue comment and override agree on Node 20.6 and 22, baseline `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, series-specific pass and disclosure in the applicable series PR description as pre-existing upstream behavior. Series-only failures remain real defects. Missing, skipped, incomplete or incomparable evidence remains unresolved. No general gate relaxation follows. |
| Pre-escalation and Front delivery | Existing Controller responsibility and existing native Orca / append-only log seam; both documents | Apply ticket abort criteria and recorded decisions before escalating; log and immediately send events | Controller handbook and override agree: escalate only unsettled questions, state which decisions were checked and why they do not fit; send each `NEEDS-SASCHA` or `BLOCKED` question or blocker immediately via native `orca orchestration send` to `term_6eae3083-5398-4d94-85e5-57a8f00d7065`, retaining the log line. Preserve existing status and fallback requirements. |
| Ownership and recording | Existing two process documents | Documentation-only, no product or operational implementation | Both documents must record both decisions in the same signed implementation commit and attribute them to Sascha, 2026-11-10. The spec excludes unrelated policy changes, real data and EXXETA writes. |
| Outside-in and parallel interfaces | Existing process documents | No new product feature, producer or consumer | Feature designs and logic diagrams, and a real producer/consumer integration test, do not apply to recording existing decisions. Independent review and documentation-only integration remain required. |

## Prefactoring

None. Existing test and Front/Controller process sections provide the recording locations.

## Findings

No design-relevant findings. Binding precision for the Developer: retain every condition in the checklist in **both** documents, preserve other existing gate and escalation rules, and do not extend the same-failure exception beyond the specified series comparison.

Reviewed by: Worker Architect, Codex, 2026-11-10.
