# T20-C4-C5-FRESHNESS architecture spec

Verdict: pass
Spec: `docs/adr/0009-detached-document-window.md` and `design/t20-detach-window/contracts.md` at `b59918f408835cc047a90b12a79643375784e6f6`; independent-review scope is the reconciled pre-prepare freshness amendment only.
Level: 3, confirmed: the ordering of the existing private shell-owner lifecycle protocol changes. No new public interface or channel is authorized.
Decision: recorded in ADR-0009, Sascha, 2026-11-16, option A. This pass is the independent spec review, not implementation or native acceptance.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Prevention and fresh sample | Desktop native adapter → existing private owner `step` | Synchronously prevent the native event; retain disposition and request ID; settle any already outstanding exchange, then initiate exactly one post-event `items: []` exchange. | ADR amendment and register §6 define ordering and existing bounded envelope; an in-flight poll is not the sample. |
| Validation and prepare | Desktop adapter → App owner | Validate envelope, sequence, session, binding and complete status; pass the returned stamp unchanged to `native-prepare`. Missing, invalid or timed-out status prevents Prepare and continuation. | Register §6 specifies exact envelope/status and C4 stamp; owner `App.tsx` compares all current stamp fields before admission. Freshness is not authorization. |
| Refusal and later event | App arbiter → desktop adapter | A refused/unknown Prepare is settled by matching abort and acknowledgement; no retry or continuation for that attempt. | Existing C4 deadlines and correlation remain binding; a separate later event uses a new request ID and sample. |
| Empty session | App arbiter and desktop adapter | A validated null status goes through the existing reserved, correlated C5 no-session path, including commit, explicit no-child evidence and completion. | Register §6 retains the reservation, replay and abort semantics. A session appearing before Prepare is invalidated, not accepted as no-session. |
| Privacy and ownership | Desktop adapter and chat-owned App | Existing origin-bound, bounded private exchange carries control/identity only; no draft, content or new channel/store/export. | ADR-0009 option A and C5 retain sole owner and existing validation. |
| Outside-in evidence and dependencies | `design/t20-detach-window/logic.md`, register, ADR | Existing lifecycle diagram remains compatible at its abstraction level; register adds the precise pre-Prepare step. | The amendment depends on the existing C4/C5 transport and no-session reservation; no parallel shared interface change is specified. Mac reports show refusal and abort, not the unrecorded stamp values or a native pass. |

## Prefactoring

None required by this amendment. Keep the change within the existing native adapter and owner protocol; do not introduce a new exported interface or change stale-stamp rejection.

## Findings

No design-relevant blocker within this review's scope. Binding precision for the Developer:

1. An empty-input exchange is status-only on the shell input; the existing owner may return legitimate queued control items alongside status. Validate and process those items under the existing protocol without treating a cached or pre-event response as the fresh sample, issuing a second sample, or letting them authorize the close.
2. Exercise the real shell producer and owner consumer through the already-authorized private injectable test hook: hold a pre-event exchange, change the owner stamp, prevent close, release the exchange, and prove one subsequent empty-input exchange supplies the exact stamp to one Prepare. Cover a stamp change after sampling as an invalidated refusal followed by matching abort-ack and no retry; a later explicit event must use a fresh request and sample. Also cover null/no-session reservation and missing, malformed, mismatched and timed-out status failing closed. Preserve existing assertions and use invented data.
3. Apply the existing single-outstanding exchange, sequence/replay and timeout rules while waiting; a late or invalid response cannot revive the attempt or authorize native continuation. Preserve the C5 reservation until matching settlement and do not treat status or abort-ack as an allow.

No test suite or native check was run in this documentation review. The independent Tester and later Mac evidence remain required.
