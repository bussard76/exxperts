# ADR-0007: Retain the internal RAW Markdown task helper

Status: accepted
Date: 2026-11-10
Decided by: Sascha (2026-11-10), option B
Architecture impact: level 3 — retains the internal web UI task-line module and its editor seam for issues #17 and #18; no new external contract or data flow.

## Context

Fork [issue #17](https://github.com/bussard76/exxperts/issues/17) requests editable RAW Markdown through the existing draft, autosave, conflict and dirty-navigation paths, with exact source preserved when switching modes without typing. [Issue #18](https://github.com/bussard76/exxperts/issues/18) adds task checkmarks in RAW and verifies saving clicked rich-editor checkboxes. Its correction records that the old toolbar was hidden in RAW, rather than acting on the hidden rich editor.

The implementation on `origin/bussard76/t17-raw-edit` at `028012127b8686ac0215fe30a4f3d3c3bb2af742` adds `apps/web-ui/src/markdown-raw-tasks.ts`. Architecture review `docs/reviews/T17-18-ADDENDUM-architecture-spec.md` at `42bca9d4e9eb09f09a1ae3670c103c7b42742b16` raises the combined change to level 3 because this is a new module with exports to the editor. The issues' expected level 1 and ADR-0002's existing guarded workspace flow do not approve that module. The review offers folding the logic into the editor (A) or retaining the helper with an accepted ADR (B).

The T17-18-ADR dispatch records Sascha's 2026-11-10 choice of option B: "retain existing internal apps/web-ui/src/markdown-raw-tasks.ts helper with only cycleTaskLines and isTaskLine, no dependency or route". This ADR records that supplied decision; it does not infer another decision from product approval or code inspection.

## Options

### A. Fold task-line logic into the existing editor module

- This was the architecture review's recommendation: avoid a separate module for one consumer's operation and return the revised exact interface for classification.
- Preserve browser coverage and the five logical source changes; adapting helper tests or commit separation would need review rather than silently dropping coverage.
- This removes the module boundary but moves the text operations into the editor implementation.

### B. Retain the internal task helper

- Keep `apps/web-ui/src/markdown-raw-tasks.ts` with the two operations `cycleTaskLines` and `isTaskLine`, consumed by `MarkdownEditorPane`.
- Keep text transformation separate from the pane's textarea, selection and save lifecycle. The cost is an additional internal module and seam, requiring this level-3 decision and independent conformance review.
- No dependency, route, durable store, external fetch, additional public API or new data flow is needed.

## Decision

Option B, as supplied in the T17-18-ADR dispatch for Sascha's decision of 2026-11-10, is accepted. Retain the existing internal helper rather than folding its operations into the editor. The tradeoff is retaining the small text-operation seam and its focused checks while explicitly accepting the additional module identified by the review.

The helper's scope is limited to `cycleTaskLines(value, start, end)`, returning `{value, selectionStart, selectionEnd}`, and `isTaskLine(value, position)`, reporting whether the caret line is a task. The existing `TaskToggleResult` type describes that result; it does not establish a new external contract. Do not expand the helper into a general Markdown service or add further public exports.

## Architecture impact

Level 3, scoped to the internal `apps/web-ui` module and its seam with `MarkdownEditorPane` and `MarkdownEditorToolbar`. The pane owns textarea selection and draft updates; the toolbar receives the task active state and callback. The helper operates only on strings and positions. Existing guarded room/workspace routes, authorization, file shapes, revisions and save/conflict paths remain the boundary for persistence. This ADR does not change responsibilities outside that seam or authorize another module, dependency, route, store or data flow.

## Consequences

- RAW remains a monospaced editable textarea, read-only when the file is read-only. Its edits and task actions use the same logical draft, autosave, manual save, conflict and dirty-navigation lifecycle as Edit. `rawRef` retains exact source while authoritative; pane `draft` mirrors that source rather than becoming an independent store. An actual rich edit permits rich serialization.
- Each selected nonempty line cycles independently: plain or bullet to unchecked, unchecked to checked, checked to unchecked. Preserve indentation, existing bullet characters and text; leave empty lines unchanged. The task button's active state follows the caret line. Edit keeps its task-list action and saves both checkbox directions.
- RAW controls that cannot operate on its text are disabled: Undo, Redo, paragraph, H1–H3, blockquote, bold, italic, strike, inline code, link, bullet and numbered lists, Find, table and Copy. The review's question about hidden Delete table versus the disabled-controls requirement remains for independent verification. Save retains its existing dirty/conflict rules.
- The review's binding checks remain required: exact source after initial load, clean polling, conflict Reload and discard; no-typing mode switches; subsequent RAW edits; saves and Keep mine with later edits in flight; errors, dirty navigation, empty content and read-only states. Keep the height assertion of at least 500px at a 900px window and checkbox/text center difference of at most 3px. Use invented files and the real textarea → toolbar → helper → draft → existing route → reload path, not helper tests alone.
- Acceptance approves only this architecture choice. It does not waive review findings, certify behavioral correctness, establish a Tester pass or replace independent architecture reclassification and conformance. No new debt is accepted by this decision; unresolved checks stay with the implementation review.
- Any Series 2 port remains conditional on independent review, gated fork integration and Controller direction, with its own independent and composed gates. The five source commits (`f999d7a`, `cc79d80`, `6213975`, `bc3743c`, `0280121`) are not a proven clean cherry-pick: the review found CSS context differences against `cdc3d5c`. Preserve Series 2 styling, tests and geometry assertions when reconciling them. Existing Series 2 R2 image, policy and dependency/lock obligations remain in force; factory files, #12, source-authority changes, Node-floor changes and unrelated fork changes are outside this decision. No EXXETA write is authorized.

## Slicing

1. Documentation only: propose this ADR citing ADR-0001, then record acceptance citing ADR-0007. Check the template fields, source revisions, option B scope and unused number across refs; change no product code or task report. No behavior TDD or gates run for this slice.
2. Independent architecture reclassification: review the accepted ADR and exact implementation revision against the bounded helper seam. The combined module choice remains level 3; the independent Architect records the classification and conformance verdict.
3. Implementation verification and integration remain separate work under the existing review protocol, retaining the review's functional checks and required gates. This documentation slice neither performs nor claims those results.
