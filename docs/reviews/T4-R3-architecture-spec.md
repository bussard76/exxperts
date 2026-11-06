# T4-R3 architecture spec

Verdict: pass
Spec: `~/controller-exxperts/analysis/T4-spec-R3.md`, SHA-256 `d9e0e0148008d5360287f3f7b96d82f368d384682ec37bc948b43c356d8a7c6a`; repository base `origin/main` at `7267ac7c3a38db1d2912b3c5e5c4c00ce2d5504d`.
Level: 3, confirmed: guarded workspace bytes enter a new preview flow and a separate explicitly authorized action dispatches a file to the host OS.
Decision: Sascha accepted ADR-0002 option A and ADR-0003 option A. The latter is accepted on `origin/agents/t4-ready-specreview` at `12242c813da98641399b48d86905de0171b4f098`, but is **not on the reviewed main**. Its integration on the actual build base is a hard prerequisite, not a request to make the decision again. Sascha's signed design and explicit exception make a clickable fake unnecessary for #4.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Signed surface and acceptance | Workspace tree, ephemeral tabs, existing Markdown guard | Contextual path → one active tab → read-only representation; explicit separate open button | R1–R6, A1–A4 and signed action map to P1–P5, B1–B7, O1–O4, K1 and H1. Sheet controls, close order and labels match design text. Human real-file and Electron checks remain Sascha's. |
| Workspace authority | Room routes, current workspace policy and existing-file resolver | Authenticated room/conversation → current grant/read checks → guarded regular file | ADR-0002 and landed #5 resolver are reused. Preview rechecks authorization after parsing; local open repeats guards immediately before dispatch. Errors do not expose host paths. |
| Local OS action | Local-classified POST → private platform adapter | Explicit intent, session, socket/host/origin and shared/paired refusal → freshly guarded target → fixed non-shell adapter | Meets ADR-0003's accepted option A. Recheck reduces but does not eliminate pathname replacement; OS acceptance does not prove display or cancellation. Do not call a real opener in worker tests. |
| Producer and consumer | Shelf child → validated versioned response → React grid / inert sandbox / page images | ExcelJS OOXML or SheetJS plus bounded BIFF → common workbook; docx-preview/jsdom → sanitized static HTML; PDF raster → ordered page images | Explicit schemas, complete-or-error behavior and producer-to-route-to-browser proofs preserve the requested basic look. The child is a crash boundary, not an OS or network sandbox. |
| Resource and safety | Parent lifecycle, child preflight and output validator | Bounded input, decompression, CFB traversal, rendering and IPC; no unbounded queue | Numerical limits and failure mappings are specified; CFB pre-extraction feasibility is a build gate. Application-level network denial and frame isolation require positive-control evidence, not an isolation claim. |
| Package ownership | Root/server manifests and bundle/release payload | Named child consumers and assets → installed and trimmed payload | Exact Controller approval, lock/licence/advisory and closure review remain before build. Koffi ownership, native child and notices are explicit; a manifest alone does not prove runtime loading. |
| Dependencies and evidence | Sequential implementation and future acceptance | Actual producers → public routes → actual UI; fake OS seams | The BIFF review's F1–F3 and Windows review's B1–B4 are carried into R3. Tests and fixtures prove fidelity after implementation; safe Windows native-load proof is separate from Sascha's real OS acceptance. |

## Prefactoring

None before build. Reuse the landed resolver, existing room policy, editor guard and shelf child lifecycle; keep format adapters and the OS opener private. No new durable store, generic process framework, desktop bridge or broad refactor is justified. If an extra public export or changed boundary is needed, follow the specified approval/escalation path.

## Findings

No remaining design-relevant blocker requires changing the selected architecture. This pass reviews the design, not permission to begin before the prerequisites below.

### Binding base correction

R3 lines 43, 50 and 457 state that both ADRs are on main at `7267ac7`; `git ls-tree -r origin/main docs/adr` shows ADR-0002 but no ADR-0003. ADR-0003 is accepted on the cited review branch. Integrate that accepted record into the actual build base before implementation, and correct the build dispatch's base statement. Reconcile the landed #5 guards and packaging on that base. This does not reopen option A or require a new Sascha decision.

### Before build

Controller must approve the exact package versions, consumers and installed ownership described in R3, including Koffi pin/retention and the separately authorized correction of the stale forbidden-import test. Confirm the installed SheetJS SSF interface and obtain evidence that the pinned public CFB facility enforces the stated limits before traversal and extraction. If it cannot, stop for a reviewed bounded design; a timeout or V8 heap cap is not that evidence. These are unresolved build prerequisites, not proof that the chosen direction fails.

### Binding implementation and future evidence

- Preserve R3's exact contracts and refusal ordering, including all BIFF F1–F3 and Windows B1–B4 precision. No successful partial document, automatic opening, shell interpolation, paired opening or real worker opening is authorized.
- Invented independent fixtures and the real child → guarded route → browser consumer must establish workbook and Word fidelity, PDF appearance, network denial and packaging. Failure to achieve basic fidelity requires a concrete escalation; probes do not establish it today. These are normal implementation acceptance checks, not missing pre-build approval.
- The non-opening Windows probe on an approved host is required to claim verified Windows packaging; its absence alone does not prevent writing the adapter after the other gates. Real association and display remain Sascha's acceptance. Respect the recorded path-race and native-memory limitations without claiming stronger guarantees.

## Review evidence and limits

Read issue #4 and its decisions, accepted ADR-0002 on main and ADR-0003 on the cited branch, the signed design text at `bc3b7485734aea7473dae2a5be4a607469e7f285`, Controller `decisions.md` (SHA-256 `d82a11a3911d3c54b5d8fade5d543ac6da4dcce57762858fea19a1f6ecbc7f47`), and the complete BIFF and Windows reviews at `1df06ba0d2dd08a3a0440043b368295709dad1ba` and `15afa900cd3304424b06161348d0c8853dfec95a`. Traced the landed workspace resolver, routes, shelf child and bundle ownership. `ARCHITECTURE.md` is absent and architecture mode is off. This was a source review only: no product implementation, real opening, fixture execution, browser or full gate was run. Independent functional review and level-3 conformance remain required after build.
