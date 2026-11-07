# Issue 8 hardening report

## Architecture impact

Level 2: existing workspace preview/open routes and workbook contract from the accepted implementation; no additional public interfaces or dependencies planned.

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
- [ ] HELD: HTML: hostile content cannot reach app cookies, storage or API; blocked connect, image and form traffic without external requests, including direct-frame URL.
- [ ] HELD: HTML: both remote HTML routes tested; workspace-open for HTML remains local only; compare read identity checking with worker path and report UTF-8 behavior.
- [x] Reported to Controller: scripted HTML can navigate its frame to an external URL carrying document content; CSP does not prevent this. Architect and security reviews also found HTML/HTM host-open expands ADR-0003. Both require Sascha’s level-3 decision; all HTML checks and behavior are held.
- [ ] Targeted typechecks, affected script suites and browser specs through attributed gate pass; merge latest main and rerun affected suites.
- [ ] Self-review each item with its proving test; document changed files, tests, assumptions, screenshots and debt.
- [ ] Independent Tester compares design and runs full gates; wave integrates branch and preview for Sascha (downstream).
- [ ] Sascha acceptance: scripts, Word sizing on screen and native Mac tab/window interactions (downstream).

## Checks and self-review

Pending.

## Files, tests, screenshots and debt candidates

Pending. Screenshots, if needed, remain untracked under `.build/screenshots/`.

## Held for Sascha’s decision

The Controller instructed this worker to leave HTML behavior, host-open scope and HTML security tests untouched. The direct-frame, cookies/storage/API isolation, blocked connect/image/form traffic, remote-route and identity-check work remains open. No tests may send requests outside localhost.
