# T22-S2-CONTRIBUTION-FINAL review, round 1

Verdict: pass
Reviewed commit: c156379b90f540c01695d6118d26647a7b67b106
Gates: Node 22.23.4 build passed; full smoke gate **failed raw**, 375/377, exit 1. Both failures repeated alone and match the same smoke, error and Node version on pinned upstream; the recorded upstream-comparison decision permits a functional-only pass. Fresh Node 20.6, Linux archive, desktop and staged browser checks passed below. The raw gate is not green.

What this change does: Standalone Series 2 supplies a guarded workspace tree and Markdown editor with images, search, RAW editing and draft protection. The final focused correction activates a standby conversation before starting its next turn and keeps the three notice files in the desktop payload.

## Scope and review

Fetched source is exactly the reviewed commit. Its merge-base with fetched `origin/main` is `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; the 46-path diff contains non-Markdown files and is mixed. The delta from `e0f8985d9ee0e174a607edcdfd9c71356942991d` is four existing files, 30 insertions and two deletions: socket, its public reattach smoke, desktop pruner and its test. No factory, report, spec, review, ADR or config file is in the source contribution. An attempted temporary-branch merge of current main conflicted and was aborted; conflicts are `NOTICE`, desktop pruner test, the image and RAW browser/image smokes, Markdown server module, remote policy, room routes, UI manifest, App, editor, search bar, chat, workspace CSS and workspace documentation. The source was reviewed on its own pinned base.

The approved Series 2 conformance at `agents/t22-series2-final-conformance` reviewed `a9d1b8b9e28c09bab08fb89ac80426fedc941e29` at level 2. The current focused changes stay inside existing turn and desktop packaging responsibilities; no new public interface, route, dependency or durable store is introduced. The guard checks whether a turn can begin before the thread is activated, and the thread write retains the in-flight runtime boundary guard. The public reattach test uses a fake gateway, waits for standby, checks successful Stop PUT during cancellation and after `agent_end`, then checks cut and stopped note after landing; developer red evidence in `t22-contribution-finalization-2026-11-10/s2-stop-red.log` recorded the original 409. The second PUT can repair a prior lost note, so the earlier landing remains a test debt candidate.

Ponytail review: reviewed the full source diff and connected route, guard, editor, thread and packaging flows for a single person using a local room, including paired-device access. No demonstrated new functional defect. The skill is `.agents/skills/ponytail-review/SKILL.md` in the repository; an initial shell attempt failed with exit 127 because it is a skill, not an executable, and the skill workflow was then applied. Prior focused discard review `0830efce55117dfbdfd3ac5fccbdcb6f5fd692b3`, standalone notice review `9178a8ae8d100266536f71238344691329cd9bea`, and combined review `572d3c42edd744d5520bd27a5c275503d7625a17` provide historical context, not fresh gate substitutes.

## Acceptance and evidence

| Requirement | Evidence and result |
| --- | --- |
| Tree, refresh, tabs, identity and drag | Workspace files route and `WorkspaceFileBrowser`, `WorkspaceFileTabs`, `App` and composer; fresh image browser smoke uses real room routes, temporary invented workspace and actual tree drag. Fresh Node 20 workspace-files smoke passed. |
| Editor modes, search, image preservation, draft/conflict and navigation | Fresh image and RAW Chromium smokes passed on both Node versions. Their public browser/disk checks include local images, blocked external and protocol-relative image requests, file bytes, 409/Keep mine, failed saves, in-flight edits, busy Save/Discard Escape before and after PUT, ordinary Escape, reopen, tabs and mode transitions. Node 22 full gate also passed both browser smokes. |
| Public route fields, revisions, limits and policy | Workspace Markdown/image modules, routes and remote policy; fresh Node 20 workspace Markdown and image smokes and both fresh browser runs exercise local and paired policy, denied paths, symlinks and root retargeting. Real browser route producers are retained, not replaced by mock producers. |
| Reattach and Stop | Strengthened reattach smoke passed in full Node 22 gate and independently under Node 20; existing detached, quick-follow-up and related guards passed in full gate. The tested Stop saves both returned 200 and final GET preserved cut and note. |
| Issue 22 lock and floor | Normal lifecycle `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed on Node 22.23.4/npm 10.9.9 and Node 20.6.0/npm 9.8.1; Node 20 emitted engine warnings. Runtime-first build, UI `npx tsc --noEmit -p apps/web-ui/tsconfig.json`, script typecheck and six named targeted smokes passed on Node 20. Lock SHA-256 remained `64db831de4dd1ad2ebf0dd4211cfabddbe0c790bec9f761a0856e59becf1c800`. Prior lock/integrity and audit evidence belongs to `t22-series2-lock-2026-11-10` and the old standalone review; the historical Node 20 expired signing-key audit is not resolved by these smoke results. |
| Release and desktop | Fresh real Linux x64 bundle succeeded under the host lock. SHA-256 `a11c1617992ce673738260356044d332f2a069535c29404d97cc4cd14b0021df` verified; extracted 13,747 regular files, under 15,000. Unchanged archive smoke passed native canvas, sanitized version and doctor, real launcher, auth, UI, health and teardown. Real desktop prune retained 2,232 files, under 2,500; 7/7 pruner tests passed. |
| Notices | Source, actual archive and pruned desktop `NOTICE`, `runtime/LICENSE`, `runtime/NOTICE.md` and root `LICENSE` match byte for byte. All ten directly added TipTap packages supply a license with the same SHA-256 `c96e5ecb55ac593157ad1d21d1f44a611187f494a0f04c235a1ae692c88d6ba9`; its text appears in NOTICE with existing trailing-whitespace handling. Inventory is in `direct-license-inventory.txt`. No transitive legal research or legal-sufficiency conclusion. |
| Actual staged parity | Copies of the two public browser smokes, with only their server root set to the freshly extracted release, passed against the real staged server and UI on Node 22.23.4 and 20.6.0. They exercise real workspace HTTP and disk bytes, including image/RAW and navigation. Series 1 workbook/preview packaging is not part of standalone Series 2. |
| Data and platform | Fixtures used invented data, fake providers, temporary homes and local endpoints. Browser tests assert zero requests for external and protocol-relative images. The unchanged doctor's read-only example.com probe was expressly authorized. Native Windows is waived; native Mac build and Sascha's real-file preview remain for 2026-11-11 on recomputed combined state. No native-platform or human pass is claimed. |

