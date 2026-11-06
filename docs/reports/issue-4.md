# Issue 4 developer report

## Architecture impact

Level 2: the approved workspace preview route, parsing, dependencies and preview Open action; existing workspace access and read-only boundaries remain in force.

## Acceptance checklist

- [ ] R1: PDF, image, Word and `.xlsx` files open as separate tabs beside Markdown.
- [ ] R2: Reopening activates the existing tab and marks the active tree file.
- [ ] R3: Tabs close; closing the active tab selects a neighbour and closing the last closes the pane.
- [ ] R4: Every workbook sheet is reachable; switching, scrolling, cached results and basic styling work.
- [ ] R5: Word text, tables and images retain their basic look.
- [ ] R6: Previews cannot edit, save or download files.
- [ ] A1: Full build and smokes pass, including both workspace preview smokes (independent Tester and wave); developer runs targeted checks.
- [ ] A2: Invented workbook and Word fixtures prove specified visual features.
- [ ] A3: Formula cells display stored results, not formulas.
- [ ] A4: Sascha checks real Excel and Word files locally, sheet switching and tab reactivation.
- [ ] Approved preview Open button opens the original locally and follows the access and remote-device rules.

Scope assumption: `.xls` and `.xlsm` retain the no-preview sentence and Open button. The 52 old-format tests ended with the scope decision and never existed on main. No binaries or screenshots will be committed; captures, if any, remain untracked under `.build/screenshots/`.

## Progress

- `workspace-markdown-images-smoke.ts` failed on the missing preview route classification, then passed after classifying preview GET as read and Open POST as local. Routes and acceptance items remain incomplete.
- `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` and the runtime build passed; the first smoke attempt could not find the unbuilt runtime. No screenshots captured.
