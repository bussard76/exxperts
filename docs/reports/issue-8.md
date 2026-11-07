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
- [ ] Excel: hidden gridlines and filled cells suppress their gridlines.
- [ ] Word: invented document converts 4.3 mm and other units to rendering sizes; plain numeric sizes stay unchanged; check a very large part for regex performance.
- [ ] Tabs: drag before, after and past end, self-drop, composer drop and unsaved Markdown draft survival.
- [ ] Image: pointer anchored wheel and pinch, 2% and 3200% bounds, show-tab fit, gap-free drag, double-click and buttons.
- [ ] HTML: hostile content cannot reach app cookies, storage or API; blocked connect, image and form traffic without external requests, including direct-frame URL.
- [ ] HTML: both remote HTML routes tested; workspace-open for HTML remains local only; compare read identity checking with worker path and report UTF-8 behavior.
- [ ] Report HTML frame navigation risk to Controller without changing navigation behavior.
- [ ] Targeted typechecks, affected script suites and browser specs through attributed gate pass; merge latest main and rerun affected suites.
- [ ] Self-review each item with its proving test; document changed files, tests, assumptions, screenshots and debt.
- [ ] Independent Tester compares design and runs full gates; wave integrates branch and preview for Sascha (downstream).
- [ ] Sascha acceptance: scripts, Word sizing on screen and native Mac tab/window interactions (downstream).

## Checks and self-review

Pending.

## Files, tests, screenshots and debt candidates

Pending. Screenshots, if needed, remain untracked under `.build/screenshots/`.
