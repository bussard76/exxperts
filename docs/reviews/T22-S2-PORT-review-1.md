# T22-S2-PORT preliminary review, round 1

Verdict: fail
Reviewed commit: ad43a3727f90675523152aecd2b3d5c1427bae6d
Baseline: cdc3d5c29b7cfd959051b5594f50cef94e3211de
Ponytail: full product diff and connected save/sync/API flow reviewed; one functional finding below. Assumed local single-user workload with the existing paired-device policy.

This is a preliminary product-only port verdict, not final issue #22 or Series 2 acceptance. The builder tested product commit `25c5d99cc906ba9379351d00968ff721b3787fa1`; `ad43a3727f90675523152aecd2b3d5c1427bae6d` adds only its report. My independent checks ran on a clean checkout of `ad43a3727f90675523152aecd2b3d5c1427bae6d`. The Controller must still assemble the lock/product candidate and obtain independent full and Series 1+2 composition gates, Node matrix and licence disposition. No full gate, main merge, or stopped matrix was run under the scope override.

## Spec checklist

| Requirement | Code and evidence | Status |
| --- | --- | --- |
| RAW editable, same save, dirty and permission path | `MarkdownEditorPane.tsx:286,625`; RAW browser smoke exercises typing, byte saves and read-only grant | Pass in exercised paths |
| Exact source, mode changes and clean external replacement | `MarkdownEditorPane.tsx:156,313`; RAW browser smoke checks no-change and later typing, external replacement shown; additional independent browser check found clean save corrupts replacement | **Fail**: finding 1 |
| Conflict, Reload, Keep mine, failed and held saves | `MarkdownEditorPane.tsx:484,571`; RAW browser smoke uses local producer and on-disk bytes; existing image UI smoke checks navigation and in-flight/failed saves | Pass in exercised paths |
| Tasks, selection, empty/mixed lines, state, disabled controls, Edit checkboxes | `markdown-raw-tasks.ts`, `MarkdownEditorPane.tsx:526`, `MarkdownEditorToolbar.tsx:74`; helper smoke and RAW browser smoke pass; nested selection is helper-only | Pass in exercised paths; browser gap below |
| Pane height and task alignment | `43-room-workspace.css:38,120`; RAW browser smoke enforces >=500px and body-minus-60px at 1280x900 and <=3px offsets | Pass |
| Existing routes, images, navigation and producer/consumer | Existing workspace API and image extension unchanged; image UI smoke passes local image, conflict, navigation and drag paths; full route and composition acceptance remains outstanding | Partial, final candidate required |
| Scope, architecture and source | Five production/test files match `028012127b8686ac0215fe30a4f3d3c3bb2af742` except additional browser assertions; CSS delta limited to specified editor hunks. Five ordered source commits preserve author and sign-offs. No manifests, lock, routes, package exports, dependencies or unrelated files changed. Level 1 confirmed within reviewed scope. | Pass |
| Safety and data | New textarea is React-controlled text, not an HTML sink; existing Markdown/image route and permission flow unchanged. Smoke uses temporary invented data, a local server and synthetic credentials. No secrets or real external systems found in the delta. | Pass within reviewed scope |

The helper test calls the internal helper directly; the browser test exercises the public room/editor and would fail without RAW or the task implementation. The browser baseline failure and helper missing-module evidence are builder-reported, not independently rerun. Existing tests were not removed or weakened; the modified source browser assertions reflect the added checkbox toggle and retain the geometry thresholds.

## Findings

### [blocker] Saving a clean external replacement rewrites its source

- Where: `apps/web-ui/src/components/MarkdownEditorPane.tsx:313` and `:226`.
- Problem: after polling adopts an external replacement, `contentSetterRef` clears `rawRef` while retaining the exact replacement as the baseline. Ctrl+S invokes save even when the UI says Saved, so `editorMarkdown` serializes TipTap instead of using those bytes. An independent browser run replaced a clean open file with `# External clean update\n\n* one\n* two\n\n\nTail\n`, waited until RAW displayed it, and pressed Ctrl+S without editing. The actual on-disk result was `# External clean update\n\n- one\n- two\n\nTail\n`. This changes data without a rich edit.
- Violates: binding exact-source and accepted external replacement requirements in `docs/reviews/T22-S2-RAW-architecture-spec.md`, and #17's no-change round trip.
- Fix: retain the exact adopted source as the surface's source until a real rich edit, including after external reconciliation and discard, and ensure a clean save does not serialize it.
- Proving test: browser test through the real workspace GET/PUT with invented noncanonical Markdown; adopt a clean external replacement, press Ctrl+S and switch modes without typing, and assert file bytes remain identical. Also cover discard and subsequent save.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/markdown-raw-tasks-smoke.ts` | Exercise a nested selected task through the browser toolbar and persisted file as well as the helper. |
| style | minor | `apps/web-ui/src/components/MarkdownEditorToolbar.tsx` | Track the previously accepted Delete table visibility omission in RAW as preview debt. |

## Independent checks

On Node 22.23.4, an attributed targeted gate with `EXXETA_SKIP_BROWSER_INSTALL=1` passed normal lifecycle `npm ci`, runtime build, UI build, `markdown-raw-tasks-smoke.ts`, `workspace-markdown-raw-ui-smoke.ts`, and `workspace-markdown-images-ui-smoke.ts`. Chromium ran; neither browser smoke skipped. An attributed in-memory variation of the RAW browser smoke then failed on the exact-source reproduction above; its first harness attempt failed before running due to an invalid module URL and was corrected before the observed functional failure. No product files were edited for that variation. `git diff --check cdc3d5c ad43a37` passed. The original worktree's pre-existing modified `package-lock.json` was preserved; a separate clean temporary checkout was used and removed after this report was committed.
