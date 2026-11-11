# T20 — room-labelled recovery strip draft

Status: **DRAFT**, authored 2026-11-11 under Q1=A. No additional human sign-off is claimed. The original clickable UI basis `5533f71d4813f0b683ff49003e35ebe259b8bdab` was approved by Sascha on 2026-11-11; this strip draft supplements its missing concrete room label. Anything beyond this bounded draft returns through Controller to Front.

Invented room: **Cedar Studio**. Chat retains its navigation, transcript and composer. The detached host contains the workspace tree, tabs, previews and one Markdown editor. The child title is `Cedar Studio · Documents`. A compact strip remains reachable in chat, including when the child is obscured or off screen:

```text
Cedar Studio · Documents in another window     [Show documents] [Return]
```

| Session state | Strip/controls in chat | Behavior |
| --- | --- | --- |
| Attached, including no tabs | Original approved Detach affordance; no detached recovery strip | Detach opens one child containing the tree and existing empty state. No file selection is required. No workspace/denied workspace retains its existing message; it cannot create access. |
| Opening | `Cedar Studio · Opening documents…`; Show documents and Return unavailable until bootstrap settles | Keep attached session authoritative. Duplicate Detach is busy. Failure within 10 seconds returns to attached and uses the existing inline error presentation; no lost draft, second host or new modal. |
| Detached, reachable | Label and both controls as above | Show documents focuses the verified current child without creating another. Return moves this same session back with exact draft/conflict/tab state and then closes the empty child. |
| Child obscured/off screen/focus refused | Same room label and controls; no new picker/banner | Show documents uses desktop visible-bounds recovery and focus, browser focus best effort. Return works entirely from chat, without access to child controls. Focus refusal alone does not authorize another writer. |
| Returning | `Cedar Studio · Returning documents…`; controls busy | Preserve volatile state and fence child input. One transfer; no automatic save, discard or normalization. Show/Detach cannot race it. |
| Recovering/child state unknown | `Cedar Studio · Documents unavailable`; Show documents and Return remain the recovery actions, busy only while their attempt runs | Show checks only the registered child. Return fences the owner-controlled writer or confirms destruction before rehosting. If neither is possible, remain recovering with the existing inline error presentation; do not spin indefinitely or create a replacement writer. |
| Child confirmed closed unexpectedly | Transient returning/recovering label, then attached | Restore the owner-retained session. Child × normally uses the Return path. Forced loss is documented under Q5=B, without durable-recovery promises. |
| Guarded room/chat exit pending | Preserve the old room label and reachability; session controls busy | Existing Save/Discard/Cancel is shown/focused in chat. Cancel retains both windows/context on the pre-commit normal path. Missing closure after commit retains chat with recovery; do not falsely promise both windows are still open. |
| Room/conversation left successfully | Strip removed after child-closed and context continuation | Never show Cedar Studio's strip or old path in the next room. Reopening requires explicit Detach. |

Show documents never opens an OS application or writes the clipboard. Return is session movement, not tab closure, and preserves unresolved conflict and unknown-save state. Tab × alone invokes the existing destructive close guard. Read-only and paired contexts keep their existing controls and server authorization. This draft adds no history, recovery store, window list, follow-room mode or UX beyond Q1.

Future evidence: T20 R1/R2/R3/R7/R9/R13/R14 through the actual chat controls, actual child, real editor and desktop geometry consumer. This document supplies no screenshots or runtime pass; later captures stay untracked under `.build/screenshots/`.
