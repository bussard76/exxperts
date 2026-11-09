# T17-18 review, round 1

Verdict: fail
Reviewed commit: fc1d59ee0e68f7487b3a5dcd1073f63349c0925c
Gates: build passed; full smokes failed (380/381, one partial skip); isolated rerun passed. Browser: exercised on the integration commit; see checklist.
Ponytail: full five-file diff and connected save, synchronization, toolbar and CSS paths reviewed. Findings below; expected load is a person editing a room's workspace file.

What this change does: RAW becomes an editable textarea using the existing save and conflict machinery. A RAW task button changes selected lines, and the pane height and Edit checkbox alignment change.

## Scope and gate evidence

- Both fork issues #17 and #18 and `~/controller-exxperts/specs/series-2-raw-tasks-addendum.md` including both Front updates were read. No T17-18 report file was present on the reviewed head.
- Fetched head above; current `origin/main` was `9111063fdd58ad96ad27f9bd1967dbe5a8de2a13`, merge-base `f919c8a956090cfc7657b1a4d060c4855626d35a`. The full four-commit diff is mixed: two TS smoke files, two UI TS/TSX files, and CSS. A clean temporary worktree merged main without textual conflict; tested merge `52ab8edaabe1f2b05d8f73882281c0f9b1bd1ff0`. Its initial merge commit hook failed before dependencies were installed; after `npm ci` the merge commit hook passed.
- Full gate at that unchanged merge: `npm run build && npm run smokes` completed exit 1; build passed, 380/381 smokes passed. `persistent-room-detached-turn-reattach-smoke.ts` failed its Stop-copy assertion (missing note); on the same commit its exact `--jobs 1` isolated rerun passed 1/1. The original full gate remains failed. The suite also reported parts skipped in `persistent-room-localfiles-secret-floor-smoke.ts`: find cases because fd is absent and case-rename grant on this case-sensitive disk. Thus evidence is incomplete for the manual exception; do not promote this gate to green without Controller disposition. Other OS-specific skips were reported as not applicable here. First detached launch produced no output; a second was interrupted during build by terminal process cleanup; the completed recovery run retained its parent session. No smoke failure was found in either incomplete log.
- Browser evidence used invented files and a local server on the integration merge, including the existing RAW smoke and an in-memory extension of it. The extension intercepted local PUTs to exercise a real Keep mine conflict and an in-flight save; it did not modify implementation or test files. The original browser smoke reports passing height, alignment, no-change, save, Reload and read-only assertions.
- No new route, package dependency or external service is introduced. The new `markdown-raw-tasks.ts` module exports a function and result interface consumed by the pane; the internal surface handle also changes and CSS changes pane sizing. The stated level 1 cannot be assumed: the mandatory independent Series-2 Architect addendum must assess the new module seam and geometry before integration. No architectural decision is made in this review.
- Diff fixtures use invented data, fake credentials and local endpoints. No `.env` or secrets were introduced. The textarea uses React's value binding rather than HTML interpolation; no new unescaped HTML sink was found. No changed code or test was found to send to a real external system. Security was assessed for untrusted document content and web requests without machine write access.

## Spec checklist

