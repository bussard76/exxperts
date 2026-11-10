# T22-FINAL-DECISIONS review, round 1

Verdict: pass
Reviewed commit: 5f5638e3354e6c6ad4428546c9e417d961a51f39
Gates: documentation-only; full gate and product/browser tests not run as directed. `git diff --check` passed. This does not substitute for the Series 1 full gate or combined gate.
Ponytail: full diff reviewed; looks good. The change records final decisions and the contribution path evidence. It changes no runtime code; load is not applicable.

## Spec checklist

| Requirement | Evidence | Check | Status |
| --- | --- | --- | --- |
| Platform decisions, Windows waiver and pending Mac | `docs/coordinator.md` and `docs/dev-workflow.md` | Compared both to issue 22 comment 6771263421: Linux on workhorse, Mac only after native build and human acceptance, no native Windows check, existing Windows tests, final combined SHA to Front. | Pass |
| Superseding licence and disclosure decision | Both process documents | Compared both to comment 6771317883: omit both disclosures, ship direct package notices, no separate transitive work, preserve upstream notices and tests/checks. Earlier coordinator instruction is explicitly superseded. | Pass |
| Final contribution hygiene and preservation | Both process documents; `docs/reports/issue-22.md` | Checked forbidden paths and fork-side history against the pinned commits below. | Pass |
| Architecture and scope | All three changed paths are Markdown: `docs/coordinator.md`, `docs/dev-workflow.md`, `docs/reports/issue-22.md`. | Level 1; no public exports, dependencies, imports, product data flow, tests, or external-system operations changed. No secrets or real data in the diff; no untrusted rendered input introduced. | Pass |
| Self-review and evidence | `docs/reports/issue-22.md` | Compared the reviewed copy byte for byte with the specified archived worker report. | Pass |

## Independent tree checks

Fetched origin; current `origin/main` and the merge-base are both `289bb6976862e7a6252d05826c9f16dd7fde77fb`. Merging that main into a temporary branch at the reviewed head was already up to date and produced no conflicts; the temporary branch was removed. Contribution branches were not changed. The existing local `package-lock.json` modification was left untouched.

Against pinned baseline `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, independently applied the path patterns in `tools/exxeta-pr-guard.sh` plus `docs/specs/` to the net changed paths. Complete exact path lists are recorded in `docs/reports/issue-22.md` under the corresponding three headings; each list was compared programmatically with `git diff --name-only` and matched exactly.

- Original Series 2 `a9d1b8b9e28c09bab08fb89ac80426fedc941e29`: 43 paths; expected FAIL, sole forbidden path `docs/reports/issue-22.md`.
- Cleaned Series 2 `373bd35b5e4ebd29b350897f71fd199c089ad66b`: 42 paths; PASS, no forbidden paths. Its complete difference from the original is deletion of `docs/reports/issue-22.md`, so all product and lock trees are identical. The original report remains in the fork commit.
- Series 1 `7f90ed7f97e0c94dd1b2d44778ac9994bfc26c25`: 45 paths; PASS, no forbidden paths.

The path filter covers factory reports, reviews, specs, ADRs and the other factory paths listed in the guard. This check evaluates the pinned baseline directly; it does not run the guard's remote fetch or push anything.

## Findings

None.

## Debt candidates

None identified. No new behavior or tests were introduced, so public test seams and mutation checks do not apply to this documentation-only diff. Mac native build and human acceptance remain pending.
