# T24-SUGGESTIONS-REVIEW-3 architecture spec

Verdict: change-spec
Spec: `docs/specs/T24-suggestions.md` at `c1b15ab1918a065bbf87b15edc1caa09f1a10d68`
Level: 3, confirmed: a server-owned model call and correlated room-socket delivery introduce a new data flow and protocol.
Decision: ADR-0009 records Sascha's accepted server-owned flow and Q01–Q14; the spec records his subsequent authorization of an internal answer ID. The observer ownership and integration evidence below need reconciliation with the existing room lifecycle before building; if that requires changing room ownership or its concurrency contract, obtain the required level-3 decision rather than assuming ADR-0009 authorizes it.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Answer identity and ordering | Interactive and background execution → room socket → composer | Fresh answer ID, live invalidation and completion, then matching suggestions | The revised spec fixes the two frame shapes, identity through retries and adoption, per-thread ordering, currentness and reconnect rules. It addresses the prior identity finding, subject to the observer seam in the finding below. |
| Trigger, model and privacy | Room execution → provider profile and isolated model call | Successful answer → same-provider `processes.absorb`, bounded text-only context | Three exchanges/4,000 JS units, 200 output tokens, 10-second deadline, cancellation, tool exclusion, no content logging or persistence, and silent errors are specified. The separate background path in `persistent-room-background-execution.ts` needs the same lifecycle. |
| Composer and empty states | Socket consumer → composer hint and keyboard | Valid current items → ghost text → explicit text insertion | Precedence, zero/one/multiple items, consumption, cyclic selection, IME, Escape and focus are specified, including the prior finding's acceptance sequence. |
| Authorized observers | Room socket, detached adoption and scheduler | Lifecycle and results → all eligible live current-thread consumers | The spec requires two live windows and an observing window during a background answer, but does not establish how those observers exist under current ownership; see finding 1. |
| Outside-in and slices | Spec diagram, fixture gallery and socket contracts | Fake model → real producer → real consumers | ADR-0009 records the approved design-export exception; the Mermaid flow and exact message fields match the spec. The fixture fake is required before UI work; ordered slices and a real-producer/real-consumer fake-model test are specified, but the observer setup must be buildable. |

## Prefactoring

None is justified before the observer ownership contract is resolved. Preserve the room lock and detached-turn ownership unless a change is explicitly decided; keep any necessary delivery seam as small as the resolved contract permits.

## Findings

1. **Design-relevant: the required observers and background test do not fit the existing room ownership seam.** The spec requires two authorized current-thread windows to observe the same interactive completion and requires a background completion to reach eligible observers. `room-socket.ts` sends turn frames to the current socket or its single detached adopter, not a registered set of same-thread observers; adoption displaces a prior claimant. `bin/lib/room-lock.cjs` gives a later web connection ownership by takeover, while `scheduled-prompt-background-execution.ts` defers a scheduled run when a web owner holds the room lock. Consequently the spec does not say how two real consumers remain eligible, or how a real observer is present for the background test without changing the existing lock/ownership rules. Define the observer registration, authorization, lifetime and interaction with lock takeover and scheduled execution, and a realizable real-producer/real-consumer test setup. Alternatively reconcile the acceptance scenarios with the existing ownership semantics under the relevant product decision. Do not silently relax the lock or substitute two mock consumers. If the chosen solution changes room ownership or concurrency, escalate for the level-3 decision.

Binding implementation precision after this finding is resolved: keep lifecycle and suggestion frames out of turn replay; ensure traces and error handling never record prompt or suggestion content; test excluded context and same-provider behavior with fake models. The pre-existing `package-lock.json` modification was left untouched. No test suite was run, as requested.
