# ADR-0006: Route macOS close shortcuts to workspace tabs

Status: accepted
Date: 2026-11-09
Decided by: Sascha (2026-11-09), option A
Architecture impact: level 3 — desktop main and sandboxed web UI share a new transient close-request contract.

## Context

Issue #16 asks Cmd+W in the packed Mac application to close the active workspace tab, including its existing dirty Markdown guard; with no active workspace tab, the existing window close action applies. T16 architecture review f3a618d found that the issue's claim that no application menu exists is stale: buildAppMenu already installs one, and the main window's ordinary close action hides it to the tray unless quitting. The sandboxed app renderer has no preload IPC. The request must not disclose file paths or contents to the shell.

## Options

### A. Narrow close-request contract for the macOS main window

The desktop shell requests a decision from its own app renderer and uses a handled/unhandled result. A handled active-tab request reuses the same close and dirty-editor flow as the tab's close button. Only an explicit unhandled result invokes the existing main-window close action. Failure must not silently close the window or discard unsaved data. Exercise the actual shell/renderer seam with invented data. This adds a small transient contract and requires lifecycle and failure handling.

### B. Defer the shortcut

Keep normal window closing and avoid the new process boundary, leaving the requested tab shortcut unavailable.

## Decision

Sascha selected option A and approved the flow in the Front agent chat on 2026-11-09. He explicitly waived the clickable fake for this task because no visible design changes. The exact transport and state rules in the companion spec remain subject to fresh architecture review before implementation.

## Consequences

The change spans the desktop main process and web UI. It preserves existing menus, sandbox and navigation policy; it sends no paths, contents or credentials. The integration tests cover real producer and consumer, dirty-prompt outcomes and unavailable renderers. Sascha verifies the packed Mac application separately. Windows and Linux shortcuts are outside this decision. The issue does not block cutting the upstream series; after completion the change is one additional commit at the end of series 1.

## Slicing

One level-3 change after the revised spec passes an independent architecture review. Implement test-first, independent Tester and conformance review, then the normal gate.
