# T24-THINKING-SWEEP-B-LAB review, round 1

Verdict: pass
Reviewed commit: 25b0a229ff772593941752e890be580a8cbfb517
Integration gate commit: d1c2e25eb8280f50f27adee70d4ef14cead1e384 (temporary merge of candidate and origin/main 40247f221286afe4b1195ce28dfc0d98547f6ce4; merge-base 1f4b79b01ebd784b6c1116a0b78c42389eae1c24)
Ponytail: reviewed full diff and connected flows, assuming one cooperative isolated lab session and no other clients.

## Gate and setup evidence

Fetched origin before interpreting the checkout: the lab tip was exactly the reviewed commit. The actual diff from the merge-base to that commit is mixed (40 paths); it includes the prior level-3 suggestions producer and its approved ADR as well as the level-2 lab amendment. The temporary merge had no conflicts. `ARCHITECTURE.md` is absent. The scoped delta against first baseline `76e4c023e42405bbb28dde81a0006516d7d0eddf` is six paths.

At the integration commit, `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci --no-audit --no-fund` passed with lifecycle scripts; the install log confirmed the MCP adapter postinstall and the approved browser-download skip, and the existing Playwright Chromium executable was present and executable. The attributed `~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` completed with build pass and **380/382 smokes passed**; the full gate failed. `thinking-levels-sweep-smoke.ts` passed (98.8s), `cache-write-cost-smoke.ts` passed (5.5s), and `persistent-room-effort-smoke.ts` failed (4.0s: expected high, got minimal). `quit-answer-note-smoke.ts` failed (23.0s: unexpected note in indexed next request). The actual gate SHA is the merge above, not an exact-candidate-only run. Isolated reruns on the unchanged integration SHA, each through the same full-gate lock: `quit-answer-note-smoke.ts` **failed again** (0/1, 21s); `persistent-room-effort-smoke.ts` **passed** (1/1, 7s). The full gate failure remains a failure regardless of isolated outcomes. Full log: `/tmp/t24-lab-test1-gate.log`; isolated logs: `/tmp/t24-lab-quit-isolated.log` and `/tmp/t24-lab-effort-isolated.log`. All three gate commands used the required task, worker, Tester, codex and gpt-6.1-terra attribution.

The quit test logs identify the problem: indexed request 3 is suggestion context (`User: Say hello` / `Assistant: Hello there.`), while request 4 is the expected `Thanks, that is all.` without the note. Its gateway captures every request and treats the third as chat (`quit-answer-note-smoke.ts:97-110,276-285`). The effort harness likewise takes the first unfiltered request after sending a prompt (`persistent-room-effort-smoke.ts:66-86,231-247`), while suggestion workers are active; the isolated pass does not prove why the parallel failure occurred. These failures expose test isolation and coverage debt, not a demonstrated functional defect under the specified functional-only verdict rule. No failure is reclassified as a passing full gate.

Browser and API smokes ran on Linux with fake providers and invented data. Native macOS and Windows cases were not exercised; the runner explicitly reported four tests with cases for another system and one with skipped parts. These results do not establish native platform behavior. No Docker or real model API was used.

## Spec checklist

