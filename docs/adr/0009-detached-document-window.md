# ADR-0009: Ownership of a detached document window

Status: proposed
Date: 2026-11-10
Decided by: Sascha pending
Architecture impact: level 3 — web UI document ownership, cross-window rendering and lifecycle; optional desktop child-window placement and close handling

## Context

[Issue #20](https://github.com/bussard76/exxperts/issues/20) asks for the workspace tree, file tabs, previews and Markdown editor to move into a separate window for a second monitor. The chat remains in its original window and file references target the current document host. Exactly one editor owns writes within that document session, with existing server revision guards retained.

The two latest Front entries in `~/controller-exxperts/inbox-done.md`, read 2026-11-10, order a logic diagram, a proposed ADR, then open questions for Sascha. Sascha's separate upstream direction, recorded in the issue's 2026-11-10 comment, places this feature in a later series 3 depending on series 1 (document pane) and series 2 (editor). Series cuts remain parked. These instructions authorize design, not implementation or acceptance of an ownership mechanism.

[The logic proposal](../../design/t20-detach-window/logic.md) was written first. At fork base `3fe7bc7`, `App.tsx` owns document tabs, active pane and dirty-navigation continuation; `MarkdownEditorPane.tsx` owns the draft, revision state and save pipeline. Desktop `wireNavigation` permits same-origin children and main close hides to tray. There is no existing complete cross-window session or dirty-close/recovery interface. Several document features bind global window/document listeners, including preview frame messages; moving DOM alone is insufficient.

ADR-0002's room/workspace protections, ADR-0003's local-only explicit OS-open action and ADR-0004's contained preview rules remain constraints. ADR-0008 confirms this is level 3 because of the new interface/data flow, irrespective of file count. #16's later deferral means its shortcut/focus proposal is neither available nor required for T20.

## Options

### A. Chat-owned document session, child presentation host (recommended for feasibility work)

- Retain one React owner in chat; render exactly one document host attached or into a same-origin child using existing ReactDOM facilities. Reuse existing HTTP authorization and save interfaces. Do not start another `App`, room WebSocket or writer in the child.
- Lift the necessary volatile draft/session state to the owner before relying on child-loss recovery. Define a guarded host-transfer interface and actual host document/window for events, focus, overlays and frame messages. Bootstrap via the existing static app entry is a candidate, not a selected new route.
- Avoids a separate state synchronization protocol and new dependency. Concentrates selection, dirty guards and saves in one place. Requires evidence for editor remount/transfer, CSP/styles/assets, native close ordering and hidden-owner behavior.
- The child depends on the chat owner's lifetime. It cannot independently continue after that owner is destroyed. In-memory recovery does not survive owner/process loss. No durable draft store is proposed; the resulting limit needs Sascha's explicit product choice, not an assumption that autosave prevents loss.

### B. Detached app owns the document session, explicit ownership handoff

- Load a document-only app surface in the child, with its own editor state and save pipeline. Transfer ownership on detach/Return; chat sends document intents and displays status. Same-origin messaging such as BroadcastChannel or checked `postMessage` is possible without a package dependency.
- Can keep the child useful after chat closes, if that is the chosen product behavior. Needs a bootstrap/document mode, session identity, versioned messages, sender/origin validation, request acknowledgement, stale-result rejection, transfer/fencing rules and a recovery policy. A channel or timeout is not a writer lock; the server's revision conflict is not owner election.
- More independent lifecycle behavior, more protocol to specify and test. Dirty-state transfer and duplicate-writer prevention remain hard during crashes or lost acknowledgements. New route, durable store or server lease is not preapproved by naming this option; return for an explicit architecture decision if required.

### C. Document Picture-in-Picture or desktop-only hosting

- A platform-managed document window, or a desktop-specific adapter, may simplify parts of placement or native lifecycle handling.
- Requires platform support evidence and a decision about the plain-browser experience. Picture-in-Picture's always-on-top behavior may not fit a normal second-monitor window. A desktop-specific solution needs a browser alternative; it is not assumed to satisfy the ticket by itself.

### D. Keep documents attached for now

- No new interface or lifecycle risk, but leaves the second-monitor request undelivered. A valid deferral option if none of the designs proves acceptable; only Sascha decides this tradeoff.

## Decision

Pending. No option is accepted. Recommendation A is an agent proposal conditioned on feasibility evidence, not a Sascha decision. The record must remain `Status: proposed` and `Decided by: Sascha pending` until Sascha explicitly selects an option and the Controller records his dated statement under the project protocol.

The separate upstream-series intent is recorded; it does not approve UI behavior, state ownership, popup transport, dirty-close policy, persistent recovery or implementation. [Front's question set](../../design/t20-detach-window/front-options.md) preserves those choices and their practical costs.

## Consequences

- No product files, lockfiles, accepted ADRs or factory rules change in this task. These proposal artifacts remain in the fork; they are not the future upstream contribution diff.
- Any later implementation must retain one writer per document session, existing permissions/revision conflicts, explicit Reload/Keep mine and Save/Discard/Cancel, read-only behavior, preview containment and the absence of automatic OS-opening side effects.
- The specification must distinguish browser native close from app-controlled Return, Electron tray hide from quit, lost HTTP acknowledgement from failed write, and confirmed child destruction from mere loss of focus or communication. It must state recovery limits without promising asynchronous unload saves or lossless crash recovery.
- Product questions include detached controls, window cardinality, placement, room-following versus pinning, dirty host transfer and lifetime after owner close. The new window's tree-to-composer interaction, shortcuts, selection/scroll preservation, paired-device eligibility and theme/accessibility also need explicit acceptance scope.
- No new dependency is expected for A or B. No new server route, package export, durable store or permission grant is proposed for A. Exact internal interfaces and any native placement change need the later Architect review; this ADR proposal does not preapprove them.
- Testing and UI acceptance remain future work. Code reading and diagrams do not establish working lifecycle safety. No feature tests/full gate are appropriate to this documentation-only task. Native browser/desktop evidence and mocked public-entry tests are required if implementation is later authorized.

## Slicing

1. **Current design only, level 3:** logic diagrams first, this proposed ADR second, then Front questions/dependency map/standalone commit plan/draft PR description. Verify requirements and proposal/decision labels; signed commits, fork design branch only.
2. **Outside-in decision gate:** Front discusses one question at a time with Sascha, obtains UI drafts plus clickable fake unless explicitly waived, agrees interfaces and logic, and records the chosen architecture in an accepted ADR. No T20 waiver is inherited from #16 or another feature. Independent Architect spec review remains required before the build.
3. **Bounded feasibility evidence, only if separately authorized:** prove the selected host bootstrap, actual editor/event/frame behavior, dirty-close/recovery ordering and hidden-owner lifecycle using invented data. A failed proof returns options to Front, rather than silently broadening the interface or accepting data loss.
4. **Future implementation, level 3:** one owner/host seam, application-controlled transfer and routing, then lifecycle/recovery and any separately chosen placement behavior, each test-first through real producer/consumer entry points. Independent Tester and architecture conformance precede integration. Preserve existing behavior/tests; escalate any new store, route, dependency or expanded flow.
5. **Later upstream series 3:** only after series work resumes and series 1+2 are reconciled and independently buildable; extract a standalone product-only delta with its own checks, commit list and PR text as proposed in the Front plan. No series cut or upstream write is authorized here; Sascha sends later from his clean upstream clone.
