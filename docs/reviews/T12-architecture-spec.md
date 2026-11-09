# T12 architecture spec

Verdict: change-spec
Spec: [issue #12](https://github.com/bussard76/exxperts/issues/12), read 2026-11-09; code base `a205df66f32ac0fb07b86dfb6e7687850c731658`.
Level: 2, raised from the issue's level 1. The already-built `PanelIcon` is a new export from `apps/web-ui/src/sidebar-collapse.tsx`, used by `App.tsx`; AGENTS.md classifies a new public export as level 2. The issue also lacks the required `## Architecture impact` section naming modules and seams.
Decision: Controller must decide the level-2 export and the corrected spec before building. No level-3 decision is indicated for the scoped UI hardening.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Fold, unfold, retain mounted content | `App.tsx` state and `InRoomChatShellView` workbench class; `43-room-workspace.css` | UI state → class → display; no new persistence or server flow | Issue tests 1–3, 5 and 9 describe observable behavior. Closing while folded can be exercised via the existing Escape path, subject to the dirty-editor guard. |
| Open another file or pane | `App.tsx` open handlers and `rightPaneKey` effect | Actual file/row selection → occupant → visibility | `rightPaneKey` uses only `kind` and top-level `path`; artifact viewer and task run use `taskId` and artifact `relativePath`, so another artifact or task of the same kind may remain hidden. See finding 2. |
| Pane kinds, maximize, keyboard, layout | Room topbar, occupant slot and existing responsive CSS | UI interactions and browser layout | Issue tests 6–8 cover the main surfaces. Specify viewport and initial width setup for reproducibility, including how the known squeezed-width exception relates to “nothing unreachable.” |
| Icon | `sidebar-collapse.tsx` → `App.tsx` | `PanelIcon({ side?: "left" | "right" })`, default `left`; `right` mirrors divider | Existing new export crosses a module seam; Controller decision required. Existing left consumers retain the default. |
| Privacy and ownership | Room UI and existing workspace/preview modules | Local transient visibility only; existing file authorization and renderer boundaries remain in place | Invented files and existing fake/test environment; no new file access, external action or persistent collapse setting is specified. ADR-0003 and ADR-0004 remain applicable to previews. |
| Outside-in evidence | Accepted existing room UI | Issue records Sascha's acceptance of the packed app at the named commit | `design/` has no feature export, interfaces or logic diagram for this toggle, so they cannot be compared. `docs/coordinator.md` sends defects in agreed behavior straight to build; this hardening is scoped to defects and tests, not a redesign. Acceptance of the existing look is not evidence of behavior for untested cases. |
| Parallel ownership | Not stated in issue | No new cross-worker interface specified | If work is split, the task must name dependencies and exact shared interfaces and include a test through each real producer and consumer before parallel work starts. No parallel split is assumed here. |

## Prefactoring

None required. The existing room UI owns the collapse state and its rendered seam; retain that ownership and exercise the real browser interactions. Do not introduce a new interface merely to test it.

## Findings

1. **Architecture impact and approval.** Add the required `## Architecture impact` to the task: level 2, UI modules and the `PanelIcon` export/import seam, transient UI-only state and no changed server or preview authorization. Obtain the Controller's level-2 decision; the export already exists at the base commit. If scope expands to a new contract or data flow, reassess before implementation.
2. **Define an actual open across occupant identities.** “Opening another file or pane” must explicitly cover a different artifact or task of the same occupant kind, including the identity fields that distinguish them, and specify whether selecting the already active item counts as opening. The current key ignores `taskId` and `artifact.relativePath`; opening a different artifact through a thread item or a different task row while folded can update the occupant without unfolding it. Add a browser regression through the real selection and rendered pane for each applicable same-kind transition, alongside the workspace-file case. Preserve the established selected-row close behavior and the dirty-draft guard. This is a functional gap in the stated behavior, not a request for a visual redesign.
3. **Make layout acceptance consistent.** The issue acknowledges that a stored wide pane can squeeze the chat and hide the toggle, yet requires “nothing unreachable” at 1000 and 1600 px and phone width. State the initial pane-width/storage conditions and whether those checks exclude the acknowledged squeezed-width case, or include a bounded defect fix. Do not silently weaken an existing test or change Sascha's accepted behavior.
