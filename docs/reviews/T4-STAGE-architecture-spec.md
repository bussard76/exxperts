# T4-STAGE compatibility architecture review

Verdict: pending
Reviewed commit: 59b08928499c2a91de41d5f9fa1656bc517fa316
Spec: `docs/specs/T4-PAYLOAD-R2.md` at `7c62e29a1466af1681b084133a1e7bd77b9c3e22`
Prior review: `docs/reviews/T4-PAYLOAD-R2-architecture-spec.md` at `91ab0a35ceeda50f2a44ed795ea4d06f49b67c91`

## Architecture impact

Level 1, documentation-only independent compatibility review of the existing desktop packaging/prune module. No implementation, exports, dependencies, routes, stores or product data flows change. The specialized review-only dispatch supersedes the generic Developer implementation/report steps; this is the sole findings file, as required by the read-only reviewer rule. No full gate or actual packaging is authorized.

## Checklist and plan

Issue #4 acceptance is retained, not certified by this staging review:

| Item | Result or observable acceptance | Review scope/status |
| --- | --- | --- |
| R1 | PDF/image/Word/Excel tabs beside Markdown | Product implementation and browser proof remain outside this review |
| R2 | Reactivation without duplicate tab; active tree marking | Product proof remains open |
| R3 | Close active tab to neighbour; last closes pane | Product proof remains open |
| R4 | Every Excel sheet; switching/scrolling; stored results; fills/fonts/borders/widths/number formats | Staging must retain dependencies; producer/browser proof remains open |
| R5 | Word text/tables/images and basic look | Staging must retain dependencies; producer/browser proof remains open |
| R6 | Read-only, no editing/saving/downloading controls | Product proof remains open |
| O1 | Build/smokes including workspace-file-preview and workspace-file-tabs-ui | Independent Tester/wave; explicitly not run here |
| O2 | Invented styled two-sheet/cached-formula workbook and styled Word/image fixtures | Genuine producer proof remains separate from mock packaging fixtures |
| O3 | Display cached formula result, not formula | Product proof remains open |
| O4 | Sascha checks real Excel/Word appearance, sheet switching and tab return | Sascha only; no worker access to real files |

Review deliverables, in order; commit and push completed slices:

- [x] Read repository/worker rules, issue #4, skills and frozen target identifiers; establish a clean branch from fetched origin/main.
- [ ] Trace actual extraction, platform support, prune callers and public tests; define trusted physical stage and stable identity with precise race limitations and adversarial checks.
- [ ] Specify coverage-preserving, test-first fixture migration and the exact approval needed to correct existing tests; distinguish mock provenance from unresolved real notices/artifact proof.
- [ ] Record bounded algorithm, architecture scope, risks, verdict and item-by-item self-review; reconcile current origin/main, run appropriate documentation checks, commit and push.

Assumptions: review-only instructions control; existing synchronous public prune is the agreed seam; isolated invented fixtures only; no real service, opener, browser, release or packaging run. No notices are invented or accepted by this review.
