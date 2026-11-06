# T4-R4 architecture spec

Verdict: pass
Spec: `~/controller-exxperts/analysis/T4-spec-R4.md`, SHA-256 `9f487eb4a2fe97a5b715bf50275f3b8c42b657909d0ee6775712bf92390f5c62`; reviewed against `origin/main` at `7fac9a1ffff5c4003728d759f0dbbf0d0808243e`.
Level: 3, confirmed: guarded workspace documents enter a new preview flow and a separate explicit action dispatches a file to the host OS.
Decision: ADR-0002 and ADR-0003 record Sascha's accepted options. ADR-0002 and #5 are on the reviewed base; ADR-0003 is accepted at `origin/agents/t4-adr` (`e8e871d8caa0764a1bebd3ad951472c8ce5c14f7`) but is absent from main. Integrate it on the actual build base before implementation. This pass does not authorize building on a base without it.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow and proof required |
| --- | --- | --- |
| R1–R3, R6; signed design | Workspace tree, ephemeral tabs, existing Markdown guard | Contextual identity, reactivation, active tree, right-then-left close and dirty transitions are specified; B1/B2/B5 prove them. No preview editing, saving or downloading; explicit opening is a separately signed action. |
| R4, A2–A3 | Existing child → validated workbook → React grid | OOXML uses ExcelJS; legacy uses the owned bounded CFB/BIFF path and bounded SheetJS SSF only. All sheets, stored results, basic styles and scrolling are required, with complete-or-error behavior. P2/B3 use independent invented fixtures and actual producer/consumer. |
| R5, A2 | Child Word renderer → validated static HTML → empty sandbox | P3/B4 require text, tables, decoded images, styles, network denial and the real browser consumer. The child is not an OS sandbox; jsdom compatibility is still a future proof. |
| PDF and images | Existing child raster and guarded image route → UI | P4/B7 cover all PDF pages and actual appearance without plugin dependence; B1/B5 retain #5 image behavior and SVG containment. Conditional PDF fidelity is not already proven. |
| Workspace and route authority | Room routes and existing policy/resolver | Preview GET is `read`, rechecks policy after parse and returns controlled errors; ADR-0002 guards remain authoritative. P1/P5/O4 prove refusal, cleanup and no stale success. |
| Explicit local opening | Local POST → repeated workspace guard → private fixed platform adapter | ADR-0003: affirmative local authentication/origin/socket checks, paired/shared refusal, no shell or client-selected application; fake-only O1–O4/B6. Acknowledgement does not prove display; the residual path race is accurately recorded. |
| Packaging and Windows | Existing bundle/release ownership, private Windows child | Exact approved package consumers and pins, retained closures/assets/notices, Koffi native ABI and IPC, non-opening Windows probe and K1 installed proofs are specified. No new generic process facility or public parser seam. |
| A1, A4 and integration | Developer → independent Tester → level-3 conformance → wave; Sascha | Targeted Developer checks; independent full gate and browser suite on reconciled main; Sascha alone tests real files, Electron and actual opening. No result is claimed before these occur. |

## Prefactoring

None before build. Extend the existing child and parent lifecycle while preserving shelf behavior; reuse the landed workspace resolver, room policy, editor guard and packaging seams. Keep parser and opener internals private. Any additional public export, dependency, responsibility or data flow needs the specified review and approval; a broader refactor is not needed for this design.

## Findings and binding precision

No design-relevant change-spec finding remains. The following clarifications bind the build dispatch and do not add approvals:

- The historical wording at R4 §7 calls the owned decoder conditional on a decision gate, and §7.2 asks for macro/chart-sheet reconciliation. The Controller's later bounded-legacy decision has selected the reviewed decoder; no new parser decision is pending. R4's controlling complete-or-error rule and every-sheet requirement apply to these sheets too: never report success while silently dropping one. A demonstrated inability to meet that scope is escalated, not treated as an accepted chart omission.
- P5's general instruction to test every bound is read with the later specific accounting table: prove reachable exact/one-over boundaries and the stated invariants for dominated, physically unreachable limits; do not fabricate impossible inputs. Pre-operation admission, rather than timeout or post-allocation checks, remains binding.
- The full-gate command and default internal smoke parallelism match the current policy. The Controller must serialize full gates across all pools and enforce `GATE_SLOTS=1` for every full-gate caller; the environment variable alone does not provide global exclusivity. Rerun each failed parallel smoke alone on the same commit and report both results. Documentation-only review gets no full gate.

## Gates and evidence limits

Before build, integrate accepted ADR-0003, reconcile landed #5/ADR-0002 and carry this complete review and the Controller's exact package and coverage-preserving test-correction approvals into the dispatch. A new Sascha parser approval, extra CFB-only review, real-file test or Windows opening is not a pre-build gate. The normal implementation proofs remain mandatory: P1–P5, B1–B7, O1–O4 and K1, actual installed closure and formatter bounds, fidelity, independent functional review and level-3 conformance. A safe non-opening probe on an explicitly approved Windows host is required to claim verified Windows packaging, but does not block authoring the adapter. Sascha's real-file and OS/Electron acceptance remains separate.

Read issue #4 and all four decision comments, ADR-0002/0003, signed design text, Controller decisions, the complete R4 spec, independent CFB and R3 reviews, package and Windows reviews, and connected workspace resolver, room routes, shelf child lifecycle and bundle ownership. The CFB review's superseded SheetJS workbook/CFB approach is not an authorized production path in R4; its bounded extraction, owned decoder, byte ownership, work metering, independent fixture and integration obligations are carried forward. The package and Windows reviews' conditions are retained without representing candidate inventory, native layout or runtime fidelity as executed evidence. No maintained `ARCHITECTURE.md` exists.

This is an independent source/spec review only. No product code, fixtures, real files, opener, browser, tests or full gate were run. No separate refactoring or new Sascha decision is recommended; actual decoder completeness, finite allocation, installed/platform behavior and visual fidelity remain to be proven during implementation and acceptance.
