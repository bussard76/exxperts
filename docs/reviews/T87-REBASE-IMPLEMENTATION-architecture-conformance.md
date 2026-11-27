# T87 rebase implementation architecture conformance

Verdict: pass
Reviewed commit: a3ad7b91c9573efe0d3b7e9e22c6f6c5bcfe89bd
Level: 2 confirmed. The four restored HTTP routes, feature dependencies, three private seams and folder-wait composition were expressly approved; no evidence in the target-relative contribution requires a higher level. The cross-file TypeScript exports are internal server composition, not package or client interfaces.

## Scope and decisions

Compared the exact candidate with target v0.16.2 `b898e851813b4da0211e6a049e9537160391091f`: 75 paths, comprising 73 product/test paths and two fork reports. Source is `5fcffe1036b2d6f867d6583b29822c4985d36fba`. Reviewed the amended contract at `f935640a1ebff3412b46a4f76bcde6ab48c2ae5e`, RoomBox review `7ff65c77c1a4037ae2d747d87a21c1ca8344992d`, grant-parity spec `cf976f79548380add5c8099941b3687305260a24` and review `e057ec8e8088a82064b84beea57a50ebd5d4a11c`, and the independent folder-wait R2 review at `/home/developer/controller-exxperts/reviews/t87-windows-folder-wait-r2.md`. The later grant-parity decision supersedes persistent identity requirements in earlier drafts.

## Boundary check

| Area | Static evidence and conclusion |
| --- | --- |
| Routes and dependencies | `room-settings-routes.ts` adds only the four approved workspace routes; `remote-route-policy.ts` classifies the three reads and local-only open. The root, server and UI manifest additions match the specified docx-preview, exceljs, jsdom, optional koffi and PPTX renderer versions; packaging retains the feature's worker dependencies. |
| Existing grant | `persistent-room-workspace-policy.ts`, `room-files.ts` and `folder-offer.ts` have no target-relative changes. The existing path-hash grant and folder eligibility remain the authority; no persisted device/inode grant or new selection protocol was introduced. A same-canonical-path replacement between operations remains outside this grant's guarantee. |
| File and parser seam | Routes pass current policy, wait and binding into `persistent-room-workspace-tools.ts`, which uses the existing fence and guarded boxed/shared/held file paths; reads supply bounded snapshots to the shelf worker through a private temporary copy. Browser listing restricts results to the chosen room root. Operation-local identity and authorization rechecks remain in the existing flow. |
| RoomBox | `room-live-sessions.ts` holds an ephemeral owner/connection-scoped binding, rejects ambiguous matching owners, and supplies a current-generation check. `room-socket.ts` registers the connection's box and removes its own binding on close; browser work acquires the binding after waiting and rechecks it around boxed work and before results. Missing required Mac bindings are refused before host fallback. The binding is not a grant or durable store. |
| Folder wait | `room-settings-routes.ts` owns the one-shot factory installation, rejects duplicate installation and has no reset; `room-socket.ts` installs `fileToolsWait` during module initialization in the existing socket-to-routes direction. Four route call sites obtain the wait for their operation; the Windows folder-wait import in routes is type-only and missing required Windows wiring refuses. |
| Host association | The resolver and dispatch stay private in the route owner; the exact checked executable, arguments and working directory are passed to a shell-free spawn after authorization and writable-place checks. Unresolved platform associations refuse. No generic opener or new public interface is introduced. |

No unapproved new module, durable store, permission exception, route, public package interface or platform coupling outside the approved seams was identified. The internal server exports for cross-file composition implement the explicitly approved seams. This is a coarse static conformance review, not a behavioral or platform acceptance finding.

## Findings and limits

No architecture blocker found. Independent functional review `814db83d550198cf072816e577b40cf45efb8f6b` reports pass for exercised flows, while the full Linux gate remains failed at 518/526 and native Mac and Windows acceptance remains unmeasured. This conformance verdict grants neither a gate waiver nor publication. No tests, build, gate, native check or attack reproduction were run for this review.
