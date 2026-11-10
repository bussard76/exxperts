# ADR-0009: Ownership of a detached document window

Status: proposed
Date: 2026-11-10
Decided by: Sascha pending
Architecture impact: level 3 — web UI document ownership, cross-window rendering and correlated dependent-close contract; remembered Electron child-window bounds with visibility validation/fallback and native close interception

## Context

[Issue #20](https://github.com/bussard76/exxperts/issues/20) asks for the workspace tree, file tabs, previews and Markdown editor to move into a separate window for a second monitor. The chat remains in its original window and file references target the current document host. Exactly one editor owns writes within that document session, with existing server revision guards retained.

The two latest Front entries in `~/controller-exxperts/inbox-done.md`, read 2026-11-10, order a logic diagram, a proposed ADR, then open questions for Sascha. Sascha's separate upstream direction, recorded in the issue's 2026-11-10 comment, places this feature in a later series 3 depending on series 1 (document pane) and series 2 (editor). Series cuts remain parked. These instructions authorize design, not implementation or acceptance of an ownership mechanism.

Sascha's product decisions, 2026-11-10, relayed by Front/Controller: the document window closes with chat and on leaving the room, never works independently, and Save/Discard/Cancel protects normal chat close/room exit with Cancel keeping both windows open. Q5=B explicitly excepts forced process loss, OS kill, and browser close/reload bypassing the async guard. It supersedes the earlier absolute requirement on those exception paths; C/D are not chosen. This does not accept the ADR or prove a normal native close guard.

Sascha also decided on 2026-11-10, recorded in [Front options](../../design/t20-detach-window/front-options.md): Q1=A room-labelled Show documents/Return strip; Q2=A one document window per chat session/room; Q3=B remembered Electron position with visible-bounds validation/fallback, browser best effort (supersedes Q3=A). He accepted exactly the existing recommended text for Q4 and Q6–Q10, reproduced verbatim there and in the paired coordinator/workflow history. Q9 records cross-window drag intent only, still untested; Q10 Mac proof remains required. Product choices are not ADR acceptance or implementation proof.

[The logic proposal](../../design/t20-detach-window/logic.md) was written first. At fork base `3fe7bc7`, `App.tsx` owns document tabs, active pane and dirty-navigation continuation; `MarkdownEditorPane.tsx` owns the draft, revision state and save pipeline. Desktop `wireNavigation` permits same-origin children and main close hides to tray. There is no existing complete cross-window session or dirty-close/recovery interface. Several document features bind global window/document listeners, including preview frame messages; moving DOM alone is insufficient.

ADR-0002's room/workspace protections, ADR-0003's local-only explicit OS-open action and ADR-0004's contained preview rules remain constraints. ADR-0008 confirms this is level 3 because of the new interface/data flow, irrespective of file count. #16's later deferral means its shortcut/focus proposal is neither available nor required for T20.

## Options

### A. Chat-owned document session, child presentation host (recommended for feasibility work)

- Retain one React owner in chat; render exactly one document host attached or into a same-origin child using existing ReactDOM facilities. Reuse existing HTTP authorization and save interfaces. Do not start another `App`, room WebSocket or writer in the child.
- Lift the necessary volatile draft/session state to the owner before relying on child-loss recovery. Define a guarded host-transfer interface and actual host document/window for events, focus, overlays and frame messages. Bootstrap via the existing static app entry is a candidate, not a selected new route.
- Avoids a separate draft synchronization protocol and new dependency, but introduces the transient correlated close-decision interface specified in logic. Chat coordinates request/allow/refuse/commit/child-closed results with owner, room, host and draft generations; timeout/unknown fails closed. Concentrates selection, dirty guards and saves in one place. Requires evidence for editor remount/transfer, CSP/styles/assets, native close ordering and hidden-owner behavior.
- The child is subordinate to chat and the current room. On guarded chat close or room exit, close it before the parent continuation; Cancel/refuse/unknown keeps both windows and room intact. Chat's current native close-to-tray handler must not hide first and leave the child running.
- Q6 requires exact in-memory draft/conflict preservation through movement without saving, contingent on proof. Q5=B documents that forced process loss, OS kill and browser close/reload bypassing the async guard can lose volatile drafts. Those exceptions do not authorize independent child operation or durable recovery; normal close/room-exit protection still needs real evidence.

### B. Separate document renderer, still subordinate to chat and room

- Load a document-only renderer and delegate one editor/save pipeline to it, with explicit transfer on detach/Return. Chat remains the lifetime and close coordinator; this option must implement the same refusal, generation, save/conflict and dependent-shutdown contract. Same-origin messaging may avoid a package dependency.
- Requires bootstrap/document mode, sender/origin validation, correlated close replies, transfer/fencing rules and recovery. The child must not continue editing after its owner/room lifetime ends; timely owner-loss detection under native/forced termination is unproved. A channel or timeout is not a writer lock, shutdown acknowledgement or permission to exit.
- More protocol than A without removing the need to prove normal/native guard and subordinate lifetime. Q5=B exceptions apply equally; new route, durable store or server lease is not preapproved. A child surviving independently or remaining pinned to a room being left is excluded by Sascha's decision.

### C. Document Picture-in-Picture or desktop-only hosting

- A platform-managed document window, or a desktop-specific adapter, may simplify parts of placement or native lifecycle handling.
- Requires platform support evidence and a decision about the plain-browser experience. Picture-in-Picture's always-on-top behavior may not fit a normal second-monitor window. A desktop-specific solution needs a browser alternative; it is not assumed to satisfy the ticket by itself.

### D. Keep documents attached for now

- No new interface or lifecycle risk, but leaves the second-monitor request undelivered. A valid deferral option if none of the designs proves acceptable; only Sascha decides this tradeoff.

## Decision

Architecture pending. No option is accepted. Recommendation A and the correlated close mechanism are agent proposals conditioned on feasibility evidence, not Sascha's selection of a technical design. The record must remain `Status: proposed` and `Decided by: Sascha pending` until the architecture decision is explicitly accepted under the project protocol.

Recorded product constraints: dependent closure, normal-path Save/Discard/Cancel with Cancel retaining both windows, Q5=B documented exceptions, later separate upstream series 3, Q1=A/Q2=A/Q3=B and the accepted Q4/Q6–Q10 recommendations. Explicit Discard is deliberate, never a fallback for failure. Q5 C/D are not chosen; durable recovery is not approved. The technical architecture/transport remains proposed. These product decisions are not implementation authorization or full outside-in/ADR sign-off; pending acceptance must remain explicit in the header.

## Consequences

- No product files, lockfiles, accepted ADRs or factory rules change in this task. These proposal artifacts remain in the fork; they are not the future upstream contribution diff.
- Any later implementation must retain one writer per document session, existing permissions/revision conflicts, explicit Reload/Keep mine and Save/Discard/Cancel, read-only behavior, preview containment and the absence of automatic OS-opening side effects.
- Chat learns refusal from an explicit reply echoing request ID, action/target and owner/room/host/draft generations; it cancels only that continuation. Pending save, conflict, lost response, timeout/unknown or late allow cannot authorize closure. Serialize simultaneous close/room/child actions, do not overwrite the existing pending-action ref, and require matching child-closed evidence before parent exit. These are proof obligations, not a claim of implemented atomic closure.
- The specification must distinguish protected normal/native close from the exact Q5=B exceptions, close-to-tray from quit, lost write acknowledgement from failed save, and child destruction from focus/communication loss. Generic browser Leave/Stay is not the custom guard. No forced-loss preservation or immediate orphan-shutdown proof is claimed; the child never operates independently.
- Q5=B is chosen, C/D are not. No new durable store or broader exception is accepted; normal Electron close is not exempt merely because the current handler hides immediately. Q10 requires platform/entry-point evidence, specifically Mac proof, before support claims.
- Accepted product behavior: Q4 guards/closes on conversation-only switch with explicit Detach to reopen; Q6 preserves exact in-memory draft/conflict without saving, contingent on proof; Q7 child close returns tabs/draft while tab × uses its guard; Q8 retains core document/snapshot behavior; Q9 preserves workspace-relative insertion where cross-window browser drag works, with click/selection and no implied clipboard effects. Q9 is still untested; extra state-preservation promises are not established by these decisions. Exact accepted wording remains in Front options.
- No new dependency is expected for A or B. No new server route, package export, durable store or permission grant is proposed for A. Exact internal interfaces, storage of remembered child bounds and visibility-validation/fallback details need specification and the later Architect review; the product placement decision does not approve a new store or a specific implementation.
- Testing and UI acceptance remain future work. Code reading and diagrams do not establish working lifecycle safety. No feature tests/full gate are appropriate to this documentation-only task. Native browser/desktop evidence and mocked public-entry tests are required if implementation is later authorized.
- Read-only Front inspection at `origin/bussard76/t20-design-lane` commit `5533f71d4813f0b683ff49003e35ebe259b8bdab` finds a portal/blank-popup prototype, not the proposed correlated close implementation. Its lifecycle, bounds, tree location and native handling still need reconciliation/evidence. The [hardening outline](../../design/t20-detach-window/hardening-outline.md) maps observed files/flows to missing implementation, tests and acceptance-preparation steps; no lane code was changed or executed here.

## Slicing

1. **Current design only, level 3:** logic diagrams first, this proposed ADR second, then Front questions/dependency map/standalone commit plan/draft PR description. Verify requirements and proposal/decision labels; signed commits, fork design branch only.
2. **Outside-in decision gate:** Front discusses one question at a time with Sascha, obtains UI drafts plus clickable fake unless explicitly waived, agrees interfaces and logic, and records the chosen architecture in an accepted ADR. No T20 waiver is inherited from #16 or another feature. Independent Architect spec review remains required before the build.
3. **Bounded feasibility evidence, only if separately authorized:** prove the selected host bootstrap, actual editor/event/frame behavior, dirty-close/recovery ordering and hidden-owner lifecycle using invented data. A failed proof returns options to Front, rather than silently broadening the interface or accepting data loss.
4. **Future implementation, level 3:** one owner/host seam, application-controlled transfer and routing, then lifecycle/recovery and the decided Q3=B Electron bounds validation/fallback with browser best effort, each test-first through real producer/consumer entry points. Independent Tester and architecture conformance precede integration. Preserve existing behavior/tests; escalate any new store, route, dependency or expanded flow.
5. **Later upstream series 3:** only after series work resumes and series 1+2 are reconciled and independently buildable; extract a standalone product-only delta with its own checks, commit list and PR text as proposed in the Front plan. No series cut or upstream write is authorized here; Sascha sends later from his clean upstream clone.
