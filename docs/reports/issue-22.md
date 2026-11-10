# T22-S2-PORT developer report

## Architecture impact
Level 1: existing Markdown editing module and its internal toolbar, text helper and CSS; no new public API, route, dependency, store or data flow.

## Scope and acceptance checklist
The Controller assigned the product-only RAW/tasks port; issue #22 lock, Node, licence and combined-candidate evidence belong to separate owners.

- [ ] RAW editable, monospaced, sized and scrollable; same dirty, autosave, save, conflict and navigation machinery, with read-only enforcement.
- [ ] Mode switches preserve exact source, including no-change round trips, in-flight edits, Keep mine, Reload and external changes.
- [ ] RAW task button cycles selected lines, indentation and existing bullets; caret active state and disabled unsupported controls.
- [ ] Edit checkbox toggles save both directions and reload in RAW.
- [ ] RAW height >=500px and >= body height minus 60px; checkbox alignment <=3px at 1280x900.
- [ ] Preserve five source changes in order, six-file product scope, existing interfaces and editor-only CSS allowlist.
- [ ] Run targeted typechecks, helper and browser checks through attributed gate; record candidate SHA, checks, assumptions, changed files, tests and debt.

## Preserved work
Before switching, HEAD was fb2ac7aaa5287659ea0da0ec306b60ab60126ac0 and status was `## bussard76/t22-s2-port` with ` M package-lock.json`. At Controller direction the existing lock rewrite was preserved as stash object `3b07619e3a0484a05b55bc1c813f179182efbecf` (named `T22-S2-PORT preserve unowned lock rewrite`); it was not applied to this branch.

## Self-review and evidence
Pending.
