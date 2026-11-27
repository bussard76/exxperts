# Issue #24: Suggestions decision and specification report

Date: 2026-11-26
Historical scope: accepted decisions reconciled before the fourth architecture review; the Slice 1 developer outcome is recorded below.

## Architecture impact

Level 3: server-owned automatic post-answer model generation and correlated room-socket delivery to the composer. ADR-0009 records the architecture decision; [the spec](../specs/T24-suggestions.md) now records Sascha's accepted Q01–Q14 answers.

## Checklist

- [x] Preserve accepted ADR-0009 Option A and its original source quote.
- [x] Reconcile Q01–Q14 from `/home/developer/controller-exxperts/t24-front-answers-2026-11-26.md`, confirmed by Sascha on 2026-11-26: “Ja, so übergeben”.
- [x] Specify trigger/deduplication; existing provider Memorize model; bounded plain-text context; logging, usage and output limits; deadline/cancellation; socket fields/lifetime; JSON validation; composer precedence and keys.
- [x] Record the approved exception to a dedicated design export, fixture-gallery fake requirement, Mermaid logic flow and exact socket interface.
- [x] Preserve Q14's order: Slice 1 server; Slice 2 UI after Q07 message format is fixed; Slice 3 real producer-to-consumer integration with fake model source.
- [x] Obtain a fresh independent Architect spec review that passes before Slice 1 implementation (`T24-SUGGESTIONS-REVIEW-4-architecture-spec.md`).

## Historical decision and next step at the spec checkpoint

Q01–Q14 are no longer open. No new provider, model table, cross-room delivery or data retention behavior is introduced. The precise next step is a fresh independent Worker Architect review of the reconciled level-3 spec; do not begin implementation until it passes. Afterward, start Slice 1 test-first, and hold Slice 2 until the Slice 1 Q07 format is fixed; Slice 3 follows both.

## Files changed

- `docs/specs/T24-suggestions.md`: replaces provisional questions with accepted contracts, Mermaid flow, outside-in evidence and ordered slice dependencies.
- `docs/adr/0009-server-owned-prompt-suggestions.md`: records the 2026-11-26 answer confirmation and implementation consequences without altering ADR-0009's accepted status/date/decider.
- `docs/reports/issue-24.md`: this decision/review checklist.

At that earlier checkpoint, no product code or tests had changed. The pre-existing `package-lock.json` change remains untouched and uncommitted.

## Slice 1 developer checklist

Architecture impact: level 3, server-owned generation and existing room socket; ADR-0009 and the passing fourth architecture review authorize the specified flow.

- [ ] Allocate a fresh answer ID per logical answer, preserving it across retries and detached adoption; publish ordered live invalidation and successful completion only to the leading socket, outside replay. Automatic retry and adoption are covered; manual continue identity awaits the clarification below.
- [x] Generate once only after a successful final answer with a leader; suppress failed, stopped, retry-intermediate and unled background answers, and cancel stale work on prompts, starts, deletion and replacement.
- [x] Select the answering provider's configured absorb model, without provider substitution; use a tool-less fake-tested call with 200 output tokens and a 10-second deadline.
- [x] Supply at most three completed text-only exchanges within 4,000 string units, excluding other content; account usage as suggestions and do not log content or persist results.
- [x] Parse a JSON array into at most three trimmed, single-line, 200-character unique nonempty strings; handle invalid responses silently (`suggestions-producer-smoke.ts`: normalized, bounded and invalid JSON cases).
- [x] Send exactly the Q07 payload to the same leading connection only after its live completion, while current; verify displaced owners, adoption, cancellation and no replay.
- [ ] Run targeted typechecks, affected suites and relevant browser specs through the attributed gate; merge current main and rerun affected suites.
- [ ] Complete item-by-item self-review, record tests, assumptions and debt, and push the branch.

Slice 2 UI and Slice 3 producer-to-consumer integration are excluded from this task. The pre-existing package-lock modification remains untouched.

## Historical developer checkpoint: context blocker (resolved 2026-11-27)

- Passing spec review: `T24-SUGGESTIONS-REVIEW-4-architecture-spec.md` at `62aed38`; Slice 1 remains incomplete.
- Added `apps/web-server/scripts/suggestions-producer-smoke.ts`: a fake-gateway, real-socket test for ordered invalidation and completion. It is intentionally red: the server sends no `answer_lifecycle` frame yet. No existing assertions were changed.
- `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` and the runtime package build passed. The first smoke attempt could not start before the runtime build; the second reached the server and failed waiting for the missing invalidation. The commit hook ran `npm run typecheck:scripts` successfully; the UI typecheck and browser gates have not been run.
- Blocker: the spec requires the last three *completed* exchanges even after a resumed conversation, excludes partial or failed answers and prohibits extra persistence. Existing `ChatItem` assistant records have no success/completion status, and `clearStaleStreamingMarks` clears stale streaming marks without distinguishing successful from interrupted answers. `buildPersistentRoomRestoredLiveThreadContext` also restores an unstructured, truncated excerpt, so the model session cannot reliably recover the missing completion status or complete original text from that excerpt. An old partial answer and a successful answer can therefore have indistinguishable saved transcript records. The spec does not define a fallback for this historical ambiguity, and guessing which text may be sent would change the approved privacy/context contract. Coordinator/Architect decision needed on how to handle historical exchanges whose completion cannot be established without new persistence; no producer implementation has been started.
- Files changed in this developer task: this report and the new smoke test. Assumption: the producer/socket seam explicitly specified by the task is the agreed test seam. Debt candidates: none assessed; the pre-existing `package-lock.json` modification remains untouched. Graph: no; the task did not request it, and direct source searches identified the relevant files.

