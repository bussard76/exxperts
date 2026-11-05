# Issue 5 implementation report

## Architecture impact

Level 3: the approved browser-to-room-to-granted-workspace flow, four routes, and ten TipTap dependencies are covered by ADR-0002 and the T5 specification. No further export, route, dependency, store, or data flow was added.

## Result checklist and self-review

- [x] Sidebar shows the workspace tree: `workspace-markdown-images-ui-smoke.ts` expands it and checks loading, no folder, empty and error states; `persistent-room-workspace-files-smoke.ts` checks nested entries.
- [x] Clicking Markdown opens the right editor: `workspace-markdown-images-ui-smoke.ts` opens the file through the real room routes and checks read-only state.
- [x] Images resolve relative to the file and image Markdown survives saving: `workspace-markdown-images-ui-smoke.ts` checks image loading and compares the entire saved file with the original plus the intentional edit, including standalone, linked, mixed linked-image, literal-space and encoded-space examples; `workspace-markdown-images-smoke.ts` covers serialization examples.
- [x] Dragging a file inserts its relative path: `workspace-markdown-images-ui-smoke.ts` drives the tree and composer; `composer-text-insertion-smoke.ts` checks insertion.

## Observable acceptance

- [ ] The independent Tester must run `npm run build && npm run smokes`, including the five issue suites. This was not run as a Developer-stage gate.
- [ ] Sascha's real preview acceptance remains: open a file with an image and see the image. The gated browser test proves the equivalent flow with invented files.
- [ ] Sascha's real preview acceptance remains: edit and save and inspect the diff. The gated browser test compares the invented file bytes and confirms only the intended edit.

## Binding specification self-review

1. **Tree and guards:** `workspace-markdown-images-ui-smoke.ts` checks no grant, root and empty responses, entry fields, ordering, hidden and denied entries, invalid traversal, denied direct listings, inside/outside symlinks and both forms of root retargeting. `persistent-room-workspace-files-smoke.ts` checks nested listing. Permission errors are 503 and test responses omit absolute paths.
2. **Markdown and image contracts:** `workspace-markdown-images-ui-smoke.ts` exercises public routes for Markdown fields, byte count, SHA-256 revision, replace, stale revision, no creation, invalid body/path/type, read-only, 128 KiB and encoding limits, all image MIME types, headers, the 20 MiB boundary and denied/missing/oversized paths. `persistent-room-workspace-markdown-files-smoke.ts` and `workspace-markdown-images-smoke.ts` add cases at the existing module seams.
3. **Tool, mode and devices:** `workspace-markdown-images-ui-smoke.ts` exercises all four local and paired routes for Bash only, List only, Read only, writer only, no tools, Read plus writer and disabled read; it checks read-only and full-capability mock devices, effective write denial without a writer, protected paths and retargeted grants. A contradictory stored write flag demonstrates the existing normalization from selected tools; a selected writer with an independently disabled effective write mode is not a reachable normalized state, as clarified by the Controller and documented in the spec.
4. **Browser flow and drafts:** `workspace-markdown-images-ui-smoke.ts` uses the real room routes and invented files to expand the tree, open, edit, save, drag, check read-only and tree states, simulate failed saves and conflicts, and exercise Reload, Keep mine, cancel, discard, successful and failed navigation saves.
5. **Image privacy:** `workspace-markdown-images-ui-smoke.ts` intercepts mock HTTPS and protocol-relative destinations and asserts zero requests and visible alt images in Edit and Preview; the unchanged source survives the byte comparison. Missing and blocked local images remain in the editor without loading bytes. `workspace-markdown-images-smoke.ts` tests URL resolution.
6. **Review gates:** `origin/main` was fetched and already included before the final targeted rerun. Independent Tester and level-3 conformance reviews remain required; no browser flow was skipped.

## Validation

- `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts`: passed, including commit-hook reruns.
- `gate bash -c 'npm run test:scripts'`: passed (49 tests).
- Under `gate`, the affected `persistent-room-workspace-files-smoke.ts`, `persistent-room-workspace-markdown-files-smoke.ts`, `workspace-markdown-images-smoke.ts`, `composer-text-insertion-smoke.ts`, `persistent-room-workspace-tools-smoke.ts`, and `persistent-room-workspace-policy-smoke.ts`: passed after merging current main.
- `gate bash -c 'npx tsx apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts'`: passed after merging current main, with Chromium and a dedicated free port, using `node bin/exxperts-web.cjs --port <free-port> --no-open`.
- `git diff --check origin/main`: passed. No Docker, live model APIs, real user files or committed binaries were used in the tests. Screenshots captured: none; signed-off reference screenshots were read from the design branch.
- During test development two browser attempts timed out because the newly extended test targeted an already-open file and then an image after navigating away; both test sequencing issues were corrected and the final runs passed. One test fixture incorrectly assumed `*.secret` was a default denial and was corrected to the actual denied `*.pem` pattern. Foreign-host network/load failures: 0. The historical `settings-look-ui-smoke` timeout was not rerun in the targeted Developer stage; the independent Tester owns the full gate.

