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
