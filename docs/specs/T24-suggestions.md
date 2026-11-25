# T24-SUGGESTIONS: Next prompts in the composer

Status: blocked for implementation — binding decisions and outside-in evidence pending
Date: 2026-11-25
Issue: [#24](https://github.com/bussard76/exxperts/issues/24)
Architecture decision: [ADR-0009](../adr/0009-server-owned-prompt-suggestions.md)
Review source: `docs/reviews/T24-SUGGESTIONS-architecture-spec.md` at `c1dcdc21ba4c54b35760c28059d9426a796e48e9` on `origin/agents/t24-suggestions-specreview`

## Architecture impact

Level 3. The server adds an automatic post-answer model call and a delivery contract to the web composer. Owners and boundaries are room turn execution (`apps/web-server/src/room-socket.ts`), provider/model policy (`room-models.ts`, `persistent-agent-ai-profiles.ts`), isolated model execution (`persistent-agent-worker-runtime.ts`, a candidate for reuse), server-to-browser room transport, and UI composer state (`apps/web-ui/src/App.tsx`, `composer-hint.ts`). These existing seams are orientation, not a decided API or file plan. No new dependency is authorized or proposed by this documentation task.

## Authority and scope

Sascha, 2026-11-25: “Ja, Option A mit diesen Vorgaben”. The dispatch records the constraints below as accepted with option A. Issue #24 supplies the composer behavior. This document organizes the remaining contracts; it does not turn a recommendation or a code observation into Sascha's decision.

Every `NEEDS-SASCHA` question Q01–Q14 is a binding implementation blocker. Resolve them in the spec with the source and date of each answer, provide the outside-in evidence and obtain the required architecture spec review before any product build. The coordinator brings questions to Sascha; this documentation worker does not choose the answers.

## Accepted behavior

| ID | Requirement and observable acceptance check for the later implementation |
|---|---|
| A1 | Server-owned automatic generation after an answer, with no tools. With invented conversation text and a fake model, observe the server start generation; no client initiation or tool execution is needed. Q01 defines eligible completion cases. |
| A2 | Use only text of the last three exchanges (user prompts and assistant answers), about 4,000 characters maximum. Exclude tool results, attachments and files. Capture a fake provider request and verify these exclusions and the approved Q03 bounds/serialization. |
| A3 | One fixed, named small model per provider; no provider switch. No suggestions if that provider has no configured eligible model. Verify exact approved Q02 IDs and fallback with fake provider catalogs. |
| A4 | Errors and timeouts after 10 seconds are silent and keep the ordinary hint. Exercise fake failures and a controlled clock; no suggestion error replaces the hint. Q06 defines the deadline boundary and cancellation. |
| A5 | No persistence; discard results stale for a different answer, room or thread. Deliver delayed results after each identity changes and verify they cannot populate the wrong composer. Q07–Q08 define identity and lifecycle details. |
| A6 | Up to three short next prompts. In an empty composer the first usable suggestion is light grey ghost text in place of the placeholder; absent suggestions leave the current placeholder. Typed text hides it. No suggestion triggers actions, tools or connectors. |
| A7 | Tab cycles forward and Shift+Tab backward when the composer is empty and the mention popup is closed. Right Arrow accepts the shown suggestion into the empty composer as normal text without sending. Q11–Q12 settle surrounding UI states and keyboard details. |
| A8 | Development and tests use invented data and fake model/suggestion sources, with no real paid model API calls. Verify the real producer-to-consumer path with a fake model at its boundary, per Q14. |

## 1. Successful-answer trigger and duplicate/retry cases

Accepted: generation is automatic, after an answer, and server-owned (A1). The review notes that `room-socket.ts` distinguishes `agent_end`, retries and other termination paths; one event name alone is not a successful-answer contract.

**NEEDS-SASCHA Q01 — Which answer endings generate suggestions, and what counts as the same answer across duplicates and retries?** Specify successful final text versus empty or tool-only endings, aborted/stopped/failed turns, automatic and manual retries, queued turns, background turns, and turns completed during disconnection. Specify who records generation eligibility in memory, the deduplication scope and whether any failed suggestion call may retry. Recommendation: one call for each successfully committed final user-facing answer, deduplicated by its stable identity; no call for stopped/failed turns and no suggestion-call retry. Confirm the listed exceptional cases rather than inferring them from “after every finished answer”.

Later check: drive each approved completion case through room execution, repeat completion notifications and exercise retries/queued/background turns; count fake model calls and verify the chosen identity rule.

## 2. Exact provider/model-ID table

Accepted: one fixed named small model per provider, within the room's provider, with no suggestions when no configured eligible model exists (A3). The existing catalog order is not a size ranking. Neither the issue nor the accepted constraints names a model ID.

| Provider category observed in repository policy | Exact suggestion model ID | Decision needed |
|---|---|---|
| Built-in `openai-codex` | Unresolved — no ID approved | Q02 |
| Built-in `anthropic` | Unresolved — no ID approved | Q02 |
| Custom providers, including any separate API-key provider IDs | Unresolved — no per-provider mapping approved | Q02 |
| Legacy `openai-compatible` and additional `gateway-*` provider IDs | Unresolved — no per-gateway mapping approved | Q02 |

These are policy categories, not an invented exhaustive list of configured accounts. No real configuration is read for this task.

**NEEDS-SASCHA Q02 — What exact provider/model-ID pairs are eligible, and how is a model configured and judged eligible?** Supply the literal table, the policy owner/location, custom/gateway mapping rules and the authentication/offered/registry checks. Decide whether “room's provider” is captured from the answer's actual provider or resolved later if room settings change. Recommendation: capture the answer's provider, use a product-owned explicit mapping, and disable suggestions for any unmapped or unavailable provider without alternative models or providers. Existing Conversation/Memory selections are not approved suggestion mappings. No guessed “smallest” ID or new settings surface is authorized.

Later check: enumerate each approved pair plus unmapped, signed-out and missing-model cases; verify no provider crossover, including custom/gateway identities and provider changes while pending.

## 3. Context roles, serialization and truncation

Accepted: only text of the last three exchanges, meaning user prompts and assistant answers, about 4,000 characters maximum; no tool results, attachments or files (A2). This does not authorize loading memory, instructions, file contents or more history as conversation context.

**NEEDS-SASCHA Q03 — What exactly is an exchange and how is the bounded context encoded?** Define pairing/order with fewer than three exchanges, queued/multiple user messages, retries and partial/empty answers; select the assistant text blocks included (including whether reasoning is excluded). Specify role preservation, separators/escaping, the fixed generation instruction and allowed metadata. Resolve the exact cap, character unit (for example Unicode code points versus UTF-16 units), whether instruction/role overhead counts, and deterministic truncation when even the newest exchange exceeds the cap. Recommendation: chronological role-labeled user/final-assistant text, drop oldest text first, exclude reasoning, and approve a hard 4,000-character budget with an explicit counting and truncation rule. This recommendation is not the final request format.

Later check: capture the exact request with invented tool/attachment/file sentinels, long and Unicode text, and sparse or irregular exchanges; assert the approved roles, ordering, exclusions and boundary lengths.

## 4. Privacy, logging, accounting and resource limits

Accepted: bounded text goes to the same provider without tools; suggestions are not persisted (A2–A5). This neither guarantees provider-side deletion nor establishes application logging/accounting behavior. Secrets can occur in otherwise allowed user/assistant text; excluding attachments alone does not settle that case.

**NEEDS-SASCHA Q04 — What privacy and logging policy applies to this additional call?** Decide whether and how secrets in allowed text are redacted; confirm which request/result/error content may reach application logs, traces or diagnostics, and what provider-retention disclosure is needed. Recommendation: no prompt or suggestion content in application logs/traces, sanitized error metadata only, and an explicit disclosure that the same provider receives an extra bounded call. Clarify how any accounting metadata avoids persisting suggestions.

**NEEDS-SASCHA Q05 — How are usage/cost and request/output budgets handled?** Specify whether and where input/output tokens, usage and cost are counted, attributed to room/provider/model, and charged against existing limits; set numeric output-token and response-size limits, any rate/burst/aggregate spend limits, and handling when limits are exhausted. Recommendation: account for the call through existing usage accounting without storing suggestion content, with a small explicit output budget and skip behavior at resource limits. No numeric limit beyond the accepted context window and 10-second deadline is decided yet.

Later check: inspect fake accounting/log sinks for permitted metadata and absence of excluded content; exercise the approved input/output and aggregate budgets without real provider calls.

## 5. Timeout, cancellation and concurrency

Accepted: silent errors and a 10-second timeout retain the ordinary hint (A4). A deadline does not itself define when an underlying call is aborted or how concurrent answers are scheduled.

**NEEDS-SASCHA Q06 — What are the deadline, cancellation and concurrency rules?** Specify when the 10 seconds starts (including queue time), whether timeout aborts the underlying call, cancellation on new prompts/answers, room/thread/provider switches, disconnect and server shutdown, and per-room/per-thread/global concurrency limits and queue/drop behavior. Reconcile cancellation/skip choices with automatic generation after each eligible answer. Recommendation: start the deadline at dispatch, abort on expiry or supersession, and allow at most one active suggestion call per room without a backlog; a global limit still needs an explicit value. Q01 governs any retry. The recommendation does not approve skipping calls.

Later check: use controlled time and an abort-aware fake model to show deadline fallback, late completion rejection, supersession and the exact approved concurrency ceilings.

## 6. Correlation, transport and ephemeral lifetime

Accepted: no persistence, and no result stale for a different room, thread or answer (A5). Option A chooses server generation, not a wire schema, broadcast policy or replay mechanism.

**NEEDS-SASCHA Q07 — What exact transport and producer/consumer fields identify a result?** Choose the existing transport seam or proposed route/event; specify exact field names, types, validation, room/thread/answer identity sources, any generation/request revision, authorization/subscription scope and server/client rejection rules. Specify event ordering, duplicate/out-of-order delivery and how the consumer knows which answer is current. Recommendation: carry stable room, thread and answer identifiers plus a generation revision through the existing room transport, with identity checks at both ends. Those conceptual identifiers are not approved wire field names.

**NEEDS-SASCHA Q08 — What happens across switches, reconnects and multiple windows?** Define in-memory ownership and lifetime, whether all observing windows receive one server-generated result, handling of a new prompt before the next answer, and invalidation on room/thread/provider switches. Decide whether returning to a room/thread can show its still-current result, whether reconnect replays any in-memory result or triggers generation, how a server restart behaves, and whether “another window has the room” suppresses display. Recommendation: generate once on the server, send only to authorized observers, clear the departing view and never show mismatched identities; do not add reconnect-triggered calls or durable replay. The precise in-memory replay/return policy is still open, and must obey no persistence.

Later check: deliver delayed and reordered events through the approved transport during answer/room/thread changes, provider changes, disconnect/reconnect, server restart and two windows. Verify correct correlation, approved call counts and absence of durable suggestion storage.

## 7. Response format, parsing and validation

Accepted: zero to three short next prompts, text only; no tools/actions; silent error fallback and ordinary placeholder when no usable result exists (A4, A6). No response schema or definition of “short” has been approved.

**NEEDS-SASCHA Q09 — What is the exact model response and validated suggestion format?** Specify the generation instruction, JSON/schema or other format, streaming versus complete response, maximum count/length (with counting unit), whitespace/newline handling, duplicates, empty strings, non-string values, extra entries, code fences/markup/control characters, and malformed/partial output. Choose reject-all versus salvage behavior. Recommendation: a complete JSON array of at most three non-empty single-line plain-text strings, rendered as text, with explicit length limits and silent rejection of invalid output. Approve the exact schema and limits before implementation.

**NEEDS-SASCHA Q10 — When are previous suggestions cleared or shown again?** Define state transitions for a new answer, pending generation, empty/invalid/error result, user typing, accepting a suggestion, clearing typed text, and returning to an empty composer. Recommendation: clear the old answer's suggestions when superseded, show the ordinary hint while waiting or on failure, and do not restore an accepted/hidden suggestion automatically. Confirm within-answer reuse and reset/index behavior; typing-hides and no accidental sending remain binding regardless.

Later check: feed valid, empty, malformed, partial, oversized and hostile-looking plain text through the actual parser to the UI; assert approved validation and lifecycle behavior, ordinary-hint fallback and no execution or sending.

## 8. Composer precedence, mentions, keyboard, focus and IME

Accepted: the empty composer shows grey ghost text, Tab/Shift+Tab cycle with mention popup closed, Right Arrow accepts without sending, typing hides (A6–A7). The issue does not rank suggestions against every existing hint or define all key modifiers.

**NEEDS-SASCHA Q11 — In exactly which composer states may a suggestion replace the hint?** Rank suggestion display against every existing `composer-hint.ts` state: `asToday`, disconnected/reconnect failed, reconnecting turn, another window, model switching, stopping, step approval and answering/queueing, plus default ready/empty state and any disabled/read-only composer. Recommendation: show suggestions only in the ready empty composer; keep connection, switching, answering and approval guidance ahead of suggestions. Confirm the full precedence and how the mention popup affects display as well as key handling.

**NEEDS-SASCHA Q12 — What is the complete keyboard/focus/IME contract?** Define zero/one-suggestion Tab and Shift+Tab behavior, wrap/index reset, and a keyboard escape from cycling that lets focus leave the composer. Specify focus/caret requirements, plain versus modified/repeated Right Arrow and Tab, event propagation/default prevention, IME composition/key handling, mention popup precedence, accessibility announcement and any touch/non-keyboard acceptance requirement. Recommendation: intercept only approved unmodified keys in the focused empty composer while not composing and with mentions closed; retain native navigation otherwise, and choose an explicit escape-to-focus-navigation rule. Escape, modified-key and one-item behavior have not been decided by the issue.

Later check: exercise all existing hint states, empty/non-empty input, zero/one/three suggestions, forward/backward wrap, mention selection, focus entry/exit, modifier keys and IME composition in the real composer. Right Arrow must insert only the shown text and never submit.

## 9. Outside-in artifacts and producer-consumer evidence

The previous architecture review found no T24 design export, interface definition or logic diagram; `design/` contained only its README. This documentation task supplies no design exports or signed-off fake and does not declare any artifact unnecessary. The option A quote does not establish that outside-in sign-off occurred.

**NEEDS-SASCHA Q13 — Where are the approved outside-in artifacts and their sign-off?** Provide the T24 design drafts/exports under `design/<feature>/`, a clickable front-end fake with invented data, signed-off input/output interfaces, and agreed logic in words plus a Mermaid diagram, with approval date and revision. Recommendation: Front supplies these before the build, covering ghost text, fallback, acceptance, keyboard escape and the pending/error/switch states settled above. If an artifact is proposed as inapplicable, obtain and record explicit approval of that exception; none is assumed here.

**NEEDS-SASCHA Q14 — What build slices and shared-contract evidence are approved?** Confirm sequential versus parallel implementation, owner/dependency order and the exact common producer/consumer contract once Q07/Q09 are resolved. Recommendation: settle the schema first, then build the server producer and UI consumer with a public-entry-point integration test through both using a fake model source. If parallel work is chosen, name shared fields and dependencies in each task before dispatch; separate server and UI fakes are not evidence that the real seam works. Agree the integration scenario and observable result against the signed-off fake, including stale/error delivery.

## Review-gap coverage and release from the block

| Review fit-checklist row | Accepted evidence | Remaining binding questions |
|---|---|---|
| Answer completion and generation | A1 | Q01: eligible completions, duplicates and retries |
| Model choice | A3 | Q02: exact table, eligibility and provider snapshot |
| Privacy and resource limits | A2, A4, A5 | Q03–Q06: serialization, privacy/accounting/budgets and execution limits |
| Delivery and stale state | A5 | Q07–Q08: exact transport, correlation and lifecycle |
| Composer interaction | A6–A7 | Q10–Q12: state lifecycle, hint order, mentions, keys/focus/IME |
| Empty, ambiguous and error | A4, A6 | Q06, Q09–Q10: deadline details, validation and prior-result transitions |
| Outside-in and parallel work | A8; review reports missing artifacts | Q13–Q14: artifacts/sign-off, shared fields, dependencies and real-seam evidence |

No prefactoring is established as necessary. After all binding answers are recorded, the spec must state exact contracts and executable acceptance expectations for each later check above, cite the approved artifacts, and undergo the required architecture spec review. Implementation, behavioral tests and integration gates belong to later authorized build/review tasks; none is performed or claimed by this docs-only task.
