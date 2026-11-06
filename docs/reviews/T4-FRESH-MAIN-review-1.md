# T4-FRESH-MAIN review, round 1

Verdict: pass
Reviewed commit: 96c13fb68b2590c614c55a5e516493fda231b078
Gates: pass; build and 377/377 smokes on merge commit `2b6fcbef43efb9c31370a5400dfb39b84a1f7085`, exit 0. The runner reports parts skipped in `persistent-room-localfiles-secret-floor-smoke.ts` and parts requiring another system in `artifact-export-smoke.ts`, `full-access-skills-folder-smoke.ts`, `persistent-room-localfiles-secret-floor-smoke.ts`, and `room-files-routes-smoke.ts`. No smoke failed; no isolated failure reruns were needed.
Browser: pass; independently ran `npx tsx apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts` on that same merge, using invented files and mocked opening.
Ponytail: full diff and connected flows reviewed; no functional finding. The cases below are debt under the functional-only rule. Assumed load: a local interactive user, with multiple simultaneous previews bounded by the server.

The reviewed branch merged cleanly with `origin/main` at `2250823dffee95de9161e3380ad607b8547e8493`. During the gate main moved to `614ec2623b26266a9b78d3787978c5e4d8fcf638`; its only subsequent changes are `docs/coordinator.md` and `docs/dev-workflow.md`, so it changes no tested product code. The diff is mixed: 26 paths include non-Markdown files. `npm ci` ran with normal lifecycle scripts in the full gate.

## Spec checklist

| Requirement | Code | Test or evidence | Status |
| --- | --- | --- | --- |
| R1: PDF, image, Word, XLSX tabs beside Markdown | `apps/web-ui/src/App.tsx`, `apps/web-ui/src/components/Workspace*Preview.tsx` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| R2: repeat click activates tab and marks tree | `App.tsx` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| R3: close, neighbour, last tab and dirty Markdown guard | `App.tsx` | `workspace-file-tabs-ui-smoke.ts` | Pass |
| R4: sheets, scrolling, cached formula results and basic styles | `apps/web-server/src/shelf-parse-worker.mjs`, `WorkspaceSpreadsheetPreview.tsx` | real invented XLSX through route and browser in both preview smokes; known formatting limits below | Pass for exercised scope |
| R5: Word text, table, image and basic look | `shelf-parse-worker.mjs`, `WorkspaceWordPreview.tsx` | invented DOCX route and browser checks | Pass |
| R6: read-only preview | preview components, `room-settings-routes.ts` | browser control assertions; explicit Open is separate and mocked | Pass |
| A1: build and smokes including both preview smokes | build and smoke scripts | 377/377 above | Pass, with runner qualifications above |
| A2: invented styled two-sheet workbook and styled Word with table/image | `workspace-file-preview-smoke.ts`, `workspace-file-tabs-ui-smoke.ts`, `workspace-preview-fixtures.ts` | route and browser fixtures, including a real generated merge | Pass |
| A3: formula stored result, not formula | `shelf-parse-worker.mjs` | route and browser assert `$54.00` from invented formula | Pass |
| A4: Sascha's own Excel and Word files | local preview | reserved for Sascha; worker did not access real data | Pending human acceptance |
| Signed-off Open action, local only | `room-settings-routes.ts`, `workspace-open-worker.mjs`, `remote-route-policy.ts` | fake platform adapters and browser checks | Pass for simulated environments; real Windows/Electron unverified |
| XLS/XLSM no-preview and Open; old DOC guidance | `App.tsx` | `workspace-file-tabs-ui-smoke.ts` | Pass |

## Architecture and safety

The complete feature is level 3 under accepted ADR-0003 because Open crosses the server-to-OS boundary; the preview route, exports and dependencies are level-2 elements within that approved feature. The local action is classified local, requires local request checks and current workspace read permission, re-resolves the file, limits extensions and invokes a fixed opener without a shell. Parsing is in a child, Word HTML in a sandboxed frame with a restrictive CSP, and spreadsheet values are rendered as React text. Fixtures are invented and opening is faked in tests. No real external system or real user data was used in the review. No secret or `.env` change was identified. Public route and browser assertions for cached results and tab activation would fail if those implementations were removed.

## Findings

No functional findings.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/workspace-file-preview-smoke.ts` | Restore the in-scope reference checks for unauthenticated Open, GET, forwarded headers, untrusted Host and duplicate headers with zero opener calls; they were present on `origin/agents/t4` and are absent here. |
| edge-case | minor | `apps/web-server/src/shelf-parse-worker.mjs:805` | Document and improve number-format fidelity: date values display ISO text and the numeric formatter handles only a subset of Excel formats. |
| style | minor | `docs/reports/issue-4.md:5` | Correct the overall feature level to 3, referencing accepted ADR-0003; level 2 applies to the preview elements. |
| tests | minor | `apps/web-server/src/workspace-open-worker.mjs` | Verify the Windows opener on a real Windows host when one is available; current tests simulate it, as Sascha allowed. |
| style | minor | `docs/developer.md` | Record the decided XLS/XLSM no-preview behaviour and accepted workbook limitations in user-facing docs. |

Not checked: Sascha's real-file preview and real OS/Electron opening; no real account, file or application was used. The traceable licence notice sources for `binary`, `buffers` and `chainsaw` were not independently verified in this review if these transitive packages are included in a distributed bundle.
