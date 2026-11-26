# ADR-0009: Server-owned prompt suggestions

Status: accepted
Date: 2026-11-25
Decided by: Sascha (2026-11-25), option A
Architecture impact: level 3 — server-owned post-answer model calls and a correlated delivery contract from room execution to the web composer

## Context

[Issue #24](https://github.com/bussard76/exxperts/issues/24) asks for up to three short next prompts as grey ghost text in the empty composer, with Tab/Shift+Tab cycling and Right Arrow acceptance. Sascha's issue decisions of 2026-11-25 require automatic generation after an answer with a small model of the room's provider.

The level-3 review, `docs/reviews/T24-SUGGESTIONS-architecture-spec.md` at `c1dcdc21ba4c54b35760c28059d9426a796e48e9` on `origin/agents/t24-suggestions-specreview`, found a new data flow and missing generation, model, privacy, delivery and composer contracts. It also found no T24 design export, interface definition or logic diagram. This ADR records the subsequent architecture decision; it does not claim those gaps are all resolved.

## Options

### A. Server owns generation (recommended in the review; accepted)

The server starts a bounded, tool-less call after an answer and delivers results associated with that room, thread and answer to the composer. Server ownership centralizes generation at the answer producer; duplicate, reconnect and multi-window policies still need explicit contracts.

### B. Client requests suggestions through the server

The client requests suggestions after an answer through a server endpoint, with server-side authorization and correlation. This would require client request ownership and duplicate handling across windows. It was not selected.

### C. Defer automatic suggestions

No new model call or delivery flow now. This would defer the requested automatic behavior. It was not selected.

## Decision

Sascha, 2026-11-25: “Ja, Option A mit diesen Vorgaben”.

The dispatch supplied that exact quote and the following accepted architecture constraints. Sascha confirmed the Q01–Q14 implementation contracts in `/home/developer/controller-exxperts/t24-front-answers-2026-11-26.md` with “Ja, so übergeben” on 2026-11-26; the reconciled details and staged dependencies are in the implementation spec.

- The server owns automatic suggestion generation after an answer, with no tools.
- Use only text of the last three exchanges: user prompts and assistant answers, about 4,000 characters maximum. Exclude tool results, attachments and files.
- Use one fixed, named small model per provider. Never switch providers; generate no suggestions if the room's provider has no configured eligible model.
- Errors and timeouts after 10 seconds are silent and keep the ordinary hint.
- Do not persist suggestions. Discard a result stale for a different answer, room or thread.
- Preserve issue #24's grey ghost text, Tab/Shift+Tab cycling and Right Arrow acceptance. Acceptance inserts ordinary composer text without sending; typing hides the suggestion; suggestions never trigger tools, connectors or actions.

### Reconciled amendment — recipient scope (2026-11-26)

Decided by: Sascha (2026-11-26), option A: “A: nur ins Fenster, das die Antwort führt”.

Keep the existing owner/adopter semantics. Suggestion lifecycle messages and suggestion results go only to the existing window that leads the answer. Do not add an observer channel or fan out to other same-room windows. The Q08 goal of suggestions for all windows and background answers is superseded: a background answer with no leading window produces no suggestions. This narrows the recipient scope; it does not change the server-owned generation decision, the Q07 payload, answer identity, or detached-adoption identity.

The accepted answer selects the provider's existing `processes.absorb` Memorize model, avoiding a new model table. It fixes context limits, usage/logging policy, cancellation, the `suggestions` room-socket message, ephemeral lifecycle, JSON parsing, composer precedence and keyboard behavior. The answers do not name literal provider model IDs: implementation must use the configured Memorize model for the provider that produced the answer and must not add a provider or model mapping.

## Consequences

The server gains responsibility for the bounded post-answer provider call, validation and correlation. The UI receives plain text for an explicitly accepted composer action. Conversation text leaves the room for an additional call to the same provider, with additional latency, usage and potential cost; staying with the same provider does not establish its retention or logging policy. Suggestion generation cannot execute tools or read extra room content.

No eligible configured Memorize model, a silent error or a 10-second timeout leaves the ordinary hint. Suggestions are ephemeral: room switches lose them, reconnect and restart do not restore them. Only the existing window leading an answer receives its suggestion lifecycle and current result; other windows receive no observer copy. A background answer without a leading window produces no suggestions. The answer fixes correlation fields and client-side last-answer validation.

The existing isolated worker, room model catalog and composer hint logic remain candidate seams, not a mandate for a new module or refactoring. No new dependency or route is specified. Sascha approved no dedicated design export because the UI change is limited to the existing placeholder's grey text; the fixture-gallery fake and Mermaid logic diagram are the outside-in artifacts. Implementation remains blocked pending a fresh independent Architect spec review.

## Slicing

1. Record this ADR, the blocked implementation spec and the issue report as documentation only. Check the quote, metadata, accepted constraints and coverage of every review gap.
2. Reconcile the accepted answers into the spec and obtain a fresh independent Architect spec review before implementation.
3. Slice 1 implements server trigger/model/parser/socket with a fake model. Slice 2 implements UI only after Slice 1 fixes the Q07 message format. Slice 3 tests the real producer through the real consumer with a fake model source. Preserve existing assertions; independent review and level-3 conformance apply before integration as required by the workflow.
