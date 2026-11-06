# GATE-PARALLEL review, round 1

Verdict: fail
Reviewed commit: 552dca3753885c58b7d12a0710aef398dcbb4235
Base: origin/main at 7fac9a1ffff5c4003728d759f0dbbf0d0808243e, an ancestor of the reviewed commit.
Gates: `git diff --check origin/main 552dca3753885c58b7d12a0710aef398dcbb4235` passed; targeted textual assertions passed. Full gates and product tests were explicitly exempted for this documentation-only review.
Ponytail: full diff reviewed; one required process instruction is missing.

What this change does: It updates both process documents to describe one full gate per host, parallel smokes, isolated reruns and the documentation-only exemption. It explains that the Controller must coordinate across separate gate pools.

## Spec checklist

| Requirement | Evidence | Status |
|---|---|---|
| Both process documents change together | `docs/coordinator.md:41`, `docs/dev-workflow.md:143`; changed-file list | Pass |
| One host-wide full gate; default parallel smokes | `docs/coordinator.md:41`, `docs/dev-workflow.md:143`; textual assertions | Pass |
| Rerun each failed smoke alone on the same commit and report both results | `docs/coordinator.md:43`, `docs/dev-workflow.md:143`; textual assertions | Pass |
| Documentation-only changes get no full gate | `docs/coordinator.md:44`, `docs/dev-workflow.md:143`; textual assertions | Pass |
| Explain higher-slot overlap, separate pools and Controller coordination | `docs/coordinator.md:42`, `docs/dev-workflow.md:145`; textual assertions | Pass |
| Controller enforces `GATE_SLOTS=1` on every full-gate caller | `docs/coordinator.md:41-45`, `docs/dev-workflow.md:143-145`; generic command omits it | Missing |
| No unrelated changes; level 1 | Full diff has only the two process documents; no code, exports, dependencies or data flow changed | Pass |

## Findings

### [major] Require one slot for every full-gate caller

- Where: `docs/coordinator.md:45` and `docs/dev-workflow.md:143`.
- Problem: The one-slot command is specific to the build and smokes, while the generic instruction uses `gate bash -c '<command>'` without `GATE_SLOTS=1`. A Controller following it for a full browser gate can use the normal higher slot setting, contrary to the explicit decision to enforce one slot on all full-gate callers. The separate host-wide coordination rule remains necessary because slots alone cannot serialize across pools.
- Violates: The 2026-11-06 full-gate concurrency decision in `~/controller-exxperts/decisions.md`.
- Fix: State in both process documents that the Controller enforces `GATE_SLOTS=1` on every full-gate caller, including browser gates, as well as coordinating across pools; update the generic invocation accordingly.
- Proving test: Targeted textual assertions verify both documents state the all-callers requirement and that the generic full-gate invocation sets one slot.

## Debt candidates

None.

Not checked: Full gates and product tests, as explicitly instructed for this documentation-only review.
