# PR 87 implementation evidence

## Checked open: Linux checkpoint

On 2026-11-27 the read-only upstream PR head and peeled v0.16.2 target again matched `5fcffe1036b2d6f867d6583b29822c4985d36fba` and `b898e851813b4da0211e6a049e9537160391091f`. The canonical reviewed grant amendment and its independent PASS remain at `cf976f79548380add5c8099941b3687305260a24` and `e057ec8e8088a82064b84beea57a50ebd5d4a11c` on the fork. Earlier checkpoint descriptions below are historical where superseded here.

The Linux open route now resolves a deliberately narrow, direct desktop association, canonical executable and explicit working directory, rejects ambiguous or indirect entries, checks current room writable places and rechecks association, guarded file and policy before direct dispatch. `workspace-open-handoff-smoke.ts` uses only invented desktop files, a synthetic executable and fake association lookup/dispatcher: it verifies the checked executable, cwd and argument, and no handoff for changed association, unsafe executable or cwd, ambiguous placeholders and in-flight file changes. The final-lookup change case first failed because a handoff was made, then passed after a post-lookup identity and authorization recheck. A fake unavailable dispatcher first returned 500, then passed with 503 `opener_unavailable`. `workspace-open-refusal-smoke.ts` retains host/origin/proxy/path refusals and instruments the dispatcher to assert zero handoffs; it also fakes the lookup so no real desktop application or association utility is invoked in tests. This is a Linux simulated association and handoff, not an actual desktop application launch.

Linux asks the desktop MIME helper for the file's effective type instead of inferring the association from its extension. A fake-lookup assertion for this first failed while the resolver used a fixed extension map, then passed after the type query; `.drawio` and `.dio` remain on the source allowlist and can proceed only if the effective association meets the same strict checks. macOS and Windows working-directory binding is not implemented and their open requests refuse; neither platform is claimed. The resolver requires further independent security and conformance review. Native boxed browser acceptance, the final item-by-item audit, contribution-only replay and the independent Tester, conformance, CI and Front draft stages remain open. No full gate is claimed.

On Linux, the four affected script suites passed 104/104, both UI and script typechecks passed, and the attributed real-app XLSX and shared PPTX-frame Chromium gates passed. These are targeted Developer checks, not the independent full gate. No screenshots were captured.

The focused handoff smoke also passes policy revocation during the final association query with zero additional handoffs, and a `%u` association with exactly one file URL for the authorized local file. These cases use the same fake resolver and dispatcher and do not launch a real application.

The fake dispatcher additionally verifies 500 `open_failed` on a launch error and 504 `open_timeout` with a stopped child when the launch does not settle; the test shortens only that synthetic timer.

After the required developer skills were made available from the project fork checkout, a public handoff test changed a synthetic executable while its header was being read during the final association lookup. It first failed because the pre-read executable stat was accepted without a post-read stat; the resolver now compares both and refuses the changed association before dispatch. This test uses only a synthetic file and fake dispatcher.

A second synthetic identity test first failed when the executable changed after the last association lookup but during the final guarded room checks. Before dispatch the resolver now synchronously rechecks the canonical desktop entry, executable and working directory against the identity it resolved; the public test then returned `association_unverified` with no additional handoff. This does not establish native macOS or Windows behavior.

The same public route test simulates macOS Launch Services and Windows association APIs using fake native calls. Each case first failed because its platform lookup was absent; the Mac case now queries the default application and bundle executable behind a fake current RoomBox, and the Windows case queries the open command and executable. Both return `association_unverified` with zero handoffs because this implementation cannot verify the actual launch working directory. These are synthetic Linux-hosted API checks, not native platform measurements or valid platform handoff evidence.

The concrete remaining boundary is the launch working directory. The pinned Windows source passes `lpDirectory: null` to `ShellExecuteExW`, while the reviewed spec refuses implicit working-directory forms; `AssocQueryStringW` supplies the command and executable but this implementation has no verified source for an explicit actual `lpDirectory`. The pinned Mac source invokes `/usr/bin/open` without a bound application working directory; the Launch Services application URL and bundle executable do not by themselves establish that directory. No native direct handoff can be claimed until a reviewed, verifiable method establishes the actual directory and binds it to direct dispatch, or Front resolves whether refusing these implicit cases satisfies the intended platform behavior. Both paths currently refuse safely.

The target bundle originally omitted the approved on-demand `koffi` package, `docx-preview` and `exceljs`; new package-retention tests failed before the payload inventory was corrected. The original test rejecting an unconditional `koffi` import remains intact, and the native dependency stays on demand. A targeted `node scripts/bundle-server.mjs --out apps/web-server/dist-t87` then passed (17.3 MB, 4,275 input files); its generated folder was removed. This is a server bundle check, not the full build or the desktop payload-size and platform checks.

The guarded route test initially failed for an invented Linux filename with a colon that is not a URI. The four route validators now retain POSIX names of that form while rejecting URI schemes and Windows colon paths; the public listing, text, image and fake-handoff cases pass, along with URI refusals and a simulated Windows refusal before association lookup. The affected script run passed 106/106.

The same public handoff smoke first failed for an unambiguous literal desktop argument and then passed with that argument preserved alongside exactly one file placeholder. Ambiguous field codes and duplicate placeholders remain refused; the actual argument vector is also passed to each room protection check. The four affected script suites passed 104/104, and the attributed local-action-context Chromium check passed on Linux.

`workspace-listing-box-race-smoke.ts` was extended through the public listing route for owner conversation and connection identity changes, detached owners and reconnection. The conversation and connection checks each initially failed because the prior binding remained usable; the binding now records the connection and invalidates itself on an observed owner or conversation change. Restoring an old identity does not revive the invalidated binding, and a replacement owner can use a freshly registered box. These are simulated Mac ownership checks with a fake box dispatcher, not native Mac acceptance.

## Upstream grant parity decision

Sascha's 2026-11-27 upstream-parity decision supersedes the persistent-identity amendment; Controller authorized spec `cf976f79548380add5c8099941b3687305260a24` and independent PASS `e057ec8e8088a82064b84beea57a50ebd5d4a11c`. Persistent identity, APFS qualification and between-operation same-path replacement detection are deferred to [fork issue #25](https://github.com/bussard76/exxperts/issues/25). Earlier grant-identity refusal and lost-answer evidence remains in this report and branch history; those superseded-only tests and assertions are not acceptance requirements for this migration. The path-only grant deliberately cannot distinguish a replacement at the same canonical path between requests; operation-local identity, policy and RoomBox checks remain required.

`workspace-grant-parity-api-smoke.ts` first failed on the branch-only folder qualification refusal when it attempted a normal invented selection. It additionally requires an older path-only grant, unknown-field normalization and a selected alias to reach the guarded listing; results are recorded as implementation proceeds. Deferred-only evidence is preserved in historical commits: `workspace-grant-identity-api-smoke.ts` at `798e853`, `workspace-location-recovery-ui-smoke.ts` at `3b57654`, the same-path before-request replacement assertion in `persistent-room-workspace-default-api-smoke.ts` at `3b57654`, and the identity-specific no-folder recovery case in `workspace-app-integration-ui-smoke.ts` at `3b57654`. Upstream and unrelated assertions remain in scope.

The parity smoke retains the retired fixture's independent assertions for an absent default without sidecars, an empty listing without a configured policy, and path/realpath redaction on selection and GET. `workspace-location-recovery-ui-smoke.ts` remains for its unrelated failed-read/retry assertion; only the superseded policy-ID identity cases are deferred. The pinned upstream reader treats undecodable policy storage as no normalized policy (`readJson`/normalization return null); the parity smoke checks that GET behavior. This is distinct from a recognized grant whose folder is denied or moved, which the guarded route must return as an error; the superseded assertion that undecodable storage itself yields an error is deferred with the private-identity contract rather than carried forward as an upstream claim.

Restored the pinned grant normalizer, selector, local folder fence and location recovery behavior, and connected local listing to the current policy, folder wait and unique Mac box binding. `workspace-grant-parity-api-smoke.ts` passed normal selection, path-only grant, ignored unknown field and eligible alias on Linux. `workspace-listing-box-refusal-smoke.ts` and `workspace-listing-box-race-smoke.ts` passed with simulated Mac and fake box dispatchers, including ambiguous/missing owners and in-flight invalidation; this is not a native Mac result. The four affected npm script tests passed 104/104. Local preview, image, checked open and the real native boxed browser path remain open.

