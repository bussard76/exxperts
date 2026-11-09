# T16-R3 architecture spec

Verdict: change-spec
Spec: `docs/reviews/T16-revised-spec.md`, `docs/adr/0006-macos-workspace-tab-close.md` and `design/t16-close-shortcut/logic.md` at `98c363ee719819b91c66da23e90619e5a94389d1`; issue #16 read 2026-11-09. Prior review: `origin/agents/t16-r2-specreview:docs/reviews/T16-R2-architecture-spec.md`.
Level: 3, confirmed. The new transient shell-to-renderer decision changes the process contract and input data flow.
Decision: ADR-0006 is accepted and records Sascha's option A decision and task-specific clickable-fake waiver. The outstanding finding is a technical detail of that option; no additional product decision is established unless its resolution broadens the approved security, platform, or data-flow scope.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| macOS input and fallback | Desktop `main.ts` application menu and main window | Cmd+W menu callback → focused window → request or existing close action | `buildAppMenu` already installs a Window menu; `createMainWindow` prevents ordinary close and hides to tray. The spec fixes the menu accelerator route, auxiliary window close, and preserves other platforms and menu roles. Test the actual callback and fallback; Sascha checks packaged Mac key dispatch. |
| Active, hidden and dirty | Web UI `App.tsx`, `rightPaneRef`, `activeWorkspacePath`, `requestCloseWorkspaceTab`, Markdown guard | Current pane → existing close action or guard | The active-path definition matches the code; retained hidden paths alone are unhandled. Existing `guardMarkdownEditorAction` replaces its pending action, so the new entry point must consume repeats and an already open switch/navigate guard before invoking it. Save, Discard, Cancel and failed save remain handled. |
| Contract, privacy and lifetime | Desktop main ↔ sandboxed app document using `executeJavaScript` | No-argument `window.__exxpertsRequestWorkspaceTabClose()` → synchronous `"handled"`/`"unhandled"`; invalid, missing, failed or expired is unavailable | The 1,000 ms deadline, document generation, one outstanding request, late invocation check and late-result rejection are specified. No file data crosses the seam and no navigation or sandbox relaxation is authorized. Focus invalidation before renderer side effects remains open; see finding. |
| Outside-in evidence | Issue, accepted ADR, revised spec and `design/t16-close-shortcut/logic.md` | Approved existing visible controls and new shortcut state flow | The Mermaid diagram covers the named states and matches the flow. Sascha approved the flow and explicitly waived the clickable fake for this task; no further signoff is needed for that approved flow. |
| Ownership and evidence | One developer owns desktop producer and UI consumer | Actual menu callback → real renderer entry point → guard or fallback | The spec requires a real producer/consumer test with invented data, plus independent UI guard and packed Mac checks. A single owner means no parallel shared-interface dependency is stated. Include delayed invocation and result, navigation, invalid return, window/focus changes, repeats and existing switch/navigate prompt. |

## Prefactoring

None established. Reuse the existing close action and guard, with a document-lifetime registration using current state. Preserve the pending guard action rather than adding another close flow.

## Findings

1. **Design-relevant: focus invalidation does not yet prevent a delayed renderer action.** The diagram says a focus change makes a pending request unavailable, but the fixed invocation checks only generation and deadline before calling the entry point. For example, the main window receives Cmd+W, execution is delayed, the user focuses an auxiliary window, and the invocation runs within 1,000 ms in the original document: it can close a background tab or open its dirty prompt before the shell rejects the result. A shell-only focus recheck before an `"unhandled"` fallback cannot undo that side effect; a current-focus check alone also does not establish invalidation if focus leaves and returns before execution. Specify a buildable way to invalidate the invocation on focus loss before it can act, including leave-and-return, or explicitly resolve that behavior within the approved scope. Require real producer/consumer tests for both sequences, asserting no tab close or prompt and no window fallback. The same guarantee must hold without passing file data or weakening the sandbox/navigation policy.

The generation/deadline check must be effective in the renderer immediately before the entry point, not merely when the shell queues execution; test an invocation delayed past deadline and one invalidated by navigation. No code or tests were changed, and no test suites were run.
