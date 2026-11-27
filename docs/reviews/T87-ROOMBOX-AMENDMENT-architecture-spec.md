# T87-ROOMBOX-AMENDMENT architecture spec

Verdict: pass
Spec: `docs/tasks/T87-REBASE.md` at `ba39775b9fe55b2d47075d250fb4783298946317`, compared with parent `3030cfa733e0f712193140fd6584ac7bcf061b0f`; connected product code at `b898e851813b4da0211e6a049e9537160391091f`.
Level: 2 confirmed. The amendment supplies the existing connection-owned box to the already specified guarded room-file flow through a private, ephemeral seam. It adds no public interface, durable store, permission, route or new module; it does not authorize a different protection flow. The four restored routes and dependencies remain level 2 as in R3. Escalate if implementation needs a new module, public contract, store, permission exception or different data flow.
Decision: Sascha's 2026-11-27 “Ja, dritten Baustein freigeben”, reported via Front, authorizes this third private binding. The R3 decisions and boundaries remain in force. The Controller must separately authorize level-2 implementation after this review; this pass does not authorize implementation, rebase or integration.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Owner and matching | `room-socket.ts`, private in-process binding consumed by `room-settings-routes.ts` and `persistent-room-workspace-tools.ts` | Validated room and conversation identify the unique current owner; the binding carries the owner's actual usable box, never authorization | Target `room-socket.ts` creates the Mac `RoomBox` in the connection closure and supplies it to workspace tools. Routes must independently validate room, conversation, policy and path; a different room or conversation cannot borrow a box. |
| Lifecycle and ambiguity | Connection ownership and box lifecycle | Register only a usable current owner; invalidate on close, identity change, disposal or ownership loss; a replacement has its own generation | Detached operation is permitted only while the original owner actually remains current. Reconnect/replacement and old owner cleanup must be owner-checked; multiple live owners fail closed rather than selecting one. Target detached-turn adoption and owner-checked releases in `room-live-sessions.ts` and `room-socket.ts` make this distinction material. |
| Refusal and races | Private binding plus guarded room-file seam | After folder wait acquire a generation, check before boxed work and before results; invalidate, cancel or discard on revocation, ambiguity or replacement | Missing, stale or non-unique required Mac bindings return 503 `box_failed`, without data, parser invocation or host-read fallback. Check the binding before handing a snapshot to a parser as well as before returning results. Target `inTheBox` runs on host when no box is supplied, so missing required bindings must be refused before that path; preserve its separately specified startup-failure rule. |
| Other paths and existing boundaries | Existing shared-server and non-Mac file paths; R3 listing, parser, UI and host-open seams | Retain their specified wait, fence and read behavior; the binding grants no new access | No new public interface, store, dependency, permission or route is authorized. R3's chosen-root, reauthorization, bounded snapshot, worker, open and format contracts continue unchanged. |
| Focused verification | Public routes and existing acceptance path | Invented fixtures and fake box dispatch only where observation requires it; real browser-to-box XLSX path remains required | Cover correct identity, missing/stale/removed/replaced/ambiguous bindings, cross-identity refusal, close and identity change, stale cleanup, detach/reconnect, multiple owners, and revocation/replacement during bounded read. Assert zero data and host reads on refusal; preserve policy and path checks. |
| Pins and delivery | Independent Architect review and Controller checkpoint | Pinned spec and target → review → separately authorized implementation | Read-only upstream refs on 2026-11-27 matched PR #87 head `5fcffe1036b2d6f867d6583b29822c4985d36fba` and main `b898e851813b4da0211e6a049e9537160391091f`; neither moved. The local source spec branch matched the reviewed SHA. Recheck product pins before implementation and stop if either moves. |

## Prefactoring

None required beyond the three explicitly authorized private seams. Keep binding ownership and invalidation local to the existing connection/file flow; do not add a public interface or durable store.

## Findings

No design-relevant finding. Binding Developer precisions:

1. Treat owner close as invalidation unless the detached turn still satisfies the spec's explicit original-owner exception; a reconnect or saved box reference alone does not establish ownership. Do not let cleanup of an older generation remove a replacement.
2. Recheck current unique generation after the wait, before boxed work, before invoking a parser on the snapshot, and immediately before returning any data. Discard an in-flight result on invalidation; do not pass a missing required box to `inTheBox` as an ordinary undefined box.
3. Preserve the separate implementation checkpoint and all R3 binding instructions, including real browser-to-box acceptance. This review establishes neither implementation correctness nor platform feasibility. No tests, installs, builds, gates or product changes were performed.
