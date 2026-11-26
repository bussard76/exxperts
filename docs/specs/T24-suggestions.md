# T24-SUGGESTIONS: Next prompts in the composer

Status: accepted for implementation planning; fresh independent Architect spec review required before Slice 1
Date: 2026-11-26
Issue: [#24](https://github.com/bussard76/exxperts/issues/24)
Architecture decision: [ADR-0009](../adr/0009-server-owned-prompt-suggestions.md)
Decision answers: `/home/developer/controller-exxperts/t24-front-answers-2026-11-26.md`; Sascha confirmed 2026-11-26: “Ja, so übergeben”.
Prior review: `docs/reviews/T24-SUGGESTIONS-architecture-spec.md`, verdict `level-3`, commit `c1dcdc21ba4c54b35760c28059d9426a796e48e9`.

## Architecture impact

Level 3: server-owned post-answer model call and correlated delivery to the web composer. Candidate owners/seams are room turn execution (`apps/web-server/src/room-socket.ts`), existing provider model policy and isolated model execution, the room socket, and composer state (`apps/web-ui/src/App.tsx`, `composer-hint.ts`). These are orientation, not a mandate for a new module or broad refactoring. No new dependency is specified.

## Authority and accepted behavior

ADR-0009 is accepted. Sascha's source answer for Q01–Q14 is the answer file above and the confirmation “Ja, so übergeben” (2026-11-26). The following resolves the review's binding contract questions; the stated limits apply throughout.

### Trigger and model

- Run exactly one generation for each successfully finished answer: successful `agent_end`, with no error or stop. Do not run for stop, error, or retry intermediate states; a retry counts only at its successful end. For queued turns, generate only for the latest finished answer and cancel older running generation. Generate for background/disconnected turns, but deliver only while the result remains current. Deduplicate on `(roomId, threadId, answerId)`.
- Use the existing provider's configured Memorize model (`processes.absorb`) for the provider that produced the answer. Do not add a model table or switch providers. If there is no absorb model or that provider is not ready, generate no suggestions. Apply the same rule to gateway and custom providers.

### Context and privacy

- Send the last three completed exchanges, each consisting of a user prompt and final assistant answer, as plain text. The maximum is 4,000 JavaScript string-length units. Drop oldest exchanges first; if still over limit, truncate from the beginning of the oldest remaining text. Exclude tool calls and results, attachments, files, system prompts and reasoning.
- Never log prompt or suggestion content. Log metadata only: room ID, duration, result code and token counts. Do not add storage. Provider retention is the same as for ordinary room calls to that provider; user-facing docs must say so.
- Record tokens in the room's existing usage accounting under category `suggestions`. Limit to one call per answer and 200 output tokens; no additional monetary budget.

### Deadline and concurrency

- The 10-second deadline starts when the model call starts. Abort on a sent new user prompt, start of a new answer, or room deletion.
- Allow at most one active generation per room/thread; a new generation replaces the previous one. Other behavior follows the trigger and cancellation rules above.

### Producer-consumer message and lifetime

- Use the existing room socket. Emit message type `suggestions` with exactly `{ roomId, threadId, answerId, items }`, where `items` is an array of zero to three strings. Send only to clients in the same room under existing authorization.
- The client discards a message if its `answerId` is not the last answer in its current thread. Send to every window observing the room.
- Results exist only in memory and are not persisted. Switching rooms loses their suggestions; returning does not restore them. Reconnect and server restart show no suggestions until the next answer. Background/disconnected generation does not imply queuing or replaying delivery.

### Model response and validation

- Expect a JSON array of up to three strings. Trim each entry, replace line breaks with spaces, limit each to 200 characters, and discard empty or duplicate entries. Invalid or partial JSON produces zero suggestions silently. The UI renders strings as text only; no actions, tools or connectors run.

### Composer behavior

- Suggestions replace the ordinary placeholder only when no higher-priority system hint applies. Connection loss, an active answer, approval required, read-only or otherwise locked states take precedence. An open mention popup suppresses suggestions and owns Tab and Right Arrow.
- When the field is empty and at least two suggestions exist, Tab advances and Shift+Tab moves back cyclically. With zero or one suggestion, native Tab moves focus. Right Arrow accepts the shown suggestion only while the field is empty; acceptance inserts normal text without sending. The other suggestions remain cycleable while the field stays empty.
- Typing hides the ghost text; clearing the field restores the current suggestion. Sending a prompt, starting a new answer, or a generation error clears suggestions. Escape hides them until the next answer. During IME composition, do not handle these keys.
- Expose the suggestion using `aria-describedby` and the hint “Tab: weiter, →: übernehmen”.

## Outside-in evidence

Sascha approved an exception to a dedicated design export because the surface changes only the existing placeholder to grey text. Do not fabricate or claim a design export. The clickable fake is a fixture-gallery entry with a fake source. This spec's flow is the agreed logic diagram; the interface is the exact socket message above.

```mermaid
sequenceDiagram
    participant Turn as Room turn
    participant Server as Suggestion producer
    participant Model as Provider Memorize model
    participant Socket as Authorized room socket clients
    participant UI as Current thread composer
    Turn->>Server: successful agent_end (roomId, threadId, answerId)
    Server->>Server: dedupe and bound last 3 text exchanges
    Server->>Model: tool-less request, at most 200 output tokens, 10 s
    Model-->>Server: JSON array or error
    Server->>Server: validate; error becomes empty items
    Server-->>Socket: suggestions {roomId, threadId, answerId, items}
    Socket-->>UI: same-room authorized delivery
    UI->>UI: discard unless answerId is current thread's last answer
    UI->>UI: show eligible ghost text; accept only on Right Arrow
```

The fixture-gallery fake is required before UI implementation. Preserve invented data and a fake model source in tests; never call a paid model API in development or tests.

## Slices and dependencies

The decision answer's Q14 permits parallel slices only after the Q07 format is fixed. This task's accepted execution order is explicit:

1. **Slice 1 — server producer:** test-first; successful-answer trigger, model selection/call, parser and socket message, exercised with a fake model. The exact Q07 message contract above is fixed and is the interface for Slice 2. Do not change rooms outside the originating room.
2. **Slice 2 — UI consumer:** begin only after Slice 1 fixes the Q07 message format; implement display, keyboard behavior and precedence against the accepted contracts. Use the fixture-gallery fake.
3. **Slice 3 — integration evidence:** after both slices, test from the real producer through the real consumer using a fake model source. Separate fakes do not replace this test.

No implementation may begin until a fresh independent Worker Architect spec review passes this reconciled level-3 spec. After Slice 1, obtain required independent review/conformance before integration work as the coordinator directs. Preserve existing assertions; no product code has been changed by this specification update.
