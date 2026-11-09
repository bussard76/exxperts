# T16 architecture spec

Verdict: level-3
Spec: [issue #16](https://github.com/bussard76/exxperts/issues/16), read 2026-11-09; repository base `82b5e8cdcd0263de57ee17f93f666e57eb0d6e8a`.
Level: 3, raised from the suggested level 1. The suggested request and answer introduce a desktop-main-to-renderer close-decision protocol and new data flow between modules. An alternative that avoids IPC still needs a way for the desktop shell to learn the renderer's tab state or decision; the issue does not fix that interface. This is neither a single-module change nor an exact diagnosed fix under ADR-0005.
Decision: Sascha must choose and record an accepted ADR before implementation. The Controller should return the issue to specification after that decision and obtain a fresh review. The dispatch permits this reviewer to commit only this findings file; the proposed ADR must be prepared separately by the coordinator's designated owner.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Shortcut and window fallback | Desktop `main.ts`, application menu and focused window | macOS input → main window or other focused Electron window | `buildAppMenu` already installs Edit, View and Window menus; the issue's no-menu diagnosis is stale. `createMainWindow` intercepts normal close and hides the window unless quitting, so define fallback as the existing close action, including hide-to-tray. Preserve other windows' normal close behavior and non-Mac shortcuts. Confirm the actual accelerator behavior in a desktop smoke. |
| Tab and dirty editor | `App.tsx` and `WorkspaceFileTabs` | Renderer state → `requestCloseWorkspaceTab(path)` → existing guard | Active path comes from `rightPaneRef`, and the close guard can defer an action for Save, Discard, or Cancel. A request for an active tab must count as handled even when the prompt is pending, canceled, or saving fails; otherwise fallback can hide a window with unsaved work. Test the real close path and all prompt outcomes. |
| Empty and ambiguous states | `App.tsx` tab state and right pane | Open tab list and active pane can differ | Tabs remain in `workspaceTabs.paths` while another right-pane occupant can make `activeWorkspacePath` null and hide the tab strip. Specify whether this means no active tab and normal window close, or whether a retained tab is selected; the issue only defines an active tab and no tabs. Specify behavior while a dialog is open and on repeated shortcuts. |
| Cross-process interface and failure | Desktop main ↔ sandboxed app renderer | New close request and handled result; no preload exists | Choose the transport and exact request/result fields, correlation, ordering, lifecycle and ownership. Define behavior for page loading, navigation, destroyed window, missing listener, timeout and overlapping requests; failure must not silently discard dirty content. Restrict actions to the intended main app window, and do not send file paths, editor content or credentials. Do not relax sandbox or navigation policy without explicit approval. |
| Outside-in evidence | Issue #16 and `design/README.md` | Existing tab UI, new keyboard behavior and process seam | No `design/<feature>/` export, signed-off interface or logic diagram is present, and the issue is a new wish, not a confirmed defect in agreed behavior. Record the applicable outside-in approval or explicit scope decision, exact interface and state/logic diagram before build; no visual redesign is implied. |
| Integration evidence and ownership | Desktop shell and web UI | Real producer → real consumer → result/fallback | The issue asks separately for desktop smoke and UI tests but does not require a test across the actual shell/renderer seam. Add one that exercises the real producer and consumer with invented data, plus cases for active, no active, dirty and failure behavior. State dependencies and the exact shared interface before any parallel split; one owner may implement both sides. Sascha's packed-Mac check remains separate. |

## Prefactoring

None established before choosing the seam. Reuse the existing close function and dirty guard; no broad tab or window refactor is justified by this issue.

## Findings and decision options

1. **Level-3 decision required.** Option A (recommended): approve a narrowly scoped desktop-main/renderer close-request protocol for the main macOS app window, with explicit handled/unhandled and failure semantics, no file data, and an end-to-end seam test. Option B: defer this behavior and retain normal window closing, avoiding the new cross-process decision. Either choice requires Sascha's decision in an accepted ADR before implementation; this review does not choose for him.
2. **Spec is not buildable yet.** The issue does not contain `## Architecture impact`, select a transport, or define the interface and lifecycle. It also leaves the hidden-tabs state, dialog/repeat behavior, focused auxiliary windows and renderer failure unresolved. Resolve these in the revised spec and align its acceptance tests with the selected ADR.
3. **Evidence gap.** The suggested `before-input-event` and menu alternatives are not equivalent evidence that packaged macOS dispatch works. Preserve the existing menu and close-to-tray behavior and verify the actual input and fallback. The separate UI test must demonstrate that cancel and unsuccessful save do not fall through to window close.

No code or tests were changed, and no test suites were run for this pre-build review.
