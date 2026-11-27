# T24-SUGGESTIONS-SLICE-1 review, round 1

Verdict: pass
Reviewed commit: 784bb268b1ce65e88469e41c27920bea5961b1aa
Gates: **failed**; build passed, full smokes 359/382 passed, 23 failed, one passing smoke had skipped parts. All 23 failed again individually. This is a failed gate, not a claim that the suite is green. Under the dispatch's functional-only verdict rule, the failures below do not establish a functional defect in Slice 1; the test failures and remaining evidence limits are recorded as debt. Independent public socket/API producer check passed 1/1 after the full gate.
Ponytail: full diff and connected producer, worker, socket, usage and fake-gateway code reviewed. The change adds a bounded, tool-less same-provider suggestion call after successful led answers, delivering ephemeral correlated results to that leader. Expected load: an individual local app with concurrent rooms, following the existing room ownership and cancellation rules. No confirmed functional defect found; test-suite compatibility debt below.

## Scope and evidence

Fetched head was exactly the expected SHA, with no movement. The diff against merge-base `1f4b79b01ebd784b6c1116a0b78c42389eae1c24` is mixed (code, tests and Markdown). Current `origin/main` at that same SHA merged into a clean temporary checkout without conflict; gate SHA was the reviewed SHA. `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` ran normal lifecycle scripts successfully, including the MCP adapter postinstall; Playwright's Chromium executable existed. Full gate ran once with the required attribution and `npm run build && npm run smokes`. The first detached shell launch ended before the gate started and produced an empty log; the recorded run subsequently completed. The skipped portions were the `fd`-dependent find cases and a case-insensitive-disk rename case in `persistent-room-localfiles-secret-floor-smoke.ts`; Windows-only cases were also reported as not applicable here. No Docker or real model service was used.

## Spec checklist

| Requirement | Code | Evidence | Status |
| --- | --- | --- | --- |
| Successful led final answer only; no failed, stopped, intermediate retry or unled background generation; queued currentness | `room-socket.ts:2387`, `:2813`; `persistent-agent-turns.ts:177` | `suggestions-producer-smoke.ts` retry, stopped, empty, overlap, queue and unled cases; `prompt-overwrite-scheduled-smoke.ts` | Pass |
| Fresh private logical answer ID; automatic retry and adoption retain it, manual continue after a failed terminal turn gets a new one | `persistent-agent-turns.ts:177`; `room-socket.ts:2335`, `:3070` | Socket smoke checks one successful completion then matching suggestions after manual continue, no failed completion/result, retries and adoption; private failed ID equality is inspectable only in code, as Front accepted | Pass with stated observability limit |
| Same answering provider's configured Memorize model; no fallback; tool-less, 200 output tokens, 10-second deadline | `room-socket.ts:1670`–`:1718`; `persistent-agent-worker-runtime.ts` | Socket smoke gateway/custom/unavailable, tools/cap and deadline cases | Pass |
| Last three proven completed text exchanges, 4,000 units, oldest first; exclude unknown history, tool results and attachments | `room-socket.ts:1684`–`:1709`, `:3073`; `persistent-room-delegate-tool.ts:26` | Socket smoke history, unknown restored pairs, long context, multipart tool output and manual continuation; code inspection of shown text and stripping | Pass; see duplicate-text edge-case debt |
| Cancel on new prompt/start, deletion and replacement; one active per room/thread | `room-socket.ts:1664`, `:2813`, `:1389` | Socket smoke held requests, takeover and room deletion; worker pre-abort test | Pass |
| Exact lifecycle and Q07 frames, ordered and live, same leader only, no replay or stale result | `room-socket.ts:1659`, `:1734`, `:2387` | Socket smoke exact JSON, queue, adoption, displacement, post-completion takeover, cancellation and reconnect | Pass |
| Trim, normalize line breaks, 200-character cap, deduplicate, at most three, invalid JSON empty | `room-socket.ts:1730` | Socket smoke normalization, bounds and invalid JSON | Pass |
| Usage category `suggestions`, no storage or suggestion content in diagnostics, errors silent | `room-socket.ts:1724`–`:1750`; `usage-log.ts` | Synthetic success/error trace and log assertions, usage API, reconnect/no replay | Pass within trace evidence below |
| Ordinary trace and replay retained; only suggestion trace privacy scoped per Front | unchanged `stream-trace.ts` and replay code; `suggestions-producer-smoke.ts:20` | At `8f69ca8` exactly one assertion was removed: the expressly retargeted mixed-trace prompt/answer assertion. Every other assertion from that commit remains, including whole mixed-trace/server-log suggestion-output absence. Success/error result codes and private markers checked in suggestion notes/logs; ordinary prompt head/tail checked. No replay executable was run separately. | Pass with replay execution limit |
| No real external systems/data, no new dependencies, no UI/Slice 2 or integration/Slice 3 | Full diff; local fake gateway in `persistent-room-detached-turn-setup.ts` | Invented test values and loopback endpoints inspected; no new dependency, route, rendering or UI change. Socket strings are JSON-serialized, with no new HTML interpolation. | Pass |
| Architecture level 3 within ADR-0009 and architecture review 4 | `room-socket.ts`, `persistent-agent-turns.ts`, worker and usage changes | Accepted server-owned socket flow, same provider, no observer registry or new dependency. New usage category and internal ID are within the approved flow. | Pass; separate Architect conformance remains required |

