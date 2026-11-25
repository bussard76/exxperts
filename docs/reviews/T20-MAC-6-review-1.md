# T20-MAC-6 review, round 1

Verdict: unresolved
Reviewed commit: 0050c9a1014cf4ee968ce6523bd6a49e3a3b562d
Gates: build passed; full smoke gate failed, 380/384. Browser flow check: not applicable to MAC-6's assertion-only change as directed.
Ponytail: inspected the full diff inventory and connected native assertion, owner endpoint and Remember code; the complete 52-file behavioral review is not established. No concrete functional defect was demonstrated in the MAC-6 assertion change. The repeated detached smoke timeout leaves the broader detached flow unresolved, so this report does not issue a pass or claim a functional-only fail.

## Scope and baseline audit

The merge-base with current `origin/main` is `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`; merging it into a clean temporary branch at the reviewed SHA was already up to date, with no conflicts. The main diff is mixed: 52 paths including code and scripts. MAC-6 changes only `apps/web-server/scripts/workspace-documents-native-ui-smoke.ts` and `docs/reports/issue-20.md` relative to `b59918f408835cc047a90b12a79643375784e6f6`. The actual immediate parent of 0050c9a is `19ca56aabcb43966ad39aee2256816f03fde7041`; b59918f is the pre-MAC-6 starting head.

Both independent script comparisons against b59918f and `a51e5b98e2cbb443bbe9adf11b6861c7a9bca453` pass: those two baseline scripts are byte-identical, as is every candidate script line outside lines 344–346. Each version has 57 `assert(` occurrences at the same line positions. The sole assertion change requires renderer `child-beforeunload` before `owner-host-adopted` and main `will-navigate` before `webcontents-destroyed` before `browserwindow-closed`, with all five present and the unchanged `defaultPrevented=true` predicate. An independent harness evaluating those actual lines accepted both cross-channel delivery orders and rejected each omitted event, each reversed required edge, and `defaultPrevented=false`. This verifies the authorized predicate, not native execution. MAC-6 is level 1: no product API, dependency, route or data-flow change; the wider T20 diff is level 3 under ADR-0009.

## Spec checklist

The report's I1–I10 and R1–R15 were compared with the frozen spec; the MAC-6 report marks assessment rather than acceptance. The following are evidence limits, not claims that the flows failed. The changed assertion concerns I5/R3/R15 only. The full 52-file change has not received a complete independent behavioral audit in this round.

| Item | Existing evidence / review status |
| --- | --- |
| I1 | Host transfer: detached smoke timed out; unresolved. |
| I2 | Owner uniqueness: detached smoke timed out; unresolved. |
| I3 | Child focus: detached smoke timed out; unresolved. |
| I4 | Child Return: detached/native evidence unresolved. |
| I5 | Native guard and close: authorized ordering predicate verified; native flow unresolved. |
| I6 | Latest save and draft retention: attached checks passed; child/native combinations unresolved. |
| I7 | Bounds and recovery: native evidence unresolved. |
| I8 | Child events and previews: detached smoke timed out; unresolved. |
| I9 | Cross-window drag: native provenance unresolved. |
| I10 | Platform claims remain limited; packed Mac run outstanding. |
| R1 | Complete host: detached smoke timed out; unresolved. |
| R2 | Owner/context fencing: detached smoke timed out; unresolved. |
| R3 | Guarded close: predicate verified; real native execution unresolved. |
| R4 | Context exits: detached smoke timed out; unresolved. |
| R5 | Refusal/deadline: owner fixture failed and native launch unavailable; unresolved. |
| R6 | Late close/abort: native evidence unresolved. |
| R7 | First admission: detached smoke timed out; unresolved. |
| R8 | Save pipeline: attached smokes passed; complete child/native proof unresolved. |
| R9 | Source/conflict transfer: detached smoke timed out; unresolved. |
| R10 | Child keyboard/overlays: detached smoke timed out; unresolved. |
| R11 | Real frame snapshots: detached smoke timed out; unresolved. |
| R12 | Cross-window drag: actual native provenance unresolved. |
| R13 | Registered bounds: native evidence unresolved. |
| R14 | Popup policy/bootstrap: detached smoke timed out; unresolved. |
| R15 | Packed Mac entrypoints: explicitly deferred to separately authorized Mac run. |

## Gate evidence

Recorded commit before and after: `0050c9a1014cf4ee968ce6523bd6a49e3a3b562d`. The required full command `~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` ran once to completion: build passed, 380/384 smokes passed, exit 1, 706 seconds wall time. No `T20_NATIVE_*` variable was set. Despite the non-native instruction, the standard runner itself selected the default `workspace-documents-native-ui-smoke.ts`, which attempted Electron launch and failed before launch. One passing local-files smoke skipped `fd` and a case-insensitive-filesystem case. Full log: `/tmp/t20-mac6-review-gate.log`.

| Smoke | Parallel result | Same-commit isolated result |
| --- | --- | --- |
| `workspace-documents-native-ui-smoke.ts` | fail: Electron executable absent, ENOENT | fail: same ENOENT, 0/1 |
| `workspace-documents-owner-ui-smoke.ts` | fail: owner endpoint absent | fail: same assertion, 0/1 |
| `workspace-detached-documents-ui-smoke.ts` | fail: 300-second timeout, no further diagnostic | fail: 300-second timeout, 0/1; cause unresolved |
| `remember-lines-copy-smoke.ts` | fail: three source-shape assertions | fail: same three assertions, 0/1 |

