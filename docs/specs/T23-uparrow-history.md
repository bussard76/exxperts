# T23: Composer prompt history

Source: [issue #23](https://github.com/bussard76/exxperts/issues/23), Sascha's wish and checks, and the prior Architect review `docs/reviews/T23-UPARROW-architecture-spec.md` on `origin/agents/t23-uparrow-specreview`. This is a specification for future implementation, not a claim that recall already works.

## Architecture impact

Level 1: the existing web UI room transcript and composer are the affected module and internal component seam. There is no change to a public interface, data flow, persistence, module responsibility, route or dependency. Pass existing room transcript data within the UI; do not add a separate history store, API, export, persistence layer, dependency or cross-room history. No prefactoring is required. No new design artifact is required: the existing textarea remains the UI, with no new visual surface.

## Current data path and behavior

- In `apps/web-ui/src/App.tsx`, `items` is the open room's `ChatItem[]` transcript; `shownItems` derives from it via `withUnansweredApprovals` and is passed as `items` to `InRoomChatShellView`. `itemsRef` follows `items`. In `apps/web-ui/src/types.ts`, the `ChatItem` user variant has `kind: "user"`, `id: string`, `text: string`, optional `ts`, `attachments` and `steered`; identity is `id`, while the visible prompt is `text`.
- `InRoomChatShellViewProps.items` already receives the transcript in `apps/web-ui/src/components/in-room-chat.tsx`. `InRoomChatShellView` renders `ComposerInput`, passing composer props including `onSend`, `initialDraftValue`, `draftResetKey` and `mention`; it does not currently pass history or `items` to `ComposerInput`. Supply the existing current-room transcript data through this internal component path for recall.
- `App.tsx` `sendMessage` uses `text.trim()` as `payload`; it rejects an empty payload with no carried attachments. On acceptance it appends a user item with a new `id` and `text: payload` to `items` before sending the prompt frame. Attachment notes and pending handoffs are composed into `wireText`; the visible item and frame's `shown.text` contain only `payload`, with attachment chips separately in `attachments`. An attachment-only send therefore has empty visible `text`. Later transcript updates can change the entries: history follows the current transcript, not a separately maintained send log.
- Existing persistence supplies reload behavior: `savePersistentAgentThread` / `threadSaveBody` save room items, and `openPersistentAgentResume` fetches the thread, converts it with `threadRecordToLocalThread`, and sets `items` from `liveThread.items`. Recall after reload derives from those restored items, subject to the existing transcript's persistence behavior.
- `ComposerInput` owns editable `draft`; its textarea synchronizes caret and selection via `syncCaret`, and `pendingCaretRef` plus a layout effect restores the caret after programmatic edits. `handleComposerKeyDown` first returns for `nativeEvent.isComposing` or key code 229; the open mention popup then owns Up, Down, Enter, Tab and Escape. Existing overlay, approval, send and Escape-stop handling also remains in place. Composition state is tracked by the textarea's composition handlers. `draftResetKey` resets the draft and focus/caret according to existing rules.

## Recall source and code-derived precision

Derive history from the open room's existing transcript, in transcript order, selecting `kind: "user"` entries and their `text` only. Use the visible stored strings, never wire text, attachment notes, handoffs or another room's items. Newly accepted sends become eligible as the transcript updates; removed or replaced entries follow the current transcript. The following are code-derived deductions, not new Sascha decisions:

- The existing send path trims visible prompt text before creating its user item. Compare stored prompt strings by exact equality, after that existing trim; apply no additional case, whitespace or other normalization.
- Empty or whitespace-only attachment-free sends are rejected; attachment-only items have empty visible text and are not recall entries. Ignore empty visible prompt strings when deriving history.
- Compare consecutive eligible user prompts even when assistant, tool or other transcript entries occur between them. Collapse each consecutive run to one history entry; retain repeats separated by a different eligible prompt. For example, user `alpha`, assistant reply, user `alpha`, user `beta`, user `alpha` yields newest-first `alpha`, `beta`, `alpha`.

## Behavioral acceptance checks

These are future implementation checks using invented data; the existing send, mention and textarea behavior above remains in force.

1. With sent prompts `alpha`, `beta`, `gamma` in the open room, Up selects `gamma`, then `beta`, then `alpha`; further Up stays at `alpha`. Down selects `beta`, then `gamma`, then restores the exact draft saved immediately before browsing. Down outside browsing retains normal textarea behavior.
2. Escape while browsing restores that original draft and ends browsing. Recalled text is ordinary editable draft text with the caret at its end; recall alone does not send it. Sending still requires the existing send action.
3. Recall starts only with an empty composer or when the caret is on its first line (no newline before the caret). With a multiline draft and caret on line 2 or later, Up retains native caret movement and does not recall. With no eligible history, Up leaves the draft and native caret movement intact.
4. While the mention popup is open, its Up/Down navigation and Escape dismissal retain precedence over history. During IME composition, history does not intercept keys; existing composition guards remain effective. Preserve the existing overlay, approval, caret, selection and send behavior when history does not handle a key.
5. Switching rooms, including while browsing, cannot expose the previous room's prompts or saved browsing draft in the new room. Each room's recall comes only from its own current transcript.
6. After reload and reopening a room, prompts present in its restored transcript remain recallable. No independent history persistence is introduced.
7. Exact stored-string consecutive duplicates collapse across intervening non-user transcript entries, non-consecutive repeats remain, and attachment-only entries are excluded. A whitespace-only attachment-free send creates no history entry; attachment and handoff wire-only text never appears in recalled text.

## Review and implementation order

An independent Architect must review this revised spec before implementation. TDD and the repository's normal implementation and review checks apply to subsequent behavioral work. There are no additional recommendations or unrecorded product decisions in this spec.
