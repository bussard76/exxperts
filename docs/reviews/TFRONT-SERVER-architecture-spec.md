# TFRONT-SERVER architecture spec

Verdict: pass
Spec: Sascha's documentation-only request dated 2026-11-10, reproduced in dispatch task_97e10ffb8996 / ctx_1e3fecfe7b33; repository baseline 3fe7bc75ad43199f9becde9ef85d99e876051b55. Issue #20 is not this task's definition.
Level: 1, classified for recording the existing server Front pilot in two process documents; no implementation or new operational interface is authorized.
Decision: Record Sascha's existing pilot decision of 2026-11-10 under ADR-0001's process-decision rule; no new ADR needed for this bounded documentation change.

## Architecture impact

- Owning topic: existing factory coordination documentation, `docs/coordinator.md` and `docs/dev-workflow.md`.
- Responsibilities remain Front talks to Sascha and prepares work; Controller steers workers; independent reviewers retain their gates. An Orca parent relationship does not transfer worker-control authority to the Front.
- No product modules, public exports, routes, dependencies, allowed imports, executable configuration, durable-store implementation or messaging implementation change.
- ADR-0008 clarifies only the new-module criterion; it does not exempt documentation from the separate responsibility, contract, protocol or data-flow criteria. Here the task records an already decided and running pilot, rather than designing or activating those mechanisms. Documentation-only scope by itself would not justify level 1 if it introduced a new normative protocol.

## Evidence and scope

