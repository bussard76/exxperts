# T22 final decisions report

## Architecture impact

Level 1: process documentation only; no product modules, interfaces, dependencies or data flows change.

## Checklist

- [x] Record the platform decision in both process documents: Linux verified; Mac native build and human acceptance only after completion; no native Windows host or check; existing tests cover Windows paths.
- [x] Record the superseding licence decision in both documents: omit buffers and ExcelJS prefix-version disclosures from PR notes; ship direct packages' supplied LICENSE/NOTICE texts; no separate transitive licence work; preserve upstream notices and existing tests/checks.
- [x] Record the final upstream path check in both documents: exclude reports, reviews, specs, ADRs and factory files; preserve the Series 2 `a9d1b8b` report fork-side and remove it from the final contribution.
- [x] Cite issue 22 comments 6771263421 and 6771317883, retain superseded history in the coordinator handbook, and avoid claiming Mac verification.
- [x] Self-review all task instructions and record checks, changed files, tests, assumptions and debt candidates; merge `origin/main` and push the final signed branch.

## Self-review and checks

- Platform decision: compared both documents against issue comment 6771263421; native Mac remains pending and Windows has no native check.
- Licence decision: compared both documents against issue comment 6771317883; direct notices, no separate transitive work, preserved checks and superseded disclosures are explicit.
- Contribution paths: compared both documents against issue comment 6771317883 and the Front order; the fork report and final-tree exclusion are explicit.
- Scope and history: reviewed the complete diff against `origin/main`; only the two process documents and this report changed, and the earlier coordinator decision is marked superseded. No product, dependency, protected-file or capacity change.
- Checks: `git diff --check origin/main` passed; manual source-to-document comparison is the acceptance check for each item. No tests added or product suites run for documentation-only work; the active commit hook reports static checks skipped. No screenshots.
- Assumptions: Linux verification is stated as directed; Mac verification is conditional on its native build and human acceptance. Existing uncommitted `package-lock.json` noise is preserved and excluded.
- Debt candidates: none identified. Separate Series 2 contribution cleanup and read-only Series 1 path check follow the coordinator's order.