Local text, image and document previews now use bounded snapshots behind the same selected-root fence, folder wait and current box generation. The box file program returns its own before/after identity and bounded bytes; policy, root and file identity and box ownership are rechecked before parsing and return. The attributed `workspace-local-real-app-ui-smoke.ts` passed on Linux with an invented selected XLSX through the actual app, authenticated route and real ExcelJS worker, then confirmed a revoked grant returns no workbook. `workspace-box-preview-smoke.ts` passed with a simulated Mac and fake dispatcher for the owning box, missing box without host opens, owner/policy invalidation during a read, no parser start after invalidation and owner loss during a synthetic parser result. `workspace-preview-folder-wait-smoke.ts` passed simulated Windows waits both before the read and throughout parsing. The five affected npm script tests passed 105/105, both typechecks and the real shared-frame browser gate passed; native Mac/Windows remain unmeasured. Checked local open and native boxed acceptance remain open.

The bounded read also retains the target's `openedFile` closed-file checks for local host reads and uses the existing `openNoFollow` shared-shelf path. After that adjustment, the six affected npm script tests, including the existing workspace-tools smoke, passed 106/106 and the real Linux app browser check passed again.

### Safe native Mac task for Front

On an isolated Mac test account, check out the final reviewed contribution candidate at its reported SHA, verify it is based on v0.16.2 `b898e851813b4da0211e6a049e9537160391091f`, and use no personal workspace or real provider credentials. Install only with `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` and normal lifecycle scripts; use an already available Chromium and the project's normal sandbox prerequisites. Run `GATE_TASK='T87-REBASE-IMPLEMENTATION' GATE_WORKER='t87-rebase-implementation' GATE_ROLE='Developer' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' gate npx tsx apps/web-server/scripts/workspace-local-real-app-ui-smoke.ts`. That smoke creates a disposable HOME, invented room, workbook and fake provider endpoint; it must exercise a real owning RoomBox and the denial after clearing the grant. Record the exact SHA, macOS version, filesystem/provider, test output and sandbox availability; if the box or browser is unavailable, report the case unmeasured. Do not commit screenshots or binaries; any captures stay under `.build/screenshots/`. Native Mac results are not asserted by the Linux simulated-box checks.

Source PR head `5fcffe1036b2d6f867d6583b29822c4985d36fba`; upstream target `b898e851813b4da0211e6a049e9537160391091f`. The implementation branch starts at that target and contains no fork ancestry. The reviewed spec is at `ba39775b9fe55b2d47075d250fb4783298946317`; the binding amendment review is at `7ff65c77c1a4037ae2d747d87a21c1ca8344992d`. These documents remain on separate local evidence branches.

At checkpoint `d31087a`, `git merge-base --is-ancestor b898e851813b4da0211e6a049e9537160391091f HEAD` succeeded. The target-relative diff excluding the two fork evidence reports contained 69 files; the only changed `docs/` files were those two reports. This demonstrates ancestry and the evidence-file boundary at that checkpoint, not a completed clean contribution replay.

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

## Independent XLSX snapshot parser slice

The configured-root route remains fail-closed while the grant identity decision is pending. Added the approved private snapshot parser path: an already bounded Buffer is copied into a private temporary directory, the existing isolated child parses it with ExcelJS, the parent validates the exact reviewed workbook schema and limits, and temporary files are removed on success, parser failure and cancellation. The worker checks ZIP structure, expansion and checksums, disables network access during rendering, enforces the grid and cell-text bounds, and retains the existing worker process limits and cancellation.

`workspace-spreadsheet-snapshot-smoke.ts` uses invented generated workbooks and checks actual cell values, malformed input, 25 MiB input bound, large grid, oversized cell text, ZIP expansion ratio, two-worker limit, cancellation and temporary-copy cleanup. It failed initially because the seam did not exist; the direct test passed after implementation. Before the final text-limit case was added, `npm run test:scripts -- apps/web-server/scripts/workspace-spreadsheet-snapshot-smoke.ts` passed 101 tests and `npm run typecheck:scripts` passed; rerun results for the final state follow below.

The approved ExcelJS 4.4.0 declarations were added to the root and server manifests. `npm update exceljs --package-lock-only --no-audit --no-fund` resolved the lock without installing packages; original non-feature entries, including platform `libc` fields and runtime nested packages, were restored, and `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed with normal lifecycle scripts. The reconciled ExcelJS closure has 201 lock nodes, including 158 new nodes and no new node outside that closure; it includes `buffers@0.1.1` with no supplied lockfile license field. A lock-only npm audit reported two moderate package findings, ExcelJS and its `uuid@8.3.2` dependency ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)); this is the already identified security debt candidate, with no dependency override. Reconcile and audit the complete feature closure again after the remaining approved dependencies are added.

This does not establish the route, real browser-to-worker-to-UI acceptance path, native Mac or Windows behavior, independent review, conformance, or CI. The root identity regression and the rest of the migration remain open.

Final XLSX slice checks: `EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- apps/web-server/scripts/workspace-spreadsheet-snapshot-smoke.ts` passed 101/101, and `npm run typecheck:scripts` passed. The configured-root listing remains unavailable and its root-identity regression remains unresolved.

## Independent PDF snapshot parser slice

Added PDF to the same private snapshot lifecycle, retaining the two-worker limit, private copy cleanup and cancellation; PDF rendering uses the target's existing pdfjs and canvas dependencies and disables worker network access. The parent validates the source contract, sequential page numbers, JPEG structure and dimensions, pixel and byte limits before returning any page. The invented PDF test exercises real two-page rendering, damaged input, the 200-page limit, the 25 MiB snapshot bound and cancellation; the XLSX snapshot test was rerun after the lifecycle change.

`EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- apps/web-server/scripts/workspace-pdf-snapshot-smoke.ts apps/web-server/scripts/workspace-spreadsheet-snapshot-smoke.ts` passed 102/102, `npm run typecheck:scripts` passed, and the existing `room-shelf-smoke.ts` and `shelf-vision-smoke.ts` passed. The two snapshot smokes also passed directly after the cleanup adjustment. These are Linux parser checks only; the route, browser acceptance, native Mac/Windows, independent review and remaining format/dependency work are still open.

## Independent Word snapshot parser slice

Added the approved Word preview to the same bounded snapshot lifecycle. The worker performs source ZIP and image preflight, blocks network access and external document resources, renders via docx-preview and jsdom, and sanitizes its HTML; the parent requires the source CSP prefix, exact response shape and permitted notice. The invented DOCX test verifies rendered heading and cell, external-resource blocking and notice, script/CSP safety, malformed and oversized input, and cancellation; the original source's bounded diagnostic handling is preserved.

`EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- apps/web-server/scripts/workspace-word-snapshot-smoke.ts apps/web-server/scripts/workspace-pdf-snapshot-smoke.ts apps/web-server/scripts/workspace-spreadsheet-snapshot-smoke.ts` passed 103/103; `npm run typecheck:scripts`, the existing room-shelf smoke, and shelf-vision smoke passed. Added approved `docx-preview@0.4.1` in root and server plus server `jsdom:^29.1.1`; the target root jsdom declaration and its 29.1.1 resolution remain unchanged. Lock reconciliation added only `docx-preview` and preserved all existing package records; a normal `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed. A lock-only npm audit still reports two moderate package entries, ExcelJS and uuid, with no new Word-specific finding. Full closure reconciliation after the remaining feature dependencies, browser acceptance, native Mac/Windows, independent review and CI remain open.

Additional independent parser evidence: the XLSX smoke now checks the 1904 date system, formatted formula result, merge and bold styling. The Word smoke also preserves the source VML assertions for page, header, footer, anchor and image layout while rejecting active VML, and checks the 40-million-pixel embedded-image limit. `EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- apps/web-server/scripts/workspace-word-snapshot-smoke.ts apps/web-server/scripts/workspace-spreadsheet-snapshot-smoke.ts` passed 102/102 and `npm run typecheck:scripts` passed. Timeout-specific cleanup, real browser paths and native platform checks remain unmeasured.

Worker-response validation checks now exercise the private snapshot entry points with fabricated child replies: invalid workbook shape, malformed JPEG, unsafe Word HTML and unexpected error fields all fail closed. The XLSX smoke also verifies the encrypted ZIP refusal. The targeted run covering these checks passed 102/102 and `npm run typecheck:scripts` passed.

A `gate --help` discovery command was inadvertently run without the required attribution variables; the shim attempted to execute `--help` as a program and returned ENOENT, so it ran no test. All subsequent gate invocations must carry the exact required task/worker/role/agent/model assignments.

## Isolated spreadsheet consumer

Restored the source spreadsheet preview component with its exact workbook, notice and response-identity validation. A direct component browser test feeds it a workbook from the real snapshot worker through an intercepted invented API response; it verifies rendering, wrong-room and malformed-schema refusal, empty-sheet behavior, and that the old file is hidden while a different path loads. The last check first failed against the pinned source component and now passes after tying displayed state to the current room, conversation and path. The component is not yet wired into the app; styles and the real browser-to-route-to-worker acceptance path remain open.

The attributed targeted browser gate passed after two development failures: the first was a test-harness readiness check incorrectly probing Vite's proxied health route; the second was the expected missing-component red test. A further attributed gate exposed the stale-display assertion before the fix and passed afterward. `npx tsc --noEmit -p apps/web-ui/tsconfig.json` and `npm run typecheck:scripts` passed. No full gate, native platform or screenshot claim is made.

## Isolated PDF and Word consumers

Restored the source PDF and Word preview components and added current room/conversation/path state guards so previously rendered content is hidden as a different file loads. An attributed Chromium component gate checks PDF page rendering, Word's opaque sandbox and external-resource notice, identity and malformed-schema refusal, and stale-content hiding; it passed after the expected missing-component and stale-display red runs. The harness uses invented intercepted responses, so it is not a real route acceptance check. Both UI and scripts typechecks passed; app wiring, styles, real route/worker browser acceptance, native platforms and independent review remain open.

## Isolated text and HTML consumers

Restored the text and HTML preview consumers and added response identity, schema and UTF-8 byte-bound checks; both hide old content during a path change. The attributed Chromium component gate passed JSON formatting, HTML sandbox attribute, wrong-room refusal, stale-content hiding and over-limit multibyte text/HTML refusal using invented intercepted responses. Its expected red runs included missing components, stale text and an over-limit byte-count case; UI and scripts typechecks passed. The harness does not exercise the real server's HTML CSP or the protected route, and app wiring, browser acceptance and native platform checks remain open.

## Isolated image consumer

Restored the source image preview with stale-image hiding and checks for an allowed image MIME type and the 20 MiB limit before creating an object URL. The attributed Chromium component gate passed image decoding, zoom control, path-change hiding, wrong-MIME refusal and oversize refusal with invented intercepted responses; expected red runs covered the missing component and stale image. Both UI and scripts typechecks passed. The component is not wired into the app, and the actual image route, its security headers and real browser-to-route behavior remain untested.

## Isolated PPTX frame consumer

Restored the source PPTX frame entry and component, with stale-frame hiding and the 25 MiB byte bound. The attributed Chromium component gate bundled the actual renderer into an opaque sandboxed frame and rendered an invented slide; it verified `frame-ready`/byte transfer/`frame-rendered`, one transfer after repeated ready, rejection of unrelated window messages, stale-frame hiding, frame failure, the timeout notice and oversize refusal. The API and frame document were intercepted for this isolated test; it does not establish the real route or the app's bundled frame output.

Added the approved UI `@aiden0z/pptx-renderer@1.4.0` and its supplied license/notice files. Lock reconciliation added six nodes, all in its 19-node closure, and preserved every pre-existing package record; `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed with normal lifecycle scripts. The lock-only npm audit still reports two moderate package entries (ExcelJS and uuid). The targeted UI-only Vite build passed, the restored source notice tests passed 2/2, `EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- scripts/pptx-notice.test.mjs` passed 102/102, and UI/scripts typechecks passed. This build did not wire the frame component into the app, so it does not prove that the real app emits the renderer bundle. Root identity, app integration, real protected-route browser acceptance, native platforms and independent review remain open.

## Isolated file-tree consumer

Restored the source file-tree consumer and its tooltip and drag helpers. Its listing client now validates the response room, conversation, path, root and entry fields before use, including rejecting paths outside the requested directory; the tree hides the previous room's entries while a new room loads. The attributed Chromium component gate passed expansion, nested selection, wrong-room and invalid-path refusal, stale-room hiding, and distinct empty and unconfigured states, using invented intercepted responses. UI and scripts typechecks passed before the final test-only additions, and the expanded browser check passed; the real listing route remains closed and app wiring and full acceptance remain open.

## Isolated file tabs

Restored the source file tabs and workspace stylesheet for later app integration. The attributed Chromium component gate exercised selection, drag reorder and closing with the source stylesheet, and both UI and scripts typechecks passed. The stylesheet is not imported into the app yet because its sidebar rules depend on the accompanying integration; real app layout and protected-route acceptance remain open.

The snapshot validation smoke now also uses a deliberately stalled fake child and an accelerated worker timer to verify timeout and in-flight cancellation kill the child and remove the private temporary copy. `EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- apps/web-server/scripts/workspace-snapshot-validation-smoke.ts` passed 101/101 and `npm run typecheck:scripts` passed. This exercises the lifecycle with a fake child; a real worker running to its full timeout has not been measured.

The server now declares the approved optional `koffi@2.16.2`; the target root declaration and already locked 2.16.2 resolution remain unchanged. `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` passed, and a local Node assertion verified the server declaration, locked version and native module load on Linux. The lock-only audit remained at two moderate package entries (ExcelJS and uuid); this does not verify Windows or macOS association resolution or complete the final feature-closure audit.

## Current approved feature dependency closure

This inventory traverses the reconciled lock from the five approved feature roots (`exceljs`, `docx-preview`, `jsdom`, `koffi`, and `@aiden0z/pptx-renderer`), including optional dependencies. It records supplied lock metadata, not a legal conclusion; `NOT SUPPLIED` means the lock does not state a license. The target declares Node `>=20.6.0`, while its retained jsdom 29.1.1 requires `^20.19.0 || ^22.13.0 || >=24.0.0`, so the pre-existing engine-floor mismatch remains a debt candidate. The latest lock-only audit after all five direct roots were reconciled reports two moderate package entries, ExcelJS and uuid, for GHSA-w5hq-g745-h8pq. This inventory does not establish later CI or release results.

Closure: 247 lock nodes; unresolved: none.

