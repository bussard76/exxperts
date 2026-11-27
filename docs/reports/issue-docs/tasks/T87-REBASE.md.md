# T87 implementation checklist

This is the historical first checkpoint. Its unchecked items and blocker below do not describe the current implementation; see [the current PR 87 evidence](../../pr87-rebase.md) for the amended review, acceptance audit, tests and remaining platform limitations.

Source PR head: `5fcffe1036b2d6f867d6583b29822c4985d36fba`; target: `b898e851813b4da0211e6a049e9537160391091f`. Reviewed spec: `339e5d5e9bd4a21bb5e5a3e3e9e31b4153c88700`; review: `3030cfa733e0f712193140fd6584ac7bcf061b0f`.

## Architecture impact

Level 2: four approved existing routes, two private seams, and authorized feature dependencies within the existing room-file, preview and host-local process boundaries.

## Results and observable acceptance

- [ ] Replay the source feature on the pinned upstream target, showing target ancestry and target-relative changes, with no unrelated fork history.
- [ ] Preserve current room policy and guarded box-mediated listings and bounded reads, identity and policy reauthorization, path restrictions and fail-closed outcomes.
- [ ] Restore the four specified HTTP routes, contracts, error states, bounds and local/shared behavior.
- [ ] Preserve all specified formats, worker validation, sandboxing, limits, cancellation, UI states and frame protocols.
- [ ] Resolve and recheck the associated executable and working directory, guard all writable places and dispatch only the exact checked command; refuse unbindable or unsafe associations with zero handoffs.
- [ ] Retain only approved feature dependencies, reconcile the lock and inspect closure, licences, engines and audit.
- [ ] Test public route security, identity, format limits, worker errors and abort; test local open denial and verified handoff; test UI validation and frame messages.
- [ ] Exercise real browser-to-route-to-ExcelJS-to-rendered-cell flow including denial, and real PPTX frame messaging.
- [ ] Run targeted typechecks, affected suites and browser specs via attributed gate; record results and platform gaps.
- [ ] Recheck upstream pins before publication, self-review every binding item and publish the named fork branch; leave Tester, conformance, CI and Front draft work to Controller.

## Blocker and progress

The target creates the Mac `RoomBox` in the connection closure in `room-socket.ts` and passes it directly to file tools. The HTTP routes in `room-settings-routes.ts` have no access to that closure or a registry for the active conversation's box. The reviewed spec requires route context to supply the current box and disallows additional interfaces or data flows; a binding integration design is needed before implementing that seam. The first public route test is committed at `47d85bf` and fails as intended because the route is absent; no product implementation has been made. This report commit is fork evidence, not part of a clean contribution candidate.

Validation: `npm run build --prefix runtime` passed. `node --import tsx apps/web-server/scripts/persistent-room-workspace-default-api-smoke.ts` failed at the new listing assertion as expected. The earlier `npm run test:scripts -- ...` ran fixed default suites as well, before dependencies and runtime artifacts were ready, and failed (97 passed, 4 failed). The upstream pins still matched before publication. No browser, platform, Tester, conformance, CI or Front draft work has been completed.

`npm ci` completed with normal lifecycle scripts, but I used `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` instead of the project-specific `EXXETA_SKIP_BROWSER_INSTALL=1`; its postinstall invoked the Playwright Chromium installer. The command emitted no download progress, but a download cannot be ruled out. Future installs must use the project-specific skip variable.

Files changed: `apps/web-server/scripts/persistent-room-workspace-default-api-smoke.ts` and this report. Test added: the public listing assertion. Assumption: a conversation's socket-local box cannot be safely supplied to an independent HTTP request without a newly specified integration mechanism. Debt candidates and the dependency audit remain unassessed.
