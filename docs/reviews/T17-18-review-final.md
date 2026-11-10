# T17-18 functional reassessment

Reviewed commit: 028012127b8686ac0215fe30a4f3d3c3bb2af742
Verdict: pass

This is a functional-only verdict under Sascha's two-round reassessment rule, not approval to integrate. The specified Delete table visibility requirement remains unmet: round 2 observed the control disappear in RAW instead of remaining visible and disabled. The action is unsupported in RAW, cannot act on the hidden editor, and its omission does not block RAW editing or task operations or cause data loss; it is carried as a debt candidate and preview acceptance item, not silently treated as compliance.

The independent Architect classified the added `apps/web-ui/src/markdown-raw-tasks.ts` module as level 3. Integration and port remain blocked pending an accepted ADR decided by Sascha, or a revised implementation and independent classification; this functional verdict does not make that decision. No product decision or integration is authorized here.

## Evidence

Both fork issues, the Series 2 addendum, round 1 (`6f70ac7b462d426e30810323578f0eccf954781e`), round 2 (`c7c6ac899865458aa3215ef3020b470bdaa8bd30`), and the independent Architect report (`42bca9d4e9eb09f09a1ae3670c103c7b42742b16`) were read. Issue #18 uses the Controller's reading 1: per-line plain to unchecked to checked to unchecked, and verification of Edit checkboxes. Round 2 reports build and 381/381 smokes passing on this exact commit, with fd-dependent and case-insensitive cases skipped and Windows/macOS cases not applicable on its platform; it exercised the main flows in a browser using invented files and local intercepted requests, including exact RAW bytes, conflict and in-flight saves, task cycles and the selected-table case. No full suite was rerun here.

A fresh UI build passed. The single focused browser smoke attempt did not reach the flows: the local server could not start because `@exxeta/exxperts-runtime/dist/index.js` was not built, and the smoke timed out waiting for server readiness; the subsequent helper smoke in the same command did not run. Thus the browser evidence for this reassessment is round 2's, not a new passing run. Code inspection confirms `MarkdownEditorToolbar.tsx:97` explicitly excludes Delete table when RAW is active. No real model or external service was used in the attempted check.

## Classification of findings

| Prior finding | Classification at reviewed commit | Evidence and disposition |
| --- | --- | --- |
| R1: saved RAW draft normalized, later overwriting formatting | Functional defect on R1 head; resolved at reviewed commit | R2 browser verified saved RAW round trips and later saves, plus Reload, clean polling and discard, preserving exact bytes. |
| R1: task cycle loses markers and treats mixed lines alike | Functional defect on R1 head; resolved at reviewed commit | R2 browser verified repeated per-line mixed and nested task cycling. |
| R1: missing task active state and disabled controls | Functional defect on R1 head; mostly resolved, remaining visibility omission below | R2 verified caret active state and disabled ordinary controls; Delete table remains absent in RAW. |
| R2: Delete table disappears instead of being disabled | Debt candidate, style, minor | A real unmet visibility requirement, but no supported RAW action fails and no table deletion occurs; show it disabled as requested. |
| R2: public coverage of mixed and nested task cycles | Debt candidate, tests, minor | Add committed browser coverage. |
| R2: public coverage of Keep mine, in-flight save and exact external replacement paths | Debt candidate, tests, minor | Add committed browser coverage for the independently exercised cases. |
| R2: fresh-page reload after unchecking Edit checkbox | Debt candidate, tests, minor | Add a reload assertion for `[ ]`. |
| R2: round-1 parallel-only Stop-copy failure | Debt candidate, tests, minor | Investigate timing; passed alone in R1 and in R2's full run. |
| R2: fd and case-insensitive filesystem cases skipped | Debt candidate, tests, minor | Run those cases in an appropriate environment. |

R1's corresponding test debts remain represented above; its Edit-to-unchecked gap and skipped environment cases are retained. The original R2 finding was a major under its original review verdict; its reclassification here follows the instructed two-round functional-only policy and does not amend the requirement.

## Debt candidates and preview acceptance

| Category | Severity | Proposal | Sascha's preview check |
| --- | --- | --- | --- |
| style | minor | Keep Delete table visible and disabled in RAW after selecting a table in Edit, with a browser assertion that the table stays unchanged. | Select a table cell in Edit, switch to RAW, and check whether the missing Delete table control is acceptable for now. |
| tests | minor | Commit browser coverage of mixed and nested task cycling through the toolbar. | Select mixed checked, unchecked and indented lines in RAW and try the task button twice. |
| tests | minor | Commit browser coverage of Keep mine, in-flight edits, external replacement, Reload and discard preserving exact formatting. | Edit a file with unusual Markdown in RAW, create an external conflict, choose Keep mine or Reload, and check the resulting text after switching modes. |
| tests | minor | Assert a fresh reload after unchecking an Edit checkbox preserves `[ ]` in RAW. | Uncheck a task in Edit, reload the page and inspect it in RAW. |
| tests | minor | Investigate and stabilize the R1 parallel-only Stop-copy assertion. | Start and stop a demo room turn and check the displayed stop message. |
| tests | minor | Exercise the skipped fd and case-insensitive filesystem cases on suitable systems. | On a supported system, try finding and renaming a demo workspace file with a case-only name change. |

Preview checks do not replace the missing automated or platform checks, and do not constitute an architecture decision.
