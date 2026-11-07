# Issue 8 hardening report

## Architecture impact

The non-HTML tests add no public interfaces or dependencies. The accepted implementation was described as level 2, but the Architect and security reviews raised level 3 for the HTML navigation and host-open boundaries; their disposition is held for Sascha.

## Baseline and assumptions

- Accepted look baseline: `origin/agents/t4-preview-look` at `9ebc303b0415368db96d69a236f17a987402abc5`.
- Public preview routes and browser interactions are the test seams. Preserve the accepted look and HTML navigation behavior.
- Full build, smokes, independent review, wave integration and native Mac acceptance belong to the Tester, wave and Controller.

## Results and observable acceptance checklist

- [x] Excel: real invented workbook through route resolves theme, tint and indexed colours (`workspace-file-preview-smoke.ts --excel-child`).
- [x] Excel: currency, negative and zero sections, dates, times, percentage and unformatted values (`workspace-file-preview-smoke.ts --excel-child`).
- [x] Excel: hidden gridlines and filled cells suppress their gridlines (`workspace-file-tabs-ui-smoke.ts`).
- [x] Word: 4.3 mm, cm, in, pt, pc, pi and numeric sizes render correctly; a 1 MB XML part completes within the route deadline (`workspace-file-preview-smoke.ts --excel-child`).
- [x] Tabs: drag before, after and past end, self-drop, composer drop and unsaved Markdown draft survival (`workspace-file-tabs-ui-smoke.ts`).
- [x] Image: pointer anchored wheel and pinch, 2% and 3200% bounds, show-tab fit, gap-free drag, double-click and buttons (`workspace-file-tabs-ui-smoke.ts`).
- [x] HTML: `workspace-file-tabs-ui-smoke.ts` verifies opaque-origin cookies, storage and parent isolation plus blocked API, connect, image and form traffic for the embedded and direct frame.
- [x] HTML: `remote-capability-smoke.ts` and `workspace-file-preview-smoke.ts --html-race-child` cover both remote responses, local-only open, descriptor identity and UTF-8 replacement.
- [x] ADR-0003 records Sascha’s decision accepting scripted self-navigation, which the browser test intercepts before sending an invented URL; CSP does not prevent it.
- [x] Targeted typechecks, script tests and browser smoke passed; merged current main (already contained) and reran the changed Excel/Word and browser cases.
- [x] Self-review: each completed item names its test; changed files, tests, assumptions, screenshots, remaining scope and debt are recorded below.
- [ ] Independent Tester compares design and runs full gates; wave integrates branch and preview for Sascha (downstream).
- [ ] Sascha acceptance: scripts, Word sizing on screen and native Mac tab/window interactions (downstream).

## Checks and self-review

- `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts`: passed after merging `origin/main` (already contained).
- `npm run test:scripts`: passed, 54 tests.
- `workspace-file-preview-smoke.ts --excel-child` through attributed gate: passed after merging main. It exercises the public route and real workbook and Word rendering. The complete `workspace-file-preview-smoke.ts` also passed through attributed gate on the same code before the no-op main merge.
- `workspace-file-tabs-ui-smoke.ts` through attributed gate: passed after merging main. It exercises the real UI, route and generated workbooks.
- The checklist above names the test for each completed item. The accepted implementation is retained with no product changes, no new dependencies, no screenshots and no PPTX work. Downstream review and acceptance remain open.
- The large Word fixture covers one 1 MB XML part within the existing route deadline; it does not prove a worst-case regex bound.
- Fresh-worktree setup required building runtime packages and the web UI for the targeted tests. The first preview smoke timed out because runtime build artifacts were absent; after building them its rerun passed.
- `npm ci` ran normal lifecycle scripts with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, but the postinstall printed a Chromium fetch message because this project uses `EXXETA_SKIP_BROWSER_INSTALL=1` for that script. No download progress appeared; the approved project-specific variable was missed.
- Before checkout, an unexpected lockfile modification appeared; it was preserved in the named stash `Preserve pre-existing package-lock changes before T8` and is not part of this branch.

## Files, tests, screenshots and debt candidates

- Changed by this task: `apps/web-server/scripts/workspace-file-preview-smoke.ts`, `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`, and this report. The merged accepted baseline contains the product implementation.
- Added route and browser assertions are listed in the checklist. Fixtures are invented and generated in temporary test homes.
- Screenshots: none.
- Debt candidates from the issue: fixed English number/date conventions; unsupported coloured format sections, rich cell colour and pattern fills; light Word desk in dark mode; frame reload on reorder; no keyboard tab reordering; header also visible without the Open button. The large-part regex test does not establish worst-case runtime.

## Continuation after Sascha’s decision

Sascha decided on 2026-11-07: “Skripte an, Risiko akzeptiert”. The remaining HTML work proceeds under the ADR addendum; tests use invented data and intercept hostile navigation without external requests.

- [x] Record HTML decision and local-only HTML/HTM opening in ADR-0003.
- [x] `workspace-file-tabs-ui-smoke.ts` proves embedded and direct HTML isolation, blocked connections, images and forms, and intercepted self-navigation.
- [x] `remote-capability-smoke.ts` exercises both HTML GETs and local-only open for full and read-only paired devices, hidden room and revoked grant over the local tunnel.
- [x] Match worker descriptor identity and bounded reads; `workspace-file-preview-smoke.ts --html-race-child` verifies replacement refusal and malformed UTF-8 replacement for both GETs.
- [ ] Run targeted checks, merge main, rerun affected suites, complete self-review and push.
