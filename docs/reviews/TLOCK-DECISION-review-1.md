# TLOCK-DECISION review, round 1

Verdict: pass
Reviewed commit: 02eaa9dba8fc65a4eb9de176bb0c2264b5a97375
Gates: skipped, documentation-only; browser/API not applicable to a decision record.
Ponytail: full diff reviewed; no functional defect found. See the process documentation debt below.

What this change does: It records Sascha's lockfile decision for future upstream series. Dependency-caused lockfile changes go with their series, unrelated install rewrites stay out, and the existing provenance and Node-floor blockers remain.

## Spec checklist

| Requirement | Evidence | Check | Status |
| --- | --- | --- | --- |
| No separate lockfile PR 0; dependency-caused deltas travel with their series | `docs/coordinator.md:144` | Read complete diff against `fb2ac7aaa5287659ea0da0ec306b60ab60126ac0` | Pass |
| Exclude unrelated npm rewrites | `docs/coordinator.md:144` | Read wording | Pass |
| Keep provenance, locked integrity and Node-floor blockers; infer no source or policy exception | `docs/coordinator.md:144` | Blockers stated unaffected; no exception added | Pass |
| Record decision and date | `docs/coordinator.md:142-144` | Quotation, attribution and date present; other details match the decision relayed in the assignment | Pass |
| Preserve existing upstream hold | `docs/coordinator.md:139-144`, `docs/dev-workflow.md:222` | Existing hold remains; decision describes future series | Pass |
| Documentation-only and architecture | Only `docs/coordinator.md` changes | No product module, API, dependency or data flow changes; level 1 | Pass |
| Companion workflow documentation | `docs/dev-workflow.md:216,262` | Decision absent although process decisions must appear in both documents | Omission; see debt |
| Data and outward effects | Entire diff | No fixtures, secrets, external calls or execution changes; escaping and public-entry-point tests do not apply | Pass |

## Findings

No functional findings under the assigned functional-only verdict rule.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| style | minor | `docs/dev-workflow.md:216,262` | Add the dated lockfile decision to this companion document in the same process-change commit, as its own rules require; verify both documents agree. |

## Merge and review notes

The temporary branch from the reviewed head merged current `origin/main` (`fb2ac7aaa5287659ea0da0ec306b60ab60126ac0`) without conflict; main was already its ancestor. The intended factory update `origin/agents/factory-update-resolved` at `4a1b9a6` conflicts at the appended decision section in `docs/coordinator.md`: retain both the lockfile and Mac Front decisions when resolving it. `docs/dev-workflow.md` merges cleanly but neither side records the lockfile decision there; the Controller should include both documents in the same process-change commit. This omission does not change the functional-only verdict.

The quoted sentence directly supports including dependency-caused lockfile changes in the associated PR; the no-PR-0 and unrelated-rewrite details were supplied in the assignment as the server Front's relay. No separate builder report for this decision was present on the reviewed branch. Issue #20 concerns a different window feature and is not the spec for this task. No full build or smoke gate was run because every path in the actual task diff is Markdown. No demo flow exists for this documentation-only decision; no real systems or data were accessed by the change. The pre-existing uncommitted `package-lock.json` modification in this worktree was left untouched.
