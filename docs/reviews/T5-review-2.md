# T5 review, round 2

Verdict: fail
Reviewed commit: 9625237c1ccd397b87cc3cab241d81b01d45f0c7
Gates: `gate bash -c 'npm run build && npm run smokes'`: build passed, 372/374 smokes passed. The two non-timeout visual failures below also fail on independently built clean `origin/main`. All five issue-named smokes passed, including the real browser and held-PUT navigation scenarios. One smoke passed with parts skipped and four had platform-specific parts skipped. Foreign-host network-failure reruns: 0.
Browser/API: the integrated smoke passed with Chromium, local routes, mock paired devices, invented files and a free port. A separate demo browser scenario reproduced the data-loss finding below. Sascha's real preview acceptance remains outstanding.
Ponytail: reviewed the full task diff and connected paths. One Must fix is below. Assumed load: one person editing a file while a local save can be delayed.

What this change does: It adds a room workspace tree, Markdown editor and local images, and lets a person drag a file path into the composer. Room workspace and paired-device policy bound the file access.

## Spec checklist

| # | Requirement | Code | Test | Status |
| --- | --- | --- | --- | --- |
| Issue result 1; spec acceptance 1: tree, nested entries, states and path guards | `persistent-room-workspace-files.ts`, `WorkspaceFileBrowser.tsx`, `room-settings-routes.ts` | `persistent-room-workspace-files-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` | Pass for tested cases |
| Issue result 2: open Markdown in the right editor | `App.tsx`, `MarkdownEditorPane.tsx` | `workspace-markdown-images-ui-smoke.ts` | Pass |
| Issue result 3 and preview acceptance: resolve local images and preserve specified Markdown on save | `WorkspaceImageExtension.ts`, `workspace-image-src.ts` | `workspace-markdown-images-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` compares saved demo bytes | Pass for demo; Sascha's preview remains |
| Issue result 4: drag a relative path into the composer at the caret | `WorkspaceFileBrowser.tsx`, `in-room-chat.tsx` | `composer-text-insertion-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` | Pass |
| Issue observable 1; spec acceptance 6: build and all smokes | Root build and smoke runner | Full gate above; five named smokes passed | Full gate not green: two failures reproduced on main |
| Spec acceptance 2: Markdown and image HTTP contracts, revisions and write boundaries | `persistent-room-workspace-markdown-files.ts`, `room-settings-routes.ts` | `workspace-markdown-images-ui-smoke.ts`, `persistent-room-workspace-markdown-files-smoke.ts` | Pass for tested cases |
| Spec acceptance 3: local and paired-device tool and mode matrix, root and path protections | `persistent-room-workspace-tools.ts`, `remote-route-policy.ts`, `room-settings-routes.ts` | `workspace-markdown-images-ui-smoke.ts` uses real local routes and mock paired devices | Pass for tested cases |
| Spec acceptance 4: save, conflict, reload, Keep mine and dirty navigation | `MarkdownEditorPane.tsx`, `useMarkdownEditorSync.ts`, `App.tsx` | Integrated browser smoke plus independent held Keep mine PUT scenario | Fail: Keep mine can lose later edits |
| Spec acceptance 5: external and protocol-relative images show alt text without requests; blocked images disclose no bytes | `workspace-image-src.ts`, `WorkspaceImageExtension.ts` | `workspace-markdown-images-ui-smoke.ts` intercepts mock destinations in Edit and Preview | Pass |

## Findings

### [blocker] Keep mine can discard edits typed during its save

- Where: `apps/web-ui/src/components/MarkdownEditorPane.tsx:517`, `apps/web-ui/src/components/MarkdownEditorPane.tsx:454`.
- Problem: After a conflict, Keep mine captures the draft and starts a PUT while the editor remains editable. If a person types another edit before that PUT returns, `setLoadedFile` and `markSaved` mark the old snapshot clean; the later edit remains visible briefly but navigating to another file shows no unsaved prompt and loses it. An independent Chromium scenario held the local PUT, typed `late-edit`, released it, observed Saved and navigated; the saved demo file did not contain `late-edit`.
- Violates: The binding spec's Keep mine, draft-retention and dirty-navigation requirements; user data is lost.
- Fix: Preserve and save or keep dirty any draft newer than the snapshot sent by Keep mine, and do not let navigation discard it; retain the draft if a subsequent save fails.
- Proving test: Through the real browser and local demo room API, hold the Keep mine PUT, type another edit, release it and navigate; assert the later edit is saved before navigation or the unsaved prompt retains it. Also fail a subsequent save and assert the editor and both edits remain.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| style | minor | `apps/web-server/scripts/room-topbar-ui-smoke.ts` | Investigate the 26.50-point icon centre; the same assertion fails on clean main here. |
| style | minor | `apps/web-server/scripts/consult-mention-smoke.ts:735` | Investigate the 1,045-pixel overlay mismatch; the same assertion fails on clean main here. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts:236` | Preserve existing file mode on atomic replacement; the temporary file is created as 0600. |
| edge-case | minor | `apps/web-ui/src/components/WorkspaceImageExtension.ts` | Test and preserve HTML image attributes if a future preservation commitment includes them. |
| edge-case | minor | `apps/web-ui/src/components/MarkdownEditorPane.tsx:304` | Reset the autosave timer on each edit to measure the specified idle interval. |

## Review notes

- Current `origin/main` was `397034345dd38e57cb90e2f5666d8b35dff10b1f`; merging it into a temporary branch from the reviewed head was already up to date and conflict-free. The gate checkout began without build output.
- Level 3 and accepted ADR-0002 cover the browser-to-room-to-workspace flow. The four route/method pairs, ten TipTap dependencies and guarded resolver export are named in the approved spec. No additional route, dependency, store or cross-boundary flow was identified; independent level-3 conformance is still required.
- The public route/browser tests use invented files and mock devices. The tree and image tests would fail if the public routes or rendering were removed; the saved-byte comparison would fail if the image lines changed. The new held-PUT browser assertions require both writes or a retained draft. React text rendering and the image resolver were inspected for untrusted content; the threat considered is a remote page or crafted workspace content without local account write access. No real data, committed secrets or real external service calls were identified in the task diff and demo flows.
- The two full-gate failures were `room-topbar-ui-smoke.ts` (26.50 rather than 25 window points) and `consult-mention-smoke.ts` (1,045 differing pixels). An independent clean-main build and one focused run of each reproduced those exact results. Neither is attributed to this branch; no test was changed or rerun as a load flake.
- The additional Keep mine reproduction's first attempt stopped on an ambiguous test locator; after correcting the temporary test locator, it reached and failed the explicit lost-edit assertion. No implementation file was edited.
- Offline setup used `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, but the repository postinstall still invoked `playwright install chromium`. Its log has no download lines; no network trace establishes whether it attempted an external connection. It created or updated `/home/developer/.cache/ms-playwright/.links/9a110b064ad7159968a780481139cf733e09aae8` for the temporary checkout outside the worktree. The later main setup also used `EXXETA_SKIP_BROWSER_INSTALL=1` and skipped that postinstall download; existing Chromium was used.
