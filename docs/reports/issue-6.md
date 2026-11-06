# Issue 6 — collapsed sidebar

## Architecture impact

Level 1: existing UI rendering and its browser smoke; no new public API, dependency, route, store or data flow.

## Acceptance checklist

- [ ] Result 1: collapse and reopen repeatedly in rooms with and without a workspace folder.
- [ ] Observable 1: UI smoke collapses and reopens twice and fails on the original code.
- [ ] Observable 2: preview: collapse, reopen and see the file tree return.

## Assumptions

The explicitly requested upstream-clean cherry-pick is the implementation; native evidence and local browser evidence are reported separately.
