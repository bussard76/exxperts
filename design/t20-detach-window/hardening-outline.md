# T20 — hardening sequence and evidence boundary

Status: revised author draft, 2026-11-11. This selectively replaces the 2026-11-10 proposal outline at `3e3d1a7c6de526558565cfb8684e4a98d707923a`; earlier proposal/review branches are unchanged. The buildable handoff is [T20-HARDEN](../../docs/specs/T20-HARDEN.md), with [frozen contracts](contracts.md).

## Accepted and outstanding

- Sascha accepted A and approved prototype `5533f71d4813f0b683ff49003e35ebe259b8bdab` as the UI basis on 2026-11-11; [ADR-0009](../../docs/adr/0009-detached-document-window.md) records the exact decision. Q1–Q10 remain unchanged. A and the UI basis need no repeat architecture question.
- The [room-labelled recovery strip](recovery-strip.md) is a draft under Q1, without additional human sign-off. Broader UX returns to Front through Controller.
- Source is main `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`, not a prototype tree transplant. Main has no docs-window hook; the prototype retains UI intent but lacks hardened identities, normal native interception, retained session, complete tree placement, real host events and desktop geometry registration.
- The previous independent review `d7c04cedf5077470a5514875bb4ebe0aecc0505a:docs/reviews/T20-HARDEN-architecture-spec.md` is historical findings/evidence. This author maps all findings/R1–R15 in the spec and claims no independent pass.

## Ordered work after fresh specification review

| Order | Work and owner | Completion criterion |
| --- | --- | --- |
| 0 | Fresh different Architect reviews accepted ADR, source inventory, UI basis/draft, C1–C8 and tests/stop criteria | Controller receives that review before dispatching implementation; this outline supplies no verdict. |
| 1 | UI owner/editor retention and one arbiter (C1/C2/C4) | Existing attached behavior preserved; failing public-entry latest-save/conflict/context tests made green; no Detach exposed. |
| 2 | Private portal/host bootstrap and actual document bindings (C3/C7/C8) | Real popup/editor/tree/preview producer-to-consumer tests prove exact source/snapshots, correct event hosts and failure rollback. |
| 3 | Desktop registered child and native prevention (C5), dependent closure | Actual shell/owner tests prove before-hide/quit/updater/reload ordering, refusal/abort/commit and child-closed; fake transport endpoints alone are insufficient. |
| 4 | Existing desktop-state child geometry (C6), Q1 strip and recovery | Real child consumes correct validated bounds, main record survives, Return works without child access; browser best-effort limits explicit. |
| 5 | Integrate safeguards and expose original approved affordance | R1–R15 evidence inventory is complete for the claimed environments; Developer targeted checks, independent Tester host-serial full gates and level-3 conformance precede integration. Missing native/drag evidence stays explicit. |

Shared semantics are implemented in this order, not independently guessed across workers. Any future split assigns one implementation owner to each frozen interface and integrates actual producer **and** consumer. No new dependency, public package export, route, durable store or backend is budgeted. If required, stop with cause/options after checking the existing decisions. Read-only/paired/workspace policy, preview sandbox and fake-only tests stay mandatory. No #19, T22, upstream-series source/review/branch or accepted older ADR is changed by this task.

The future product-only Series 3 depends on Series 1+2 after their reconciled common base. No branch cut or upstream action is performed. Native/Mac work is only the [MAC-TASK draft](front-options.md#mac-task-draft-for-front-via-controller), relayed later by Controller; no support claim is supplied here. Today's checks are documentation/source/scope checks and mandatory commit hooks only, never manual npm/product/browser/native/fullgate execution.
