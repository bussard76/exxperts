# T22-S2-PORT-R2 preliminary review, round 2

Verdict: pass
Reviewed commit: 41c3851980471f3fa196030bb6f25b060759aaa8
Tested product and test commit: 4323d9a3be76b9306ad31590b519cded4fb4cddd
Base: cdc3d5c29b7cfd959051b5594f50cef94e3211de
Ponytail: full scoped product diff and connected save, sync, API, toolbar, task and browser flows reviewed. Assumed local single-user use and the existing paired-device policy.

This is a **preliminary product-only** verdict, not final issue #22 or Series 2 acceptance. The reviewed head differs from the tested product commit only in the developer report. The Controller must assemble the lock-composed candidate and obtain its independent full gate, combined Series 1+2 gate, Node matrix, licence disposition, architecture conformance and Sascha's preview acceptance. Per the Controller's override no main merge, full gate or stopped Node matrix was run here. The merge-base with current `origin/main` is `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; its actual diff is mixed, but includes the already existing Series 2 contribution outside this preliminary port scope.

## Spec checklist

| Requirement | Code and test | Status |
| --- | --- | --- |
| Exact adopted source, clean save and mode switches | `MarkdownEditorPane.tsx` retains `rawRef` on external adoption; `workspace-markdown-raw-ui-smoke.ts` replaces invented noncanonical text through real local workspace GET/PUT, checks exact disk bytes and observes zero PUTs after Ctrl+S and mode switches | Pass; round 1 blocker resolved |
| Discard and subsequent clean save | Same pane retains the baseline on discard; browser smoke fails a local save, discards through navigation, reopens and checks bytes and zero PUTs after Ctrl+S and mode switches | Pass in exercised public flow |
| RAW and rich edits, modes, exact bytes, read-only | Pane and RAW browser smoke test editable RAW, autosave, round trips, Preview, rich edit and read-only grant | Pass in exercised paths |
| Conflict, Reload, Keep mine, failed and held saves | RAW and image browser smokes exercise local conflict, failed saves, draft retention, Reload, Keep mine, held PUT and later edits | Pass in exercised paths |
| Tasks, selection, toolbar and checkboxes | `markdown-raw-tasks.ts`, toolbar and pane; helper smoke and RAW browser smoke test mixed selected lines, repeated cycles, active state, disabled controls and both checkbox directions | Pass in exercised paths; nested browser coverage is debt |
| Geometry | RAW browser smoke checks 1280x900, height >=500px and >= body height minus 60px, and checkbox center offset <=3px | Pass |
| Routes, images and navigation | Existing guarded producer remains unchanged by this port; image browser smoke checks local images, authentication, conflict, navigation, held saves and drag | Pass in exercised paths; composed candidate acceptance outstanding |
| Level and scope | Six product/test paths and separate developer report relative to `cdc3d5c`; internal helper and toolbar props only, no new package export, route, dependency or data flow | Level 1 within this scoped port |
| Privacy and data | RAW text is React text input; existing Markdown/image route and policy remain the authority. Tests use invented temporary files, local server and synthetic credentials. No real external system or secrets found in this scoped delta | Pass within reviewed scope |

The RAW browser smoke exercises the public room and local workspace API; its exact-source assertion fails on the round 1 implementation according to recorded red evidence and the code path. Removing RAW or the task behavior would fail its public browser assertions. The helper smoke directly imports an internal helper; it adds coverage but does not replace public browser evidence. Existing source assertions and geometry thresholds are preserved; checkbox expectations were updated for the additional tested toggle.

## Findings

No functional findings in this scoped review.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/markdown-raw-tasks-smoke.ts` | Exercise nested selected tasks through the browser toolbar and persisted file, in addition to the internal helper. |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts` | Add a same-mounted-editor discard and save case; the current public navigation case reopens the file. |
| style | minor | `apps/web-ui/src/components/MarkdownEditorToolbar.tsx` | Carry the previously accepted Delete table visibility behavior into preview acceptance. |

## Independent checks

A clean temporary checkout at reviewed commit `41c3851980471f3fa196030bb6f25b060759aaa8` ran the attributed targeted gate on Node 22.23.4: `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` with normal lifecycle scripts, runtime build, UI build, `markdown-raw-tasks-smoke.ts`, `workspace-markdown-raw-ui-smoke.ts` and `workspace-markdown-images-ui-smoke.ts`. All passed; Chromium actually ran both browser smokes. `git diff --check cdc3d5c HEAD` passed. The original worktree's pre-existing modified `package-lock.json` was left untouched. No real model API, external service, Docker or real data was used.