| Lock path | Version | Supplied license | Engines |
| --- | --- | --- | --- |
| `node_modules/@aiden0z/pptx-renderer` | 1.4.0 | Apache-2.0 | `{}` |
| `node_modules/@asamuzakjp/css-color` | 5.1.11 | MIT | `{"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}` |
| `node_modules/@asamuzakjp/dom-selector` | 7.1.1 | MIT | `{"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}` |
| `node_modules/@asamuzakjp/generational-cache` | 1.0.1 | MIT | `{"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}` |
| `node_modules/@asamuzakjp/nwsapi` | 2.3.9 | MIT | `{}` |
| `node_modules/@bramus/specificity` | 2.4.2 | MIT | `{}` |
| `node_modules/@csstools/color-helpers` | 6.1.0 | MIT-0 | `{"node":">=20.19.0"}` |
| `node_modules/@csstools/css-calc` | 3.2.1 | MIT | `{"node":">=20.19.0"}` |
| `node_modules/@csstools/css-color-parser` | 4.1.9 | MIT | `{"node":">=20.19.0"}` |
| `node_modules/@csstools/css-parser-algorithms` | 4.0.0 | MIT | `{"node":">=20.19.0"}` |
| `node_modules/@csstools/css-syntax-patches-for-csstree` | 1.1.6 | MIT-0 | `{}` |
| `node_modules/@csstools/css-tokenizer` | 4.0.0 | MIT | `{"node":">=20.19.0"}` |
| `node_modules/@exodus/bytes` | 1.15.1 | MIT | `{"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}` |
| `node_modules/@fast-csv/format` | 4.3.5 | MIT | `{}` |
| `node_modules/@fast-csv/format/node_modules/@types/node` | 14.18.63 | MIT | `{}` |
| `node_modules/@fast-csv/parse` | 4.3.6 | MIT | `{}` |
| `node_modules/@fast-csv/parse/node_modules/@types/node` | 14.18.63 | MIT | `{}` |
| `node_modules/archiver` | 5.3.2 | MIT | `{"node":">= 10"}` |
| `node_modules/archiver-utils` | 2.1.0 | MIT | `{"node":">= 6"}` |
| `node_modules/archiver-utils/node_modules/balanced-match` | 1.0.2 | MIT | `{}` |
| `node_modules/archiver-utils/node_modules/brace-expansion` | 1.1.22 | MIT | `{}` |
| `node_modules/archiver-utils/node_modules/glob` | 7.2.3 | ISC | `{"node":"*"}` |
| `node_modules/archiver-utils/node_modules/minimatch` | 3.1.5 | ISC | `{"node":"*"}` |
| `node_modules/archiver-utils/node_modules/readable-stream` | 2.3.8 | MIT | `{}` |
| `node_modules/archiver-utils/node_modules/safe-buffer` | 5.1.2 | MIT | `{}` |
| `node_modules/archiver-utils/node_modules/string_decoder` | 1.1.1 | MIT | `{}` |
| `node_modules/array-buffer-byte-length` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/arraybuffer.prototype.slice` | 1.0.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/async` | 3.2.6 | MIT | `{}` |
| `node_modules/async-function` | 1.0.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/available-typed-arrays` | 1.0.7 | MIT | `{"node":">= 0.4"}` |
| `node_modules/base64-js` | 1.5.1 | MIT | `{}` |
| `node_modules/bidi-js` | 1.0.3 | MIT | `{}` |
| `node_modules/big-integer` | 1.6.52 | Unlicense | `{"node":">=0.6"}` |
| `node_modules/binary` | 0.3.0 | MIT | `{"node":"*"}` |
| `node_modules/bl` | 4.1.0 | MIT | `{}` |
| `node_modules/bluebird` | 3.4.7 | MIT | `{}` |
| `node_modules/buffer` | 5.7.1 | MIT | `{}` |
| `node_modules/buffer-crc32` | 0.2.13 | MIT | `{"node":"*"}` |
| `node_modules/buffer-indexof-polyfill` | 1.0.2 | MIT | `{"node":">=0.10"}` |
| `node_modules/buffers` | 0.1.1 | NOT SUPPLIED | `{"node":">=0.2.0"}` |
| `node_modules/call-bind` | 1.0.9 | MIT | `{"node":">= 0.4"}` |
| `node_modules/call-bind-apply-helpers` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/call-bound` | 1.0.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/chainsaw` | 0.1.0 | MIT/X11 | `{"node":"*"}` |
| `node_modules/compress-commons` | 4.1.2 | MIT | `{"node":">= 10"}` |
| `node_modules/concat-map` | 0.0.1 | MIT | `{}` |
| `node_modules/core-util-is` | 1.0.3 | MIT | `{}` |
| `node_modules/crc-32` | 1.2.2 | Apache-2.0 | `{"node":">=0.8"}` |
| `node_modules/crc32-stream` | 4.0.3 | MIT | `{"node":">= 10"}` |
| `node_modules/css-tree` | 3.2.1 | MIT | `{"node":"^10 || ^12.20.0 || ^14.13.0 || >=15.0.0"}` |
| `node_modules/data-urls` | 7.0.0 | MIT | `{"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}` |
| `node_modules/data-view-buffer` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/data-view-byte-length` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/data-view-byte-offset` | 1.0.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/dayjs` | 1.11.21 | MIT | `{}` |
| `node_modules/decimal.js` | 10.6.0 | MIT | `{}` |
| `node_modules/define-data-property` | 1.1.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/define-properties` | 1.2.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/docx-preview` | 0.4.1 | Apache-2.0 | `{}` |
| `node_modules/dunder-proto` | 1.0.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/duplexer2` | 0.1.4 | BSD-3-Clause | `{}` |
| `node_modules/duplexer2/node_modules/readable-stream` | 2.3.8 | MIT | `{}` |
| `node_modules/duplexer2/node_modules/safe-buffer` | 5.1.2 | MIT | `{}` |
| `node_modules/duplexer2/node_modules/string_decoder` | 1.1.1 | MIT | `{}` |
| `node_modules/echarts` | 6.1.0 | Apache-2.0 | `{}` |
| `node_modules/echarts/node_modules/tslib` | 2.3.0 | 0BSD | `{}` |
| `node_modules/end-of-stream` | 1.4.5 | MIT | `{}` |
| `node_modules/es-abstract` | 1.24.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/es-abstract-get` | 1.0.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/es-define-property` | 1.0.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/es-errors` | 1.3.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/es-object-atoms` | 1.1.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/es-set-tostringtag` | 2.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/es-to-primitive` | 1.3.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/exceljs` | 4.4.0 | MIT | `{"node":">=8.3.0"}` |
| `node_modules/exceljs/node_modules/saxes` | 5.0.1 | ISC | `{"node":">=10"}` |
| `node_modules/exceljs/node_modules/uuid` | 8.3.2 | MIT | `{}` |
| `node_modules/fast-csv` | 4.3.6 | MIT | `{"node":">=10.0.0"}` |
| `node_modules/for-each` | 0.3.5 | MIT | `{"node":">= 0.4"}` |
| `node_modules/fs-constants` | 1.0.0 | MIT | `{}` |
| `node_modules/fs.realpath` | 1.0.0 | ISC | `{}` |
| `node_modules/fstream` | 1.0.12 | ISC | `{"node":">=0.6"}` |
| `node_modules/function-bind` | 1.1.2 | MIT | `{}` |
| `node_modules/function.prototype.name` | 1.2.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/functions-have-names` | 1.2.3 | MIT | `{}` |
| `node_modules/generator-function` | 2.0.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/get-intrinsic` | 1.3.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/get-proto` | 1.0.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/get-symbol-description` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/globalthis` | 1.0.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/gopd` | 1.2.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/graceful-fs` | 4.2.11 | ISC | `{}` |
| `node_modules/has-bigints` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/has-property-descriptors` | 1.0.2 | MIT | `{}` |
| `node_modules/has-proto` | 1.2.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/has-symbols` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/has-tostringtag` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/hasown` | 2.0.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/html-encoding-sniffer` | 6.0.0 | MIT | `{"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}` |
| `node_modules/ieee754` | 1.2.1 | BSD-3-Clause | `{}` |
| `node_modules/immediate` | 3.0.6 | MIT | `{}` |
| `node_modules/inflight` | 1.0.6 | ISC | `{}` |
| `node_modules/inherits` | 2.0.4 | ISC | `{}` |
| `node_modules/internal-slot` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-array-buffer` | 3.0.5 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-async-function` | 2.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-bigint` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-boolean-object` | 1.2.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-callable` | 1.2.7 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-data-view` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-date-object` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-document.all` | 1.0.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-finalizationregistry` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-generator-function` | 1.1.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-map` | 2.0.3 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-negative-zero` | 2.0.3 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-number-object` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-potential-custom-element-name` | 1.0.1 | MIT | `{}` |
| `node_modules/is-regex` | 1.2.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-set` | 2.0.3 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-shared-array-buffer` | 1.0.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-string` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-symbol` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-typed-array` | 1.1.15 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-weakmap` | 2.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-weakref` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/is-weakset` | 2.0.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/isarray` | 1.0.0 | MIT | `{}` |
| `node_modules/jsdom` | 29.1.1 | MIT | `{"node":"^20.19.0 || ^22.13.0 || >=24.0.0"}` |
| `node_modules/jsdom/node_modules/entities` | 8.0.0 | BSD-2-Clause | `{"node":">=20.19.0"}` |
| `node_modules/jsdom/node_modules/parse5` | 8.0.1 | MIT | `{}` |
| `node_modules/jszip` | 3.10.1 | (MIT OR GPL-3.0-or-later) | `{}` |
| `node_modules/jszip/node_modules/readable-stream` | 2.3.8 | MIT | `{}` |
| `node_modules/jszip/node_modules/safe-buffer` | 5.1.2 | MIT | `{}` |
| `node_modules/jszip/node_modules/string_decoder` | 1.1.1 | MIT | `{}` |
| `node_modules/koffi` | 2.16.2 | MIT | `{}` |
| `node_modules/lazystream` | 1.0.1 | MIT | `{"node":">= 0.6.3"}` |
| `node_modules/lazystream/node_modules/readable-stream` | 2.3.8 | MIT | `{}` |
| `node_modules/lazystream/node_modules/safe-buffer` | 5.1.2 | MIT | `{}` |
| `node_modules/lazystream/node_modules/string_decoder` | 1.1.1 | MIT | `{}` |
| `node_modules/lie` | 3.3.0 | MIT | `{}` |
| `node_modules/listenercount` | 1.0.1 | ISC | `{}` |
| `node_modules/lodash.defaults` | 4.2.0 | MIT | `{}` |
| `node_modules/lodash.difference` | 4.5.0 | MIT | `{}` |
| `node_modules/lodash.escaperegexp` | 4.1.2 | MIT | `{}` |
| `node_modules/lodash.flatten` | 4.4.0 | MIT | `{}` |
| `node_modules/lodash.groupby` | 4.6.0 | MIT | `{}` |
| `node_modules/lodash.isboolean` | 3.0.3 | MIT | `{}` |
| `node_modules/lodash.isequal` | 4.5.0 | MIT | `{}` |
| `node_modules/lodash.isfunction` | 3.0.9 | MIT | `{}` |
| `node_modules/lodash.isnil` | 4.0.0 | MIT | `{}` |
| `node_modules/lodash.isplainobject` | 4.0.6 | MIT | `{}` |
| `node_modules/lodash.isundefined` | 3.0.1 | MIT | `{}` |
| `node_modules/lodash.union` | 4.6.0 | MIT | `{}` |
| `node_modules/lodash.uniq` | 4.5.0 | MIT | `{}` |
| `node_modules/lru-cache` | 11.3.6 | BlueOak-1.0.0 | `{"node":"20 || >=22"}` |
| `node_modules/math-intrinsics` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/mdn-data` | 2.27.1 | CC0-1.0 | `{}` |
| `node_modules/minimist` | 1.2.8 | MIT | `{}` |
| `node_modules/mkdirp` | 0.5.6 | MIT | `{}` |
| `node_modules/mtx-decompressor` | 1.9.0 | MPL-2.0 | `{}` |
| `node_modules/normalize-path` | 3.0.0 | MIT | `{"node":">=0.10.0"}` |
| `node_modules/object-inspect` | 1.13.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/object-keys` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/object.assign` | 4.1.7 | MIT | `{"node":">= 0.4"}` |
| `node_modules/once` | 1.4.0 | ISC | `{}` |
| `node_modules/own-keys` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/pako` | 1.0.11 | (MIT AND Zlib) | `{}` |
| `node_modules/path-is-absolute` | 1.0.1 | MIT | `{"node":">=0.10.0"}` |
| `node_modules/possible-typed-array-names` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/process-nextick-args` | 2.0.1 | MIT | `{}` |
| `node_modules/punycode` | 2.3.1 | MIT | `{"node":">=6"}` |
| `node_modules/readable-stream` | 3.6.2 | MIT | `{"node":">= 6"}` |
| `node_modules/readdir-glob` | 1.1.3 | Apache-2.0 | `{}` |
| `node_modules/readdir-glob/node_modules/balanced-match` | 1.0.2 | MIT | `{}` |
| `node_modules/readdir-glob/node_modules/brace-expansion` | 2.1.8 | MIT | `{}` |
| `node_modules/readdir-glob/node_modules/minimatch` | 5.1.9 | ISC | `{"node":">=10"}` |
| `node_modules/reflect.getprototypeof` | 1.0.10 | MIT | `{"node":">= 0.4"}` |
| `node_modules/regexp.prototype.flags` | 1.5.4 | MIT | `{"node":">= 0.4"}` |
| `node_modules/require-from-string` | 2.0.2 | MIT | `{"node":">=0.10.0"}` |
| `node_modules/rimraf` | 2.7.1 | ISC | `{}` |
| `node_modules/rimraf/node_modules/balanced-match` | 1.0.2 | MIT | `{}` |
| `node_modules/rimraf/node_modules/brace-expansion` | 1.1.22 | MIT | `{}` |
| `node_modules/rimraf/node_modules/glob` | 7.2.3 | ISC | `{"node":"*"}` |
| `node_modules/rimraf/node_modules/minimatch` | 3.1.5 | ISC | `{"node":"*"}` |
| `node_modules/safe-array-concat` | 1.1.4 | MIT | `{"node":">=0.4"}` |
| `node_modules/safe-array-concat/node_modules/isarray` | 2.0.5 | MIT | `{}` |
| `node_modules/safe-buffer` | 5.2.1 | MIT | `{}` |
| `node_modules/safe-push-apply` | 1.0.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/safe-push-apply/node_modules/isarray` | 2.0.5 | MIT | `{}` |
| `node_modules/safe-regex-test` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/saxes` | 6.0.0 | ISC | `{"node":">=v12.22.7"}` |
| `node_modules/set-function-length` | 1.2.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/set-function-name` | 2.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/set-proto` | 1.0.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/setimmediate` | 1.0.5 | MIT | `{}` |
| `node_modules/side-channel` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/side-channel-list` | 1.0.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/side-channel-map` | 1.0.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/side-channel-weakmap` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/source-map-js` | 1.2.2 | BSD-3-Clause | `{"node":">=0.10.0"}` |
| `node_modules/stop-iteration-iterator` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/string.prototype.trim` | 1.2.11 | MIT | `{"node":">= 0.4"}` |
| `node_modules/string.prototype.trimend` | 1.0.10 | MIT | `{"node":">= 0.4"}` |
| `node_modules/string.prototype.trimstart` | 1.0.8 | MIT | `{"node":">= 0.4"}` |
| `node_modules/string_decoder` | 1.3.0 | MIT | `{}` |
| `node_modules/symbol-tree` | 3.2.4 | MIT | `{}` |
| `node_modules/tar-stream` | 2.2.0 | MIT | `{"node":">=6"}` |
| `node_modules/tldts` | 7.4.5 | MIT | `{}` |
| `node_modules/tldts-core` | 7.4.5 | MIT | `{}` |
| `node_modules/tmp` | 0.2.7 | MIT | `{"node":">=14.14"}` |
| `node_modules/tough-cookie` | 6.0.1 | BSD-3-Clause | `{"node":">=16"}` |
| `node_modules/tr46` | 6.0.0 | MIT | `{"node":">=20"}` |
| `node_modules/traverse` | 0.3.10 | MIT | `{"node":">= 0.4"}` |
| `node_modules/typed-array-buffer` | 1.0.3 | MIT | `{"node":">= 0.4"}` |
| `node_modules/typed-array-byte-length` | 1.0.3 | MIT | `{"node":">= 0.4"}` |
| `node_modules/typed-array-byte-offset` | 1.0.5 | MIT | `{"node":">= 0.4"}` |
| `node_modules/typed-array-length` | 1.0.8 | MIT | `{"node":">= 0.4"}` |
| `node_modules/typedarray.prototype.slice` | 1.0.6 | MIT | `{"node":">= 0.4"}` |
| `node_modules/unbox-primitive` | 1.1.0 | MIT | `{"node":">= 0.4"}` |
| `node_modules/undici` | 7.30.1 | MIT | `{"node":">=20.18.1"}` |
| `node_modules/unzipper` | 0.10.14 | MIT | `{}` |
| `node_modules/unzipper/node_modules/readable-stream` | 2.3.8 | MIT | `{}` |
| `node_modules/unzipper/node_modules/safe-buffer` | 5.1.2 | MIT | `{}` |
| `node_modules/unzipper/node_modules/string_decoder` | 1.1.1 | MIT | `{}` |
| `node_modules/util-deprecate` | 1.0.2 | MIT | `{}` |
| `node_modules/w3c-xmlserializer` | 5.0.0 | MIT | `{"node":">=18"}` |
| `node_modules/webidl-conversions` | 8.0.1 | BSD-2-Clause | `{"node":">=20"}` |
| `node_modules/whatwg-mimetype` | 5.0.0 | MIT | `{"node":">=20"}` |
| `node_modules/whatwg-url` | 16.0.1 | MIT | `{"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}` |
| `node_modules/which-boxed-primitive` | 1.1.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/which-builtin-type` | 1.2.1 | MIT | `{"node":">= 0.4"}` |
| `node_modules/which-builtin-type/node_modules/isarray` | 2.0.5 | MIT | `{}` |
| `node_modules/which-collection` | 1.0.2 | MIT | `{"node":">= 0.4"}` |
| `node_modules/which-typed-array` | 1.1.24 | MIT | `{"node":">= 0.4"}` |
| `node_modules/wrappy` | 1.0.2 | ISC | `{}` |
| `node_modules/xml-name-validator` | 5.0.0 | Apache-2.0 | `{"node":">=18"}` |
| `node_modules/xmlchars` | 2.2.0 | MIT | `{}` |
| `node_modules/zip-stream` | 4.1.1 | MIT | `{"node":">= 10"}` |
| `node_modules/zip-stream/node_modules/archiver-utils` | 3.0.4 | MIT | `{"node":">= 10"}` |
| `node_modules/zip-stream/node_modules/balanced-match` | 1.0.2 | MIT | `{}` |
| `node_modules/zip-stream/node_modules/brace-expansion` | 1.1.22 | MIT | `{}` |
| `node_modules/zip-stream/node_modules/glob` | 7.2.3 | ISC | `{"node":"*"}` |
| `node_modules/zip-stream/node_modules/minimatch` | 3.1.5 | ISC | `{"node":"*"}` |
| `node_modules/zrender` | 6.1.0 | BSD-3-Clause | `{}` |
| `node_modules/zrender/node_modules/tslib` | 2.3.0 | 0BSD | `{}` |

## Composer file-path drop

Restored the source file-tree-to-composer drop behavior. An attributed Chromium component check exercises inserting a relative path at the caret, replacing selected text, restoring the caret and ignoring unrelated drags; the existing attributed `skill-pick-ui-smoke.ts` also passed. UI and scripts typechecks passed. This check uses an invented intercepted listing; the actual file-tree route and app integration are still pending.

## Sidebar integration primitives

Restored the optional workspace slot without changing the target's existing Rooms label, and the optional resizable sidebar with the source keyboard and pointer controls. Attributed Chromium checks passed the slot and Rooms action, keyboard bounds and pointer resizing; an initial resize harness needed a test-only grid height before the separator could be visible. The existing attributed `create-room-opens-smoke.ts` and both UI and scripts typechecks passed. The app does not yet enable the slot or resize control, and the workspace stylesheet is not yet imported into the live app.

## App integration checkpoint

The app now connects the workspace tree, tabs and format consumers, enables the sidebar resize control, and imports their stylesheet. The local open control requires an explicit local, non-shared client-context response; malformed, remote, shared and unavailable responses hide it. It displays a refusal when its request fails and does not claim a handoff succeeded without the exact accepted response. The server open route is not implemented, and configured-root listing remains deliberately fail-closed pending the root-identity decision.

Attributed Chromium `workspace-app-integration-ui-smoke.ts` passed with an invented listing and intercepted preview response built by the real spreadsheet worker; this is a mock integration check, not the required actual browser-to-box acceptance path. Attributed `workspace-local-action-context-ui-smoke.ts`, existing `create-room-opens-smoke.ts` and `remote-settings-readonly-smoke.ts` passed. UI and scripts typechecks and the UI workspace build passed; the latter emitted the PPTX frame entry. Browser and platform results remain Linux Chromium only, with independent Tester, conformance, CI, Front draft update and the real route-to-worker browser checks outstanding.

The coordinator reconciled review precision 1 with pinned source `openWorkspaceFile`: the text fallback is in the pane selector, reached only after the source allowlist, so unlisted files do not open a tab. The attributed mock app check confirms `notes.txt` renders and `sketch.excalidraw` opens no tab and sends no preview request. Independent review must check both that selection boundary and the still-pending direct-preview unsupported response. The mock integration check also passed after resizing the open workspace pane to a 390-pixel viewport, including its close action; this is not a cross-platform or full mobile accessibility pass.

## Interim acceptance audit

This is a working audit, not the final self-review. Earlier checkpoints are historical; the current state and remaining gaps are recorded here and at the start of this report.

The nine affected route and ownership script files, together with the fixed script-runner suites, passed 111/111 on Linux after the latest route and packaging changes. The attributed real Linux app XLSX browser check also passed again. These results do not close the native and final-audit gaps below.

The spreadsheet, PDF, Word, snapshot-validation and shared-preview-race scripts, together with the fixed script-runner suites, passed 107/107 on Linux after the package-retention change.

| Reviewed obligation | Current evidence and gap |
| --- | --- |
| Source and target pins, clean ancestry | Pins last rechecked as recorded above; recheck before publication, exclude evidence files from the contribution, and show final target-relative diff and ancestry. |
| Grant parity and aliases | `workspace-grant-parity-api-smoke.ts` exercises a real settings selection, an older path-only grant, unknown fields, eligible alias, listing, image and preview. Persistent identity, APFS qualification and between-request same-path replacement remain deferred to #25; earlier contrary checkpoints are superseded. |
| Listing, policy, paths and current owner | `persistent-room-workspace-default-api-smoke.ts`, `workspace-listing-box-refusal-smoke.ts`, `workspace-listing-box-race-smoke.ts` and `workspace-shared-listing-smoke.ts` exercise guarded listing, empty state, path restrictions, fake box ownership, invalidation, replacement and revocation. Native box execution is not established by the fakes. |
| Bounded bytes, current policy and identity | `workspace-box-preview-smoke.ts`, `workspace-preview-folder-wait-smoke.ts` and `workspace-shared-preview-race-smoke.ts` cover fake box ownership, waits, read/parser invalidation, policy and file races; `workspace-local-real-app-ui-smoke.ts` exercises a real Linux guarded XLSX route. Native Mac/Windows paths are unmeasured. |
| Format and worker bounds | `workspace-spreadsheet-snapshot-smoke.ts`, `workspace-pdf-snapshot-smoke.ts`, `workspace-word-snapshot-smoke.ts` and `workspace-snapshot-validation-smoke.ts` exercise invented snapshots, parser validation, limits and cleanup; `workspace-shared-listing-smoke.ts` covers text, HTML, image and presentation routes. A final case-by-case check of the complete reviewed format/error matrix is still required. |
| UI formats, tree, tabs, frames and stale responses | `workspace-spreadsheet-component-ui-smoke.ts`, `workspace-document-components-ui-smoke.ts`, `workspace-text-html-components-ui-smoke.ts`, `workspace-image-component-ui-smoke.ts`, `workspace-pptx-component-ui-smoke.ts`, `workspace-file-browser-ui-smoke.ts` and `workspace-file-tabs-ui-smoke.ts` use invented inputs. `workspace-shared-frame-ui-smoke.ts` covers the real Linux Chromium presentation frame transfer and render. |
| Actual browser-to-worker path | `workspace-local-real-app-ui-smoke.ts` selected and rendered an invented XLSX through the actual Linux app, guarded route and ExcelJS worker, and checked revocation. The corresponding native Mac RoomBox path is not yet measured; the exact safe Front task is above. |
| App selection and local-only control | `workspace-app-integration-ui-smoke.ts` and `workspace-local-action-context-ui-smoke.ts` exercise selection, unsupported tabs and context visibility with invented inputs; the Linux actual app check also exercises authorization. |
| Explicit open and protected direct dispatch | `workspace-open-refusal-smoke.ts` and `workspace-open-handoff-smoke.ts` cover route refusals, Linux fake verified handoff, changed policy/file/association, unsafe executable/cwd, placeholders, unavailable/error/timeout and zero extra handoffs. Fake native lookups refuse because Mac and Windows launch working directories are not bound; valid native direct handoff remains open. |
| Dependency closure and audit | Reconciled approved feature closure and lock-only audit are recorded above; repeat after any dependency changes and include the identified engine and audit debt in final review. |
| Developer checks and independent stages | UI/scripts typechecks, targeted script runs and actual browser acceptance reported above passed on Linux. Final affected checks, native Mac/Windows, independent Tester, conformance, CI and Front draft update remain outstanding; no full gate or cross-platform result is claimed. |

## Grant identity amendment: refusal checkpoint

Controller authorized level 2 under Sascha's Option A, spec `f5a26e290ef78e55947ab47110c190668d1f81be` and independent PASS `1570086c6927d3ea378c26c74105c4d52fcc7147`. Read-only upstream checks returned PR head `5fcffe1036b2d6f867d6583b29822c4985d36fba` and annotated v0.16.2 tag object `e84a023c753800caf261268090946c1e0d17f338`, peeled to target `b898e851813b4da0211e6a049e9537160391091f`.

This first slice strictly normalizes the private versioned tuple, preserves valid evidence through settings rewrites, retains malformed and absent evidence as unusable, distinguishes invalid policy storage from no policy, reports configured unusable roots in the existing refusal flag, and refuses root-bearing saves without changing the old policy. No combination is enabled; **all local folder selections and previously selected local roots are currently unavailable**, including existing local room file tools. The shared-server synthetic shelf does not use selected-grant identity; `room-files-routes-smoke.ts` passed with its macOS-only Finder check skipped. The public `workspace-grant-identity-api-smoke.ts` passed with invented policy fixtures for valid, legacy, malformed, unknown and out-of-range evidence, refusal, redaction, settings-only rewrite, failed selection and invalid storage; its expected initial red run showed a configured unqualified root being treated as usable. This is a refusal checkpoint, not a completed capture or recovery implementation.

The working directory reports Linux Node 22.23.4 and an ext4 mount sourced from `/dev/md2`. The [Linux ext4 inode documentation](https://www.kernel.org/doc/html/latest/filesystems/ext4/inodes.html) describes a creation-time field, while [Node stat-time documentation](https://nodejs.org/docs/latest-v22.x/api/fs.html#stat-time-values) permits birth-time fallback; an ext4 label and a sample cannot establish the provenance of Node's value, provider and device stability over restart/remount, or the required reuse bounds. The exact combination therefore remains unqualified, and no Mac, Windows, cloud or other combination is claimed. The tuple also cannot prove identity against deliberate metadata forgery or simultaneous identifier and creation-time reuse.

The [Linux statx contract](https://man7.org/linux/man-pages/man2/statx.2.html) uses `stx_mask` to indicate whether birth time is actually supplied. Node's documented bigint `Stats` exposes the timestamp but no corresponding statx support mask, and the [libuv stat structure](https://docs.libuv.org/en/v1.x/fs.html) likewise does not expose one. That is a concrete missing observation for establishing timestamp provenance from the allowed API; a standalone diagnostic of a disposable folder would not establish the evidence for every later authorization or stable device identity across remounts.

Still required: reviewed capture and opened-object/path checks for any combination supported by sufficient evidence; all policy rewrite and restart coverage; picker and typed-selection lost-response recovery; real guarded listing, ownership race and route checks; and the rest of the original migration and independent stages. No source path or private tuple is sent in the new refusal response. Historical checkpoint statements above are superseded where this amendment changes behavior.

The folder settings pane now reconciles a lost picker or typed-selection answer using the prior policy ID, requested path and an explicit current `folderRefused: false`; unchanged or missing IDs, a different path and refused or unknown status cannot establish success. The no-folder picker applies the same check after reading the before and after state. Attributed `workspace-location-recovery-ui-smoke.ts` passed both selection modes and these refusal cases with invented intercepted responses; attributed `workspace-app-integration-ui-smoke.ts` passed a no-folder refused-then-retry scenario and a same-path lost-answer recovery. These UI checks simulate server views and do not qualify a filesystem or establish a real successful selection. The UI workspace build and UI typecheck passed; an expected red run of each browser test preceded its implementation.

The synthetic shared-server shelf now uses the guarded listing seam through the public workspace-files route, with fresh room, conversation and effective-policy checks and cancellation on disconnect. `workspace-shared-listing-smoke.ts` passed a real invented shelf listing, hidden-name omission, empty second-room isolation, missing-conversation refusal and nested-path refusal; its initial run returned the earlier 503 placeholder. Local configured-root listings remain closed. The grant refusal test also exposed that effective runtime policy and its working directory still accepted an unqualified root; it now verifies that file tools, commands and the selected working directory remain disabled, and passed after the fix. `EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- apps/web-server/scripts/workspace-grant-identity-api-smoke.ts apps/web-server/scripts/workspace-shared-listing-smoke.ts` passed 102/102 and scripts typechecking passed. Other route, race, qualified-root and independent-stage obligations remain open.

The shared shelf also has an initial bounded text and XLSX preview path: it opens with no-follow, checks file identity and size before and after reading, rechecks the room, conversation and file before parsing and return, and passes only a private copy to the existing validated spreadsheet worker. The real public route test now covers invented text, UTF-8 replacement decoding, 16 MiB refusal, headers, cross-room refusal, unsupported-file response and a real ExcelJS worker result containing an invented cell; it first failed with the route absent, then with XLSX unavailable. The same targeted script run passed 102/102. HTML, PDF, Word, PPTX, image and open routes, active read races, browser-to-box acceptance, and qualified local files remain outstanding; the new code does not establish those cases.

Shared-shelf PDF and Word now use that same bounded and rechecked snapshot path with their existing isolated, validated workers. `workspace-shared-listing-smoke.ts` exercises a generated one-page PDF and a generated DOCX through the public preview route; both initially returned renderer unavailable, then passed. `EXXETA_SKIP_BROWSER_INSTALL=1 npm run test:scripts -- apps/web-server/scripts/workspace-shared-listing-smoke.ts apps/web-server/scripts/workspace-pdf-snapshot-smoke.ts apps/web-server/scripts/workspace-word-snapshot-smoke.ts` passed 103/103. These checks do not establish the required in-flight authorization races or actual boxed browser path.

The shared-shelf routes additionally return bounded HTML JSON and opaque sandboxed frames, presentation bytes and the bundled sandboxed frame, and bounded image bytes with artifact security headers. `workspace-shared-listing-smoke.ts` verifies invented data, the HTML and frame CSPs, presentation frame and bytes, image MIME, 20 MiB limit, unsupported image refusal, cross-room isolation and tilde-path refusal; each newly implemented path was first exercised red. Attributed `workspace-shared-frame-ui-smoke.ts` used the actual authenticated shared-shelf routes and bundled renderer to exercise `frame-ready`, a transferable buffer, `frame-rendered`, and the invented slide in Chromium, without intercepting producer or frame. It does not establish the native boxed browser-to-XLSX path. Shared open, active read races, native boxed paths and independent validation remain outstanding.

The host-local open route now rejects nonlocal, shared, proxied, wrong-origin, missing-intent, invalid-body and invalid-path requests; a missing or unqualified grant also refuses. It contains no dispatch implementation and returns `association_unverified` if a future eligible grant reaches that point, so no successful handoff is claimed. `workspace-open-refusal-smoke.ts` exercises these public refusals and remote-route classifications using invented fixtures; the request guard may reject an origin or proxy before this route does. The three read routes are classified under the existing remote read policy, and open is local-only; `remote-capability-smoke.ts` passed the complete route-inventory coverage and existing remote capability checks. The resolver, exact checked direct dispatch, fake-dispatcher zero-call assertions for association races and a verified safe handoff remain to be implemented and independently checked.

Attributed `workspace-shared-real-app-ui-smoke.ts` now runs the actual app against a disposable shared-server shelf without intercepting routes: it selects an invented XLSX in the file browser and displays its cell from the authenticated route and real worker. A missing conversation exposed a 500 in the first browser run; the preview and image routes now return 404 when thread lookup throws, and the browser check passed. This is a real shared-shelf path only: it does not qualify a local filesystem or prove the required Mac RoomBox path, live revocation race, or independent cross-platform behavior.

`workspace-shared-preview-race-smoke.ts` pauses a synthetic child after an invented XLSX snapshot, then checks that shelf revocation yields 403 and file change yields 409 without the worker's result. It also checks that revocation before the request invokes no parser. The fake child returns a previously validated invented workbook result; this is shared-shelf evidence and does not establish the required RoomBox owner-generation or local-grant races.

The public grant refusal smoke now restarts the disposable server and checks that an unqualified stored identity remains unchanged and refused, with no identity fields in the view or captured server logs. This is restart refusal evidence; it does not establish a working selected grant or device stability across restart/remount.

The attributed folder-location recovery browser test also checks a failed read after a lost typed save: the pane reports that it cannot load and offers retry instead of declaring success.

## Checkpoint file inventory

At implementation checkpoint d31087a, the target-relative paths below are changed; the two report paths are fork evidence and are excluded from the intended contribution replay.

- `apps/web-server/package.json`
- `apps/web-server/scripts/persistent-room-workspace-default-api-smoke.ts`
- `apps/web-server/scripts/workspace-app-integration-ui-smoke.ts`
- `apps/web-server/scripts/workspace-box-preview-smoke.ts`
- `apps/web-server/scripts/workspace-composer-drop-ui-smoke.ts`
- `apps/web-server/scripts/workspace-document-components-ui-smoke.ts`
- `apps/web-server/scripts/workspace-file-browser-ui-smoke.ts`
- `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`
- `apps/web-server/scripts/workspace-grant-parity-api-smoke.ts`
- `apps/web-server/scripts/workspace-image-component-ui-smoke.ts`
- `apps/web-server/scripts/workspace-listing-box-race-smoke.ts`
- `apps/web-server/scripts/workspace-listing-box-refusal-smoke.ts`
- `apps/web-server/scripts/workspace-local-action-context-ui-smoke.ts`
- `apps/web-server/scripts/workspace-local-real-app-ui-smoke.ts`
- `apps/web-server/scripts/workspace-location-recovery-ui-smoke.ts`
- `apps/web-server/scripts/workspace-open-handoff-smoke.ts`
- `apps/web-server/scripts/workspace-open-refusal-smoke.ts`
- `apps/web-server/scripts/workspace-pdf-snapshot-smoke.ts`
- `apps/web-server/scripts/workspace-pptx-component-ui-smoke.ts`
- `apps/web-server/scripts/workspace-preview-folder-wait-smoke.ts`
- `apps/web-server/scripts/workspace-shared-frame-ui-smoke.ts`
- `apps/web-server/scripts/workspace-shared-listing-smoke.ts`
- `apps/web-server/scripts/workspace-shared-preview-race-smoke.ts`
- `apps/web-server/scripts/workspace-shared-real-app-ui-smoke.ts`
- `apps/web-server/scripts/workspace-sidebar-resize-ui-smoke.ts`
- `apps/web-server/scripts/workspace-sidebar-slot-ui-smoke.ts`
- `apps/web-server/scripts/workspace-snapshot-validation-smoke.ts`
- `apps/web-server/scripts/workspace-spreadsheet-component-ui-smoke.ts`
- `apps/web-server/scripts/workspace-spreadsheet-snapshot-smoke.ts`
- `apps/web-server/scripts/workspace-text-html-components-ui-smoke.ts`
- `apps/web-server/scripts/workspace-word-snapshot-smoke.ts`
- `apps/web-server/src/persistent-room-shelf-reading.ts`
- `apps/web-server/src/persistent-room-workspace-tools.ts`
- `apps/web-server/src/remote-route-policy.ts`
- `apps/web-server/src/room-box/box-files.ts`
- `apps/web-server/src/room-box/file-worker.mjs`
- `apps/web-server/src/room-live-sessions.ts`
- `apps/web-server/src/room-settings-routes.ts`
- `apps/web-server/src/room-socket.ts`
- `apps/web-server/src/shelf-parse-worker.mjs`
- `apps/web-ui/package.json`
- `apps/web-ui/public/pptx-notices/LICENSE`
- `apps/web-ui/public/pptx-notices/THIRD_PARTY_NOTICES.md`
- `apps/web-ui/public/pptx-notices/licenses/ECMA-text-copyright-notice.txt`
- `apps/web-ui/public/pptx-notices/licenses/mtx-decompressor-MPL-2.0.txt`
- `apps/web-ui/src/App.tsx`
- `apps/web-ui/src/components/Sidebar.tsx`
- `apps/web-ui/src/components/WorkspaceFileBrowser.tsx`
- `apps/web-ui/src/components/WorkspaceFileTabs.tsx`
- `apps/web-ui/src/components/WorkspaceFramedPreview.tsx`
- `apps/web-ui/src/components/WorkspaceHtmlPreview.tsx`
- `apps/web-ui/src/components/WorkspaceImagePreview.tsx`
- `apps/web-ui/src/components/WorkspacePdfPreview.tsx`
- `apps/web-ui/src/components/WorkspaceSpreadsheetPreview.tsx`
- `apps/web-ui/src/components/WorkspaceTextPreview.tsx`
- `apps/web-ui/src/components/WorkspaceWordPreview.tsx`
- `apps/web-ui/src/components/in-room-chat.tsx`
- `apps/web-ui/src/components/workspace-hover-tooltip.tsx`
- `apps/web-ui/src/composer-text-insertion.ts`
- `apps/web-ui/src/pptx-frame-entry.ts`
- `apps/web-ui/src/remote-client-context.ts`
- `apps/web-ui/src/styles.css`
- `apps/web-ui/src/styles/43-room-workspace.css`
- `apps/web-ui/src/workspace-files-api.ts`
- `docs/reports/issue-docs/tasks/T87-REBASE.md.md`
- `docs/reports/pr87-rebase.md`
- `package-lock.json`
- `package.json`
- `scripts/bundle-server.mjs`
- `scripts/bundle-server.test.mjs`
- `scripts/pptx-notice.test.mjs`

Added test files at that checkpoint:

- `apps/web-server/scripts/workspace-app-integration-ui-smoke.ts`
- `apps/web-server/scripts/workspace-box-preview-smoke.ts`
- `apps/web-server/scripts/workspace-composer-drop-ui-smoke.ts`
- `apps/web-server/scripts/workspace-document-components-ui-smoke.ts`
- `apps/web-server/scripts/workspace-file-browser-ui-smoke.ts`
- `apps/web-server/scripts/workspace-file-tabs-ui-smoke.ts`
- `apps/web-server/scripts/workspace-grant-parity-api-smoke.ts`
- `apps/web-server/scripts/workspace-image-component-ui-smoke.ts`
- `apps/web-server/scripts/workspace-listing-box-race-smoke.ts`
- `apps/web-server/scripts/workspace-listing-box-refusal-smoke.ts`
- `apps/web-server/scripts/workspace-local-action-context-ui-smoke.ts`
- `apps/web-server/scripts/workspace-local-real-app-ui-smoke.ts`
- `apps/web-server/scripts/workspace-location-recovery-ui-smoke.ts`
- `apps/web-server/scripts/workspace-open-handoff-smoke.ts`
- `apps/web-server/scripts/workspace-open-refusal-smoke.ts`
- `apps/web-server/scripts/workspace-pdf-snapshot-smoke.ts`
- `apps/web-server/scripts/workspace-pptx-component-ui-smoke.ts`
- `apps/web-server/scripts/workspace-preview-folder-wait-smoke.ts`
- `apps/web-server/scripts/workspace-shared-frame-ui-smoke.ts`
- `apps/web-server/scripts/workspace-shared-listing-smoke.ts`
- `apps/web-server/scripts/workspace-shared-preview-race-smoke.ts`
- `apps/web-server/scripts/workspace-shared-real-app-ui-smoke.ts`
- `apps/web-server/scripts/workspace-sidebar-resize-ui-smoke.ts`
- `apps/web-server/scripts/workspace-sidebar-slot-ui-smoke.ts`
- `apps/web-server/scripts/workspace-snapshot-validation-smoke.ts`
- `apps/web-server/scripts/workspace-spreadsheet-component-ui-smoke.ts`
- `apps/web-server/scripts/workspace-spreadsheet-snapshot-smoke.ts`
- `apps/web-server/scripts/workspace-text-html-components-ui-smoke.ts`
- `apps/web-server/scripts/workspace-word-snapshot-smoke.ts`
- `scripts/pptx-notice.test.mjs`
