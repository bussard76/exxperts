# T24-SUGGESTIONS-R2 architecture spec

Verdict: change-spec
Spec: `docs/specs/T24-suggestions.md` at `3ba149a8707ca207f51208466e022e91049e96f6`
Level: 3, confirmed: a server-owned model call and correlated delivery introduce a new data flow and socket contract.
Decision: ADR-0009 records Sascha's accepted option A and the subsequent Q01–Q14 confirmation. No further level-3 decision is identified by this review; the spec needs to make that decision buildable.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Trigger, including background and detached turns | Room turn execution and background execution | Completed answer → suggestion producer | `room-socket.ts` subscribes to interactive session events; `persistent-room-background-execution.ts` has a separate execution and subscription path. Specify the common correlation and completion contract across both paths, including retries and queued turns. |
| Correlation and delivery | Producer → authorized room sockets → current thread composer | Ephemeral `{ roomId, threadId, answerId, items }` | The field names and cardinality are fixed, but `answerId` has no defined source or consumer-visible identity. See finding 1. Same-room delivery must reach all authorized observing windows without replay, including for background work. |
| Model, context and privacy | Provider model policy and isolated worker | Answering provider → bounded text-only call | Spec fixes `processes.absorb`, provider, readiness, 3 exchanges/4,000 JS units, 200 output tokens, timeout, cancellation, metadata-only logging, usage category and no persistence. Tests must exercise fake providers and ensure excluded content does not reach the call. |
| Empty, invalid, error and stale states | Producer parser and composer | Invalid/error → no visible suggestion; stale results discarded | Spec defines limits and silent errors, last-answer check and room/reconnect lifetime; the identity needed to make the last-answer check is missing (finding 1). |
| Composer interaction | Composer hint and keyboard handling | Ghost text → explicit text insertion | Priority, IME, Escape, focus and screen-reader behavior are specified. Acceptance consumption diverges from the accepted answer (finding 2). |
| Outside-in and slice evidence | Spec diagram, fixture gallery, socket interface | Fake source → producer → actual consumer | ADR-0009 records the approved design-export exception. Mermaid diagram and named fixture-gallery fake match the proposed flow; the fake is required before UI implementation, not claimed to exist. Slice dependencies and the real-producer-to-real-consumer test with fake model are explicit, but the interface needs finding 1 resolved first. |

## Prefactoring

None is justified before the correlation and lifecycle contract is fixed. Keep the existing turn, provider, socket and composer owners; any smallest necessary seam should follow the corrected spec rather than a speculative refactor.

## Findings

1. **Design-relevant: answer identity is not a shared interface yet.** The spec names `answerId` but does not define what it identifies, how the server derives it, or how every current-thread consumer learns the identical value before validating the message. `room-socket.ts` names items on keyed turn frames, while `assistant-stream.ts` also permits locally assigned IDs; an answer can comprise multiple parts. Background execution has a separate turn path. Consequently choosing an arbitrary server ID, turn ID, or last UI item ID can make valid results disappear or stale results be accepted, particularly across windows and background turns. Specify one stable identity and its publication/ordering for interactive, detached and background answers, plus how a consumer establishes the current answer and rejects messages after new prompts, room/thread switches and reconnect. Preserve Q07's exact payload or obtain a decision if another shared contract is needed. Require a real producer-to-consumer test covering identity across windows, stale/out-of-order delivery and the background path.

2. **Design-relevant: accepted suggestions are not specified as consumed.** Sascha's confirmed Q10 says the accepted suggestion is consumed and the others remain available when the field is empty. The spec instead says typing hides and clearing restores the current suggestion, and does not remove the accepted item. A developer following it could show and accept the same consumed suggestion again. Specify removal on Right Arrow, the next selected item, behavior with zero or one remaining, and tests for accepting then clearing the field. Keep the accepted native-Tab rule for fewer than two remaining suggestions.

Binding implementation precision once the spec is corrected: do not use turn replay for suggestion frames; send only to currently authorized same-room observers, and ensure no prompt/suggestion content leaks through worker error logging or traces. The `package-lock.json` modification present before this review was left untouched. No test suite was run, as requested.
