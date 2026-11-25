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

The dispatch supplies that exact quote and the following accepted constraints:

- The server owns automatic suggestion generation after an answer, with no tools.
- Use only text of the last three exchanges: user prompts and assistant answers, about 4,000 characters maximum. Exclude tool results, attachments and files.
- Use one fixed, named small model per provider. Never switch providers; generate no suggestions if the room's provider has no configured eligible model.
- Errors and timeouts after 10 seconds are silent and keep the ordinary hint.
- Do not persist suggestions. Discard a result stale for a different answer, room or thread.
- Preserve issue #24's grey ghost text, Tab/Shift+Tab cycling and Right Arrow acceptance. Acceptance inserts ordinary composer text without sending; typing hides the suggestion; suggestions never trigger tools, connectors or actions.

These are the accepted architecture and limits. The exact model IDs, context encoding, completion semantics, transport fields, resource policy and interaction details are not implied by approval of option A. They remain binding questions in [the implementation spec](../specs/T24-suggestions.md), marked `NEEDS-SASCHA`; recommendations there are not decisions.

## Consequences

The server gains responsibility for the bounded post-answer provider call, validation and correlation. The UI receives plain text for an explicitly accepted composer action. Conversation text leaves the room for an additional call to the same provider, with additional latency, usage and potential cost; staying with the same provider does not establish its retention or logging policy. Suggestion generation cannot execute tools or read extra room content.

No eligible configured model, a silent error or a 10-second timeout leaves the ordinary hint. Suggestions are ephemeral, so durable replay cannot be assumed. Correlation must prevent an old result from appearing for a different room, thread or answer. Exact in-memory lifetime, reconnect behavior and multi-window delivery remain undecided.

The existing isolated worker, room model catalog and composer hint logic are candidate seams, not a mandate for a new module or refactoring. No new dependency, route, wire schema, provider/model table, logging/accounting policy or UI precedence has been approved here. No product code or design export accompanies this ADR. Implementation is blocked until the spec's binding questions and outside-in evidence are resolved and the required review permits the build.

## Slicing

1. Record this ADR, the blocked implementation spec and the issue report as documentation only. Check the quote, metadata, accepted constraints and coverage of every review gap.
2. Obtain Sascha's answers and the signed-off outside-in artifacts; update the spec with exact producer/consumer fields and observable checks, then obtain the required architecture spec review. This is a prerequisite, not permission to implement from recommendations.
3. Implement the accepted server producer and UI consumer under the level-3 design, with public-entry-point tests using invented data and a fake model source. A test through the real producer and consumer must cover their shared contract; separate fakes alone are insufficient. Independent review and level-3 conformance precede integration.
