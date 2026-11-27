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

## Slice 1 developer checklist

Architecture impact: level 3, server-owned generation and existing room socket; ADR-0009 and the passing fourth architecture review authorize the specified flow.

- [ ] Allocate a fresh answer ID per logical answer, preserving it across retries and detached adoption; publish ordered live invalidation and successful completion only to the leading socket, outside replay.
- [ ] Generate once only after a successful final answer with a leader; suppress failed, stopped, retry-intermediate and unled background answers, and cancel stale work on prompts, starts, deletion and replacement.
- [ ] Select the answering provider's configured absorb model, without provider substitution; use a tool-less fake-tested call with 200 output tokens and a 10-second deadline.
- [ ] Supply at most three completed text-only exchanges within 4,000 string units, excluding other content; account usage as suggestions and do not log content or persist results.
- [ ] Parse a JSON array into at most three trimmed, single-line, 200-character unique nonempty strings; handle invalid responses silently.
- [ ] Send exactly the Q07 payload to the same leading connection only after its live completion, while current; verify displaced owners, adoption, cancellation and no replay.
- [ ] Run targeted typechecks, affected suites and relevant browser specs through the attributed gate; merge current main and rerun affected suites.
- [ ] Complete item-by-item self-review, record tests, assumptions and debt, and push the branch.

Slice 2 UI and Slice 3 producer-to-consumer integration are excluded from this task. The pre-existing package-lock modification remains untouched.

## Developer progress and blocker (2026-11-27)

- Passing spec review: `T24-SUGGESTIONS-REVIEW-4-architecture-spec.md` at `62aed38`; Slice 1 remains incomplete.
- Added `apps/web-server/scripts/suggestions-producer-smoke.ts`: a fake-gateway, real-socket test for ordered invalidation and completion. It is intentionally red: the server sends no `answer_lifecycle` frame yet. No existing assertions were changed.
- `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` and the runtime package build passed. The first smoke attempt could not start before the runtime build; the second reached the server and failed waiting for the missing invalidation. No targeted typechecks or browser gates have been run.
- Blocker: the spec requires the last three *completed* exchanges even after a resumed conversation, excludes partial or failed answers and prohibits extra persistence. Existing `ChatItem` assistant records have no success/completion status, and `clearStaleStreamingMarks` clears stale streaming marks without distinguishing successful from interrupted answers. `buildPersistentRoomRestoredLiveThreadContext` also restores an unstructured, truncated excerpt, so the model session cannot reliably recover the missing completion status or complete original text from that excerpt. An old partial answer and a successful answer can therefore have indistinguishable saved transcript records. The spec does not define a fallback for this historical ambiguity, and guessing which text may be sent would change the approved privacy/context contract. Coordinator/Architect decision needed on how to handle historical exchanges whose completion cannot be established without new persistence; no producer implementation has been started.
- Files changed in this developer task: this report and the new smoke test. Assumption: the producer/socket seam explicitly specified by the task is the agreed test seam. Debt candidates: none assessed; the pre-existing `package-lock.json` modification remains untouched. Graph: no; the task did not request it, and direct source searches identified the relevant files.
