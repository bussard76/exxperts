# T12-R2 architecture spec

Verdict: pass
Spec: GitHub issue #12 at accepted base `a205df66f32ac0fb07b86dfb6e7687850c731658`, as revised by the Controller's round 2 dispatch
Level: 2, confirmed. The accepted base exports `PanelIcon` from `sidebar-collapse.tsx` for `App.tsx`; the Controller accepts that existing seam. This hardening authorizes no additional exports, dependencies, routes, stores, contracts or data flows.
Decision: recorded. Sascha accepted the packed app look and toggle behavior; the Controller accepted the existing export and limited this round to functional defects and tests. No new product or level 3 decision is needed for this scope.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Toggle and empty/maximized states | `App.tsx` room topbar and workbench; `PanelIcon` import from `sidebar-collapse.tsx`; `43-room-workspace.css` | Local React state and CSS; no persistence or server change | Issue #12 specifies button visibility, label, `aria-expanded`, grid, mounted tabs, keyboard and Escape. The existing `rightPaneVisible`, `artifactPaneMaximized` and `rightCollapsed` predicates define the seam. |
| Open a different occupant while folded | `App.tsx` owns `RightPaneOccupant`, selection and fold state | Existing workspace browser, artifact selection and task/attachment actions produce the occupant consumed by the pane | The current key uses only `kind` and optional `path` (`App.tsx:939`); it distinguishes workspace paths but omits artifact `taskId`/`artifact.relativePath` and task-run `taskId`. See binding instructions below. |
| Close, draft and retained content | `App.tsx` workspace tab and asset-row handlers; existing editor and preview modules | Existing dirty-action guard and mounted pane state remain authoritative | Cover last-tab close/reopen, selected asset-row close, guarded dirty switches and retained draft, tabs, scroll and zoom through user-visible flows. No permission or renderer change is authorized. |
| Layout | Existing room workbench CSS and topbar | Browser layout only | Issue #12 requires 1000px, 1600px and phone checks; use clean/default pane-width storage for each. Keep accepted squeezed-width behavior as debt. |
| Privacy and failures | Existing workspace and preview modules and room routes | Existing ADR-0002/0003/0004 access, isolation and failure behavior remains unchanged | Use invented files and fakes, no real services or data. Fold/unfold must not add reads, authorization, server behavior or a new content path; existing errors and guards remain in force. |
| Outside-in evidence and delivery | Issue #12, accepted base, Controller dispatch | Existing UI and real selection-to-render seam | No `design/<feature>/` export, standalone interfaces or logic diagram exists at this base. The issue records Sascha's acceptance of the packed app itself; the Controller explicitly accepts its look and behavior for this defect-only hardening. The issue and code provide the existing interface and state evidence, not an approval for redesign. No parallel implementation split or new shared interface is specified. |

## Prefactoring

None required. Keep the identity and fold transition within the existing `App.tsx` owner; preserve the existing public seam and pane implementations.

## Findings

### Binding Developer instructions

1. Exercise the real selection producer through the rendered pane consumer with invented data. While folded, opening a different workspace file of the same kind, a different artifact `relativePath`, or a different task-run `taskId` unfolds and displays the selected occupant. Artifact identity includes both task ID and relative path, so equal paths in different tasks are distinct. Selecting the already-active occupant is not an opening; retain the existing selected asset-row close action, including its back-to-attachments behavior. Do not infer an open merely from a render or an unrelated update to occupant metadata.
2. Preserve the dirty Markdown guard: a cancelled or failed guarded switch leaves the draft and selected occupant intact; the pending selection proceeds only after the existing successful save or discard path. Folding alone does not invoke the guard or discard the draft. Test the relevant outcomes through the UI.
3. Verify no button without a visible right pane, no stuck collapsed class after closing the last tab, normal reopening, each named pane kind and maximized artifact behavior, as well as the issue's keyboard, Escape, state-retention and layout checks. Use clean/default pane-width storage independently at each viewport; do not change the accepted layout or add persistence.
4. If implementation reveals that a new public seam, dependency, route, store, contract or data flow is required, stop and return to the Controller for architecture review. A producer/consumer integration test must cross the actual selection and rendering seam, not just a mocked identity helper; there is no parallel split or dependency in this task as dispatched.

### Debt candidate

A previously stored wide pane can squeeze the chat column and push existing topbar controls out of sight. The Controller expressly leaves this known case unchanged; it is not a reason to redesign or block this task. Window dragging by the empty tab bar is already accepted.
