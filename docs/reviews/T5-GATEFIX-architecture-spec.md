# T5-GATEFIX architecture spec

Verdict: change-spec
Spec: coordinator's T5-GATEFIX dispatch and scope clarification; baseline `origin/main` 397034345dd38e57cb90e2f5666d8b35dff10b1f. Issue #5 is context, not the scope of this review.
Level: 1 proposed for the bounded alternatives below; the dispatch does not record an architecture impact. Confirm level 1 in the build task, naming the affected modules and unchanged interfaces. Reassess if the selected fix adds an export, dependency, contract or new data flow.
Decision: Controller must record the bounded implementation choice and acceptance evidence in the build task. No level-3 decision is indicated by the alternatives reviewed.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Composer mirror alignment | `apps/web-server/scripts/consult-mention-smoke.ts`; Chromium launch and the rendered composer | Smoke captures the real textarea and mirror; no product interface changes are needed for a test-only rasterisation setting. | Diagnosis shows `--disable-lcd-text` passes all four viewport/theme cases with aligned 0 and shifted 1,823 on this host. Specify its scope to this smoke's browser launch and preserve all existing assertions, including `off > 50`, `aligned * 20 < off`, and the 1 CSS px shift. Verify on the target host and other supported Chromium hosts available to the Controller; report unverified hosts. Do not claim it fixes product rendering. |
| Viewer row alignment | `apps/web-ui/src/components/ArtifactViewer.tsx`, `apps/web-ui/src/styles/31-viewer.css`, `34-desktop-app.css`; the existing viewer controls and `room-topbar-ui-smoke.ts` | Button labels, actions, disabled state, maximize/restore state and layout remain the interface; no new route, dependency or data flow is needed. | Choose and bound a remedy in the build spec. The existing open-tab and maximize glyphs use host fallback; removing the 2px padding alone does not fix the observed maximize failure at 125%. A small inline vector matching the existing controls is a candidate, not a proven fix. Preserve both maximize and restore meanings, accessible names and click targets. Verify measured ink alignment with the unchanged smoke at 100% and 125%, sidebar open/hidden, deck and long-name cases; check restore state and appearance on supported environments. |
| Evidence and scope | Existing smoke scripts and rendered UI | Synthetic fixtures and local test server only; no real data or external service. | Retain every assertion and threshold; no skip, tolerance increase, substitution of a mock consumer, or bypass. Focused smokes must pass with real rendered product, then `npm run build && npm run smokes` for integration. Preserve the deliberately shifted negative control and demonstrate it still detects 1px movement. |

## Prefactoring

None is needed. Keep each change local to the existing smoke launch or viewer controls/styles; do not introduce a new shared abstraction or dependency for these two fixes.

## Findings

1. **Build specification incomplete.** The clarified task states the goal and constraints but does not record `## Architecture impact` or choose the viewer remedy and its exact scope. The alternatives have different user-visible effects and the padding-only probe does not establish a complete fix. Record a level-1 impact and a concrete bounded choice with the checks above before building. If experiment disproves that choice, return to the Controller rather than silently broadening it.
2. The available evidence is diagnosis of existing UI and smokes, not a `design/T5-GATEFIX/` export or logic diagram. This is a bounded correction of existing visual behavior, not the issue #5 feature design; issue #5's outside-in evidence does not specify these repairs. The build task should identify the existing controls, expected alignment and negative control as its outside-in evidence, and state any dependency on concurrent changes to those same files. No parallel shared interface or producer/consumer contract was specified in this dispatch; if work is split, fix the shared interface and require an end-to-end smoke through the real producer and consumer.
3. Diagnosis establishes LCD/grayscale differences on this host and confirms the fallback font and padding contribution; it does not establish cross-host portability or isolate the maximize offset. Treat those as validation obligations, not established causes or reasons to weaken checks. Empty, ambiguous and error data states introduce no new interface here; preserve existing disabled and maximize/restore states. No privacy or ownership change is proposed.
