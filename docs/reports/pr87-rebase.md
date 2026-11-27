# PR 87 implementation evidence

Source PR head `5fcffe1036b2d6f867d6583b29822c4985d36fba`; upstream target `b898e851813b4da0211e6a049e9537160391091f`. The implementation branch starts at that target and contains no fork ancestry. The reviewed spec is at `ba39775b9fe55b2d47075d250fb4783298946317`; the binding amendment review is at `7ff65c77c1a4037ae2d747d87a21c1ca8344992d`. These documents remain on separate local evidence branches.

## Architecture impact

Level 2: four approved routes and three private seams in the existing room-file, preview and local process flows. Implementation remains incomplete.

## Checkpoint

Commits `47d85bf`, `e2af68d`, `8285d25` and `cc3b9e6` contain a public route test, the earlier evidence report, request validation and the no-workspace empty state. The listing route deliberately returns `workspace_unavailable` for configured workspaces until guarded listing is implemented. The public smoke reaches the positive listing assertion and fails there; the traversal and empty-state assertions before it pass. `npm run typecheck:scripts` and `npm run build --prefix runtime` passed. A prior `npm run test:scripts -- ...` ran its fixed default suites before install/runtime build and failed (97 pass, 4 fail); it is not evidence of a product regression. No browser, Mac, Windows, Tester, conformance or CI result is claimed.

Publication remains pending workflow permission; no push has been attempted since the Controller's instruction to wait. The earlier `npm ci` invocation used `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` instead of `EXXETA_SKIP_BROWSER_INSTALL=1`, and the lifecycle invoked the Chromium installer; no download progress appeared, but a download cannot be ruled out. Future installs use the project-specific variable. No screenshots have been captured.

All remaining reviewed acceptance items, including guarded listings and reads, box binding, formats, safe direct dispatch, dependency reconciliation, targeted checks, self-review and clean contribution replay, remain open. The earlier report at `docs/reports/issue-docs/tasks/T87-REBASE.md.md` is fork evidence and must be excluded with this report from the contribution candidate.

## Guarded listing checkpoint and unresolved root identity

On 2026-11-27, upstream main and PR head again matched the pins above. A guarded listing implementation and connection-owned Mac box binding were developed locally; while the route was wired, the public listing smoke passed its positive, nested, hidden-name and link checks, and fake-box route checks passed owner ambiguity, other-conversation refusal, owner invalidation, replacement during a listing, and policy revocation during a listing. The affected `npm run test:scripts -- ...` run passed 103 tests before the final regression was added; both UI and scripts typechecks passed at that checkpoint. The fake dispatcher executes the actual boxed file program on invented fixtures, not a real Mac sandbox; native Mac and Windows remain unmeasured.

A new public-route regression exposed a conflicting requirement: after the folder is renamed away and a different directory is created at the same path *before* a request, the wired route returned the replacement's listing. `room-files.ts:roomFolder` verifies the stored `pathHash` against `hashPersistentRoomPath(real)`, and that function hashes only the path string; `PersistentRoomWorkspaceRootGrant` stores no device/inode identity from the folder selection. Both directories therefore produce the same stored hash, and a snapshot obtained only after the request cannot identify the original folder. Comparing root identity during a request does detect concurrent replacement, but cannot detect a replacement that happened before the server first observes it or across a restart.

The reviewed spec requires replaced roots to fail closed and forbids durable state or another public contract. Detecting this prior replacement while still listing a normal folder requires an authorized source of the originally selected folder's identity, including its lifetime and restart behavior; a new decision or reviewed specification is required. To avoid exposing the known unsafe behavior, the route has been restored to its prior fail-closed `workspace_unavailable` response for configured folders; the guarded seam, binding, and tests remain local work in progress and are not yet a verified or complete implementation. The positive public route smoke is again red by design, and the new before-request replacement assertion remains in the test.

Next independent work after the boundary is resolved: wire the listing route under the accepted identity design, rerun its positive and replacement tests and binding races, and continue the authorized image, preview, open and UI work. No publication, full gate or cross-platform pass is claimed.
