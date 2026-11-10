# T22-S2-NOTICE-FIX review, round 1

Verdict: pass
Reviewed commit: a9d1b8b9e28c09bab08fb89ac80426fedc941e29
Gates: build passed; full smoke gate **failed** (375/377, exit 1). Both failed smokes failed again in same-commit isolated reruns and match retained pinned-upstream Node 22 diagnostics. Separate Chromium image and RAW checks passed. The raw gate remains failed; see evidence and limitations below.
Ponytail: reviewed the standalone Series 2 and notice diff, its route, policy, editor, save, tree, image, tab, composer and test connections. Assumed local single-user use and the existing paired-device policy. No functional finding.

What this change does: Series 2 adds the room workspace tree and Markdown editor, including guarded saves, images, tabs, search and RAW tasks. This correction adds the two runtime notice files already referenced by the npm package's root NOTICE and tests the actual tarball.

Scope: the Controller pinned the standalone branch to `a9d1b8b9e28c09bab08fb89ac80426fedc941e29` and upstream base `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; it expressly prohibited merging fork main or either series into the product. The merge-base with fetched `origin/main` is that upstream base. The diff has 43 changed paths including non-Markdown files, so it is mixed. The notice correction relative to approved Series 2 `35e728881ae7f94b07a706e7f2cbfd374b1876fe` changes only `package.json`, the existing notice smoke and the report; the tested product/test commit is `f651881`. No main merge was attempted under the explicit override. The original worktree's pre-existing lock modification was left untouched.

## Spec checklist

| Requirement | Code and evidence | Status |
| --- | --- | --- |
| R1 tree, refresh, ordering, grants and paths | `persistent-room-workspace-files.ts`, `WorkspaceFileBrowser.tsx`; public route and browser `workspace-markdown-images-ui-smoke.ts` | Exercised paths pass |
| R2 editor, modes, read-only, tab identity and navigation | `MarkdownEditorPane.tsx`, `App.tsx`, `WorkspaceFileTabs.tsx`; image and RAW browser smokes | Exercised paths pass |
| R3 local images, exact source preservation and no external image requests | `persistent-room-workspace-image.ts`, `workspace-image-src.ts`, `WorkspaceImageExtension.ts`; image browser smoke compares saved bytes and intercepts external requests | Pass |
| R4 tree drag into composer, selection and distinct tab drag | `WorkspaceFileBrowser.tsx`, `in-room-chat.tsx`, `composer-text-insertion.ts`; browser and helper smokes | Pass |
| Draft, conflicts, reload, Keep mine, failed and in-flight saves, dirty navigation | `MarkdownEditorPane.tsx`, `useMarkdownEditorSync.ts`, `App.tsx`; browser smokes use local GET/PUT, held and failed requests | Exercised paths pass |
| Edit search and nonmutation | `TipTapSearchExtension.ts`, `MarkdownSearchBar.tsx`; image browser smoke checks search and saved bytes | Exercised paths pass |
| Route fields, limits, revisions, image headers and authorization | `room-settings-routes.ts`, workspace guard/image/Markdown modules and `remote-route-policy.ts`; image browser smoke uses local and synthetic paired devices, denied paths, symlinks and changed grants | Exercised paths pass |
| RAW exact source, task controls and geometry | `MarkdownEditorPane.tsx`, `markdown-raw-tasks.ts`, toolbar and CSS; RAW browser and helper smokes | Pass |
| Architecture and shared seam | Series 2 extraction is level 2 with four approved routes and ten approved direct TipTap dependencies. Image module owns the single shared error class; Markdown re-exports it. The npm correction is level 1, two existing allowlist entries and an existing test seam, with no new dependency, export, route or data flow. | Standalone reviewed; separate Series 1+2 composition and fresh level-2 conformance remain required |
| #22 lock, Node floor, licences and report | Against pinned upstream the lock has 63 additions, no removals and only `apps/web-ui` changed among existing records. All 63 match retained exact-version URL, registry and tarball integrity evidence, with MIT declarations. `npm ci` and lock checks below; Node matrix is retained earlier-candidate evidence, not a fresh matrix on this SHA. | Lock checked; non-host platform closure and attribution remain open |
| Actual npm notice paths and prior assertions | `package.json`, `workspace-markdown-notices-smoke.ts`; fresh real npm tarball, counts and bytes below; prior licence/dry-run assertions retained | Pass |
| Real release and desktop, complete notice attribution, human and composed acceptance | No actual release archive or final desktop package inspected here. No complete Omnigent/Tiptap/transitive bundle inventory, legal conclusion, human real-file preview, or composed-tip acceptance is claimed. | Outstanding |

Tests use public HTTP and browser entry points for the main flows with temporary invented data and a fake provider; helper tests supplement them. Removing the editor or tree would break the browser open/save assertions, and removing RAW preservation would break the RAW exact-source and no-clean-PUT assertions. The builder reports the notice smoke failed before the manifest change; this review did not independently remove the implementation. The new smoke's exact-count check would reject the absent runtime entries. React renders file names as text; local images are resolved through the guarded route and external image tests intercept invalid hosts. No real credentials, paid model calls or real external-system changes were identified in the reviewed changes and checks.

## Gate and baseline evidence

A clean checkout at the reviewed SHA used Node `v22.23.4` and npm `10.9.9`. `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` exited 0 with the real postinstall lifecycle (adapter patch and explicitly skipped browser download); lock SHA-256 `64db831de4dd1ad2ebf0dd4211cfabddbe0c790bec9f761a0856e59becf1c800` was identical before and after, and equals the Series 2 lock. No install-only lock rewrite was committed.

One attributed host-serialized `~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` ran on the reviewed SHA. Build passed; smoke suite exited 1, 375/377, 645 seconds wall time. The complete log is `/tmp/t22-notice-gate.log`; exit record is `/tmp/t22-notice-gate.exit`. Gate attribution used task `T22-S2-NOTICE-FIX`, worker `t22-s2-notice-fix-test`, role `Tester`, agent `codex`, model `gpt-6.1-terra`.

| Smoke | Parallel run on reviewed SHA | One isolated rerun, same SHA | Retained upstream `461e6485`, same host and Node 22 |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Fail: eight window-button row alignment diagnostics; 25-point row, new-tab ink 26.50, and at 125% maximize 25.75 | Fail, the same eight diagnostics, exit 1 (`/tmp/t22-notice-topbar.log`) | Fail, identical eight diagnostic lines (`~/controller-exxperts/evidence/t22-series2-final-independent-review/room-topbar-ui-smoke.3386522.failed.log`) |
| `consult-mention-smoke.ts` | Fail: 1280 light picked-name layer differs by 1045 pixels (2048 one-pixel offsets) | Fail, same diagnostic, exit 1 (`/tmp/t22-notice-mention.log`) | Fail, same diagnostic (`~/controller-exxperts/evidence/t22-series2-final-independent-review/consult-mention-smoke.3388597.failed.log`) |

Each isolated rerun used the attributed full-gate wrapper with `npm run smokes -- --jobs 1 <smoke-filename>`. The prior baseline evidence identifies the pinned commit, same Node and host. Under Sascha's #22 same-smoke/same-error no-worse decision these matching failures do not establish a Series 2-only defect; both must be disclosed in the Series 2 PR. This comparison does not make the actual gate green or establish the cause. The earlier Node 20.6 matrix logs for baseline and earlier Series 2 product `1962d656` both show `room-workspace-path-reach-smoke.ts` failing with `e.split is not a function` at tsx startup and server exit 1; disclose that matching failure too. Those earlier logs are not a new Node 20 run on this SHA.

After the full gate, separately attributed `workspace-markdown-images-ui-smoke.ts` and `workspace-markdown-raw-ui-smoke.ts` passed with actual Chromium and local invented data, 22s and 39s respectively (`/tmp/t22-notice-images.log`, `/tmp/t22-notice-raw.log`); neither reported a Chromium skip. The image test exercises the real room routes, device policy, tree, editor, saving and blocked external images; the RAW test exercises edits and conflicts. The full suite skipped `fd` find cases and a case-rename grant on this case-sensitive disk; Windows 8.3, `.mcp.json.`, `.git.`, trailing-dot/space/stream cases and macOS Finder cases were not run. Skips are not passes.

## npm artifact evidence

On the built reviewed checkout, fresh `npm pack --json` exited 0. The 1,473-entry tarball SHA-256 is `39beaba2f88e2eceed55a6f9860689204f27de8e88a14933c8aedb280cb7b775`. Each path below appears exactly once and independently compared byte-for-byte equal to its checked-out source:

| Tarball path | SHA-256 |
| --- | --- |
| `package/LICENSE` | `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` |
| `package/NOTICE` | `2aab1152c844567f4f80eba2e13d0e3645ea26831cefa42714b7e78d8a92514b` |
| `package/runtime/LICENSE` | `0457f5bcec3b3b211605dfb5d1a49042fd638f3686a410fe099c24a25af13c48` |
| `package/runtime/NOTICE.md` | `05b44274a0f3d330852074e6ddf76e45fbc9feaad0322a4a127035ae1b449d23` |

The existing notice smoke also passed, including its pre-existing installed-licence and dry-run assertions and the new real-pack checks. The actual release archive, pruned desktop stage and final desktop packages were not inspected; macOS arm64 and Windows x64 artifact coverage remains unverified. The desktop pruner is separately owned, and its source rule alone does not establish the absence of all notice copies in a final package. Exact Omnigent upstream material, complete Tiptap/transitive text and actual bundle membership remain incomplete attribution evidence. No legal conclusion or complete notice inventory is asserted, and no baseline artifact equivalence is inferred from source alone.

## Findings

No proven functional defect in the exercised standalone flows. The functional-only pass is not release approval or a green full gate.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts` | Preserve the original file mode on atomic replacement; the temporary file currently uses 0600. |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts` | Add public-browser checks for nested task selections and same-mounted discard/save. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Exercise fd, case-insensitive filesystem and platform-specific paths on suitable hosts. |
| style | minor | `apps/web-ui/src/components/MarkdownEditorToolbar.tsx` | Include Delete table visibility in human preview acceptance. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF when that file is next edited; `git diff --check` reports it. |