## Assumptions, decisions and debt

- The coordinator confirmed ADR-0002 supersedes the old HTTPS and protocol-relative pass-through test assertions. Those specific assertions now require blocking; other coverage remains.
- The Controller clarified that the effective write mode is derived from selected writer tools, rather than a separate stored switch; the spec and public-route tests reflect that existing contract.
- The original worktree's pre-existing uncommitted `package-lock.json` change was preserved; a temporary checkout was necessary because switching branches would overwrite it. The branch's own tracked lockfile is the feature contribution, not that pre-existing edit.
- Debt candidate (edge-case): HTML `<img>` attributes remain outside the specified Markdown-image preservation examples.
- The Developer-stage instruction prohibited the full build. While preparing the temporary checkout I mistakenly started a chain building the runtime workspaces and stopped it before its UI step; UI builds were subsequently needed for browser testing, so this was equivalent to the component builds of the full build. The full smoke suite was not run.

## Files changed

The branch includes the original feature contribution, approved spec/reviews and the surgical fixes and tests above. Relative to current `origin/main`:

- `NOTICE`
- `apps/web-server/scripts/composer-text-insertion-smoke.ts`
- `apps/web-server/scripts/persistent-room-workspace-files-smoke.ts`
- `apps/web-server/scripts/persistent-room-workspace-markdown-files-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-images-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts`
- `apps/web-server/src/persistent-room-workspace-files.ts`
- `apps/web-server/src/persistent-room-workspace-markdown-files.ts`
- `apps/web-server/src/persistent-room-workspace-tools.ts`
- `apps/web-server/src/remote-route-policy.ts`
- `apps/web-server/src/room-settings-routes.ts`
- `apps/web-ui/package.json`
- `apps/web-ui/src/App.tsx`
- `apps/web-ui/src/components/MarkdownEditorPane.tsx`
- `apps/web-ui/src/components/MarkdownEditorToolbar.tsx`
- `apps/web-ui/src/components/MarkdownSearchBar.tsx`
- `apps/web-ui/src/components/RoomDangerZone.tsx`
- `apps/web-ui/src/components/RoomSessionSection.tsx`
- `apps/web-ui/src/components/RoomSettingsModal.tsx`
- `apps/web-ui/src/components/Sidebar.tsx`
- `apps/web-ui/src/components/TipTapSearchExtension.ts`
- `apps/web-ui/src/components/WorkspaceFileBrowser.tsx`
- `apps/web-ui/src/components/WorkspaceImageExtension.ts`
- `apps/web-ui/src/components/in-room-chat.tsx`
- `apps/web-ui/src/components/landing.tsx`
- `apps/web-ui/src/components/useMarkdownEditorSync.ts`
- `apps/web-ui/src/composer-text-insertion.ts`
- `apps/web-ui/src/styles.css`
- `apps/web-ui/src/styles/43-room-workspace.css`
- `apps/web-ui/src/workspace-files-api.ts`
- `apps/web-ui/src/workspace-image-src.ts`
- `apps/web-ui/src/workspace-markdown-api.ts`
- `docs/adr/0002-room-workspace-access.md`
- `docs/reports/issue-5.md`
- `docs/reviews/T5-SPEC-R2-architecture-spec.md`
- `docs/reviews/T5-SPEC-architecture-spec.md`
- `docs/specs/T5-workspace-files.md`
- `docs/workspace-and-bash.md`
- `package-lock.json`

## Tests added or extended

The feature contribution adds `persistent-room-workspace-files-smoke.ts`, `persistent-room-workspace-markdown-files-smoke.ts`, `workspace-markdown-images-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` and `composer-text-insertion-smoke.ts`. This work extended the file, image and integrated browser/route smokes with the policy, privacy, preservation, device, conflict and error cases listed above.

## Rework 1

The browser test `workspace-markdown-images-ui-smoke.ts` holds the first local PUT while a second edit is made and verifies Save and continue writes both edits before navigation; it also fails the second PUT and verifies the editor and draft remain. Both scenarios failed before the fix. Saving now waits for the latest draft and its returned revision before navigation.

The two visual failures from review were reproduced in focused gated runs both on this branch and on clean `origin/main` at `397034345dd38e57cb90e2f5666d8b35dff10b1f`, with independently built UI and runtime: `consult-mention-smoke.ts` reported 1,045 differing pixels (2,048 one pixel off), and `room-topbar-ui-smoke.ts` reported the icon center at 26.50 instead of 25 window points (also 25.75 for maximize at 125%). These are independent of the T5 branch in this environment; no visual tests were changed. Foreign-host network-failure reruns: 0.

Architecture impact: level 3, within the existing Markdown editor and room workspace boundaries under ADR-0002; no new route, dependency, or boundary. Independent conformance must be repeated for this rework.
