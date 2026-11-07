# ADR-0004: Contained workspace file renderers

Status: accepted
Date: 2026-11-07
Decided by: Sascha (2026-11-07), option A
Architecture impact: level 3 — workspace preview routes, opaque renderer frames, parent-to-frame bytes and local OS-open contract

## Context

[Issue #9](https://github.com/bussard76/exxperts/issues/9) and [the T9 architecture spec review](../reviews/T9-architecture-spec.md) identify the new renderer boundary, changed OS-open scope, identity races and repeated frame delivery. Sascha accepted the look at cf043a6 and the issue records his review; the missing design exports and detailed contracts are addressed by that recorded acceptance and this ADR. No visual redesign is approved.

## Options

### A. Contained renderers with bounded delivery (recommended)

Pin `@aiden0z/pptx-renderer` 1.4.0 and `@excalidraw/excalidraw` 0.18.1 in opaque-origin script-enabled frames. Keep external resources, connections and forms blocked, and keep the current frame sandbox and CSP. Parent-side file delivery is limited to one delivery for one preview. The frame can still navigate itself.

### B. Defer the renderers and expanded OS-open scope

Avoid the new frame and host-action boundaries but defer the accepted experience.

## Decision

Option A. Sascha said “Festhalten, weitermachen” on 2026-11-07 in issue #9. He accepted this exact residual risk: "a redirected frame can carry the content of the one opened file outside." No broader host access is approved.

The local-only, explicit OS Open action retains ADR-0003's workspace authorization and guards. Its approved extensions are `.xlsx`, `.xlsm`, `.xls`, `.docx`, `.pdf`, `.html`, `.htm`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, plus `.pptx`, `.excalidraw`, `.txt`, and `.json`. `.drawio` and `.dio` are excluded.

## Consequences

Text and framed bytes are read from a stable descriptor with identity and content metadata checks before and after reading, and current workspace policy and target revalidation. Metadata-only chmod remains accepted. The hard input byte ceilings are 16,777,216 for text and 26,214,400 for framed files; these are input limits, not expanded renderer limits. Oversize returns `file_too_large`; replacement, content change and read failure return `file_changed`. Policy revocation and denied targets remain refused.

The parent fetches only the requested file; the frame signals `frame-ready`, receives its bytes at most once, then responds with `frame-rendered` or `frame-failed`. Repeat ready and later documents cannot request another delivery. The parent checks message source, cancels the fetch when closed, and presents a failure on an absent or stalled renderer rather than loading forever. Direct frame navigation supplies no bytes. Concurrent tabs have independent delivery state. Close, reordering and switching must preserve the accepted UI and not send bytes to another preview. The sandbox retains opaque origin and blocks external fetch, images and forms; frame navigation itself remains possible as stated in the accepted risk.

The current Word, PDF and spreadsheet parser limits and lifecycle remain in force. Existing workspace policies and local authorization remain mandatory. Tests use invented content and real public route and browser seams; packaging and desktop verification remain independent acceptance work.

## Slicing

1. Record this decision and the issue checklist.
2. Add public-route race and bound regressions and implement descriptor reads.
3. Add producer-to-consumer navigation and lifecycle regressions and enforce single delivery and failure timeout.
4. Verify the issue's remaining applicable cases and hand the branch to independent review and conformance.
