# ADR-0009: Ownership of a detached document window

Status: accepted
Date: 2026-11-11
Decided by: Sascha (2026-11-11), option A
Architecture impact: level 3 — chat-owned document session, cross-window portal host and correlated dependent-close interface in apps/web-ui; native close/placement adapter in apps/desktop

## Context

[Issue #20](https://github.com/bussard76/exxperts/issues/20) requests moving a room's workspace tree, tabs, previews and Markdown editor to a second-monitor window while chat stays in its original window. One editor/save pipeline, existing workspace policy, revision checks and explicit dirty/conflict controls remain authoritative.

The original proposal at `origin/agents/t20-detach-design`, `3e3d1a7c6de526558565cfb8684e4a98d707923a`, was proposed on 2026-11-10. Its options and earlier uncertainty are historical context. The independent preparation review at `origin/agents/t20-harden-specreview`, `d7c04cedf5077470a5514875bb4ebe0aecc0505a`, `docs/reviews/T20-HARDEN-architecture-spec.md`, identified missing acceptance and exact native-close, ownership/host and geometry contracts. That review is preserved, not retroactively changed to a pass.

The Controller evidence `~/controller-exxperts/evidence/t20-front-order-2026-11-11.md`, section “Front: T20 / #20 unblocked (Sascha 2026-11-11), next priority ahead of #19”, records the human decision verbatim: “ADR-0009 architecture: option A accepted (one chat-owned document session, one portal host, native close/placement adapter in apps/desktop).” It also records approval of the clickable UI basis `origin/bussard76/t20-design-lane` at `5533f71d4813f0b683ff49003e35ebe259b8bdab` on 2026-11-11 and asks for a draft room-labelled recovery strip. The strip has no separate human sign-off.

This revision is authored against current main `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`. Main has no detached document host: App owns tabs/navigation and MarkdownEditorPane owns draft/save state; normal desktop close hides immediately. The prototype is approved UI evidence, not hardened lifecycle or platform evidence. Its broad about:blank allowance, room-only popup name, localStorage geometry and pagehide cleanup are not adopted as contracts.

## Options

### A. Chat-owned document session and one portal host — accepted

Keep a single React owner in chat and one presentation host attached or in a same-origin child. Retain volatile editor/draft/revision/conflict/save authority under that owner and use the existing ReactDOM and HTTP interfaces. apps/desktop mediates native close before hide/quit/reload and remembers accessible child bounds through its existing state mechanism. The child has no second App, room WebSocket, editor/save pipeline or independent lifetime.

This minimizes synchronization while requiring explicit transfer fencing, actual host-document bindings, retained preview snapshots, correlated shutdown and native provenance. The [frozen contract register](../../design/t20-detach-window/contracts.md) specifies those private implementation contracts for fresh Architect review.

### B. Separate subordinate document renderer — historical alternative, not selected

A separate renderer with draft handoff and writer fencing would require more synchronization and bootstrap protocol while retaining the same dependent-close obligations. No separate renderer or second save pipeline is authorized.

### C. Picture-in-Picture or desktop-only hosting — historical alternative, not selected

Platform constraints and always-on-top or browser differences would require another UX/platform decision. No such change is accepted.

### D. Keep documents attached — historical alternative, not selected

Avoids the interface but defers the requested second-monitor behavior. This is not the accepted architecture.

## Decision

Option A is accepted by Sascha on 2026-11-11: one chat-owned document session, one portal host, native close/placement adapter in apps/desktop. This is the exact human architecture choice, not an agent recommendation or an independent spec verdict.

The [Q1–Q10 decision record](../../design/t20-detach-window/front-options.md) retains the 2026-11-10 choices precisely: Q1=A room-labelled Show documents/Return strip; Q2=A one document window per chat session/room; Q3=B remembered Electron bounds with visibility fallback through existing persistence and browser best effort. Q4 and Q6–Q10 retain their accepted recommendation text. Q5=B exceptions are only forced process loss, OS kill and browser close/reload bypassing the async guard. Native normal close remains protected even when its continuation hides to tray; normal quit, updater quit and Electron reload are not silently added to the exceptions.

Normal chat close and room/conversation departure guard and close the dependent child before their continuation; Cancel/refuse/unknown withholds that continuation. Child × means Return, preserving tabs and recoverable in-memory draft/conflict without saving; tab × retains its destructive guard. Explicit Save/Discard/Cancel and Reload/Keep mine retain their meanings, with no discard implied by timeout or failure. A timeout never proves a writer is gone. Draft/host transitions do not themselves save or normalize.

## Consequences

- ADR-0002/0003/0004/0008 remain binding: no broader workspace grant, OS-open action or preview privilege; paired/read-only policy, opaque frames, bounded delivery and accepted frame self-navigation risk remain intact.
- No new package export, dependency, route, durable store or server draft/lease channel is authorized. Remembered child geometry extends the existing desktop window-state record, separately from main bounds; no draft content is persisted. Browser geometry is volatile/best effort. No prototype branch is merged wholesale.
- Native interception must precede current hide, quitting flags, updater/server stop and reload. Parent continuation needs an explicit matching allow plus authoritative dependent-child closure. Partial/unknown teardown retains the owner and reports recovery; it does not promise atomic two-window shutdown or forced-loss preservation.
- The room-labelled recovery strip is a bounded draft based on Q1, not new approved UX. Any broader UX or actually necessary new route/store/dependency/boundary returns through Controller to Front with concrete cause/options and the existing decisions checked.
- This is documentation-only architectural preparation by an Analyst. The accepted ADR does not replace the fresh different Architect's spec review, a subsequent implementation dispatch, independent Tester gates, or level-3 conformance. No browser/native/model check, support claim or product pass is supplied here. Packed Mac/native and actual cross-window drag evidence remain required before claims.
- Later upstream contribution is a separate product-only Series 3 depending on Series 1+2 after their reconciled base. No contribution branch or EXXETA write is authorized here.

## Slicing

1. Record the accepted ADR, approved UI basis, honest strip draft and paired priority/approval history. Check exact human authority, Q1–Q10 and source refs; run documentation diff/scope checks only.
2. Freeze the current-main implementation contract in [T20-HARDEN](../specs/T20-HARDEN.md) and the contract register; a fresh different Architect checks acceptance, ownership, transport, stop criteria and R1–R15 before implementation.
3. After that review and a Controller build dispatch, implement the ordered owner/host, preview/event, lifecycle/native and placement slices test-first. Keep Detach unavailable until required safeguards work. The Developer owns targeted checks, the independent Tester/wave owns host-serial full gates, and a different Architect checks level-3 conformance.
4. Controller relays the [MAC-TASK draft](../../design/t20-detach-window/front-options.md#mac-task-draft-for-front-via-controller) to Front; record final candidate SHA/OS/app/entrypoint and real native/drag evidence before support claims. Do not infer evidence from this ADR or the approved prototype.


## Reconciled C7 amendment — 2026-11-12

Status: accepted
Date: 2026-11-12
Decided by: Sascha (2026-11-12), C7 review option B
Architecture impact: level 3 — narrow the C7 pre-readiness guarantee's threat model; the original architecture option A remains accepted.

### Context and alternatives

The independent [C7 identity review](../reviews/T20-C7-IDENTITY-architecture-spec.md) at `9aaf284df9934522ed75cf8d65c0b4298df3a2a1`, reviewing `2de2cfec8162ebb3d526ece0a6ec8cc4597f69f2`, found that an unchanged iframe `src`, stable WindowProxy and visible fragment do not prove the concrete opaque document before first delivery. The real test holds the genuine shell response, then the trusted app parent's own script navigates that same proxy to an invented replacement and copies the fragment; it receives the retained file's first snapshot. This is a counterexample to the formerly unqualified written guarantee. It is not proof of an external attack: that trusted parent already holds and can read the snapshot. No product-reachable pre-ready navigator controlled by untrusted preview content or an external page was demonstrated.

For this C7 question, review option A was to retain the unqualified guarantee and commission a bounded new authority design; option B was to explicitly narrow the threat model; option C was to change isolation/delivery architecture. These labels belong to this amendment's C7 review, not the historical architecture alternatives above. Sascha selected **C7 option B**. The earlier review remains historically `level-3`; this human decision settles its decision requirement and is not a retroactive pass for that review or any implementation.

### Accepted decision and exact boundary

Front relayed Sascha's decision on 2026-11-12: “a frame navigated before its first ready BY THE TRUSTED APP PARENT's own script is out of scope (that code can already read the snapshot); untrusted preview content and external pages stay fully covered, and every other C7 rule stays.”

Only that privileged trusted-parent pre-first-ready counterexample is excluded. It is an explicit guarantee change, not a new claim that a WindowProxy, visible nonce or `src` authenticates a document. It grants no authority to untrusted preview content, an external page, a foreign frame, an arbitrary same-name popup or stale owner/host/frame messages. It does not authorize an external ready, a second delivery after the first, rearming a navigated frame, a new trust channel or weakening the opaque sandbox, HTTP CSP, permissions, credential checks, byte/parser limits or snapshot/read-count rules. No new route, store, dependency, privilege or different owner is accepted. All other C1–C8, Q1–Q10 and native obligations remain in force.

### Tests, baseline evidence and continuation

Front's exact instruction is: “Keep the pre-ready regression tests for Excalidraw and HTML unchanged, as documented expected behaviour under the narrowed model, not deleted or loosened in other respects.” Retain those real counterexample scenarios and their observation of the original snapshot under explicit trusted-parent navigation; record their expected out-of-scope behaviour and the previous red honestly. Preserve every other assertion, one-use/foreign/stale/after-delivery control and actual producer/consumer requirement. A scoped expectation reconciliation must not become a generic failure waiver, skip or broader relaxation. The reconciled review and later independent Tester/conformance must inspect this boundary and the exact treatment of both tests.

The read-only [baseline comparison](../reports/T20-C7-baseline-comparison.md) pins upstream PR #87 to `5fcffe1036b2d6f867d6583b29822c4985d36fba` and fork main to `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`. The same parent-authority pattern already occurs for PPTX on both baselines, and for Excalidraw on fork main; PR #87 at that SHA does not implement Excalidraw. Baseline HTML directly serves the guarded file under HTTP CSP and has no parent `frame-ready` byte handoff, so this specific handoff counterexample does not apply there. These facts are context, not a waiver of the newly scoped C7 obligations or proof of an external exploit. The five supported type/commit cases were exercised using their unchanged source components in real Chromium with local fixture API/shell responses; this was not full App/auth/parser/native acceptance and changed no `exxeta/*` branch.

Record this amendment in the spec/register, reconcile the accepted boundary, then continue T20 including enabling Detach **as specified** once its connected safeguards are implemented. The decision removes the C7 guarantee-choice blocker; it does not itself prove child movement, recovery, C4/C5 ordering or any native lifecycle. The separately missing sandbox-capable native test environment remains an evidence blocker. No support or full-gate pass follows from this documentation.


## Reconciled C5 no-session amendment — 2026-11-12

Status: reconciled for independent review; implementation remains pending
Date: 2026-11-12
Decided by: Sascha (2026-11-12)
Architecture impact: level 3 — correct the empty-session ordering within the accepted private native lifecycle adapter; architecture option A and all other C5 and C7-B rules remain unchanged.

A live owner reporting no current or retained document session must not leave an interval in which a room can open before the shell consumes that response. Sascha chose C5 no-session option 1: the owner allocates a correlation and reserves the same one-use action arbiter as an active-session close. It prevents opening a room or session until the matching shell commit or abort; exact replay returns the cached result, and timeout or unknown fails closed. The reservation and correlation bind the established native session, owner generation, request and disposition. A receipt, stale message or timeout does not authorize a native continuation.

The [C5 contract register](../../design/t20-detach-window/contracts.md#6-c5-native-transport-trusted-registration-and-entry-point-ordering) reconciles the empty-context representation and ordered commit, explicit no-child evidence, completion and abort acknowledgement for independent review. Only this empty-session ordering is amended. C7 option B, the recorded Q5 exceptions, trusted child registration, native exchange bounds and all other C5 rules remain in force. Preserve the current implementation and disabled Detach while a different Architect reviews this amendment. After a pass, add failing real-endpoint ordering, replay and timeout tests before implementing the amendment; neither this decision nor the documentation is native acceptance or a product pass.
