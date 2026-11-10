# T22-SERIES2-FINAL architecture conformance

Verdict: pass
Reviewed commit: a9d1b8b9e28c09bab08fb89ac80426fedc941e29
Baseline: 461e6485bf932f5cba85ac3dde8e0104e47d5dec
Architecture impact: level 2, the approved standalone Series 2 extraction; the RAW port, lock/evidence reconciliation and scoped npm notice correction remain within their approved level-1 scopes.
Reviewer: independent Worker Architect, 2026-11-10.

## Findings

No blocking architecture conformance finding. This is a coarse boundary review of the pinned standalone candidate, not release approval or verification of a combined product.

| Seam | Evidence and disposition |
| --- | --- |
| Routes and policy | `room-settings-routes.ts` adds the approved GET workspace-files, GET/PUT workspace-markdown and GET workspace-image routes. `remote-route-policy.ts` assigns read to the three GETs and write to PUT. The UI listing, Markdown and image consumers target those routes, with the specified conversation and path inputs and Markdown content/revision payload. |
| Producers and shared identity | Listing returns the approved root, path and entry fields; HTTP adds the intentionally allowed agent and conversation IDs. Image and Markdown use the existing policy and guarded workspace resolver. `persistent-room-workspace-image.ts` defines the sole `PersistentRoomWorkspaceMarkdownError`; Markdown imports and re-exports that class, and the route uses it. Tabs and composer retain the separate approved drag MIME types. |
| Dependencies, exports and imports | The UI manifest adds the ten approved `@tiptap/*` direct dependencies; the resolver export and internal editor/helper exports serve the approved extraction and RAW port. Inspected added imports stay within the existing server/UI and approved dependency seams. No unapproved route, dependency, package entry-point export, durable store, or external data flow was identified. |
| RAW and CSS | The product/test delta from `cdc3d5c29b7cfd959051b5594f50cef94e3211de` through `1962d656` touches exactly the six files approved by the RAW review. The task helper is consumed by the editor; it uses the existing Markdown save seam. |
| npm notice | Relative to `35e728881ae7f94b07a706e7f2cbfd374b1876fe`, product/test changes are the two approved runtime notice entries in root `package.json` and actual-tarball assertions in the existing notice smoke; the remaining change is the issue report. This adds no dependency or runtime interface. |
| Scope | The 43-path base-to-candidate diff contains no Series 1 renderer, factory, architecture review or ADR files. The upstream base is an ancestor; no other series or main was merged into the candidate. |

## Independent review and limits

The independent Tester review at `9178a8ae8d100266536f71238344691329cd9bea`, `docs/reviews/T22-S2-NOTICE-FIX-review-1.md`, passed the candidate. Its build passed and the actual full smoke run failed with **375/377**, exit 1. `room-topbar-ui-smoke.ts` and `consult-mention-smoke.ts` failed again individually with the same Node 22 diagnostics on pinned upstream; under Sascha's 2026-11-10 decision and Front confirmation, the gate counts as passed for Series 2. This does not make the raw run green. Both failures and the matching Node 20 `room-workspace-path-reach-smoke.ts` tsx failure require disclosure as pre-existing upstream behavior. The Node 20 evidence is from earlier product commit `1962d656`, not a fresh run on this notice SHA; missing, skipped and incomparable evidence remains open. The Tester also reports real Chromium image and RAW checks passed and records platform and fd skips.

Actual release archive and final desktop packages, including macOS arm64 and Windows x64, remain unverified; the desktop notice-pruner correction is separate. Complete Omnigent and Tiptap/transitive attribution and actual bundled membership remain outstanding. Human real-file preview and the separately integrated Series 1 producer to Series 2 consumer gate, including both acceptance sets, remain required. This review makes no legal conclusion.

## Method and debt

Read issue #22, the architect and coordinator protocols, original Series 2 R2, #22 R2, RAW and npm notice spec reviews, and the independent Tester report including its adjudication. Compared the committed candidate to the pinned base and inspected the route, policy, imports, interfaces, package manifests, RAW file scope and notice delta. No full suite, gate, real data or external service was used. `git diff --check` flags the previously reported extra blank line at the image module EOF; it is a minor style debt candidate, not a boundary violation. Other logic, security and load edge cases were not hunted in this coarse review.
