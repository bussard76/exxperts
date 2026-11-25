# T23-UPARROW-SPEC-REVISION architecture spec
Verdict: change-spec
Spec: `docs/specs/T23-uparrow-history.md` at 7b67da465040d3cf284571e122f54b32b57e5a8c; issue #23 read 2026-11-25.
Level: 1 confirmed for the specified transcript-only UI approach; the missing consult-prompt design must be classified once specified.
Decision: no level-2 decision or accepted level-3 ADR is needed for the specified approach. Resolve the finding before implementation; do not assume an additional store or change of scope is approved.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Sent prompts in this room | `App.tsx` transcript to `InRoomChatShellView` to `ComposerInput` | `shownItems` preserves user items and can supply `ChatItem` user `id` and `text` to the composer | Normal sends and steers appear as user items, but accepted composer consults do not. Specify how all issue-required sent prompts are represented and recalled, including reload, or obtain a scope decision. |
| Reload and room privacy | Existing thread save/resume and composer room reset | `threadSaveBody` saves items; resume converts the record and installs `liveThread.items` | Valid for persisted transcript items. Retain room-scoped browsing state and test the real producer-to-consumer path, including a room switch and reload. |
| Bounds, duplicates and empty history | Composer draft and history navigation | Select nonempty user `text` in transcript order, collapse consecutive eligible exact strings; clamp cursor and restore saved draft | The spec provides buildable checks for these cases; no new store is needed for ordinary transcript messages. |
| Keyboard and caret | `ComposerInput` textarea handler | Existing IME guard and mention popup precede normal handling; programmatic draft changes restore caret | The issue's Up/Down, first-line, editing and Escape requirements are specified. Preserve overlay and approval precedence as instructed below. |
| Visual design and outside-in evidence | Existing textarea | No new visual surface; `design/README.md` has no T23 export | The spec explicitly retains the existing UI. No new visual design is needed. The prose and acceptance examples specify the internal data flow and logic; no separate interface or logic diagram exists. No parallel implementation dependency is specified. |

## Prefactoring

None is needed for the specified ordinary-message path. Reassess after the consult-prompt requirement is resolved; do not preemptively introduce a new module or persistence store.

## Prior findings

- **Transcript source and eligible prompts: not fully resolved.** The revision identifies `App.tsx` `items`, `shownItems`, `ChatItem.kind`, `id`, and `text`, the internal consumer path, accepted normal sends, restored items, and exclusion of attachment-only entries. These source claims match the code for normal sends. However, filtering only `kind: "user"` misses accepted `@` consults sent from the same composer, as detailed below. The original finding explicitly required identifying which user messages are prompts eligible for recall; the stated filter does not cover the issue's sent-prompt requirement.
- **Draft, caret, keyboard and duplicate precision: resolved.** The revision specifies original draft restoration, editable text and end caret, first-line gating, IME and mention priority, exact stored-string equality and exclusion of empty text. `sendMessage` trims and rejects empty attachment-free sends, and its visible `shown.text` excludes wire-only notes. Steered and restored user items can also supply text; the rule compares their stored text exactly rather than assuming every historical source passed through `sendMessage`.
- **Visual design: resolved.** The revision records that the existing textarea remains and no new design artifact is needed.
- **Level and prefactoring: resolved for the proposed transcript-only scope.** No new public export, dependency, route, module or external data flow is specified. ADR-0008 confirms that a file alone would not create a new module.

## Findings

1. **Design-relevant — accepted composer consult prompts are omitted.** `ComposerInput.submitDraft` routes a leading known-room mention through `mention.onConsultRequest` and clears the draft when accepted, without calling `onSend`. `App.tsx` `requestConsult`/`handleConsultRequest` dispatch the consult rather than appending a `kind: "user"` item. A later transferred item is `kind: "consult"` and exists only if the user transfers a completed stack; it is not an ordered record of all accepted composer sends. Thus, for example, after sending `@room question`, Up cannot recall that prompt under the revision's filter, although #23 asks for previous prompts sent from the composer, including after reload. Revise the spec to cover this path and its ordering, exact recalled text, lifetime, room isolation and reload behavior using a real producer-to-consumer acceptance check, or obtain a product decision explicitly narrowing the issue. Classify any new persistence, contract or data flow before building.

## Binding precision for the Developer after the design finding is resolved

- Keep the first pre-browsing draft intact through navigation and Escape; reset navigation on a room/draft reset and after an accepted send so stale state cannot leak. Existing mention and IME handling take precedence. Preserve the existing overlay and approval handling when history does not handle a key, and consume Escape used to restore a browsing draft so it does not also stop an answer.
- Verify the feature through the real room transcript producer and composer consumer, not just a fabricated history array: include normal send, room switch, restored thread, duplicate filtering, attachment-only text, and keyboard cases using invented data. No test suites were run in this documentation review.
