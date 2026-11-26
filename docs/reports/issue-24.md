# Issue #24: Suggestions decision and specification report

Date: 2026-11-26
Scope: accepted decisions reconciled; implementation awaits independent architecture spec review.

## Architecture impact

Level 3: server-owned automatic post-answer model generation and correlated room-socket delivery to the composer. ADR-0009 records the architecture decision; [the spec](../specs/T24-suggestions.md) now records Sascha's accepted Q01–Q14 answers.

## Checklist

- [x] Preserve accepted ADR-0009 Option A and its original source quote.
- [x] Reconcile Q01–Q14 from `/home/developer/controller-exxperts/t24-front-answers-2026-11-26.md`, confirmed by Sascha on 2026-11-26: “Ja, so übergeben”.
- [x] Specify trigger/deduplication; existing provider Memorize model; bounded plain-text context; logging, usage and output limits; deadline/cancellation; socket fields/lifetime; JSON validation; composer precedence and keys.
- [x] Record the approved exception to a dedicated design export, fixture-gallery fake requirement, Mermaid logic flow and exact socket interface.
- [x] Preserve Q14's order: Slice 1 server; Slice 2 UI after Q07 message format is fixed; Slice 3 real producer-to-consumer integration with fake model source.
- [ ] Obtain a fresh independent Architect spec review that passes before Slice 1 implementation.

## Decision and remaining step

Q01–Q14 are no longer open. No new provider, model table, cross-room delivery or data retention behavior is introduced. The precise next step is a fresh independent Worker Architect review of the reconciled level-3 spec; do not begin implementation until it passes. Afterward, start Slice 1 test-first, and hold Slice 2 until the Slice 1 Q07 format is fixed; Slice 3 follows both.

## Files changed

- `docs/specs/T24-suggestions.md`: replaces provisional questions with accepted contracts, Mermaid flow, outside-in evidence and ordered slice dependencies.
- `docs/adr/0009-server-owned-prompt-suggestions.md`: records the 2026-11-26 answer confirmation and implementation consequences without altering ADR-0009's accepted status/date/decider.
- `docs/reports/issue-24.md`: this decision/review checklist.

No product code or tests changed. The pre-existing `package-lock.json` change remains untouched and uncommitted.