The public socket smoke's exact frame and completion assertions would fail on the baseline, which has no lifecycle or suggestions frames; its synthetic model/model-limit and privacy assertions exercise the real server rather than an internal parser. Existing test assertions in the baseline diff were not removed or weakened. The review did not test a real model, real account or production service.

## Full gate and isolated outcomes

Every row below failed in the parallel full run and failed again under `npm run smokes -- --jobs 1 <filename>` through the attributed full gate at the same SHA. Original and isolated results are both **FAIL** for every filename; none was rerun more than once. The full and per-file logs are in `/tmp/t24-slice1-full-gate.log` and `/tmp/t24-isolated-<filename>.log` on the test host.

| Parallel and isolated failures | Evidence in failed output |
| --- | --- |
| `save-ids-page-smoke.ts`, `chat-follow-smoke.ts` | Browser timeouts. Their fake gateways hold any last-user text containing the gated marker; a suggestion request includes that marker and can occupy the single held-response slot. `chat-follow` hit 300 seconds in both runs. |
| `room-failed-message-returns-away-smoke.ts`, `room-failed-message-returns-smoke.ts`, `room-send-edges-smoke.ts` | Assertions select a captured suggestion request as the last ordinary chat request, then look for chat-only file notes, cut notes or tool results. |
| `model-pick-page-smoke.ts`, `effort-while-switching-ui-smoke.ts`, `room-removed-claude-model-smoke.ts`, `prepared-thread-model-smoke.ts`, `conversation-switch-model-smoke.ts`, `anthropic-api-key-provider-smoke.ts`, `room-signed-out-reconnect-smoke.ts` | Captured model/request sequences include additional suggestion requests; these tests do not distinguish the worker call. The exact failed assertions should be rechecked after separating calls. |
| `thinking-levels-sweep-smoke.ts`, `persistent-room-away-steps-smoke.ts`, `auto-compaction-failure-smoke.ts`, `room-state-page-smoke.ts`, `room-state-continuations-smoke.ts`, `room-state-message-smoke.ts`, `room-self-awareness-smoke.ts`, `persistent-room-pointer-recall-smoke.ts`, `skills-execution-exposure-smoke.ts`, `delegate-task-smoke.ts` | Failed assertions include extra request counts or fake response selection in the presence of the suggestion call. The complete individual outputs remain evidence; some flows stopped at the first failing assertion and were not independently proven end-to-end. |
| `cache-write-cost-smoke.ts` | Wallet total includes the separately accounted suggestion worker call, while the old assertion expects only the conversation turn. |

The individual failures are not silently reclassified as passes. Their fake-call assumptions are concrete, but their later assertions were not reached; particularly the specialist, signed-out/reconnect, skills and model-switch flows remain incomplete evidence until the tests distinguish the two call types and pass. No foreign-host network-failure reruns were made.

## Findings

No demonstrated functional defect under the dispatch's functional-only rule. The failed full gate and incomplete regression evidence remain open for normal integration disposition; this verdict does not waive that gate.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | major | The 23 smoke files listed above, e.g. `save-ids-page-smoke.ts:169`, `room-state-message-smoke.ts` | Distinguish the suggestion worker from chat and specialist calls in each fake and request assertion; preserve all existing behavioral assertions, then rerun the full suite. |
| tests | minor | `suggestions-producer-smoke.ts:23` | Add a replay execution check with ordinary chat boundaries and suggestion metadata to prove the existing trace/replay contract end-to-end. |
| edge-case | minor | `room-socket.ts:1692` | Exercise repeated identical user prompts: the uniqueness check deliberately omits ambiguous history even when fewer than three pairs remain; preserve Q03's fail-closed privacy rule while verifying the intended context for provably completed duplicates. |
| tests | minor | `persistent-agent-turns.ts:180` | Preserve the documented inspection-based identity check or add an approved private test seam if one is later authorized; the unpublished failed ID cannot be compared at the socket. |
