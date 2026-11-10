# T22-S2-DISCARD-FIX review, round 1

Verdict: fail
Reviewed commit: a7d519f0bbf479584c97fec72c27ef416226d90d
Gates: build passed; full Node 22 smoke gate failed (374/377); Node 20.6 targeted checks passed. See the original failures, isolated reruns and skips below.
Ponytail: fix before shipping: Escape can cancel a busy dialog while the discard continues and removes the draft. Expected load: an individual using a local room; the reproduction needs one browser and one local server.

What this change does: It pauses idle autosave while a dirty-navigation choice is open and coordinates Discard with an already-running save. It also attempts to restore the original bytes after an in-flight save, using the new revision so an external change causes a conflict instead of being overwritten.

## Scope and architecture

This is an independent fix review, not final Series 2 composition approval. The exact reviewed head is based on `373bd35b5e4ebd29b350897f71fd199c089ad66b`; the functional fix delta changes two existing UI files and adds browser-smoke cases. Its merge-base with `origin/main` is `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; the 42-path Series 2 diff is mixed. The explicit override prohibited merging fork main or factory material into this product tree. Issue #22 concerns lockfile and Node-floor evidence; its broader dependency and notice acceptance is not newly certified by this fix review.

The fix is level 1 within the existing App/editor seam. The asynchronous `discard` handle is used by the existing App caller; this fix adds no route, dependency, storage or external protocol. Existing tests are retained; the new smoke exercises the browser, routes and disk, and its held-prompt assertion would fail on the old implementation because the original autosave writes the draft while the prompt remains open. Untrusted content is not interpolated by the fix; its new test uses invented local data. No real service or model API was called. The initial workspace's unrelated lockfile modification was preserved.

## Spec checklist

| Requirement | Evidence | Result |
| --- | --- | --- |
| RAW and Edit checkbox, prompt held beyond one second; quick Discard | `workspace-markdown-raw-ui-smoke.ts` in full gate and Node 20 run, actual Chromium and disk | Pass |
| Save, Cancel, normal one-second autosave, navigation after save | Same browser smoke | Pass |
| In-flight PUT held before forwarding and response held after write | Same browser smoke checks reopened file and disk | Pass |
| External change before original PUT | Independent `pre-forward-reopen.log`: 409; explicit Discard leaves external bytes and reopening shows them | Pass |
| External change after save, required restore, polling beyond five seconds | Browser smoke; independent `restore-conflict.log`: original PUT 200, restore 409, external bytes and exact draft retained with conflict visible | Pass |
| Save or Cancel after a conflicting in-flight PUT | Independent `save-conflict.log` and `cancel-conflict.log`: external bytes and draft retained, conflict visible | Pass |
| Busy dialog actions cannot race | Independent `escape-during-discard.log`, actual Chromium, routes and disk | **Fail**, finding below |
| Existing permissions | Browser smoke proves RAW read-only without write grant; no permission route changes in fix | Pass for affected flow |
| Node floor, direct-package notices and lockfile for issue #22 | Node 20 targeted checks below; broader lock/notice work is outside this fix review | Not independently re-certified |

## Findings

### [blocker] Escape cancels the busy dialog but the discard still removes the draft

- Where: `apps/web-ui/src/App.tsx:576`, `:627`, `:8979`; `apps/web-ui/src/components/MarkdownEditorPane.tsx:269`.
- Problem: With the autosave PUT held before it reaches the local server, choose Discard, then press Escape while the Cancel button is disabled. Escape still calls the dialog's cancel function, closes it and clears the pending navigation; the asynchronous discard nevertheless finishes. The user remains in the editor, but the original bytes replace the draft on disk and in the editor. The reproduction observed two successful PUTs and the lost draft.
- Violates: The explicit requirement that busy dialog actions cannot race, and the Cancel choice retaining the draft.
- Fix: Make Escape obey the same busy state as the disabled Cancel button, and ensure an active discard cannot race with cancellation.
- Proving test: With a real local server and demo Markdown, hold an autosave PUT, select Discard, press Escape while busy, and verify the dialog remains busy until the discard completes; also test ordinary Escape/Cancel while idle retains the draft.
- If skipped: A user can dismiss the prompt as if cancelling and find their unsaved draft gone.

## Gates and evidence

All gate runs used the requested attribution and host lock on the exact reviewed SHA. The Node 22.23.4 full gate used clean normal-lifecycle `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci`; build passed, smokes exited 1 with 374/377 passing. `workspace-markdown-raw-ui-smoke.ts` and `workspace-markdown-images-ui-smoke.ts` passed with Chromium. Each failed smoke was rerun alone at the same SHA; the original full-gate failure remains a failure.

| Smoke | Parallel original | Same-SHA isolated | Baseline disposition |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Fail: 25-point row, ink 26.50 and 25.75 | Fail: same eight diagnostics | Same smoke and diagnostics on pinned `461e6485` and Node 22.23.4 recorded in `origin/agents/t22-series2-final-review-1:docs/reviews/T22-SERIES2-FINAL-review-1.md` and its retained baseline logs. |
| `consult-mention-smoke.ts` | Fail: 1045 differing pixels, 2048 one-pixel offsets | Fail: same diagnostic | Same smoke and diagnostic on the same pinned baseline and Node, in the same independent report and logs. |
| `key-refused-setup-smoke.ts` | Fail: `the sign-in starts, got 500` | Pass | Cause and baseline match unresolved; the isolated pass does not erase the original failure. |

The full log reports parts skipped in `persistent-room-localfiles-secret-floor-smoke.ts`: `fd` is not installed and the case-rename check requires a case-insensitive disk. Other listed cases require Windows short-name/trailing-dot handling or macOS Finder; native Windows is waived for this task and Mac remains pending. These skips are not passing evidence for those cases.

Node 20.6.0 passed runtime package builds, UI and script typechecks, and the actual Chromium RAW browser smoke, including read-only access; the checkout's normal lifecycle install was performed under Node 22 before both runs. The gate and independent browser logs and reproducible harnesses are retained under `~/controller-exxperts/evidence/t22-s2-discard-fix-independent-2026-11-10/`. The pre-forward 409 followed by explicit Discard is not a failed discard: reopening correctly shows the external bytes.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts` | Cover Escape during an in-flight discard and verify idle Escape continues to retain the draft. |
| tests | minor | `key-refused-setup-smoke.ts` | Investigate the parallel-only sign-in 500 and reproduce against the pinned baseline before attributing it. |
