# T20-HARDEN-R2 architecture spec

Verdict: pass

Reviewed commit: 5d911938b5ffc642571214f28711fc3acb7107d9

Spec: `docs/specs/T20-HARDEN.md` and `design/t20-detach-window/contracts.md`, author freeze v1 at the reviewed commit. The fetched `origin/agents/t20-revised-spec` resolved to that exact commit; `origin/main` resolved to `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`. This is an independent second-round pre-build review, not implementation evidence.

Level: 3, confirmed: the document host crosses window documents and introduces correlated native lifecycle and placement interfaces. Decision: accepted [ADR-0009](../adr/0009-detached-document-window.md), option A, decided by Sascha on 2026-11-11. The Controller's dated evidence also approves prototype `5533f71d4813f0b683ff49003e35ebe259b8bdab` as UI basis. Q1–Q10 remain in force; the room-labelled strip is a bounded draft, not a further sign-off. No new human decision is needed for this review.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow and evidence |
| --- | --- | --- |
| I1–I4, I6: one session and host; exact draft and writes | App owns context and arbitration; editor owns one engine; `docs-window.ts` owns presentation host (C1–C3) | Main's `App.tsx` owns tabs and pending navigation, while `MarkdownEditorPane.tsx` owns source/baseline and save drain. C2 retains them across host movement, fences generations, and reconciles unknown PUT through existing GET/revision; R1–R3 and R8–R9 cross real editor/host and server seams. Child Return is distinct from destructive tab close. |
| I5, I10: normal close and Q5 exceptions | App arbiter C4 ↔ desktop `main.ts` C5 | Current main hides on close, sets quit state before server stop, and has direct reload/updater paths. The register prevents those effects first, correlates prepare/abort/commit and authoritative child closure, and limits loss exceptions to the recorded Q5=B cases. R3–R8/R15 exercise actual entry points. Missing/late/duplicate/busy outcomes fail closed; no timeout grants writer or exit. |
| I7: child identity and placement | Desktop registration C5 and existing `window-state.ts` C6 | One-use registration binds the actual child; existing state file is extended with separate child bounds, current work areas and fallback. Main fields remain intact; browser geometry is volatile and best effort. R13–R15 test actual adapter/child and offscreen recovery. |
| I8: actual host and retained previews | C7 host binding → editor, overlays and actual frame consumers | Current framed preview listens on global window and transfers its buffer; HTML currently reads from the frame route. C7 binds the actual parent realm, retains snapshots, copies transferred bytes, checks actual frame source and reuses the guarded HTML frame entry with unchanged CSP. R10/R11 require real rendered content, scripts, blocked fetch and foreign/stale frame checks. |
| I9: tree path and policy | C8 actual tree/chat producer → composer and existing room routes | Existing relative-path MIME and insertion are preserved with context validation; R12 requires real cross-window drag, not helper-only evidence. R14 covers local/paired/read-only and fake OS opener; no new grant. |
| Outside-in and delivery | Approved prototype, logic diagram, strip draft, paired coordinator/workflow record | Prototype supplies appearance, not lifecycle proof; its room-only popup name, localStorage geometry and pagehide behavior are not adopted. The logic and C1–C8 specify empty, failure, recovery and ownership states. I1–I10 map to R1–R15; MAC-TASK requires final candidate SHA and actual packed Mac/drag evidence before support claims. |

The nine author paths were reviewed together: spec, contracts, logic, front options, hardening outline, strip, ADR and both paired decision records. Issue #20 was read via the fork's issue API after `gh issue view` hit GitHub's deprecated projectCards query. The accepted Controller evidence and the isolated prototype source were checked against current main. Earlier proposal and first review are historical inputs, not the accepted spec.

## Prefactoring

Separate the document tree/rendering and retained editor/session ownership only as needed within the existing web UI; replace the single pending callback with the specified correlated arbiter. Keep the desktop adapter and geometry inside the existing desktop ownership. No generic bus, second App, server draft store, new route or dependency is warranted. Owner foundation precedes host and native integration; placement depends on registered native child. If implementation is split, assign one owner to each frozen interface and retain the real producer-to-consumer tests in R1–R15.

## Findings and binding Developer instructions

No design-relevant unresolved finding prevents a build dispatch. The first review's findings 2–4 are covered respectively by C1/C2/C4/C5 and R3–R8/R15, C1–C3/C7/C8 and R1/R2/R7–R12/R14, and C5/C6 and R13–R15. The following precision instructions bind the implementation and its tests:

1. Apply the C4 dependent-child shutdown only to a continuation that actually exits or replaces the current context, or to chat close. A selected-file/tab action stays in the host; a room operation that does not change context retains its existing effect. Resolve the broad R4 wording by exercising each real callback and asserting closure before the actual context-changing or destructive continuation, without inventing a context change for a non-leaving operation.
2. Treat native `frameName` as the opaque one-use permit selector: it must contain no room/path/draft, credential or reusable authority. Bind registration to the actual opener, live permit and child; never accept a frame name alone. The transfer request's draft stamp is recaptured at gesture admission as C5 states, while context/host and permit provenance remain validated.
3. For a selected-file/tab action, commit executes that action once without manufacturing child-closed evidence. For an exit, `prepared` is readiness only: retain the fence until current commit and actual matching closed/no-child evidence, then execute its immutable continuation once. A missing abort acknowledgement reserves the arbiter; a late acknowledgement may release only that attempt, never revive its continuation. Preserve this ordering in actual producer/consumer tests.
4. Keep original preview snapshots and frame instance identity under the owner, and verify the changed HTML frame response through the real authorized route and actual opaque child. A ready message or matching source alone is insufficient after arbitrary frame navigation; only a controlled new frame may receive a copy of the retained snapshot. Preserve the existing frame policy, size limits and accepted self-navigation risk.
5. Keep Detach unavailable until the owner, host and native safeguards for the relevant entry point work together. The 100 ms private native exchange is bounded and fail-closed; test the actual shell and owner endpoints including stuck/malformed/late responses and one-use permits. If the existing adapter or frame approach cannot meet the frozen behavior without a new route, dependency, durable store, public export, broader UX or a different architecture, stop and send Controller the concrete cause and options rather than silently changing the contract or expanding Q5 exceptions.

## Next step and review boundary

Controller can dispatch the ordered test-first build against the pinned spec. Developer and independent Tester must run the specified real-entry checks and full gates; a different Architect must perform level-3 conformance. Controller should relay the MAC-TASK and withhold native/platform support claims until final-candidate evidence exists. No test, browser, native, product, dependency, install or full gate was run in this review; no product behavior or support is claimed. No code or tests were added. The only intended change is this report.
