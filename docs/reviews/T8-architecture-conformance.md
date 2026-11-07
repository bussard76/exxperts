# T8 architecture conformance

Reviewed commit: f261964507c5b3f00a2583b9c82ac5c55abdbb69
Verdict: pass
Branch: agents/t8-conformance, created from origin/agents/t8-html-hardening at the reviewed commit; nothing merged.
Diff base: a36bce1678c743e69672cbc924ba504fcf687340

## Architecture impact

Level 3: executable workspace HTML and its accepted frame-navigation path, plus HTML host opening, within the existing preview UI, room routes, workspace authorization and local OS-opener modules. Level-2 elements are the HTML response variants, local UI exports and workbook `showGridLines` contract. Issue [#8](https://github.com/bussard76/exxperts/issues/8) names these interface changes; ADR-0003's accepted HTML addendum records Sascha's decision of 2026-11-07, including the navigation/exfiltration risk and `.html`/`.htm` local opening.

The historical spec review at `origin/agents/t8-specreview:docs/reviews/T8-architecture-spec.md` (d8c6b03c797118d99dacd9f2b097631f6c28ae37) says `Verdict: level-3`, not pass. Its unresolved decision is now recorded in ADR-0003; this review checks conformance to that recorded scope. The project has no maintained root `ARCHITECTURE.md` (`architecture.mode` is `off`); accepted ADRs and documented module responsibilities supply the applicable constraints.

## Boundary check

| Area | Evidence and result |
| --- | --- |
| HTML interface and data flow | `WorkspaceHtmlPreview.tsx:6` calls the room-scoped preview GET, checks its HTML readiness response and loads the same route with `frame=1`. `room-settings-routes.ts:335` implements the bounded UTF-8 HTML read, JSON `schemaVersion: 1` / `kind: "html"` response and HTML document response. This is the flow identified in the spec review and authorized by the HTML addendum; it adds no listener, backend service or durable preview store. Existing document parsing remains in `shelf-parse-worker.mjs`. |
| Workspace authorization | Both HTML variants pass through the existing room/conversation lookup, effective workspace policy, read-tool permission and guarded existing-file resolver in `room-settings-routes.ts:286`. The HTML branch checks descriptor identity before and after reading and resolves the guarded pathname again before returning. It does not introduce a separate grant or inherit authorization from the UI's readiness request. ADR-0002 remains authoritative. |
| Script and external-effect policy | `WorkspaceHtmlPreview.tsx:23` uses `sandbox="allow-scripts"` without same-origin permission. The frame response in `room-settings-routes.ts:360` also applies a CSP sandbox for direct opening, with restricted resources, `connect-src 'none'` and `form-action 'none'`. Scripts and frame self-navigation are intentionally allowed; a navigation URL can carry file content. This real external path is expressly accepted in ADR-0003:69, rather than treated as an unapproved flow or a promise that all network activity is blocked. |
| Local OS opening | The only opener change is adding `.html` and `.htm` to the existing allowlist (`room-settings-routes.ts:261`), expressly approved by ADR-0003:71. The separate explicit action retains affirmative local request authorization, current workspace/read checks and revalidation before the existing opener. `remote-route-policy.ts:174` retains GET as `read` and POST as `local`; both full and read-only paired devices remain excluded from opening. The external application remains outside the preview sandbox, as recorded in the ADR. |
| Workbook contract | Issue #8 explicitly names `showGridLines`. The producer emits a boolean, defaulting true unless the first sheet view explicitly disables it (`shelf-parse-worker.mjs:901`); both server and UI validators admit the field, and the UI requires a boolean and consumes it. The existing worker → route → React flow and schema version remain; no persistence or separate consumer protocol is introduced. Formatting and Word measure conversion stay within their existing parser module. |
| Exports, imports and dependencies | The new `WorkspaceHtmlPreview` export is consumed only by `App.tsx`; the changed `WorkspaceFileTabs` interface adds `onReorder` for issue #8's tab reordering, with `App.tsx` as its caller. Both stay inside the web UI. New imports use existing React and UI modules; no server/runtime import into the UI or reverse tier dependency was found. No package export, package manifest, dependency or lockfile changes occur in the committed task diff. |
| State and scope | Reordered tabs, image zoom/pan and HTML readiness are transient UI state; preview reads introduce no writes or new durable store. The changed tests use invented files, fake opening and intercepted navigation. No new agent tool, external connector, real model invocation or PPTX implementation was found. |

## Findings

No unapproved module responsibility, export, contract, durable store, data flow or forbidden import was found in this coarse review. No architecture blocker remains from the HTML decision. Logic edge cases, detailed security and load behavior were not re-reviewed.

## Independent Tester and gate evidence

Read `origin/agents/t8-review-1:docs/reviews/T8-review-1.md` at d5f2b58303616f92327b1c86b09495499e11e538. Its functional verdict is pass at the exact reviewed commit, and its complete-diff Ponytail review, including design commit `9ebc303b0415368db96d69a236f17a987402abc5`, reports no confirmed Must fix.

Preserve both raw gate results: build passed; parallel smokes were **376/377**, with only `workspace-file-tabs-ui-smoke.ts` failing after a 30-second wait for the draft Discard changes button. The exact same smoke passed **1/1 in isolation on the same commit**; the timeout's cause remains unresolved. The Tester report calls the original full gate failed and leaves acceptance open. The Controller's supplied disposition applies Sascha's recorded 2026-11-06 rule in `docs/coordinator.md`: at most two parallel-failed smokes that all pass alone count as a passing smoke gate. This run has one such smoke, so the Controller counts the gate as passed. The raw timeout is preserved as test debt, not an architecture finding.

## Debt and acceptance

Carry forward the Tester's existing debt candidates: parallel draft-prompt timeout, expanded spreadsheet-grid load, large Word conversion work, number-format fidelity, HTML second-request error display, keyboard tab reordering and Word/HTML frame reload on reorder. No new edge-case search was performed. `WorkspaceHtmlPreview.tsx:5` still claims every network request is blocked; retain the Tester's minor style/documentation proposal to describe the accepted navigation exception accurately. The accepted navigation/exfiltration risk itself is a recorded product decision, not an unresolved approval.

Sascha's remaining acceptance includes scripted HTML, Word sizing on screen and native Mac tab/window interactions. Wave integration and preview acceptance belong to the Controller and Sascha; this report does not perform them.

## Verification and limits

Fetched origin, verified the requested full SHA and branch base, read issue #8, both independent reports, the architecture/coordinator protocols, developer documentation, ADR-0002 and ADR-0003, and inspected the full changed-file inventory and connected route, worker, UI, import/export and remote-policy seams. Focused checks were source/diff inspection and caller/import searches only; no suites, model calls, real opener or external-system experiment ran. No tests were added because this task changes only this review file. The pre-existing working-tree `package-lock.json` modification was preserved and excluded from the review commit.
