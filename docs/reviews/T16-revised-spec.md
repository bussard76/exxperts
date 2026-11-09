# T16 revised specification for architecture review

Status: proposed; subject to ADR-0006 acceptance and fresh spec review.

## Architecture impact

Level 3: a transient close-decision contract between Electron main and the sandboxed application renderer. One owner implements both sides. No file path, file contents or credentials cross this contract.

## Result

On macOS, Cmd+W when the main application window is focused requests the active workspace tab to close through the same function and dirty Markdown guard as the tab close button. When there is no active workspace tab, use the existing main-window close action, including hide-to-tray behavior. Existing Edit, View, Window and Quit menu behavior remains. Auxiliary windows retain their normal close behavior; Windows and Linux shortcuts remain unchanged. The issue's assertion that an application menu is absent is stale: buildAppMenu exists.

## Proposed interface and states for review

Use the existing main-to-sandboxed-page execution seam, without weakening sandbox or navigation rules. The main process invokes a fixed renderer entry point with no user data. The result is exactly handled or unhandled; missing entry point, rejected execution, navigation, timeout or destroyed renderer is unavailable. The renderer returns handled immediately when an active tab close is requested, including when the dirty guard opens a dialog, is cancelled or a save fails. Only unhandled triggers the existing main-window close action; unavailable does not close or hide the window and may be reported as a bounded diagnostic without document data.

An active tab means the current right-pane occupant identifies a workspace path. Retained but hidden tabs with no active workspace path yield unhandled. While a dirty-close dialog or an earlier close request is pending, further Cmd+W requests are consumed as handled; they do not create another dialog or cause window fallback. A request is scoped to the focused main window and a single document generation; navigation or destruction invalidates its result. The implementation must bound waiting, ignore late results, and serialize or correlate requests so a stale response cannot close a later window.

## Evidence

Write failing tests first. Exercise the actual desktop input producer, renderer entry point and close decision together using invented data: active tab, no active tab, hidden retained tabs, dirty Save/Discard/Cancel and failed save, repeated shortcut/dialog, renderer unavailable/timeout/navigation, auxiliary windows and existing close-to-tray fallback. Independently test the UI path reaches the same close guard as the button. Verify menu behavior and the actual packed Mac shortcut separately; the latter is Sascha's acceptance. Do not touch real documents or send file data across the seam.

## Proposed precise input and lifetime contract (R2 follow-up)

The macOS application menu supplies the Cmd+W accelerator in place of its normal close-window accelerator. The callback checks the currently focused BrowserWindow. If it is an auxiliary window, invoke that window's existing close action; if it is the main application window, issue one close request. Leave other menu roles and other platforms unchanged. The desktop producer test must trigger this actual menu callback/accelerator path; the packed Mac check verifies real key dispatch.

For the main window, the shell allows at most one outstanding request. It records the main-window identity, focused-window identity, a new opaque request nonce, the current document generation and a deadline 1,000 ms from request creation. No tab path or content is passed. The renderer entry point is `window.__exxpertsRequestWorkspaceTabClose()` and returns exactly `"handled"` or `"unhandled"` synchronously. Missing functions, exceptions, other values, timeouts, invalid generation and destroyed windows are unavailable. The fixed shell-generated invocation checks a document-generation token and deadline in the renderer immediately before calling the entry point; an expired or wrong-generation invocation returns unavailable without side effects. The generation token is unique per document, invalidated when navigation begins and established only for the intended main app document. An expired or invalid queued invocation must not call the entry point, even if execution occurs after the shell stopped waiting. The shell ignores late results and permits no unbounded queue of requests. While a request or an existing dirty guard is pending, further shortcuts are consumed; the current pending guard action is never replaced.

Before acting on unhandled, the shell rechecks that the same main window and document generation still exist, that this main window is still focused, and that the request is still current and within the deadline. If any check fails, treat the result as unavailable; only a valid unhandled result invokes the existing main-window close action. A handled result never falls through, including when the guard later cancels or fails. The renderer entry point uses a current-state ref, not a stale closure, and is registered and removed with its owning document. Design diagram: `design/t16-close-shortcut/logic.md`. These exact details are proposed for Architect review, not a claim of outside-in sign-off.

Tests must include a delayed invocation that starts only after its deadline, a delayed result, window/focus switches, navigation and stale generation, invalid return values, and an already active switch/navigate dirty prompt. Verify no late invocation closes a tab and no stale unhandled result closes or hides a window.
