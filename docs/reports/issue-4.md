# Issue 4 developer report

## Architecture impact

Level 3: workspace preview and local opening within ADR-0002 and ADR-0003.

## Acceptance checklist

The following checklist covers every Result and Observable acceptance item in [issue #4](https://github.com/bussard76/exxperts/issues/4). Boxes remain unchecked until implementation evidence exists. “Specified” means mapped in this draft, not implemented or independently accepted.

- [ ] R1 — PDF, image, Word and Excel each open in their own right-pane tab beside an open Markdown tab. Proof: B1 and P1–P4 below.
- [ ] R2 — Clicking again activates one existing tab; the tree marks the active file. Proof: B1, including contextual tab identity and stale-response checks.
- [ ] R3 — Any tab closes; active close selects a neighbour; last close closes the pane. Proof: B2, including background close, right neighbour then left, and dirty guards.
- [ ] R4 — Every Excel sheet reachable, sheet switching and two-axis scrolling, calculated results and basic fills/fonts/borders/column widths/number formats. Proof: P2 and B3; no successful partial workbook.
- [ ] R5 — Word text, tables and images retain their basic look. Proof: P3 and B4 through the real child, route and sandboxed browser consumer.
- [ ] R6 — Preview has no edit/save/download control and changes no file. Proof: P1–P4/B5; print and formula-bar controls are also absent. The separately approved explicit external-open action is permitted.
- [ ] A1 — Full build/smokes green, including `workspace-file-preview-smoke` and `workspace-file-tabs-ui-smoke`. Independent Tester/wave own this check after implementation; Developer runs targeted checks only.
- [ ] A2 — Invented workbook with two sheets, fill, bold, set width, number format and cached formula; invented Word heading, coloured run, table and image visibly prove the look. Proof: P2/P3 and B3/B4, generated fixtures, no committed binary.
- [ ] A3 — Formula cells display results, not formulas. Proof: P2/B3 with formatted numeric, string, boolean, error, stale and absent caches.
- [ ] A4 — Sascha tries his real Excel/Word files locally, switches sheets and reactivates tabs on the preview. Human gate only; workers never obtain those files. Electron acceptance also belongs to Sascha.
- [ ] Added signed-off result — A separate header click opens the original file in the OS-assigned application on the server computer; works from local browser and Electron, hidden on paired devices, omitted in Markdown, approved error sentence on failure. Proof: O1–O4/B6, fake opener only; local OS/Electron observation remains human acceptance.
