# TFRONT-SERVER review, round 1

Verdict: pass
Reviewed commit: 01e384968da5c6daf08d09034b2ccfd86ddcdb40
Gates: build and smokes not run: all three paths in the actual merge-base diff are Markdown, so the requested documentation-only exemption applies; browser/API flows not applicable to this documentation-only task.
Ponytail: full diff reviewed; looks good. The change records a manual server Front pilot and aligns the human workflow guide. No executable logic or tests changed.

## Spec checklist

| # | Requirement | Evidence | Test / status |
|---|---|---|---|
| 1 | Server Front and Controller in the same Orca; dated Sascha pilot decision and source | `docs/coordinator.md:21`, `docs/dev-workflow.md:189` | Read against request and factory PR 36; pass |
| 2 | Front → Controller → Integration and workers, preserving role ownership | `docs/coordinator.md:15`, `:23`; `docs/dev-workflow.md:18`, `:35`, `:189` | Diagram, table and prose checked together; pass |
| 3 | Native sends both ways; inbox and status remain fallback and record | `docs/coordinator.md:25`; `docs/dev-workflow.md:189` | Text comparison; pass |
| 4 | Controller writes append-only, never-archived events for Front | `docs/coordinator.md:25`; `docs/dev-workflow.md:189` | Text comparison; pass |
| 5 | Mac-only task path, return by native messaging, waiting when off, no server-to-Mac pairing or private data transfer | `docs/coordinator.md:27`; `docs/dev-workflow.md:189` | Text comparison; pass |
| 6 | Manual pilot and unimplemented automation; empty log is not proof of delivery | `docs/coordinator.md:29`; `docs/dev-workflow.md:189` | Text comparison; pass |
| 7 | Location table and diagram agree with interface and roles | `docs/dev-workflow.md:18`, `:35`, `:157`, `:189` | Read in context; pass |
| 8 | Level 1; no implementation, new protocol, dependency, export or changed import | Full diff; `docs/reviews/TFRONT-SERVER-architecture-spec.md` | Documentation-only inspection; pass |
| 9 | No private operational content, real data, secrets or changes to real external systems | Full diff | Inspection; pass |

## Findings

None.

## Debt candidates

None.

## Verification and limits

Fetched `origin/main` at `3fe7bc75ad43199f9becde9ef85d99e876051b55` and the task branch at the reviewed SHA. A clean temporary branch from that SHA merged current `origin/main` without conflicts (already up to date). The full merge-base diff contains `docs/coordinator.md`, `docs/dev-workflow.md` and the prerequisite `docs/reviews/TFRONT-SERVER-architecture-spec.md`; the builder commit itself changes only the two requested process documents. `git diff --check` passed. The spec review is the only TFRONT-SERVER report present on the branch. Issue 20 concerns a different task; the dispatch and architecture spec define this review. Factory PR 36 and its pinned source were read without modifying that repository. No behavior or tests changed, so public-entry-point, test-failure, untrusted-rendering and load checks are not applicable; no live pilot, real data or external system was exercised. The expected load is the documented manual pilot.
