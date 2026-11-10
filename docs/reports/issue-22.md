# T22 final decisions report

## Architecture impact

Level 1: process documentation only; no product modules, interfaces, dependencies or data flows change.

## Checklist

- [x] Record the platform decision in both process documents: Linux verified; Mac native build and human acceptance only after completion; no native Windows host or check; existing tests cover Windows paths.
- [x] Record the superseding licence decision in both documents: omit buffers and ExcelJS prefix-version disclosures from PR notes; ship direct packages' supplied LICENSE/NOTICE texts; no separate transitive licence work; preserve upstream notices and existing tests/checks.
- [x] Record the final upstream path check in both documents: exclude reports, reviews, specs, ADRs and factory files; preserve the Series 2 `a9d1b8b` report fork-side and remove it from the final contribution.
- [x] Cite issue 22 comments 6771263421 and 6771317883, retain superseded history in the coordinator handbook, and avoid claiming Mac verification.
- [x] Self-review all task instructions and record checks, changed files, tests, assumptions and debt candidates; merge `origin/main` and push the final signed branch.

## Self-review and checks

- Platform decision: compared both documents against issue comment 6771263421; native Mac remains pending and Windows has no native check.
- Licence decision: compared both documents against issue comment 6771317883; direct notices, no separate transitive work, preserved checks and superseded disclosures are explicit.
- Contribution paths: compared both documents against issue comment 6771317883 and the Front order; the fork report and final-tree exclusion are explicit.
- Scope and history: reviewed the complete diff against `origin/main`; only the two process documents and this report changed, and the earlier coordinator decision is marked superseded. No product, dependency, protected-file or capacity change.
- Checks: `git diff --check origin/main` passed; manual source-to-document comparison is the acceptance check for each item. No tests added or product suites run for documentation-only work; the active commit hook reports static checks skipped. No screenshots.
- Assumptions: Linux verification is stated as directed; Mac verification is conditional on its native build and human acceptance. Existing uncommitted `package-lock.json` noise is preserved and excluded.
- Debt candidates: none identified. Separate Series 2 contribution cleanup and read-only Series 1 path check follow the coordinator's order.
## Contribution path checks

Pinned baseline: `461e6485bf932f5cba85ac3dde8e0104e47d5dec`. The check rejects paths covered by `tools/exxeta-pr-guard.sh` plus `docs/specs/`.

### Series 2 original negative control: FAIL (expected)

Commit: `a9d1b8b9e28c09bab08fb89ac80426fedc941e29`. Forbidden paths: `docs/reports/issue-22.md`.

Net changed paths:

- `NOTICE`
- `apps/web-server/scripts/composer-text-insertion-smoke.ts`
- `apps/web-server/scripts/markdown-raw-tasks-smoke.ts`
- `apps/web-server/scripts/persistent-room-workspace-files-smoke.ts`
- `apps/web-server/scripts/persistent-room-workspace-markdown-files-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-images-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-notices-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts`
- `apps/web-server/src/persistent-room-workspace-files.ts`
- `apps/web-server/src/persistent-room-workspace-image.ts`
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
- `apps/web-ui/src/components/WorkspaceFileTabs.tsx`
- `apps/web-ui/src/components/WorkspaceImageExtension.ts`
- `apps/web-ui/src/components/in-room-chat.tsx`
- `apps/web-ui/src/components/landing.tsx`
- `apps/web-ui/src/components/useMarkdownEditorSync.ts`
- `apps/web-ui/src/components/workspace-hover-tooltip.tsx`
- `apps/web-ui/src/composer-text-insertion.ts`
- `apps/web-ui/src/markdown-raw-tasks.ts`
- `apps/web-ui/src/styles.css`
- `apps/web-ui/src/styles/43-room-workspace.css`
- `apps/web-ui/src/workspace-files-api.ts`
- `apps/web-ui/src/workspace-image-src.ts`
- `apps/web-ui/src/workspace-markdown-api.ts`
- `docs/reports/issue-22.md`
- `docs/workspace-and-bash.md`
- `package-lock.json`
- `package.json`

### Series 2 cleaned: PASS

Commit: `373bd35b5e4ebd29b350897f71fd199c089ad66b`. Forbidden paths: none.

Net changed paths:

- `NOTICE`
- `apps/web-server/scripts/composer-text-insertion-smoke.ts`
- `apps/web-server/scripts/markdown-raw-tasks-smoke.ts`
- `apps/web-server/scripts/persistent-room-workspace-files-smoke.ts`
- `apps/web-server/scripts/persistent-room-workspace-markdown-files-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-images-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-notices-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts`
- `apps/web-server/src/persistent-room-workspace-files.ts`
- `apps/web-server/src/persistent-room-workspace-image.ts`
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
- `apps/web-ui/src/components/WorkspaceFileTabs.tsx`
- `apps/web-ui/src/components/WorkspaceImageExtension.ts`
- `apps/web-ui/src/components/in-room-chat.tsx`
- `apps/web-ui/src/components/landing.tsx`
- `apps/web-ui/src/components/useMarkdownEditorSync.ts`
- `apps/web-ui/src/components/workspace-hover-tooltip.tsx`
- `apps/web-ui/src/composer-text-insertion.ts`
- `apps/web-ui/src/markdown-raw-tasks.ts`
- `apps/web-ui/src/styles.css`
- `apps/web-ui/src/styles/43-room-workspace.css`
- `apps/web-ui/src/workspace-files-api.ts`
- `apps/web-ui/src/workspace-image-src.ts`
- `apps/web-ui/src/workspace-markdown-api.ts`
- `docs/workspace-and-bash.md`
- `package-lock.json`
- `package.json`

### Series 1 read-only: PASS

Commit: `7f90ed7f97e0c94dd1b2d44778ac9994bfc26c25`. Forbidden paths: none.

Net changed paths:

- `apps/desktop/scripts/prune-payload.test.mjs`
- `apps/web-server/package.json`
- `apps/web-server/scripts/persistent-room-workspace-default-api-smoke.ts`
- `apps/web-server/scripts/remote-capability-smoke.ts`
- `apps/web-server/scripts/word-diagnostic-oom-smoke.ts`
- `apps/web-server/scripts/workspace-preview-fixtures.ts`
- `apps/web-server/scripts/workspace-series1-ui-smoke.ts`
- `apps/web-server/src/persistent-room-shelf-reading.ts`
- `apps/web-server/src/persistent-room-workspace-files.ts`
- `apps/web-server/src/persistent-room-workspace-image.ts`
- `apps/web-server/src/persistent-room-workspace-tools.ts`
- `apps/web-server/src/remote-route-policy.ts`
- `apps/web-server/src/room-settings-routes.ts`
- `apps/web-server/src/shelf-parse-worker.mjs`
- `apps/web-server/src/workspace-open-worker.mjs`
- `apps/web-ui/package.json`
- `apps/web-ui/public/pptx-notices/LICENSE`
- `apps/web-ui/public/pptx-notices/THIRD_PARTY_NOTICES.md`
- `apps/web-ui/public/pptx-notices/licenses/ECMA-text-copyright-notice.txt`
- `apps/web-ui/public/pptx-notices/licenses/mtx-decompressor-MPL-2.0.txt`
- `apps/web-ui/src/App.tsx`
- `apps/web-ui/src/components/Sidebar.tsx`
- `apps/web-ui/src/components/WorkspaceFileBrowser.tsx`
- `apps/web-ui/src/components/WorkspaceFileTabs.tsx`
- `apps/web-ui/src/components/WorkspaceFramedPreview.tsx`
- `apps/web-ui/src/components/WorkspaceHtmlPreview.tsx`
- `apps/web-ui/src/components/WorkspaceImagePreview.tsx`
- `apps/web-ui/src/components/WorkspacePdfPreview.tsx`
- `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx`
- `apps/web-ui/src/components/WorkspaceTextPreview.tsx`
- `apps/web-ui/src/components/WorkspaceWordPreview.tsx`
- `apps/web-ui/src/components/in-room-chat.tsx`
- `apps/web-ui/src/components/workspace-hover-tooltip.tsx`
- `apps/web-ui/src/composer-text-insertion.ts`
- `apps/web-ui/src/pptx-frame-entry.ts`
- `apps/web-ui/src/remote-client-context.ts`
- `apps/web-ui/src/styles.css`
- `apps/web-ui/src/styles/43-room-workspace.css`
- `apps/web-ui/src/workspace-files-api.ts`
- `docs/developer.md`
- `package-lock.json`
- `package.json`
- `scripts/bundle-server.mjs`
- `scripts/bundle-server.test.mjs`
- `scripts/pptx-notice.test.mjs`

The complete difference from `a9d1b8b` to the cleaned Series 2 commit is deletion of `docs/reports/issue-22.md`; all other paths, including product and lock files, are identical. No product smoke gates were run for this report-only deletion.