- Read local `AGENTS.md`, `docs/architect-protocol.md`, `docs/review-protocol.md`, `docs/developer.md`, both target documents, accepted ADR-0001 and ADR-0008, `factory.config.json`, and the documentation exemptions in `tools/factory-guardrails.mjs`. There is no `ARCHITECTURE.md`; `architecture.mode` is `off`.
- Read [agentic-factory PR #36](https://github.com/bussard76/agentic-factory/pull/36) with `gh pr view`; its head was `docs/front-agent-on-server`, commit `373f4151cb0c52d670af95d72d34642882723ae2`.
- Read only `docs/orca.md` from that exact PR head through the GitHub contents API: [pinned source](https://github.com/bussard76/agentic-factory/blob/373f4151cb0c52d670af95d72d34642882723ae2/docs/orca.md#front-agent-on-the-server). No checkout or write in that repository.
- The PR records the owner's decision on 2026-11-10: “auf dem Server alles im Baum” and a Front above the Controller. It reports a same-day pilot and explicitly excludes startup automation and an implemented client-worker mechanism.
- Source terminology is generic `client-tasks.log`; this task explicitly chooses the project-specific Mac convention `~/front-exxperts/mac-tasks.log`. Do not describe that spelling as supplied by the factory PR or as an implemented factory interface.
- No Controller directory, live event log, Mac task log, private handover, real data, real account or model API was read. The source's operational observations are reported evidence, not independently repeated measurements.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
|---|---|---|---|
| Opening line and Front role | `docs/coordinator.md:3`, `:15` | Human communicates with server Front; Controller remains worker coordinator | Replace the Mac-only location statement; retain the role split from ADR-0001. |
| Dated pilot section | New `Front agent and Controller on the server` section in `docs/coordinator.md` | Both agents inhabit the same server Orca | Mark decided by Sascha, 2026-11-10, and explicitly call it a pilot; cite the supplied decision/source. |
| Worktree ownership | Same new section; workflow overview diagram | Front root → Controller → Integration and workers | Record containment without implying Front directly steers factory workers; no re-parenting commands are executed by this task. |
| Orders and answers | Native Orca messaging seam | Front ↔ Controller using `orca orchestration send` | Reuse existing Orca terminal targeting, subject and body; introduce no custom envelope, transport or polling mechanism. |
| Event history | Existing pilot convention `front-events.log` | Controller produces events for Front; append-only, never archived | State producer, reader and retention rule; retain `status.md` and `inbox.md` as fallback and record. Do not create a log, parser or watcher. |
| Mac-only work | Manual Mac-worker handoff convention | Server Front records tasks at `~/front-exxperts/mac-tasks.log`; Mac worker handles work available only on Mac | Describe routing and the accepted wait while the Mac is off; source describes a client session, not delivered automation. Do not invent a record schema or claim a running watcher. |
| Mac result and privacy | Existing client-to-server Orca capability | Mac worker returns results to server Front; no server-to-Mac pairing | Keep native return messaging distinct from the file handoff; no server control over Mac, no transfer of private work data to the build server. |
| Human-readable summary | `docs/dev-workflow.md:18-20`, `:36`, Front–Controller interface bullet | Diagram, role location and prose describe the same pilot | Update both the Front node and obsolete file-only diagram arrows, plus role and interface prose; do not leave the diagram claiming inbox/status are the primary transport. |
| Existing location statement | `docs/dev-workflow.md`, `Where things run` table (`Wo was läuft`) | Human's machine currently claims to host the Front | Qualify its existing Front entry to agree with the server pilot; this is the same requested location correction, not a new feature. |
| Infrastructure limitations | Both process documents | Factory automation remains outside this change | Do not claim `agentic-factory start`, `statuswatch.mjs`, `doctor`, a `hosts.frontAgent.location` setting, automatic worktree creation/re-parenting, or a Mac task watcher is implemented. |

## Interfaces, states and outside-in evidence

This is a process record, with no product UI or new executable behavior. A design export under `design/<feature>/`, clickable fake, product data contract and product logic diagram are not applicable. The supplied topology and the existing workflow Mermaid diagram are sufficient outside-in evidence for this scope; the updated diagram must agree with the prose.

The interface facts needed for this edit are exact: same Orca, the stated parent tree, existing `send` both ways, Controller-produced append-only `front-events.log`, Front-produced Mac task handoff at the requested path, and no server-to-Mac pairing. Empty logs mean there is no recorded work/event; they must not be portrayed as proof of successful delivery. If Orca messaging is unavailable, the retained inbox/status records remain fallback; do not claim guaranteed delivery, retries or acknowledgement semantics beyond native Orca. A Mac that is off leaves Mac-only tasks waiting, rather than silently moving them to a server worker. Ambiguous requests still return through the Controller/Front decision path; log entries confer no new authority.

No parallel implementation, shared payload schema or producer/consumer code is being introduced. Consequently no new cross-worker contract test is required here, and running live Front/Controller or Mac-worker experiments would exceed this review. Dependencies are the already decided pilot and the pinned documentation source, not a merge of PR #36 or a factory infrastructure release.

## Prefactoring

None. Edit the two existing process documents in place. Keep code, `factory.config.json`, hooks, ADRs, external Controller files and live topology unchanged.

## Findings and binding Developer instructions

No design-relevant blocker found for the bounded request. Apply the checklist as binding precision instructions, including the matching diagram arrows and the existing location-table entry so the documents do not contradict themselves.

The pass does **not** approve a new log schema, durable queue, watcher, delivery/acknowledgement protocol, remote-control capability, role reassignment or factory implementation. In particular, calling the Mac-worker mechanism implemented would contradict the pinned source. Such expansion requires a separate level check; a new protocol or data flow invokes level 3 and an accepted ADR with Sascha's decision before implementation. ADR-0008 is not approval for any such expansion.

Acceptance is a focused diff review: only the two requested process documents change; all pilot facts above appear consistently; the decision date and pilot/automation limits are explicit; no private operational content is copied. An independent documentation review remains separate from this pre-build spec review.

## Verification and limits

Read-only source and baseline comparison completed; no test suites, full gates or live pilot exercises run, as requested for this documentation review. No tests added. This review changes only this report; the pre-existing `package-lock.json` worktree modification is unrelated and remains untouched and uncommitted.
