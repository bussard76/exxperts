# T22 desktop notices — work checklist

## Architecture impact

Level 1: the existing desktop payload pruning module and its test; no new export, dependency, route, store, or data flow.

## Result and observable acceptance

- [x] Preserve `NOTICE`, `runtime/LICENSE`, and `runtime/NOTICE.md` in the existing desktop keep list, retaining all existing keeps and the 2,500 file ceiling.
- [x] Test the public `pruneDesktopPayload` seam against exact source bytes and verify missing required inputs fail, preserving all existing tests.
- [ ] Build a real Linux release from exact Series 2 candidate `a9d1b8b` plus only the desktop product fix in a temporary composition; never merge Series 2 into this branch.
- [ ] Inspect and retain evidence for the pre-prune archive and actual post-prune payload: exact notice bytes, renderer, server and Node notices, required modules, lock and file checks and unchanged ceiling.
- [ ] Run the specified typechecks and affected suites; run applicable browser specs through the attributed gate, and record any retries.
- [ ] Review every binding item and name the proving test or evidence; record files, tests, assumptions, debt and unavailable native macOS and Windows package evidence.
- [ ] Merge current `origin/main`, rerun affected suites and push this branch; do not run the full Developer-stage smoke gate.

## Resolved instruction conflict

`origin/agents/t22-s2-notice-specreview` contains Series 2 product and lock history, not just its review. The requested merge would violate the explicit instruction never to merge Series 2 into this contribution branch. The Controller directed cherry-picking only review commit `1486f8d`; this was done. The pre-existing worktree modification to `package-lock.json` remains untouched and is excluded from commits.
