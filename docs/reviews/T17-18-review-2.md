# T17-18 review, round 2

Verdict: fail
Reviewed commit: 028012127b8686ac0215fe30a4f3d3c3bb2af742
Merge-tested commit: 028012127b8686ac0215fe30a4f3d3c3bb2af742
Gates: build passed; 381/381 smokes passed, with partial and platform skips below. Browser: exercised with invented local files; see checklist.
Ponytail: full six-file diff, connected editor, synchronization, toolbar, save, tests and CSS reviewed. Expected load is one person editing a room's workspace file.

What this change does: RAW becomes an editable Markdown textarea using the existing save, conflict and navigation machinery. Its task button changes selected lines, and the pane height and Edit checkbox alignment are adjusted.

## Scope and evidence

- Read both fork issues, the Series 2 RAW/tasks addendum and round 1 review. No T17-18 report file was present on this reviewed head. Current fork main and merge-base are both `9111063fdd58ad96ad27f9bd1967dbe5a8de2a13`; merging main into a clean temporary branch from the head was already up to date. The actual diff is mixed: two smoke scripts, three UI TypeScript files and CSS, across five commits.
- At the unchanged merge-tested commit, the attributed host-locked full gate ran `npm run build && npm run smokes` once to completion: build passed and 381/381 smokes passed. The first detached launch was killed before it started; a recovery launch completed. No isolated reruns were needed. The prior round's `persistent-room-detached-turn-reattach-smoke.ts` parallel failure passed here. `persistent-room-localfiles-secret-floor-smoke.ts` skipped its fd-dependent find cases and case-rename grant on this case-sensitive filesystem. Four smoke files also reported Windows-only or macOS-only cases as not applicable here; these are not evidence for those platforms.
- Independent browser exercises used throwaway HOME, invented files, local server and local intercepted PUTs only. In addition to the committed RAW smoke, checks held a PUT while editing and switching modes, exercised actual Keep mine, clean external polling, Reload, navigation discard and later saves with `*` bullets and extra blank lines, selected a mixed nested task block repeatedly, moved the caret with keyboard input, and selected a table before switching to RAW. Two intermediate browser harness runs stopped at harness issues (a synthetic selection event and a navigation attempted before autosave); the corrected run completed the listed checks. The full gate result was not affected.
- No new route or package dependency. The diff adds `markdown-raw-tasks.ts` with two exported helpers and a result interface, plus an internal editor-surface handle and toolbar prop; CSS changes pane sizing. The addendum did not confirm the level and a separate Series 2 Architect addendum remains mandatory before integration or port; no level is approved by this review.
- The changed tests use invented fixtures, fake credentials and local endpoints. No secrets or `.env` changes were found, and no changed code or test was found to send to a real external system. The textarea binds text through React rather than an HTML sink. Security was assessed for untrusted document content and web requests without machine write access.

## Spec checklist

| Requirement | Code and test/evidence | Status |
| --- | --- | --- |
| #17 editable monospaced RAW with prior sizing and scroll | `MarkdownEditorPane.tsx:629`, `43-room-workspace.css`; browser smoke measured at least 500px at 900px viewport | Pass |
| #17 same draft, save/autosave and dirty navigation | `MarkdownEditorPane.tsx:283,523`; committed browser smoke saves exact text; independent browser exercised failed save, dirty navigation and discard | Pass |
| #17 RAW/Edit/Preview, in-flight save and Keep mine | `MarkdownEditorPane.tsx:301,557,588`; independent held-PUT and real Keep mine checks preserved bytes across mode switches; Preview rendered a table typed in RAW | Pass |
| #17 read-only and no-change round trip, including initial source | browser smoke read-only and clean switch; independent saved RAW round trip and later save preserve exact unsupported formatting | Pass |
| #17 external replacement and conflict Reload | independent browser verified exact bytes after clean polling and conflict Reload, mode switches and later RAW saves | Pass |
| #18 line cycle, mixed selection, repeated presses and indentation | `markdown-raw-tasks.ts`; browser selected checked, unchecked and plain nested lines and verified both presses on disk; helper smoke directly tests edge cases | Pass |
| #18 caret active state | browser moved caret via keyboard between plain/task lines and checked `aria-pressed`; committed smoke checks active state during task cycling | Pass |
| #18 unsupported actions visible and disabled | browser found normal actions disabled, but Delete table disappears when switching from a selected table; finding 1 | Fail |
| #18 Edit checkbox saving | browser smoke clicks unchecked checkbox and verifies `[x]` on disk and in RAW; independent browser clicks checked checkbox and verifies `[ ]` on disk and in RAW, without a fresh page reload for that direction | Partial |
| Pane height and checkbox alignment | committed browser smoke verifies >=500px height and <=3px checkbox/text center offset | Pass |
| Test seams | browser smoke uses public UI and local API, and its textarea and checkbox assertions would fail without those changes; `markdown-raw-tasks-smoke.ts` imports internal helper directly | Partial |

In RAW the visible disabled controls are Undo, Redo, paragraph, headings 1–3, blockquote, bold, italic, strikethrough, inline code, link, bullet and numbered list, Find, Insert table and Copy. Save remains governed by dirty/in-flight/conflict state. Delete table is omitted rather than disabled when it was visible in Edit.

## Findings

### [major] Delete table disappears instead of staying disabled in RAW
- Where: `apps/web-ui/src/components/MarkdownEditorToolbar.tsx:97`
- Problem: when the caret is in a table, Delete table is visible in Edit. Switching to RAW removes it from the toolbar entirely; the browser found zero such buttons rather than a disabled button.
- Violates: #18 and the addendum require unsupported toolbar actions to remain disabled in RAW; round 1 explicitly identified Delete table among the missing actions.
- Fix: keep the conditional table action visible when switching from an active table and disable it in RAW, without acting on the hidden editor.
- Proving test: browser test selects a table cell in Edit, switches to RAW and asserts Delete table is visible and disabled, then confirms the table remains unchanged.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/markdown-raw-tasks-smoke.ts:2` | Cover nested and mixed-selection cycles through the public toolbar in a committed browser test instead of relying on direct helper imports. |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts:154` | Commit public browser coverage for actual Keep mine, held in-flight save, clean external replacement and exact formatting after Reload and discard. |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts` | Add a fresh-page reload assertion after unchecking an Edit checkbox and verify `[ ]` in RAW. |
| tests | minor | `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts` | Investigate the round-1 parallel-only Stop-copy failure; it passed alone then and in this round's parallel run. |
| tests | minor | `apps/web-server/scripts/persistent-room-localfiles-secret-floor-smoke.ts` | Run skipped fd and case-insensitive filesystem cases in an appropriate environment. |

Verdict: fix finding 1 first. Separate Architect conformance remains required.
