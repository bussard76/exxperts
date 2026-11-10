# T22-SERIES2-FINAL review, round 1

Verdict: pass
Reviewed commit: 35e728881ae7f94b07a706e7f2cbfd374b1876fe
Full gate commit: 35e728881ae7f94b07a706e7f2cbfd374b1876fe
Gates: full build passed; parallel smokes **failed**, 375/377, with one smoke partly skipped. Same-commit isolated reruns of both failures also failed. Both failures reproduce with matching diagnostics on the pinned upstream baseline and require disclosure; the full gate remains failed. Separate Series 2 Chromium checks passed. See details below.
Ponytail: reviewed the full Series 2 diff and connected route, policy, editor, save, image, tab and composer flows; no functional finding. Assumed local single-user use and the existing paired-device policy.

What this change does: It adds a room workspace tree and a Markdown editor with guarded saving, images, navigation and RAW/task editing. It also carries the approved editor dependency graph and a distribution notice.

Scope: independent standalone Series 2 against merge-base `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; 43 changed paths, including non-Markdown paths, so this is mixed. The Controller's explicit pinned-base override prohibited merging current fork main or cross-merging the series. Product/lock tree `1962d656a057a223d751f3ead11a9e44c7210c00` differs from reviewed head only in `docs/reports/issue-22.md`; six RAW product/test paths exactly match `4323d9a3be76b9306ad31590b519cded4fb4cddd`, and the lock matches `267968c`. The original worktree's pre-existing lock modification was untouched.

## Spec checklist

| Requirement | Code and evidence | Status |
| --- | --- | --- |
| R1 tree, ordering, refresh, grants and path restrictions | `persistent-room-workspace-files.ts`, `WorkspaceFileBrowser.tsx`; public route and browser `persistent-room-workspace-files-smoke.ts`, `workspace-markdown-images-ui-smoke.ts` | Pass in exercised paths |
| R2 Markdown editor, modes, read-only, tabs, identity and navigation | `MarkdownEditorPane.tsx`, `App.tsx`, `WorkspaceFileTabs.tsx`; image and RAW browser smokes | Pass in exercised paths |
| R3 local images and source preservation; block external requests | `persistent-room-workspace-image.ts`, `workspace-image-src.ts`, `WorkspaceImageExtension.ts`; image and browser smokes check invented local, blocked and external images, and unchanged image source | Pass in exercised paths |
| R4 drag tree path at composer selection and distinguish tabs | `WorkspaceFileBrowser.tsx`, `in-room-chat.tsx`, `composer-text-insertion.ts`; browser and `composer-text-insertion-smoke.ts` | Pass in exercised paths |
| Draft, 409, reload, Keep mine, failures and in-flight edits | `MarkdownEditorPane.tsx`, `useMarkdownEditorSync.ts`, `App.tsx`; two browser smokes use real local GET/PUT and held or failed mock requests | Pass in exercised paths |
| Edit search and nonmutation | `TipTapSearchExtension.ts`, `MarkdownSearchBar.tsx`; image browser smoke checks find/navigation and saved bytes | Pass in exercised paths |
| Route contract, caps, revisions, image headers and authorization | `room-settings-routes.ts`, `remote-route-policy.ts`, workspace guard/image/Markdown modules; Markdown and image browser smokes use local and synthetic paired devices, denied paths, symlinks and changed grants | Pass in exercised paths |
| RAW exact source, task controls, checkboxes and geometry | `MarkdownEditorPane.tsx`, `markdown-raw-tasks.ts`, toolbar and CSS; `markdown-raw-tasks-smoke.ts` and RAW browser smoke; exact RAW fix matches reviewed product | Pass in exercised paths |
| Level and shared producer/consumer | Architect approved level 2 extraction; four routes, guard and ten listed TipTap dependencies match approved scope. Image module owns the one error class; Markdown module re-exports that same class. Later Series 1 producer-to-Series 2 consumer composition and independent level-2 conformance remain required | Standalone reviewed; composition outstanding |
| Issue #22 lock delta | Compared actual lock to pinned upstream and 63 retained exact registry/tarball integrity records: 63 additions, only existing `apps/web-ui` entry changed, none removed, no mismatches; missing-metadata path set unchanged. `npm ci` passed normal lifecycle | Pass for checked graph; non-host platform closure remains unverified |
| Issue #22 Node floor | Retained matrix logs report Node 20.6.0/npm 9.8.1 and Node 22.23.4/npm 10.9.9, clean installs, runtime builds, UI and scripts typechecks, targeted candidate smokes and process provenance. Same Node 20 `room-workspace-path-reach-smoke.ts` fails baseline and candidate with `tsx` `e.split is not a function` at the same startup path; Node 22 and the other common policy smoke pass. Candidate browser logs have no Chromium skip | Pass under the specified same-smoke exception; PR disclosure required |
| npm ls, signatures, licences and report | Retained matrix reports same 12 invalid `@types/node` problem identities and successful signatures, and exact-lock records identify 63 MIT declarations. `docs/reports/issue-22.md` lists changed paths. Actual tarball contains root LICENSE and NOTICE | Lock evidence checked; distribution attribution unresolved below |
| Independent full gate, browser and human/composed acceptance | Full gate and independent browser checks below. No Series 1+2 composition, level-2 conformance, or Sascha human preview was claimed | Full gate failed; other acceptance remains outstanding |

Tests use public route/browser seams for the main flows and synthetic temporary data; helper tests supplement them. Removing tree/editor behavior would break the public tree-open/save assertions, and removing RAW or its fix would break the RAW browser's exact-source and no-clean-PUT assertions. The earlier developer report records red-first failures; this review did not independently remove implementation to rerun them. React text rendering and the image URL resolver were inspected for untrusted content; external image tests intercept invalid hosts and require no requests. No real credentials, real model calls or real external-system changes were identified in reviewed changes and checks.

## Gate and baseline evidence

Clean checkout and normal lifecycle `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed on Linux, Node 22.23.4. The attributed `~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` ran once on the reviewed SHA: build passed, smokes 375/377 failed overall. Chromium ran; `workspace-markdown-images-ui-smoke.ts` and `workspace-markdown-raw-ui-smoke.ts` also passed separately after the full gate, with actual Chromium and local invented demo data (20.3s and 38.6s). No Chromium skip was reported for these checks.

