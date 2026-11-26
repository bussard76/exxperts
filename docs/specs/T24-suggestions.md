# T24-SUGGESTIONS: Next prompts in the composer

Status: accepted for implementation planning; fresh independent Architect spec review required before Slice 1
Date: 2026-11-26
Issue: [#24](https://github.com/bussard76/exxperts/issues/24)
Architecture decision: [ADR-0009](../adr/0009-server-owned-prompt-suggestions.md)
Decision answers: `/home/developer/controller-exxperts/t24-front-answers-2026-11-26.md`; Sascha confirmed 2026-11-26: “Ja, so übergeben”. On 2026-11-26 Sascha additionally authorized the internal answer identity lifecycle: “Ja, interne Antwort-ID einführen”.
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
- The server creates a fresh, unique opaque internal `answerId` for each logical answer before its execution starts, scoped by room and thread. It belongs to the complete answer, including all assistant parts and tool steps, and stays the same across retries and detached adoption; a queued subsequent answer gets a different ID. Interactive, detached and background execution use this same lifecycle, not a turn ID or transcript item ID. Only a successful final completion makes that ID the current completed answer; failed, stopped and retry-intermediate attempts do not.
- For each room/thread, serialize lifecycle changes and delivery: publish invalidation when a new prompt is sent or an answer starts, then publish the successful completion and its `answerId` to every currently authorized window observing that thread before any `suggestions` message for it. Use an internal room-socket frame `{ type: "answer_lifecycle", roomId, threadId, phase: "invalidate" }` for invalidation and `{ type: "answer_lifecycle", roomId, threadId, phase: "complete", answerId }` for completion; these are separate from the unchanged Q07 payload. Enqueue these frames and suggestions in that order on each observer socket under the same per-thread serialization, so a result cannot overtake its completion or a later invalidation. Background execution publishes the same completion after its complete answer is available, even though it has a separate execution path; detached adoption retains the original ID. The producer checks currentness again at delivery, and sends only to currently authorized same-room observers, never through turn replay.
- A consumer records the live completion ID for its current room/thread before accepting a matching suggestion. The sending window clears immediately on sending a prompt; the ordered invalidation clears the recorded ID and suggestions in every observing window on a new prompt or answer start; switching room or thread, disconnecting, or reconnecting also clears both. A connection accepts only a completion observed live on that connection, not a replay or a completion from before reconnect; after reconnect or server restart there are no suggestions until a subsequent answer completes. Reject a suggestion unless room, thread and ID match the current live completion, so late results and results delivered out of order after a newer prompt, start or completion cannot revive older suggestions. Results exist only in memory, are not persisted or replayed, and background/disconnected generation does not imply queued delivery.

### Model response and validation

- Expect a JSON array of up to three strings. Trim each entry, replace line breaks with spaces, limit each to 200 characters, and discard empty or duplicate entries. Invalid or partial JSON produces zero suggestions silently. The UI renders strings as text only; no actions, tools or connectors run.

### Composer behavior

- Suggestions replace the ordinary placeholder only when no higher-priority system hint applies. Connection loss, an active answer, approval required, read-only or otherwise locked states take precedence. An open mention popup suppresses suggestions and owns Tab and Right Arrow.
- When the field is empty and at least two suggestions exist, Tab advances and Shift+Tab moves back cyclically. With zero or one suggestion, native Tab moves focus. Right Arrow accepts the shown suggestion only while the field is empty; acceptance inserts normal text without sending and removes that item from the available list. Select the item that followed it in the previous cyclic order, wrapping to the first remaining item when the accepted item was last. With one remaining it is selected; with none there is no selection and the ordinary placeholder applies. Remaining suggestions are cycleable only while the field is empty and at least two remain.
- Typing hides the ghost text; clearing the field restores the selected remaining suggestion, never a consumed item. Sending a prompt, starting a new answer, or a generation error clears suggestions. Escape hides them until the next answer. During IME composition, do not handle these keys.
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
    Turn->>Server: start logical answer (allocate answerId)
    Server-->>Socket: invalidate current answer
    Turn->>Server: successful final completion (roomId, threadId, answerId)
    Server-->>Socket: publish live completion and answerId
    Server->>Server: dedupe and bound last 3 text exchanges
    Server->>Model: tool-less request, at most 200 output tokens, 10 s
    Model-->>Server: JSON array or error
    Server->>Server: validate; error becomes empty items
    Server-->>Socket: suggestions {roomId, threadId, answerId, items}
    Socket-->>UI: same-room authorized delivery
    UI->>UI: record live completion; discard unless answerId matches current completion
    UI->>UI: show eligible ghost text; accept only on Right Arrow
```

Acceptance coverage for finding 1 must exercise the real producer through real consumers with a fake model: two authorized current-thread windows observe the same live completion ID before receiving the same Q07 result for an interactive answer with multiple parts and a retry; detached adoption retains that ID; and a background answer publishes its completion before its result to eligible observers. Delay an older result until after a newer prompt, answer start, and completion and prove it is rejected in each window; cover room/thread switches, reconnect, and no replay. Verify failed and stopped attempts do not publish successful completion and queued answers receive distinct IDs. Include a window that did not observe a completion live, and prove it cannot accept that answer's late result.

Acceptance coverage for finding 2: with `[A, B, C]` selected at `B`, Right Arrow inserts `B` and leaves `[A, C]` selected at `C`; clearing the composer shows `C`, Tab shows `A`, and `B` never returns. After cycling back to `C`, accepting last-selected `C` from `[A, C]` selects `A`; clearing shows `A` and Tab moves focus natively. Accepting `A` leaves no selection; clearing shows the ordinary placeholder and Tab moves focus natively. Also verify Shift+Tab cycles the remaining list when at least two remain, and typing and clearing without acceptance restores the current unconsumed selection.

The fixture-gallery fake is required before UI implementation. Preserve invented data and a fake model source in tests; never call a paid model API in development or tests.

## Slices and dependencies

The decision answer's Q14 permits parallel slices only after the Q07 format is fixed. This task's accepted execution order is explicit:

1. **Slice 1 — server producer:** test-first; successful-answer trigger, model selection/call, parser and socket message, exercised with a fake model. The exact Q07 message contract above is fixed and is the interface for Slice 2. Do not change rooms outside the originating room.
2. **Slice 2 — UI consumer:** begin only after Slice 1 fixes the Q07 message format; implement display, keyboard behavior and precedence against the accepted contracts. Use the fixture-gallery fake.
3. **Slice 3 — integration evidence:** after both slices, test from the real producer through the real consumer using a fake model source. Separate fakes do not replace this test.

No implementation may begin until a fresh independent Worker Architect spec review passes this reconciled level-3 spec. After Slice 1, obtain required independent review/conformance before integration work as the coordinator directs. Preserve existing assertions; no product code has been changed by this specification update.
