# T4-PAYLOAD-R2 — desktop staging specification

Status: draft for fresh independent specification review; no implementation authorization.
Date: 2026-11-06.

## Architecture impact

Level 1: revise documentation for one private, behavior-preserving transform inside the existing packaging module. No new dependency, parser, public export/option, route, store, process boundary or product data flow. The complete T4 feature remains level 3 under accepted ADR-0002/0003. `ARCHITECTURE.md` is absent.

## Scope and checklist

The specialized specification-only dispatch supersedes the generic implementation/report instructions. Only this file changes; `docs/reports/issue-4.md` remains the product Developer's report. Product acceptance below is preserved, not checked off by writing this specification.

| Issue item | Obligation retained | Future proving check | Status here |
| --- | --- | --- | --- |
| Result 1 | PDF/image/Word/Excel tabs beside Markdown | P1/P2/P3/P4, B1/B3/B4/B7 | Not implemented or accepted |
| Result 2 | Reactivation without duplication; active tree | B1/B2 | Not implemented or accepted |
| Result 3 | Close active to right neighbour, then left; last closes pane | B2 | Not implemented or accepted |
| Result 4 | Every Excel sheet, switching/scrolling, stored results, fills/fonts/borders/widths/number formats | P2/B3 with actual producer | Not implemented or accepted |
| Result 5 | Word text/tables/images and basic look | P3/B4 | Not implemented or accepted |
| Result 6 | Read-only controls; no editing/saving/downloading | B5 | Not implemented or accepted |
| Observable 1 | Full build/smokes, including workspace-file-preview and workspace-file-tabs-ui | Independent Tester/wave gates | Not run; historical source checks failed 2/57 |
| Observable 2 | Independently authored invented styled two-sheet/cached-formula workbook and styled Word/image fixture | P2/P3/B3/B4, literal expectations | Product proof open |
| Observable 3 | Formula result displayed, formula absent | P2/B3 | Product proof open |
| Observable 4 | Sascha's real files, appearance, sheet switching and tab return | H1, Sascha only | Human acceptance open |
| Added signed-off result | Eligible preview opens original through guarded local server action, fixed labels, hidden on paired/shared clients | O1–O4/B6; fake openers only | Product proof open |

Specification work checklist:

- [x] Freeze research, independent review, issue and Controller decision evidence.
- [ ] Correct F1 with exact desktop-only ownership, synchronous operation and graph preservation.
- [ ] Specify public bundle, retained entries/resources, complete attribution and target/count conditions.
- [ ] Name public test-first hooks, installed/pruned real-producer/browser/CLI and negative proofs.
- [ ] Self-review every binding instruction, reconcile current main, validate documentation, sign/commit/push and report SHA.

## Evidence and decision precedence

Research: `origin/agents/t4-payload-research`, `docs/reviews/T4-PAYLOAD-research.md`, commit `1ad61128cf541b0460ef88536481e9f4c43ab8b8`. Independent review: `origin/agents/t4-payload-review`, `docs/reviews/T4-PAYLOAD-architecture-spec.md`, commit `eff68e577db9c1b8a585fdbd22e6db3da2822177`, verdict **change-spec**, F1 major. Inspected T4 research baseline: `c780e72d6361b692f5ab09d18cc6907b9b5ff0bf`; current main at start: `cc075a4d371bbdfea6cead35f515df6086f8df28`.

Controller decision, 2026-11-06, `~/controller-exxperts/decisions.md`, “T4 desktop package ownership direction”: select the review's staged-desktop-only correction, preserve the synchronous interface, exact identities, consumers/resources/notices/engine/platforms/lock and 2,500-file ceiling; no implementation/deletion until revised independent review passes. This is a Controller selection, not an additional Sascha decision.

All applicable R5 contracts and independent package, Node, Windows, CFB/BIFF/Unicode and payload-review conditions remain binding. This specification changes only artifact ownership for the proposed reduction. It does not resolve separate producer correctness questions or replace the complete feature specification.
