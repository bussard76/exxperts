# T23-UPARROW architecture spec
Verdict: change-spec
Spec: GitHub issue #23, “Composer: Up arrow recalls previous prompts” (read 2026-11-25); no separate design/spec revision supplied.
Level: 1 is confirmed for a composer-only UI change with no public export or new dependency.
Decision: none; no Sascha decision is needed if history is derived from the existing room transcript.

## Fit checklist
| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Arrow handling, editable recall and draft restoration | `apps/web-ui/src/components/in-room-chat.tsx`, `ComposerInput` textarea `onKeyDown` | Existing `draft` React state feeds the textarea and `onSend`; recall should edit this state only | Existing handler owns mention navigation and input-method guards. Add history navigation there, preserving mention precedence and caret behavior. |
| Current-room sent prompt history, reload persistence | Room transcript producer in `App.tsx` and composer consumer in `in-room-chat.tsx` | Room messages already arrive as transcript; derive own user prompt strings from the current room's existing messages | Issue says “same source as room's message history” but does not identify the producer/consumer fields, exact filtering (including app prompt messages), or how history updates when a send is accepted versus persisted. Specify this data path; do not add a separate store. |
| Empty, bounds and duplicate handling | Composer history cursor/draft state | Empty history leaves draft and native caret behavior intact; bounds clamp at oldest/newest; consecutive duplicate rule applies to sent prompts | Issue gives examples and duplicate rule, but should say whether whitespace-only prompts count and whether duplicate comparison uses exact text or normalized text. |
| Multi-line caret and mentions | `ComposerInput` | Up recalls only at first line or empty; mention popup owns arrows while open | Existing mention handler precedes general key behavior. State caret line detection and preserve popup priority. |
| Visual design | `design/<feature>/` | No new visual surface is implied | `design/README.md` documents feature exports, but no T23 design directory exists. Existing textarea presentation appears sufficient; record that no design change is needed. |

## Prefactoring
None. The existing composer and room transcript are the appropriate seams; no new module, persistence layer, or public interface is indicated.

## Findings
- Design-relevant: the issue does not identify the concrete room transcript source and fields consumed by the composer, or define which user messages are prompts eligible for recall. This is necessary to ensure history is room-scoped, excludes non-prompt user entries, survives reload through the intended existing source, and has a single producer-to-consumer path. Add the exact existing data source and filtering rule to the spec before implementation.
- Precision instruction for the Developer: retain the pre-browsing draft across Up/Down and Escape; put recalled text in normal editable draft state with caret at its end; Up at first line (or empty), Down at last entry, and Escape restore behavior must not intercept IME composition or open mention navigation. Clarify duplicate equality and whitespace-only eligibility in the task.
- No level-2/3 interface, dependency, module, or data-flow change is justified. No architectural decision or separate persistence store is needed.