| Requirement | Implementation | Evidence and status |
| --- | --- | --- |
| Controlled isolated child, fresh home/store/marker/log/token, exact fake profile and host, owned child and proxy | `thinking-levels-sweep-smoke.ts:40`, `:190-242`, `:271-275`, `:309-314` | Public `runSweep` through loopback server/proxy in sweep smoke: passed on integration gate. Scratch HOME, fake credentials and room store are explicit; no authenticated-client exclusivity is claimed. |
| Fail startup for partial or malformed activation, in-home marker and matching recorder preload, writable log and hosts | `room-socket.ts:219-233` | Nine negative child startups in sweep smoke, before provider receipts; passed. The out-of-home negative case also has mismatched contents, so it does not independently establish path rejection; see debt. |
| Lab skips only suggestion generation, normal producer remains live | `room-socket.ts:2404-2408` | Lab sweep passed with zero observed suggestion requests, frames and usage through final rung; separate ordinary `suggestions-producer-smoke.ts` passed through real socket and fake provider. The ordinary smoke uses its own fake profile; the builder reports a red run against the lab profile without suppression, which I did not independently repeat. |
| Unfiltered receipt/recorder comparison and exercised transports | `thinking-levels-sweep-smoke.ts:320-327,391-395` | Passed; actual configured fake OpenAI-compatible endpoint is HTTP, and the comparison does not prove arbitrary transports, delayed departures or complete billing. |
| Preserve original sweep contract and cases | `thinking-levels-sweep-smoke.ts`, unchanged `thinking-levels-sweep.ts` and recorder | Compared every original assertion to `76e4c023` (also unchanged since the file's initial baseline): no deletion or loosening. Passed original recorder refusal, invalid budget, reasoning fields, honest/silent/stubborn, retries, tool cost, 15 rows/TSV, delayed frames, cut/stalled status, timeout and broken-model checks. Public `runSweep`, `--run`, output and budget interfaces are unchanged. |
| Cleanup on success, failure and interruption | `thinking-levels-sweep-smoke.ts:166-179,398-407` | Passing smoke checks successful cleanup and invalid child startups; the builder reports separate synthetic preflight-failure and SIGTERM probes, not independently rerun. An early port-allocation failure precedes cleanup; see debt. |
| Unchanged ordinary behavior, invented data, no outward effects, escaping | `room-socket.ts`, `suggestions-producer-smoke.ts`, lab fake and UI text paths | Ordinary producer smoke passed against fake provider; the lab uses loopback fake endpoint, synthetic credentials and temporary state. No UI change in the lab delta; suggestion results are JSON strings and existing React text rendering escapes content. No real external effects observed in reviewed paths. |
| Level and dependencies | `room-socket.ts` and existing sweep smoke; `docs/reviews/T24-THINKING-SWEEP-B-R3-architecture-spec.md` | Level 2 fits the lab delta; no new dependency, route, public setting, recorder schema or public export. Prior producer's level-3 scope is covered by ADR-0009 and its separate review. |

The broad diff replaces the Wallet total assertion with the sum of the independently asserted chat and suggestion costs, retaining the chat and repricing assertions; it also renames the pointer-recall marker without changing its value or assertion. These are outside the lab commit and do not weaken the original sweep assertions.

## Findings

### [minor] Inherited sweep comments overstate cost coverage
- Where: `apps/web-server/scripts/thinking-levels-sweep-smoke.ts:20-22,32-35`.
- Problem: the comments say the failed retry attempts' cost is covered and that a sweep never pays for calls it cannot see. The 500 responses carry no usage, and the recorder covers configured hosts and exercised transports only. Neither assertion is supported; the same header also says three models while listing seven. The lab report and developer guide correctly disclose the narrower limits.
- Violates: approved lab specification's accounting and recorder limitations; the false claim predates the lab commit and does not prove a functional defect.
- Fix: correct the comments to describe observed calls and unknown costs.
- Proving test: retain existing retry and recorder tests and verify the documentation states the observed limitation; no invented failed-call cost evidence.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/quit-answer-note-smoke.ts:97`, `apps/web-server/scripts/persistent-room-effort-smoke.ts:231` | Distinguish fake suggestion requests from chat requests and assert the intended turn; retain every original assertion and rerun both smokes. |
| tests | minor | `apps/web-server/scripts/thinking-levels-sweep-smoke.ts:252` | Test a matching marker outside HOME so the path check must reject it independently of the content check. |
| tests | minor | `apps/web-server/scripts/thinking-levels-sweep-smoke.ts:191-242`, `apps/web-server/scripts/suggestions-producer-smoke.ts` | Exercise ordinary generation with the same selected lab profile as well as suppression, so a missing producer cannot make the lab test vacuous. |
| edge-case | minor | `apps/web-server/scripts/thinking-levels-sweep-smoke.ts:40-51,166-179,190` | Start cleanup protection immediately after creating the scratch directory; failure of `freePort()` currently leaves an empty scratch directory before the handlers and `try/finally` are installed. |
| style | minor | `apps/web-server/scripts/thinking-levels-sweep-smoke.ts:12-35` | Correct the inherited model count and unsupported cost/completeness comments as described above. |

The new checks exercise the actual server and public socket/API rather than importing the private guard. Removing the guard would start fake suggestion requests and fail the zero-request assertion; removing startup validation would allow the switch-alone child to reach health and fail its negative assertion. The builder reports both corresponding pre-implementation red runs; I did not independently modify the candidate to repeat them. No tests were added or weakened by this review.
