# T4-FRESH-MAIN architecture conformance

Reviewed commit: 96c13fb68b2590c614c55a5e516493fda231b078
Verdict: pass
Architecture impact: level 3 — workspace preview UI, room routes, workspace authorization, isolated parser and the local server-to-OS opener; preview routes, internal exports and dependencies are level-2 elements within that feature.

## Boundary check

| Boundary | Evidence and decision |
| --- | --- |
| Workspace and routes | `remote-route-policy.ts` classifies preview GET as read and Open POST as local. `room-settings-routes.ts` resolves the room, conversation, current read permission and guarded existing file for each request, rechecks before returning or dispatching, and restricts file types. This follows ADR-0002 and ADR-0003. |
| Local host action | ADR-0003 and issue #4 authorize the explicit browser/Electron → local server → OS application flow. The Open route checks loopback address, host, origin, intent header, shared and paired contexts; the fixed POSIX opener uses argument arrays without a shell, and Windows uses a private supervised child. UI confirmation is additional to server authorization. Revalidation reduces but cannot eliminate the documented pathname replacement race. |
| Parsing and display | The route passes guarded files to the existing shelf child with bounded admission, heap and deadlines; Word is rendered in an empty sandbox with restrictive CSP, spreadsheets as React content, and images use the existing workspace-image route. Preview results and tab state are transient; no new durable preview store was found. |
| Exports and dependencies | The Controller's `decisions.md` records the internal `runWorkspacePreviewWorker` and `useConfirmedLocalClientContext` exports, exact ExcelJS 4.4.0, docx-preview 0.4.1, jsdom 26.1.0 and optional Koffi 2.16.2 selections and consumers. New UI component exports are local application modules; no new package-level public export was identified. Worker and bundle imports match these selected uses; no forbidden import was identified in the feature diff. |
| Scope and prior review | The earlier `T4-READY-architecture-spec.md` was a change-spec review of a draft. ADR-0003 and its passing independent `T4-ADR-review-1.md` resolve the level-3 opener decision; later issue #4 decisions authorize XLS/XLSM no-preview with Open, the ExcelJS resource-abort waiver and use of library behavior with known limits. Those later decisions supersede conflicting older draft requirements. |

## Findings

No conformance failure found in this coarse boundary review. The developer report's level-2 label for the whole feature is incorrect: the OS opener makes the feature level 3 under ADR-0003. The independent functional report already records that correction as debt.

## Debt and limits

The independent functional report records missing defense-in-depth Open route test cases, spreadsheet formatting fidelity, the level label and user-facing documentation, and real Windows verification as debt. Windows was tested with simulated adapters; Sascha explicitly waived a real Windows proof for this ticket. Human acceptance of real files and actual OS/Electron opening remains outstanding. Licence-source verification, packaging and release hardening remain separate work. No new logic-edge-case investigation, real opener, real data, external service or full suite was run in this review.

## Verification

Fetched origin and verified the feature branch tip exactly matches the reviewed SHA. Read the issue and comments, accepted ADRs, prior and passing reviews, Controller decisions, task diff and connected route, worker, UI, import and package boundaries. `git diff --check origin/main...96c13fb68b2590c614c55a5e516493fda231b078` passed. The independent Tester reports a passing build, smokes and browser check; that is a separate gate, not a test rerun here.
