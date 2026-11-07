# T9 review, round 2

Verdict: pass
Reviewed commit: cad8daef22e2de6eb68b8c4084dd0cfc2b685cb1
Gates: **red** — build passed; parallel smokes 374/377; all three failures passed alone on the same commit. Three parallel failures keep the gate red under the Controller's clarification. No functional defect in the changed preview flows was confirmed, so the functional-only verdict is pass; the red gate remains an integration issue, not a green gate.
Ponytail: full diff and connected code reviewed; no confirmed functional finding. Expected load: a person using local workspace previews, including multiple open tabs.

The reviewed diff is mixed, with non-Markdown paths. Its merge-base with current `origin/main` is `981719c9f54042965f4a5802d5aa897b4f497007`; merging that main into a clean temporary branch from the reviewed head was already up to date. Full gate and all isolated reruns used the reviewed SHA, with the required Controller attribution. Full log: `/tmp/t9-review-2-gate.log`; isolated log: `/tmp/t9-review-2-reruns.log` on this host.

| Parallel smoke | Original result | Same-commit isolated result |
| --- | --- | --- |
| `settings-look-ui-smoke.ts` | Fail: phone scheduled-task settings box timed out | Pass, 32.7s |
| `key-refused-setup-smoke.ts` | Fail: mock sign-in returned 500 | Pass, 19.6s |
| `persistent-room-detached-turn-reattach-smoke.ts` | Fail: stopped-answer copy assertion | Pass, 14.4s |

These are all failures in the completed full log. Their causes are not established; an isolated pass does not prove the parallel failures were harmless. A separate post-gate `workspace-file-tabs-ui-smoke.ts` browser run passed with invented files, and the full run also passed both that test and `workspace-file-preview-smoke.ts`. No Docker, real model API, real account or production system was used for review.

## Spec checklist

| Requirement | Code | Public evidence | Status |
| --- | --- | --- | --- |
| Word pages stack, footer follows body, wide page scrolls | `shelf-parse-worker.mjs` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| Metadata-only changes allowed; content changes detected | `shelf-parse-worker.mjs`, `room-settings-routes.ts` | `workspace-file-preview-smoke.ts` race child | Pass |
| PPTX valid, damaged and 26,214,400-byte limit | `pptx-frame-entry.ts`, `room-settings-routes.ts` | Preview and tabs smokes | Pass |
| Excalidraw zero, one, multiple and deleted frames; invalid data | `excalidraw-frame-entry.ts` | Tabs smoke | Pass |
| Frame zoom, pointer anchoring, limits, drag, controls, tabs, resize and themes | `frame-canvas.ts` | Tabs smoke | Pass |
| Text and JSON, invalid JSON, UTF-8 replacement, 16,777,216-byte limit, literal text | `WorkspaceTextPreview.tsx`, `room-settings-routes.ts` | Preview and tabs smokes | Pass |
| Multiple tabs, hidden tabs, reorder and close during load | `App.tsx`, `WorkspaceFramedPreview.tsx` | Tabs smoke | Pass |
| Opaque frame, blocked network/forms, hostile content and direct frame load | `room-settings-routes.ts`, frame entries | Tabs smoke | Pass; residual self-navigation risk accepted in ADR-0004 |
| Bounded descriptor reads, target and policy revalidation | `room-settings-routes.ts` | Preview smoke race child | Pass |
| Single byte delivery, replay/navigation, cancellation and timeout | `WorkspaceFramedPreview.tsx` | Tabs smoke | Pass |
| Local Open allowlist and authorization; draw.io Open-only | `room-settings-routes.ts`, `App.tsx` | Preview and remote capability smokes; draw.io UI checked by code | Pass by inspection; see test debt |
| Assets, notices, audit, size and desktop | `NOTICE`, `renderer-notices.txt`, `docs/reports/issue-9.md` | Builder's package, size, audit and desktop-build evidence | Reported; actual packaged desktop render and pruned payload remain open |
| Upstream readiness report | `docs/reports/issue-9.md` | Separate integration/coordinator work | Not verified in this review |
| Independent review, architecture conformance, wave and Sascha preview | This review and later stages | Review recorded here | Conformance, integration and preview remain outstanding |

Draw.io rendering is excluded by Sascha's later issue comment. The `.txt` refusal test was changed to `.csv` and a `.txt` success assertion added per his decision; the KaTeX test excludes only the named frame bundles and reports their sizes per his later decision. Both tests retain meaningful assertions.

Level 3 is consistent with ADR-0004: the two pinned renderer dependencies, frame byte flow, explicit Open list and build change are covered. New frame and UI exports/imports stay within the described seams; no unannounced dependency or route was found. Two key tests would fail without the feature: the public text route asserts invented returned text, and the browser test requires the real PPTX frame to render its invented slide. React text and frame tab labels use text rendering; Word sanitization and the sandbox/CSP contain untrusted content. The attacker considered can supply a crafted file or URL but cannot write to the user's machine. Sascha accepted that a redirected frame can carry its one opened file out; replay delivery is blocked. Fixtures inspected are invented, and no secrets or real external-system changes were found.

## Findings

No confirmed functional defect.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts` | Add public browser coverage that `.drawio` and `.dio` show the no-preview sentence and local Open action. |
| tests | minor | `docs/reports/issue-9.md` | Verify renderer display and pruned payload count in a packaged supported desktop build. |
| security | high | `docs/reports/issue-9.md` | Triage the reported dependency audit advisories before release. |
| tests | minor | Full smoke gate | Investigate the three parallel-only failures and establish their causes; keep the full gate red until resolved under the gate rule. |

Preview acceptance for Sascha: check the packaged client render and the accepted frame-navigation risk on a supported desktop, alongside normal preview acceptance. The builder's licence-source gaps and original size measurements are recorded in its report; they were not independently remeasured here.
