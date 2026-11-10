# T22-RELEASE-C-DECISION review, round 1

Verdict: pass
Reviewed commit: 81041c12e5136bc73f329a33ccb6acaf99056b7b
Gates: documentation-only; no merge, test suites, full gate or browser checks, as explicitly directed. `git diff --check origin/main...81041c12` passed.
Ponytail: full fork diff reviewed; looks good. The change records a release process decision and adds no runtime behavior; runtime load is not applicable.

## Spec checklist

| Requirement | Evidence | Check | Status |
| --- | --- | --- | --- |
| Exact head, parent and scope | Commit `81041c12e5136bc73f329a33ccb6acaf99056b7b`, parent `5f5638e3354e6c6ad4428546c9e417d961a51f39` | One DCO-signed commit changes only `docs/coordinator.md` and `docs/dev-workflow.md`, together. | Pass |
| Option C and measurement | `docs/coordinator.md`, `docs/dev-workflow.md` | Both record the existing bundled shelf worker, unchanged 15,000 ceiling, complete real staged combined-candidate measurement, exclusive-worker proof using the import graph and existing unknown/dynamic-import checks, and actual count to Front before build-out. | Pass |
| Fit and over-limit paths | Both process documents | Both specify Series 1 ownership and folding the same fix into the combined state, preservation of checks and notices, the five requested release checks, and stopping and reporting the measured count if over limit; any smaller increase needs another Sascha decision. | Pass |
| Estimates, evidence and limits | Both process documents | 14,600 is an estimate; 18,028 and review `c9a145d` are historical. No threshold increase or package or runtime-contract deletion by assumption is authorized. | Pass |
| Preserve prior decisions | Parent-to-head diff | Existing licence, Windows and contribution-path decisions are unchanged. The independent review at `docs/reviews/T22-FINAL-DECISIONS-review-1.md` on `origin/agents/t22-final-decisions-review-1` passed for the parent. | Pass |
| Architecture and safety | Whole diff from `origin/main` | All three changed paths are Markdown, including the inherited report. Level 1: no product code, public export, dependency, interface or data flow changes; no secrets, real data, untrusted rendering or external operations introduced. | Pass |

Compared both decision records with the final section of `~/controller-exxperts/specs/series-controller-decisions.md`, external developer report `~/controller-exxperts/evidence/t22-release-c-decision-2026-11-10/report.md`, and issue 22 comment 6774520776. The issue's original lockfile task is superseded for this review by the explicit documentation-only scope. The GitHub issue-view command failed on GitHub's deprecated Projects API; the read-only issue and comment API returned the content.

The full fork diff has merge-base `289bb6976862e7a6252d05826c9f16dd7fde77fb` and also contains the parent decision report `docs/reports/issue-22.md`. No main merge was attempted, per the exact override. No product tests were added or run; public test seams and tests failing without the implementation do not apply to this decision transcription. The existing unrelated `package-lock.json` worktree modification was left untouched.

## Findings

None.

## Debt candidates

None identified. Native Mac build and human acceptance remain pending under the inherited decision.
