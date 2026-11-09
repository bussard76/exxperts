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
