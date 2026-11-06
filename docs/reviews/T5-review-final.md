# T5 final functional review

Reviewed commit: c0f62d9c3b1ebe882181c5c79aaec05eb0a7958e
Verdict: pass

What this change does: A room's workspace appears as a file tree, and Markdown files open in an editor with local images. A file can also be dragged from the tree into the composer as a relative path.

## Classification of round 2 findings

| Previous finding | Classification | Current evidence |
| --- | --- | --- |
| Keep mine can discard edits typed during its save | Functional defect, fixed | The browser check held the Keep mine PUT, added another edit, and verified both successful navigation and a failed subsequent PUT retaining the editor and both edits. |
| Top-bar icon alignment smoke fails | Debt candidate: style, minor | Round 2 reproduced it on clean main as well. |
| Composer overlay pixel mismatch smoke fails | Debt candidate: style, minor | Round 2 reproduced it on clean main as well. |
| Atomic replacement changes existing file mode to 0600 | Debt candidate: edge-case, minor | The round 2 observation remains open. |
| HTML image attributes may not be preserved | Debt candidate: edge-case, minor | The round 2 coverage and future-preservation question remains open. |
| Autosave timer measures from first edit rather than last edit | Debt candidate: edge-case, minor | The round 2 observation remains open. |

The round 1 data-loss finding was also a functional defect: the browser check held the first save, added a second edit, and verified both successful navigation and a failed second PUT retaining the editor and both edits. Both previously reported data-loss defects are fixed in the tested scenarios; neither is classified as debt.

## Debt candidates and preview acceptance

| Category | Severity | Location | Proposal | Sascha can try on preview |
| --- | --- | --- | --- | --- |
| style | minor | `apps/web-server/scripts/room-topbar-ui-smoke.ts` | Investigate the top-bar icon alignment assertion on main. | Open a room and inspect the top-bar icon alignment. |
| style | minor | `apps/web-server/scripts/consult-mention-smoke.ts:735` | Investigate the composer overlay pixel mismatch on main. | Open the composer mention overlay and inspect its alignment. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts:236` | Preserve the existing file mode when replacing a Markdown file. | Save a disposable Markdown file with non-default permissions and check whether its permissions remain unchanged. |
| edge-case | minor | `apps/web-ui/src/components/WorkspaceImageExtension.ts` | Decide whether HTML image attributes should be preserved and add a proving test if so. | Edit a disposable Markdown file containing an HTML image with attributes and inspect the saved markup. |
| edge-case | minor | `apps/web-ui/src/components/MarkdownEditorPane.tsx` | Reset the autosave timer after each edit to measure the idle interval. | Type continuously for longer than a second and observe when autosave starts. |

For the issue's preview acceptance, open a Markdown file with an image, make an unrelated edit, save it and check that the image still shows and its Markdown line is unchanged in `git diff`.

## Checks and limits

- `npm run build` passed on the reviewed commit. `gate bash -c 'npx --no-install tsx apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts'` passed once with Chromium, a free local port, invented data and mock paired devices; it checked the tree, editor, image rendering and preservation, drag-to-composer, conflicts and both held-save scenarios including failed follow-up saves.
- The last full build and smoke gate recorded in round 2 was on `9625237c1ccd397b87cc3cab241d81b01d45f0c7`, not this commit: build passed and 372/374 smokes passed, with both visual failures reproduced on clean main. The full suite was not rerun for this review; the integrated wave still needs its full gate.
- Setup used the existing local npm package cache with `npm ci --offline`, a worktree-local cache and logs, and both browser-install skip variables. No real model service or real user data was used.
- Ponytail review: focused on the changes since round 2 and the connected save paths under the requested narrow re-evaluation, assuming one person editing while a local save is delayed. No additional finding was identified in the checked flows. Sascha's preview acceptance remains outstanding.