Each isolated command was `~/controller-exxperts/full-gate.sh bash -c 'npm run smokes -- --jobs 1 <smoke-filename>'`; logs are `/tmp/t20-mac6-isolated-<smoke-filename>.log`. All requested attribution variables were supplied. The full run's isolated HOME made the shim use its local fallback gate implementation, so the full run was not recorded in the Controller journal with the requested attribution; the isolated reruns used the Controller gate. An initial launch failed before the gate started because the isolated home lacked the default shim; no build or smoke ran on that attempt. The original failed full-gate result stands.

## Findings

No concrete functional defect has been established. The repeated detached smoke timeout is unresolved: it supplies neither a passing flow nor enough diagnostic evidence to identify a product defect. The public browser fixture for the owner test does not set the `ExxpertsDesktop` user agent, so the `desktop-app` class required by `App.tsx:1086` is absent; this explains the endpoint assertion without establishing that a real desktop owner fails. The Remember failures are source-shape assertions against changed code and do not alone establish a wrong user-visible result.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | major | `apps/web-server/scripts/workspace-detached-documents-ui-smoke.ts` | Diagnose the repeated 300-second timeout and prove the real detached flows with bounded diagnostics. |
| tests | minor | `apps/web-server/scripts/workspace-documents-owner-ui-smoke.ts:20` | Supply the desktop user-agent fixture before asserting the desktop-only endpoint. |
| tests | minor | `apps/web-server/scripts/remember-lines-copy-smoke.ts:208` | Replace brittle source-shape checks with public behavior checks while retaining the intended outcomes. |
| tests | major | `apps/web-server/scripts/workspace-documents-native-ui-smoke.ts:76` | Supply the authorized Electron prerequisite and run the separately scheduled Mac evidence. |
| tests | minor | `scripts/run-smokes.mjs:101` | Keep test tool discovery isolated from real user data and provision fake or test tools when needed. |

Safety review was limited to the inspected paths: the changed assertion does not render untrusted content or reach external systems, and the inspected fixtures use invented values and loopback fakes. The broader security, secret and outward-effects audit is not complete. No real model API was called, no Docker was used, and no native-mode variables were set.

## Changed paths against origin/main

- `apps/desktop/scripts/documents-owner-refusal.test.mjs`
- `apps/desktop/scripts/documents-refusal.test.mjs`
- `apps/desktop/src/main.ts`
- `apps/desktop/src/window-state.ts`
- `apps/web-server/scripts/remember-job-dialog-smoke.ts`
- `apps/web-server/scripts/sidebar-reopen-ui-smoke.ts`
- `apps/web-server/scripts/two-window-room-ui-smoke.ts`
- `apps/web-server/scripts/workspace-detached-documents-ui-smoke.ts`
- `apps/web-server/scripts/workspace-documents-native-ui-smoke.ts`
- `apps/web-server/scripts/workspace-documents-owner-ui-smoke.ts`
- `apps/web-server/scripts/workspace-file-preview-smoke.ts`
- `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts`
- `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts`
- `apps/web-server/src/room-settings-routes.ts`
- `apps/web-ui/src/App.tsx`
- `apps/web-ui/src/components/MarkdownEditorPane.tsx`
- `apps/web-ui/src/components/MarkdownEditorToolbar.tsx`
- `apps/web-ui/src/components/MarkdownSearchBar.tsx`
- `apps/web-ui/src/components/RoomSessionSection.tsx`
- `apps/web-ui/src/components/RoomSettingsModal.tsx`
- `apps/web-ui/src/components/WorkspaceFileBrowser.tsx`
- `apps/web-ui/src/components/WorkspaceFileTabs.tsx`
- `apps/web-ui/src/components/WorkspaceFramedPreview.tsx`
- `apps/web-ui/src/components/WorkspaceHtmlPreview.tsx`
- `apps/web-ui/src/components/WorkspaceImagePreview.tsx`
- `apps/web-ui/src/components/WorkspacePdfPreview.tsx`
- `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx`
- `apps/web-ui/src/components/WorkspaceTextPreview.tsx`
- `apps/web-ui/src/components/WorkspaceWordPreview.tsx`
- `apps/web-ui/src/components/in-room-chat.tsx`
- `apps/web-ui/src/components/useMarkdownEditorSync.ts`
- `apps/web-ui/src/components/workspace-hover-tooltip.tsx`
- `apps/web-ui/src/docs-window.ts`
- `apps/web-ui/src/excalidraw-frame-entry.ts`
- `apps/web-ui/src/pptx-frame-entry.ts`
- `apps/web-ui/src/styles/43-room-workspace.css`
- `design/t20-detach-window/contracts.md`
- `design/t20-detach-window/front-options.md`
- `design/t20-detach-window/hardening-outline.md`
- `design/t20-detach-window/logic.md`
- `design/t20-detach-window/recovery-strip.md`
- `docs/adr/0009-detached-document-window.md`
- `docs/coordinator.md`
- `docs/dev-workflow.md`
- `docs/reports/T20-C7-baseline-comparison.md`
- `docs/reports/issue-20.md`
- `docs/reviews/T20-C1-COMPAT-architecture-spec.md`
- `docs/reviews/T20-C7-B-AMENDMENT-architecture-spec.md`
- `docs/reviews/T20-C7-IDENTITY-architecture-spec.md`
- `docs/reviews/T20-HARDEN-R2-architecture-spec.md`
- `docs/specs/T20-HARDEN.md`
