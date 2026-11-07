# T8 review, round 1

Verdict: pass
Reviewed commit: f261964507c5b3f00a2583b9c82ac5c55abdbb69
Merge-base: a36bce1678c743e69672cbc924ba504fcf687340
Gates: **full gate failed**; build passed, 376/377 smokes passed. The failed browser smoke passed once in isolation on the same commit. The failed full-gate result stands and issue #8's green-gate acceptance remains open.
Ponytail: full diff reviewed, including previously unreviewed design-lane commit `9ebc303b0415368db96d69a236f17a987402abc5`. No confirmed Must fix; see debt. Assumed load: local room use by one person, with bounded workspace previews.

## Gate evidence and limits

`origin/main` was merged into a temporary branch from the reviewed head; it was already an ancestor, with no conflicts. The diff is mixed (code, tests and Markdown). The attributed fixed-host-lock gate ran `npm run build && npm run smokes` at the reviewed commit. `workspace-file-tabs-ui-smoke.ts` failed in the parallel run at line 329, waiting 30 seconds for the Discard changes button after cancelling the unsaved Markdown prompt; full log: `/tmp/exxperts-smoke-failures/workspace-file-tabs-ui-smoke.2053320.failed.log`. Its exact same-commit isolated rerun `npm run smokes -- --jobs 1 workspace-file-tabs-ui-smoke.ts` passed (1/1); the cause of the original timeout is unresolved. No other smoke failed. `persistent-room-localfiles-secret-floor-smoke.ts` skipped find cases because `fd` is absent and a case-rename case on this case-sensitive disk; four smokes also named platform-specific cases for another OS. The full log is `/tmp/t8-review-1-gate.log`; isolated log `/tmp/t8-review-1-isolated.log`.

This checkout had a pre-existing modified `package-lock.json` and existing installed dependencies and build artifacts. The lockfile was preserved, and the gate rebuilt the product, but this is not a clean-install/clean-output verification. No implementation files were changed. The browser smoke uses invented files and a fake opener, and the route and remote smokes use local fixtures. The isolated browser pass exercises the changed main flows; native Mac window dragging remains Sascha's acceptance item.

## Spec checklist

| Requirement / result | Implementation | Public proof and status |
| --- | --- | --- |
| Theme, tint and indexed Excel colours; currency, negative/zero, percentage, dates, times and unformatted values | `shelf-parse-worker.mjs` | `workspace-file-preview-smoke.ts --excel-child`, passed within full suite. |
| Excel gridlines, filled cells, sheet headers and grid beyond content | `WorkspaceSpreadsheetPreview.tsx`, `43-room-workspace.css` | Real workbook through browser in `workspace-file-tabs-ui-smoke.ts`, isolated pass; header/grid extension traced in UI. |
| Word measure units, numeric size and large XML | `shelf-parse-worker.mjs` | Real DOCX via `workspace-file-preview-smoke.ts --excel-child`, passed. One 1 MB fixture does not establish worst-case bounds. |
| Tabs reorder before, after, past end and self; composer drop; preserve Markdown draft | `WorkspaceFileTabs.tsx`, `App.tsx` | Browser smoke isolated pass; original parallel run timed out later during the draft prompt, as above. |
| Image pointer/pinch zoom, bounds, hidden fit, drag, double-click and buttons | `WorkspaceImagePreview.tsx` | Browser smoke isolated pass. |
| Scripted HTML, opaque origin, blocked connect/images/forms, including direct frame | `room-settings-routes.ts`, `WorkspaceHtmlPreview.tsx` | Browser smoke isolated pass against local fake receiver. CSP omits same-origin and blocks the stated resource classes; intercepted direct self-navigation remains possible and accepted by ADR-0003. |
| Both HTML GETs, remote policy, local-only open, identity and UTF-8 | `room-settings-routes.ts`, `remote-route-policy.ts` | `remote-capability-smoke.ts` and `workspace-file-preview-smoke.ts --html-race-child` passed; fake opener and invented files. |
| Data and effects | Changed files and tests | Invented fixtures, no secrets found in diff; navigation test intercepts its invented external URL, opener is fake. No real external system used in review tests. |
| Tests and architecture | Changed route, worker and UI | Tests use public routes and browser; e.g. removing colour resolution breaks exact route assertions and removing sandbox/network controls breaks hostile browser assertions. Issue initially states level 2; three independent architecture/security reports raised HTML to level 3, and ADR-0003 records Sascha's dated acceptance and HTML host-open scope. No new dependency identified. Level-3 conformance remains downstream. |
| Integration and acceptance | Controller / Sascha | Full gate remains failed; wave integration, preview, scripted HTML and on-screen Word/Mac acceptance are downstream. |

## Design comparison

Compared the full diff and `9ebc303b0415368db96d69a236f17a987402abc5` with the signed `origin/agents/t4-design:design/workspace-file-previews/` README, tree and six screens. The newer accepted design adds HTML, draggable tabs and pointer zoom controls; the preview header remains visible on paired devices although Open is hidden, and the Word desk is light even in dark mode. The image now has a zoom toolbar and drag/pinch behavior absent from the signed fitted-image screen. The code adds sheet headers and extends the grid as in the signed Excel screen; Word uses a light desk and white pages. Browser assertions checked actual controls and content, but a pixel-by-pixel screenshot comparison of the running app against every signed screen was not performed.

## Findings

No confirmed functional defect. The functional verdict does not turn the failed full gate into a pass; the gate acceptance remains open for normal disposition.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts:329` | Investigate the parallel-only draft-prompt timeout with browser state evidence; retain the failed full-gate result. |
| load | minor | `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx:121` | Bound or virtualize the expanded grid: a valid 100,000-by-1 sheet becomes 1.2 million rendered cells. |
| load | minor | `apps/web-server/src/shelf-parse-worker.mjs:639` | Bound measure conversion work for adversarial large valid Word XML and test through the preview route. |
| edge-case | minor | `apps/web-server/src/shelf-parse-worker.mjs:828` | Preserve optional `#` fractional digits: format `0.##` currently renders value 1 as `1.00`. |
| edge-case | minor | `apps/web-ui/src/components/WorkspaceHtmlPreview.tsx:23` | Show a safe sentence if authorization or the file changes between the successful preflight and frame request instead of displaying the raw error response. |
| style | minor | `apps/web-ui/src/components/WorkspaceHtmlPreview.tsx:5` | Correct the comment claiming every network request is blocked; accepted self-navigation can send a URL. |
| tests | minor | `docs/reviews/T8-review-1.md` | Repeat the full gate from a clean checkout with known installed dependencies and no stale output, then compare running screens with the signed design. |
| edge-case | minor | `apps/web-ui/src/components/WorkspaceFileTabs.tsx` | Add keyboard tab reordering; mouse-only reordering is recorded in issue #8. |
| edge-case | minor | `apps/web-server/src/shelf-parse-worker.mjs` | Track the issue's accepted format limitations: English conventions, coloured format sections, rich cell colours and pattern fills. |
| edge-case | minor | `apps/web-ui/src/App.tsx:8680` | Preserve Word/HTML frame state on tab reorder; reordered frames can reload. |
