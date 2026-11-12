# T20-C5-AMENDMENT architecture spec

Verdict: pass
Spec: `docs/specs/T20-HARDEN.md`, `docs/adr/0009-detached-document-window.md`, and `design/t20-detach-window/contracts.md` at `f7dee79c15c3b73e4be00beaf385e8ffd738c6b2`.
Level: 3, confirmed: the private cross-window native lifecycle contract changes. The owner and shell modules and their responsibilities remain those of accepted option A.
Decision: recorded in ADR-0009, C5 no-session option 1, `Decided by: Sascha (2026-11-12)`. No further product decision is required for this reconciliation.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Empty admission and isolation | `App.tsx` owner arbiter; private `window.__exxpertsDocuments.step` | Live owner confirms no selected or retained session, editor or registered child, constructs the empty correlation for the shell request and disposition, and reserves the existing single action before replying. Room/session admission stays fenced until terminal settlement. | C1 and C5 define the empty stamp, zero initial room generation, binding, exact fields and reservation. Existing `documentEndpointHasNoSession`, `nativePrepared`, and `markdownEditorPendingActionRef` show the relevant owner seam; the current unreserved `no-session` response must change. |
| Distinct identities and privacy | Owner and `apps/desktop/src/main.ts` private pull exchange | `NativeBinding` supplies native session and owner identity; empty stamp has no room/conversation fields and cannot match an active stamp. No document content, paths or secrets cross this exchange. | C1/C5 discriminate exact shapes and bind request, owner generation and disposition. Both endpoints must validate their respective shape rather than treating null status as a correlation. |
| Completion and abort | Shell native prevention and owner arbiter | Matching commit, shell-supplied explicit null child/context evidence, and matching completed precede the exact prevented continuation once; matching abort acknowledgement releases only that reservation. | C4/C5 specify the fields, ordering, one-use permit and fail-closed deadlines. The shell's `accept`/`poll` and owner's `step` already supply the exchange seam, although their existing no-session branches do not yet implement this amendment. |
| Replay, failures and concurrency | Both endpoint state machines | Exact envelope replay returns cached output with no repeated reservation or continuation. Other actions are busy while reserved; malformed, stale, unknown, missing and timed-out replies grant no authority. | C5 specifies bounded sequences and cached replay; C4 specifies abort acknowledgement and late-message handling. Owner currently caches the exact last envelope and shell retains a retry input. The actual room-entry paths must share the fence. |
| Evidence, dependencies and unchanged scope | T20-HARDEN and `design/t20-detach-window/logic.md` | Existing owner/host and C4 work precede the native integration; actual owner and shell endpoints are the producer and consumer. Logic diagram's guarded prepare/commit/no-child sequence is consistent with the more precise register. | The amendment requires failing actual-endpoint ordering, replay and timeout tests before implementation; R3–R8/R15 retain the existing integration evidence. C7-B, Q5 exceptions, registration, privacy and all other C5 rules remain in force. No concurrent implementation split is specified; any later split must use the frozen C5 fields and an actual producer/consumer test. |

## Prefactoring

None is required by the architecture. Extend the existing private arbiter and endpoint state machines at their current seams; no new module, route, dependency, store or second owner is authorized.

## Findings

No design-relevant gap prevents implementation. The following precision instructions bind the Developer:

1. Fence every route that can admit a room or retained document session, including asynchronous entry already in flight, from reservation until matching abort acknowledgement or committed completion settlement. Revalidate at the point of admission; a disabled control alone is insufficient. Keep the reservation after `completed` until matching `native-completed` or disposal after the committed native continuation, as C5 specifies.
2. Validate the exact empty correlation and binding at both ends, including request ID, disposition, generation values and absence of active-only fields. `NativeStatus.stamp` remains null for the empty case; do not compare an empty stamp to an active status stamp or synthesize a room context. The shell supplies `child-closed` with `child:null`, `transfer:null`, `context:null` and the reserved host generation only after the matching commit, based on its actual lack of a registered child.
3. If a preparation response is lost or late, replay only the identical envelope under the bounded exchange rules to recover its cached result; a timed-out preparation cannot become permission. When the exact correlation is known, abort that attempt and await its acknowledgement. If it cannot be recovered or acknowledged, retain prevention and the reservation; a late acknowledgement can release that attempt only and cannot execute the native action. Never infer no child, completion or consent from timeout or receipt acknowledgement.
4. Add failing tests through the real owner and shell endpoints before implementation: attempt room entry between no-session reply and settlement; verify commit → explicit no-child → completed → one exact continuation, exact replay without repeated effects, matching abort and late acknowledgement, malformed/stale/wrong-disposition and active/empty substitution, and lost/timeout/unknown replies. Use controlled local test environments and preserve existing C5/C7-B tests and native evidence requirements.

This is a pre-build specification review, not implementation, test, native support or conformance evidence. No test suites were run.
