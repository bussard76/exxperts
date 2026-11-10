# T22 final decisions report

## Architecture impact

Level 1: process documentation only; no product modules, interfaces, dependencies or data flows change.

## Checklist

- [x] Record the platform decision in both process documents: Linux verified; Mac native build and human acceptance only after completion; no native Windows host or check; existing tests cover Windows paths.
- [x] Record the superseding licence decision in both documents: omit buffers and ExcelJS prefix-version disclosures from PR notes; ship direct packages' supplied LICENSE/NOTICE texts; no separate transitive licence work; preserve upstream notices and existing tests/checks.
- [x] Record the final upstream path check in both documents: exclude reports, reviews, specs, ADRs and factory files; preserve the Series 2 `a9d1b8b` report fork-side and remove it from the final contribution.
- [x] Cite issue 22 comments 6771263421 and 6771317883, retain superseded history in the coordinator handbook, and avoid claiming Mac verification.
- [ ] Self-review all task instructions and record checks, changed files, tests, assumptions and debt candidates; merge `origin/main` and push the final signed branch.