## Full gate and isolated outcomes

The exact-source full command was `FACTORY_CONFIG=/home/developer/controller-exxperts/factory.config.json ~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'`, with `SERIES_COMBINED` unset and the requested task, worker, role, agent and model attribution. Build passed; 375/377 passed in 632 seconds wall time, exit 1. Each failure was rerun exactly once alone on the same commit and Node 22 through the host lock after a fresh normal install and build.

| Smoke | Full run | Isolated run | Pinned upstream comparison |
| --- | --- | --- | --- |
| `room-topbar-ui-smoke.ts` | Fail | Fail, exit 1 | Eight simulated Mac row alignment messages match `room-topbar-ui-smoke.3386522.failed.log` at `461e6485`, Node 22.23.4. |
| `consult-mention-smoke.ts` | Fail | Fail, exit 1 | The 1280 light picked-name diagnostic matches `consult-mention-smoke.3388597.failed.log`: 1,045 differing pixels and 2,048 one-pixel offsets, same baseline and Node. |

The raw failed gate remains failed. The functional-only disposition uses the retained same-smoke, same-error, same-Node upstream allowance; it does not claim all tests passed. The full log records skipped `fd` and case-rename parts in `persistent-room-localfiles-secret-floor-smoke.ts` and platform-only Windows/macOS parts in that smoke, `artifact-export-smoke.ts`, `full-access-skills-folder-smoke.ts` and `room-files-routes-smoke.ts`. These are not platform passes.

## Findings

No demonstrated functional blocker or major in the exercised standalone flows.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts:714` | Assert the landed cut and note before the second PUT so that save cannot repair an earlier loss unnoticed. |
| edge-case | minor | `apps/web-server/src/persistent-room-workspace-markdown-files.ts:187` | Preserve the original file mode when atomically replacing Markdown. |
| tests | minor | `scripts/bundle-release-prune.mjs` | Add negative checks for a missing required peer and relative imports into an omitted package, as identified in prior independent review. |
| tests | minor | `persistent-room-localfiles-secret-floor-smoke.ts` | Exercise fd, case-insensitive and native-platform cases on suitable hosts. |
| style | minor | `apps/web-server/src/persistent-room-workspace-image.ts:117` | Remove the extra blank line at EOF. |

## Evidence and limits

Complete logs, original failure details and isolated reruns, conflict list, full diff, checksums, inventories, archive, source-to-archive-to-desktop comparisons and staged browser scripts/output are in `~/controller-exxperts/evidence/t22-s2-contribution-final-independent-2026-11-10/`. Historical developer evidence is in `~/controller-exxperts/evidence/t22-contribution-finalization-2026-11-10/`; baseline logs and Node version are in `~/controller-exxperts/evidence/t22-series2-final-independent-review/`. This review does not certify the composed tip, native Mac or human preview. The Controller must separately gate the exact Series 1 then Series 2 composition and update its notes and SHAs.