| Smoke | Parallel candidate | Same-SHA isolated rerun | Pinned baseline isolated, same Node and host |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Fail: window-button row at 25 points, new-tab ink 26.50; at 125% maximize 25.75 | Fail, same eight diagnostics | Fail, same eight diagnostics |
| `consult-mention-smoke.ts` | Fail: 1280 light, picked-name layer differs by 1045 pixels (2048 one-pixel offsets) | Fail, same diagnostic | Fail, same diagnostic |

Each isolated candidate and baseline smoke ran once via attributed `full-gate.sh bash -c 'npm run smokes -- --jobs 1 <filename>'`, in clean checkouts with normal-lifecycle install and built UI/runtime. The original failed gate is not converted to a passing gate. These are matching baseline failures, not demonstrated Series 2-only defects; disclose both exact diagnostics as pre-existing upstream behavior in any Series 2 PR, alongside the Node 20 `tsx` failure. Matching diagnostic evidence does not establish why the checks fail.

Full suite skips: `persistent-room-localfiles-secret-floor-smoke.ts` skipped `fd` find cases (fd unavailable) and case-rename grant (case-sensitive disk). Windows-only 8.3, trailing-dot/space/stream and `.mcp.json.`/`.git.` cases and macOS-only Finder cases were not run on Linux. These platform and tool paths remain unverified; no skip is a pass.

Evidence retained in `~/controller-exxperts/evidence/t22-series2-final-independent-review/`: full gate log, original and isolated failure logs, baseline logs and retained Node matrix logs. The matrix's product/lock SHA is identified by the developer report, not independently recoverable from tarball bytes alone.

## Findings

No proven functional defect in the reviewed standalone Series 2 flows. The functional-only verdict does not certify a green full gate or release readiness.

## Unresolved distribution evidence

The actual retained npm tarball includes root `NOTICE` and `LICENSE`, but its NOTICE refers to `runtime/LICENSE` and `runtime/NOTICE.md`, neither of which is packaged. Root NOTICE identifies Omnigent and editor dependencies, but registry licence fields alone do not prove complete bundled attribution or legal sufficiency. The independent `~/controller-exxperts/evidence/t22-series2-notices-2026-11-10/report.md` records that desktop pruning omits root NOTICE; no final desktop artifact or matching baseline tarball was inspected, so neither final desktop contents nor baseline artifact equivalence is established. Obtain exact upstream licence/notice texts and actual npm, release and supported desktop artifacts and resolve attribution with the decision maker. This is unresolved evidence, not a legal conclusion or a Node no-worse waiver.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts` | Preserve the original file mode on atomic replacement; the temporary file is created with mode 0600. |
| tests | minor | `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts` | Exercise nested task selections and same-mounted discard/save through the public browser flow. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Run fd, case-insensitive filesystem and platform-specific cases on suitable hosts. |
| style | minor | `apps/web-ui/src/components/MarkdownEditorToolbar.tsx` | Include Delete table visibility in human preview acceptance. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF; `git diff --check` reports it. |
