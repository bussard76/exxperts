# T23-UPARROW-R2 architecture spec

Verdict: change-spec
Spec: `docs/specs/T23-uparrow-history.md` at `c69a55083e8e9b8b3df0d28c1c2474230c0b3aec`; issue #23 read 2026-11-26.
Level: 1 confirmed for the specified UI-only implementation: the transcript and composer remain in the existing web UI module, with no changed public export, persistence, route, dependency, or inter-module contract.
Decision: no level-2 or level-3 decision is indicated. The required outside-in sign-offs below remain to be evidenced before build.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| History source and room ownership | `App.tsx` `items` → `shownItems` → `InRoomChatShellView` → private `ComposerInput` | Existing `ChatItem` user `text` from the current room; no separate store or cross-room source | Spec fixes filtering, transcript order, exact duplicate comparison, attachment-only exclusion and current transcript updates. Transferred consults have `kind: "consult"`; they are excluded. |
| Persistence and errors | Existing thread save/resume → `items` | Restored transcript is the source, with no new persistence or recovery path | Spec limits reload recall to entries present in the restored transcript; existing save/load failures retain their existing behavior. |
| Keyboard and state | `ComposerInput` textarea handler and existing draft/caret state | Mention and IME handling precede history; draft and cursor stay local to the composer | Spec defines empty history, first-line gating, bounds, Escape, editable text, room isolation and no send on recall. See binding instructions below. |
| Outside-in UI, interface and logic evidence | `design/<feature>/`, feature interface and logic sign-offs | Evidence must correspond to the described keyboard behavior and transcript-to-composer path | `docs/coordinator.md` requires Sascha's UI (design drafts and clickable fake), interface, and words plus Mermaid logic sign-offs for new features before build. The spec asserts no new visual surface, but neither it nor `design/` supplies the required sign-off evidence, a feature export, or a logic diagram. See finding 1. |
| Parallel implementation | Private composer seam | Existing `shownItems` is the producer; no parallel implementation or shared worker interface is specified | No parallel task split is asserted. If split later, fix the shared fields, dependencies and a real producer-to-consumer test in the task before dispatch. |

## Prefactoring

None is needed for the stated scope. Pass the existing transcript through the private composer path and keep navigation state there; do not introduce another storage or public seam.

## Findings

1. **Design-relevant — outside-in evidence missing.** This is new behavior, and `docs/coordinator.md` requires UI, interface and logic sign-off before building it. The existing textarea makes a new visual surface unnecessary, but does not itself establish the required signed-off drafts, clickable fake, interface and Mermaid logic evidence. Record the applicable signed-off evidence and its location, including a design export and logic diagram that match this spec, or obtain and record an authorized exception to that process. Reconcile any differences with the current-room-only decision before another review.

2. **Binding Developer precision:** Keep the original draft for the whole browsing session, including when a recalled entry is edited; clear browsing state when the composer is reset or a send is accepted, and ensure room changes cannot retain a prior room's browsing state. Respect the existing overlay and approval precedence as well as mention/IME handling. Exercise accepted send → transcript → composer recall, room switch and restored transcript → recall through real producer and consumer paths with invented data; cover Escape, edits, first-line gating, bounds and empty history. The implementation must not make a failed send erase the draft or start a new persistent history.

No functional defect is established for other cursor or transcript-update edge cases; they are not grounds to expand this task.
