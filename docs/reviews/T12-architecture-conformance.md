# T12 architecture conformance

Reviewed commit: dd5d916a7c885a86b20cafef2d0a778f6506a040
Verdict: pass

## Architecture impact

Level 2: the Controller accepted the `PanelIcon` export from `sidebar-collapse.tsx` to `App.tsx` in the passing R2 architecture spec. No additional public export, dependency, route, contract, durable store or production data flow is introduced. No forbidden import was found in the changed files. There is no maintained `ARCHITECTURE.md` baseline; the accepted R2 spec and ADR-0002, ADR-0003 and ADR-0004 supply the relevant boundaries.

## Findings and evidence

No blocking architecture findings. Compared the reviewed commit with main `f919c8a956090cfc7657b1a4d060c4855626d35a` and the accepted base `a205df66f32ac0fb07b86dfb6e7687850c731658`, read issue #12, the R2 spec and the independent R2 review, and traced the changed selection and rendering seams. The production changes are confined to `App.tsx`, the approved icon module and room CSS; no server, route, renderer, authorization, dependency or persistence code changes. Folding uses local React state and CSS with the panes mounted. The occupant key includes workspace path, artifact task ID and relative path, and task-run ID; selection and the existing dirty Markdown guard remain in `App.tsx`. The gallery exception keeps the existing attachments surface available. The identity browser smoke exercises real transcript selection and rendered artifacts with invented data and checks that folding does not trigger an additional artifact read.

The independent Tester passed this exact commit: build and 379/379 smokes, with one partially skipped smoke and platform-specific omissions, plus three post-gate browser flows. This review did not run a full gate; `git diff --check` passed. The earlier memory timeout remains unexplained; the old failed gate did not pass and its cause is not established.

## Debt candidates

- **tests, minor:** A second distinct live task-run selection while folded is not directly exercised because the current UI exposes only one live run; cover it if multiple selectable runs are supported.
- **tests, minor:** Exercise the folded discard and pending selection path directly; the R2 Tester reports the existing guard paths pass but this assertion is absent.
- **edge-case, minor:** Clamp an already stored wide pane on a narrower window; the R2 spec explicitly defers the squeezed chat and controls case.
- **tests, minor:** Capture the maintenance response and visible error if the prior memory timeout recurs, and check the settings flow at preview; do not infer its cause from the later passes.
- **tests, minor:** Exercise skipped find and case-rename cases with `fd` and a case-insensitive disk, and platform-specific omissions on their respective platforms.