## Resumed developer work

Sascha decided on 2026-11-27 that only provably completed exchange pairs may be sent, unknown historical pairs must be omitted fail-closed even when fewer than three remain, and no storage is added. The previous historical-context blocker is resolved.

## Historical developer checkpoint: trace privacy conflict (resolved 2026-11-27)

The producer, queued-answer identity and fake-model tests are implemented but the task is not complete. The fourth review requires traces and errors never to record prompt or suggestion content. The existing opt-in `stream-trace.ts` records the first and last 12 characters of ordinary prompt and assistant text; `scripts/replay-stream-trace.ts` requires those fields to reconstruct whitespace at delta boundaries. The new `suggestions-producer-smoke.ts` check for absence of the prompt and answer in traces fails on that existing behavior. Removing those fields would change an existing diagnostic output contract and replay fidelity; the dispatch authorizes no extra contract change and requires escalation if one is needed. A Controller/Architect decision is needed on the privacy requirement and compatible trace/replay behavior before changing that contract. Suggestion frames themselves are traced by type only, and the new worker's success/error logging contains metadata only.

The fake-model socket smoke now covers normalized and invalid results, length and count limits, the 4,000-unit context limit and last three proven exchanges, exclusion of unknown restored pairs and tool results, usage accounting, distinct gateway and custom-provider Memorize models, an unavailable model, successful retry, empty and stopped answers, unled detached turns, multipart answers, queued answers, reconnect, adoption, displacement, post-completion takeover, cancellation, and the 10-second deadline. `lifecycle-worker-session-smoke.ts` checks cancellation before model startup. `prompt-overwrite-scheduled-smoke.ts` checks an unled scheduled answer makes no suggestion call or replay. The added trace-content assertion remains red; no acceptance item depending on it is claimed complete.

Checks before the red privacy assertion: UI and script typechecks passed; the attributed targeted gate passed 58/58 with `NODE_OPTIONS='--import tsx'`, including the producer, worker, steering and scheduled suites; detached-turn, reattach and quick-follow-up suites passed 57/57. The bare `npm run test:scripts` invocation with TypeScript smoke files failed to resolve their `.js` imports (54/56); loading `tsx` made the same suite pass. The reconnect browser smoke initially timed out twice because its synthetic gateway held suggestion requests containing its chat marker; adapting the fake gateway without changing assertions made the attributed browser gate pass. The room-steer fake needed the same distinction; its existing assertions then passed. A mistaken `gate --help` discovery call omitted attribution and failed immediately with ENOENT; it did not run a suite. No full root build or smokes were run. Foreign-host network-failure reruns: 0. No screenshots were captured.

Files changed so far: `apps/web-server/src/room-socket.ts`, `persistent-agent-turns.ts`, `persistent-agent-worker-runtime.ts`, `usage-log.ts`; `apps/web-server/scripts/suggestions-producer-smoke.ts`, `lifecycle-worker-session-smoke.ts`, `persistent-room-detached-turn-setup.ts`, `chat-reconnect-smoke.ts`, `room-steer-smoke.ts`, `prompt-overwrite-scheduled-smoke.ts`; `docs/developer.md` and this report. All model and room data in the tests is synthetic. The pre-existing `package-lock.json` modification remains untouched. Graph: no; six tool calls preceded the first task file edit, and direct source searches identified the relevant code. Debt candidates: trace/replay fidelity requires the decision above; no other debt was assessed. Slice 2, Slice 3, independent review/conformance, final merge and final checks remain outstanding.


## Trace decision and assertion change (2026-11-27)

Front approved suggestion-only trace privacy under Sascha's Q04: ordinary chat trace boundaries and replay stay unchanged. Suggestion trace entries carry only room ID, duration, result code and token counts; the suggestion request, response and free-text provider error are excluded. The pre-existing assertion that suggestion output is absent from the mixed trace and server logs remains unchanged. The one newly added assertion that searched the entire mixed ordinary-chat trace for `What comes` and `Quick answer` was replaced with assertions scoped to `suggestion_generation` entries: a successful call must record metadata and omit its input and result; an error call uses distinct synthetic input and provider-error markers, must record an `error` code, remain silent on the socket, and omit those markers from suggestion trace and server logs. The test also checks that ordinary prompt boundary fields remain available for replay. No global trace format or replay code changed.

