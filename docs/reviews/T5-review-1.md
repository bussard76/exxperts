# T5 review, round 1

Verdict: fail
Reviewed commit: e9eec6233952033e11410c5322a7337a3fd6126e
Gates: `gate bash -c 'npm run build && npm run smokes'` failed: build passed, 372/374 smokes passed. `consult-mention-smoke.ts` failed its pixel-alignment assertion (1,045 differing pixels); `room-topbar-ui-smoke.ts` reported top-bar icon alignment at 26.50 rather than 25 window points. Neither failure was a timeout, and neither was rerun or attributed to host load. Existing platform-specific cases and `fd`-dependent find cases were skipped. Foreign-host network-failure reruns: 0.
Browser/API: after the gate, `gate bash -c 'npx --no-install tsx apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts'` passed with Chromium, a dedicated local port, a demo room and invented files. A separate browser scenario reproduced the draft-loss finding below.
Ponytail: full task diff and connected flows reviewed; one Must fix below. Assumed load: a person editing a room file while a save may take longer than another keystroke.

What this change does: It adds a room-scoped workspace tree and Markdown editor, including local images and dragging file paths into the composer. Access is bounded by the room's workspace policy and paired-device permissions.

## Spec checklist

| # | Requirement | Code | Test | Status |
| --- | --- | --- | --- | --- |
| Result 1; acceptance 1: tree, nested entries, states and path guards | `persistent-room-workspace-files.ts`, `WorkspaceFileBrowser.tsx`, `room-settings-routes.ts` | `persistent-room-workspace-files-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` | Pass |
| Result 2: selecting Markdown opens editor | `App.tsx`, `MarkdownEditorPane.tsx` | `workspace-markdown-images-ui-smoke.ts` | Pass |
| Result 3; preview acceptance: local images resolve and the specified Markdown image examples survive an unrelated edit | `WorkspaceImageExtension.ts`, `workspace-image-src.ts` | `workspace-markdown-images-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` compare demo bytes | Pass for demo; Sascha's real preview remains outstanding |
| Result 4: drag a file path to the composer at the caret | `WorkspaceFileBrowser.tsx`, `in-room-chat.tsx` | `composer-text-insertion-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` | Pass |
| Observable acceptance 1 and spec acceptance 6: full build and smokes | root build and smoke runner | all five named smokes passed; full gate failed as above | Fail: full suite not green |
| Spec acceptance 2: Markdown and image HTTP contracts, boundaries, revisions and writes | `persistent-room-workspace-markdown-files.ts`, `room-settings-routes.ts` | `workspace-markdown-images-ui-smoke.ts`, `persistent-room-workspace-markdown-files-smoke.ts` | Pass for tested cases |
| Spec acceptance 3: local and paired tool matrix, read/write and root protections | `persistent-room-workspace-tools.ts`, `remote-route-policy.ts`, `room-settings-routes.ts` | `workspace-markdown-images-ui-smoke.ts` exercises actual HTTP routes and mock paired devices | Pass for tested cases |
| Spec acceptance 4: save, conflict, reload, keep mine and dirty navigation | `MarkdownEditorPane.tsx`, `useMarkdownEditorSync.ts`, `App.tsx` | `workspace-markdown-images-ui-smoke.ts`; extra held-response browser scenario | Fail: a newer draft can be lost while navigating |
| Spec acceptance 5: external and protocol-relative images show alt text without requests; blocked local images do not disclose content | `workspace-image-src.ts`, `WorkspaceImageExtension.ts` | `workspace-markdown-images-ui-smoke.ts` intercepts mock destinations in Edit and Preview | Pass |

## Findings

### [blocker] Save and continue can drop edits made during an earlier save

- Where: `apps/web-ui/src/components/MarkdownEditorPane.tsx:206`, `apps/web-ui/src/App.tsx:561`.
- Problem: When a save is already in flight, another `save()` returns the first request's promise and schedules the newer draft for later. If the user types more while that request is held, opens another Markdown file and chooses Save and continue, the first request resolves successfully and navigation closes the editor before the queued save can preserve the newer edit. In an independent browser run using invented files and a held local PUT, the file contained `first` but lost `second`.
- Violates: The binding spec's dirty-navigation save and draft-retention requirements; user data is lost.
- Fix: Make navigation await successful persistence of the latest draft, including edits made during an in-flight save; keep the editor open if that save fails.
- Proving test: Through the real browser and local room API, hold the first PUT, type another edit, choose Save and continue, release the first PUT and assert that both edits are on disk before navigation; also assert that a failed second PUT retains the editor and draft.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| style | minor | `apps/web-server/scripts/consult-mention-smoke.ts:735` | Investigate the 1,045-pixel composer overlay mismatch observed in the full gate without assuming its cause. |
| style | minor | `apps/web-server/scripts/room-topbar-ui-smoke.ts` | Investigate the 1.5-point top-bar icon alignment mismatch observed in the full gate. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts:236` | Preserve the existing file mode when atomically replacing Markdown; the new temporary file is created as 0600, so an executable or shared file loses its permissions. |
| edge-case | minor | `apps/web-ui/src/components/WorkspaceImageExtension.ts` | Test and preserve HTML image attributes if that syntax is included in a future Markdown preservation commitment. |
| tests | minor | `apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts` | Cover a held first PUT followed by a newer edit and navigation, including a failed second PUT. |
| edge-case | minor | `apps/web-ui/src/components/MarkdownEditorPane.tsx:313` | Reset the one-second autosave timer on each edit so it measures idle time, rather than time since the first dirty edit. |

## Review notes

- Current `origin/main` was `397034345dd38e57cb90e2f5666d8b35dff10b1f`; merging it into a clean temporary branch from the reviewed head was already up to date, with no conflicts. The clean checkout had no prior build output.
- Level 3 and ADR-0002 cover the browser-to-room-to-workspace flow. The four route/method pairs and ten TipTap dependencies are the ones named in the approved spec. New exports within the owning modules support these seams; no additional route, dependency, store or cross-boundary flow was identified. Independent architectural conformance remains required.
- Route/browser tests use invented files and mock devices. The tree and image assertions exercise public routes and browser interactions and would fail if the routes or image rendering were removed; the byte comparison would fail if the image lines were rewritten. React text rendering and the TipTap image resolver were inspected for untrusted content; no real data or committed secrets were found in the task diff. The untrusted-content threat considered is a remote page or crafted workspace content without local account write access.
- The existing browser suite checks ordinary failed saves and conflicts, but not the held-save navigation race above. The optional HTML-image-attribute case is not proved. No real preview acceptance was attempted; it belongs to Sascha.
- Clean-checkout setup used `npm ci --offline`, but its postinstall also invoked Playwright's Chromium installer. Its log showed no download lines, and Chromium binaries had earlier timestamps, but whether it attempted an external connection cannot be established. It created a Playwright cache link outside the checkout; this deviation was reported to the coordinator. No later download was initiated.
