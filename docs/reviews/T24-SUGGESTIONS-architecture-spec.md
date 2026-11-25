# T24-SUGGESTIONS architecture spec

Verdict: level-3

Spec: [issue #24](https://github.com/bussard76/exxperts/issues/24), including Sascha's 2026-11-25 decisions, and the dispatched task; repository base `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`. No T24 task spec is present in `docs/tasks/` at this base.

Level: 3, raised from the issue's unclassified architecture impact. Automatically sending chat context to a separate model after an answer and delivering its output to the composer introduces a different data flow and a delivery contract. The issue has no `## Architecture impact` specifying level, owners and boundaries. ADR-0008's file/module clarification does not change the data-flow criterion.

Decision: Sascha has chosen automatic generation and a small model of the room's provider, but no accepted ADR with `Decided by: Sascha` records this level-3 design. The Controller must obtain and record the decision before implementation. The issue's product decision does not itself specify the data-flow design or substitute for the required accepted ADR.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Answer completion and generation | Room turn execution (`apps/web-server/src/room-socket.ts`) and an isolated model worker (`persistent-agent-worker-runtime.ts` are existing candidates) | Finished turn → bounded context → tool-less model call | Specify which successful answer endings trigger one call, including retries, stop, failure, queued turns and background/reconnected turns; define ownership and prevent duplicate calls. `room-socket.ts` distinguishes `agent_end`, retry and other termination paths. |
| Model choice | `room-models.ts` catalog and provider policy | Room's provider → suitable available model | Define an exact deterministic selection and unavailable fallback for curated, custom and gateway providers. The catalog has conversation/memory lists and recommendations, but its provider order is not a size ranking; “smallest suitable” cannot be implemented from this contract alone. Never silently cross providers without a decision. |
| Privacy and resource limits | Server-owned suggestion generation and provider call | Conversation content leaves the room for the chosen provider | Specify exactly which text, roles and history are sent, bounds and truncation, excluded tool results/attachments/secrets, retention/logging and usage/cost accounting; specify timeout, output limits and concurrency/cancellation. The existing isolated worker supports abort, timeout and token caps, but the issue chooses none. |
| Delivery and stale state | Server/room transport and UI chat state | Result associated with the originating room, thread and answer → correct composer | Fix the transport and exact fields, correlation, lifetime and behavior on later answers, room/thread switches, reconnects, multiple windows and late results; decide whether results persist. Without correlation, a slow prior result can appear in a different or newer conversation. |
| Composer interaction | `apps/web-ui/src/App.tsx`, composer and `composer-hint.ts` | Suggestion is display-only until explicit acceptance | Specify exact eligibility and precedence with the existing connection, answering, approval and switching hints, plus keyboard focus/IME and mention handling. Define Tab/Shift+Tab when zero or one suggestion exists and a keyboard escape from cycling so keyboard users can leave the composer. |
| Empty, ambiguous and error | Server output parser and UI | Untrusted model output → 0–3 plain text suggestions or fallback | Define response format, validation, length, malformed/partial output and error/timeout behavior, including what happens to prior suggestions. Guarantee plain text and no tool execution; explicitly preserve the normal placeholder when no usable result exists. |
| Outside-in and parallel work | Feature spec, design and implementers' shared interface | Signed-off experience → producer/consumer contract → tests | `design/` contains only its README: no T24 export, interface definition or logic diagram is present, so matching evidence cannot be verified. Supply the applicable signed-off design, logic diagram and exact producer/consumer fields. If work is parallel, name dependencies and add a test through the real producer and consumer with a fake model source, not only separate fakes. |

## Prefactoring

None is established as necessary yet. Reuse the existing isolated, tool-less worker and room model catalog where the accepted design fits; choose the smallest local changes after the delivery and model-selection seams are specified.

## Findings

1. **Level-3 decision required.** Options: (A) server owns a bounded, tool-less call tied to a completed room/thread/turn and delivers correlated results to the composer; (B) the client requests suggestions after an answer through a server endpoint, with server-side authorization and correlation; (C) defer automatic suggestions. Recommend A because the server already owns turn completion and the isolated worker, while explicitly deciding multi-window/reconnect ownership and costs. Each option needs its privacy and lifecycle consequences recorded in the ADR; the chosen design must honor Sascha's automatic-generation decision or return any change to him.
2. **Design is not buildable as written.** Resolve the missing contracts, model policy, privacy limits, lifecycle and UI states in the checklist, and add `## Architecture impact`. Specify observable acceptance checks for these paths with invented data and a fake suggestion source. The existing issue is a product wish, not a sufficient interface or logic specification.
3. **Outside-in evidence is absent.** Provide the applicable feature design export, interface and logic diagram, or record the approved reason an artifact does not apply. If multiple builders are planned, fix shared fields and dependencies before dispatch and cover the actual producer-to-consumer seam with one integration test.

Reviewed by: Worker Architect, Codex, 2026-11-25.