A further test-first check found that a manually continued failed answer had lost its original prompt in the suggestion context. The producer now uses the original text only when the session's user message matches the saved user item; otherwise it omits that unverified pair. `suggestions-producer-smoke.ts` exercises this continuation and the fail-closed restored-history case.

## Slice 1 self-review

| Binding item | Evidence |
| --- | --- |
| Fresh answer identity before execution, retained across retry and adoption; queued identities are distinct | `suggestions-producer-smoke.ts`: retry, multipart, adoption, re-adoption and queued cases. Interactive and scheduled execution both allocate their private non-serialized identity in `beginPersistentAgentTurn`; a background identity has no external recipient, so its allocation is additionally verified by code inspection. |
| Successful answer only; no retry-intermediate, failed, stopped, empty, unled detached or unled scheduled generation | `suggestions-producer-smoke.ts`: retry, empty, stopped and unled cases; `prompt-overwrite-scheduled-smoke.ts`: scheduled no-call and no-replay assertions. |
| Same-provider configured Memorize model, including gateway and custom; unavailable model has no fallback | `suggestions-producer-smoke.ts`: gateway `suggest-model`, custom `custom-suggest` and unavailable-model cases. |
| Tool-less model call, 200 output tokens, 10-second deadline; cancellation on new prompt, start, owner loss and deletion | `suggestions-producer-smoke.ts`: request cap/tools, held deadline, superseding prompt, post-completion takeover and synthetic room deletion; `lifecycle-worker-session-smoke.ts`: pre-start cancellation. |
| Last three proven completed exchanges, 4,000 JavaScript units, oldest dropped first, unknown history omitted; no tools, attachments or other context | `suggestions-producer-smoke.ts`: history, long context, restored unknown history, multipart tool result and continuation cases. The text-only input is assembled from user and assistant text; attachment-only text is excluded by the shown-prompt/stripper boundary. |
| Usage under `suggestions`; no content in suggestion logs or traces; no suggestion persistence | `suggestions-producer-smoke.ts`: usage API, success and error trace/log checks and reconnect/no-replay. The producer keeps only active run state in memory. Ordinary chat trace behavior remains as separately approved above. |
| JSON parsing, trim, line breaks, 200-character cap, empty and duplicate removal, maximum three and invalid JSON | `suggestions-producer-smoke.ts`: normalization, bounded response and invalid JSON cases. |
| Exact Q07 result and lifecycle fields; completion before result; same live owner only; no replay or stale delivery | `suggestions-producer-smoke.ts`: exact payload, reconnect, displaced adopter, re-adoption, takeover after completion, new prompt and unled cases. |
| Existing assertions retained; fake models and invented data only; no UI slice or end-to-end consumer slice | All assertions in existing suites remain; `chat-reconnect-smoke.ts` and `room-steer-smoke.ts` fake gateways distinguish suggestion calls, and `prompt-overwrite-scheduled-smoke.ts` only adds assertions. No UI consumer was changed. |

Final merge and post-merge targeted reruns remain pending.

## Final developer validation

Code and tests were checked at `f40c3623caa689e2ec1d140b6325715326b6f322` after fetching and merging `origin/main` (already up to date). `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed. The attributed targeted `npm run test:scripts` gates passed 58/58 for the producer, isolated worker, steering and scheduled cases, and 57/57 for detached turns, reattachment and quick follow-up; TypeScript smoke files require `NODE_OPTIONS='--import tsx'`. The final attributed `chat-reconnect-smoke.ts` browser gate passed.

Assumptions: the accepted producer/socket seam is the test boundary; only provably completed historical pairs are included, as directed by Sascha on 2026-11-27. Graph: no; six tool calls preceded the first task file edit and direct source searches found the touched files; no comparison was measured. No screenshots, full root build, full smokes, paid model calls or real data were used. The pre-existing `package-lock.json` modification remains untouched and uncommitted.

Debt candidate (`tests`, low): a background answer's internal non-serialized ID cannot be observed at the socket because an unled background answer sends no lifecycle frames; the scheduled no-call/no-replay test covers its observable behavior, and the shared allocation is checked by inspection. The Controller will arrange the independent Tester and level-3 conformance review; Slice 2 and Slice 3 remain separate follow-up work.


## Remaining answer-identity clarification

The accepted spec says an answer ID stays the same across retries. Automatic retries within a running turn retain the ID and the socket smoke covers their single successful completion, but the app's manual Try again sends `continue` after the failed turn has finished and starts a fresh turn; the current producer allocates a fresh answer ID there. It is unclear whether that manually continued turn is the same logical answer for the accepted ID contract or a new logical answer. The failed ID is deliberately internal and no completion frame is published for the failed attempt, so its equality with the eventual success is not observable at the specified socket seam without a further test seam. The Controller/Architect must clarify manual-continue identity and how to verify it without expanding the approved public interface; Slice 1 remains unfinished pending that answer. The same-producer manual-continue test already proves the successful result uses the original prompt.