| Requirement | Code and evidence | Status |
| --- | --- | --- |
| #17 editable monospaced RAW, prior scroll/sizing | `MarkdownEditorPane.tsx:630`, `43-room-workspace.css:120,365`; browser textarea and >=500px at 900px passed | Pass |
| #17 RAW updates common draft, dirty, save/autosave and navigation machinery | `MarkdownEditorPane.tsx:279,522,630`; browser byte-exact RAW autosave passed; shared dirty callback inspected; navigation guard not independently exercised in RAW | Partial |
| #17 RAW to Edit/Preview and Edit to RAW; in-flight edits | `MarkdownEditorPane.tsx:289,557`; browser Edit rendering and held-PUT second edit with Edit/RAW switches passed; Preview specifically not independently exercised | Partial |
| #17 conflict Reload and Keep mine, including subsequent mode switch | `MarkdownEditorPane.tsx:569,582`; browser exercised both on invented file, including Keep mine -> Edit -> RAW | Pass |
| #17 read-only RAW | `MarkdownEditorPane.tsx:630`; browser read-only grant passed | Pass |
| #17 lossless no-typing mode switch, no dirty | browser initial unsupported-format round trip passed; after saved RAW typing, another no-typing round trip changes draft and later save loses formatting; finding 1 | Fail |
| #18 plain line, toggles, indentation, multiline | `markdown-raw-tasks.ts:10-52`; browser single line and selected mixed block, helper smoke nested and multiline; checked becomes plain and mixed lines follow first line; finding 2 | Fail |
| #18 active state follows caret | RAW button `MarkdownEditorPane.tsx:628` has no active class or `aria-pressed`; browser confirmed | Fail |
| #18 other RAW controls disabled | RAW toolbar only renders Tasks; Edit toolbar is hidden by CSS. Undo, redo, paragraph, headings 1–3, blockquote, bold, italic, strike, inline code, link, bullet/numbered list, Find, table/delete table and Copy are absent rather than disabled. Header Save is separately governed by dirty state. | Fail |
| #18 Edit checkbox click saves `[x]` / `[ ]`, reload RAW | browser smoke proves unchecked -> checked on disk and RAW sees it; checked -> unchecked and reload were not separately exercised | Partial |
| Front updates: >=500px RAW at 900px window; checkbox geometry | `workspace-markdown-raw-ui-smoke.ts:103,174`; browser smoke passed >=500px and checkbox/text center offset <=3px | Pass |
| Tests and level | Browser smoke uses public UI and local API and would fail without textarea or checkbox save. Helper smoke imports the new helper directly; missing conflict/in-flight, active and mixed-selection assertions in committed tests. Architect review remains separate. | Partial |

## Findings

### [blocker] A saved RAW draft is silently normalized and later overwrites the source
- Where: `apps/web-ui/src/components/MarkdownEditorPane.tsx:289`
- Problem: `leaveRaw` serializes through the rich editor and replaces the exact saved RAW draft even when it is clean. Browser reproduction: start with `*` bullets and two blank lines, append RAW text and wait for save, switch RAW -> Edit -> RAW without typing: bullets become `-` and a blank line disappears in the displayed draft; type one more RAW character and autosave persists those unintended changes.
- Violates: #17 lossless mode switches and no lost edit/data.
- Fix: retain the exact saved RAW source across mode switches until an actual rich-editor edit requires serialization.
- Proving test: browser test with unsupported formatting, saved RAW edit, no-typing round trip and subsequent RAW edit, asserting the entire saved file preserves original formatting.

### [major] Task cycling changes the wrong lines and removes checked markers
- Where: `apps/web-ui/src/markdown-raw-tasks.ts:16`
- Problem: a checked task becomes plain text instead of unchecked; the first selected line determines every line's operation. Browser selection `- [x] done\n- [ ] open\nplain` became `done\nopen\nplain`, losing both markers instead of individually toggling checked/open and adding an unchecked marker to plain.
- Violates: addendum #18 per-line plain -> unchecked, unchecked -> checked, checked -> unchecked, preserving indentation.
- Fix: apply the specified cycle independently to each selected line, preserving indentation and markers.
- Proving test: browser test selecting mixed checked, unchecked and plain lines, followed by repeated presses and nested indentation assertions.

### [major] RAW toolbar omits active state and disabled controls
- Where: `apps/web-ui/src/components/MarkdownEditorPane.tsx:626`
- Problem: Tasks never indicates whether the caret is on a task, and the other formatting actions disappear rather than being disabled. Browser inspection found no `aria-pressed` or active class and only one visible RAW toolbar button.
- Violates: #18 active state follows caret and unsupported toolbar actions are disabled.
- Fix: update the task button state when caret or selection changes and show unsupported controls disabled in RAW.
- Proving test: browser test moving the caret between task and ordinary lines, asserting active state and disabled status of the other actions.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts:154` | Add public browser assertions for actual Keep mine, in-flight save edits and Preview; the section labelled Keep mine currently only saves after Reload. |
| tests | minor | `apps/web-server/scripts/markdown-raw-tasks-smoke.ts:2` | Cover nested and multiline behavior through the public toolbar rather than relying on the helper import. |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts:180` | Verify a checked Edit checkbox becomes unchecked and remains so after reload in RAW. |
| tests | minor | `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts:717` | Investigate the parallel-only Stop-copy assertion failure and make its timing deterministic. |
| tests | minor | `apps/web-server/scripts/persistent-room-localfiles-secret-floor-smoke.ts` | Run the skipped fd and case-insensitive filesystem cases in a suitable test environment. |

Verdict: fix the three functional findings first. Separate Architect conformance and a complete green gate remain required.
