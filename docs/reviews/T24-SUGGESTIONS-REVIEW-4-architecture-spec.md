# T24-SUGGESTIONS-REVIEW-4 architecture spec

Verdict: pass
Spec: `docs/specs/T24-suggestions.md` at `ec68c512855669eaa6d7b9374f65fc65b8cd4ff1`
Level: 3, confirmed: server-owned model generation and correlated room-socket delivery add a data flow and protocol.
Decision: ADR-0009 records Sascha's accepted server-owned flow and the 2026-11-26 recipient-scope amendment. The review is limited to that amendment and its direct interaction with prior findings.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence |
| --- | --- | --- | --- |
| Recipient and ownership | Room turn execution and its existing owner/adopter socket | Completion and result reach only the window leading the answer; no observer channel | `room-socket.ts` routes watched turn traffic to the original socket or the detached adopter, and claims displace earlier claimants. The amendment preserves those semantics and rechecks ownership and currentness at delivery. |
| Detached and background answers | Room turn execution and background execution | Adoption retains the answer ID; an answer without a leading window causes no generation or delivery | The spec and ADR-0009 expressly supersede Q08's all-window/background goal. The real-producer/consumer acceptance case requires adoption and separately verifies no generation or frames for a background answer without a leader. |
| Correlation and lifecycle | Producer → leading socket → composer | Ordered invalidate, live complete with answer ID, then matching suggestions | The exact lifecycle frame fields and Q07 `{ roomId, threadId, answerId, items }` remain fixed. The consumer accepts only a live matching completion and clears on navigation or reconnect; frames are not replayed. |
| Privacy and failure | Producer → same-provider model → leading composer | Bounded text-only context, ephemeral text results | The amendment does not alter the existing context exclusions, model selection, deadline, silent failure, no content logging or persistence. |
| Outside-in evidence and slices | Spec flow, fixture gallery and producer/consumer seam | Fake model → real producer → real leading consumer | The Mermaid flow names the leading socket, and ADR-0009 records the design-export exception. The spec fixes both frame shapes, requires the fixture fake before UI work, orders Slice 2 after the producer contract and Slice 3 after both, and requires a real producer-to-consumer test. |

## Prefactoring

None required by the amendment. Preserve the existing room lock and adoption rules; do not introduce an observer registry or fan-out.

## Findings

REVIEW-3's observer ownership objection is resolved by Sascha's recorded narrower decision: the spec no longer requires two simultaneous eligible observers or delivery to an unled background answer. The proposed single leading-window seam fits the existing ownership and adoption mechanism without changing the room's concurrency contract. No design-relevant gap or new level-3 decision is identified within this round's scope.

Binding implementation precision: a displaced or disconnected former owner is not a second recipient; verify its lack of lifecycle and suggestion frames using the real ownership/takeover behavior, without inventing a simultaneous observer. If ownership changes after completion, deliver only when the same window that observed that completion still leads; otherwise discard the result. Keep lifecycle and suggestion frames out of turn replay, and ensure traces and errors do not record prompt or suggestion content, as required by REVIEW-3.

No tests or gates were run, as directed. The pre-existing `package-lock.json` modification was left untouched.
