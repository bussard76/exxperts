# T24-SUGGESTIONS-SLICE-2 review, round 1

Verdict: pass
Reviewed commit: 4b27874d19679db24d699d52dc071281e32f9ac1
Gates: **full gate failed** (build passed; smokes 378/383); consumer browser gate passed. The failure is not waived by this functional-only verdict and needs normal Controller disposition.
Ponytail: reviewed the full integration diff and connected paths at the expected single-user room load; no confirmed Slice 2 functional defect found.

## Scope and setup

Fetched `origin` before interpreting the checkout. The candidate pin was exactly the reviewed SHA; `origin/main` and its merge-base were both `40247f221286afe4b1195ce28dfc0d98547f6ce4`. A temporary branch from the candidate merged current main without conflict and remained at the reviewed SHA. The integration diff is mixed (code, tests and Markdown), so the full gate was required. The Slice 2-only diff is against `4c1dcdd7235fb57b33d4652f5225eca341b2d49d`; Slice 1 and Slice 3 are separate tasks. No product files or assertions were changed for this review.

Normal `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` ran the postinstall MCP adapter patch successfully; Playwright's Chromium executable exists. All gate commands used the requested task, worker, role, agent and model attribution and host-wide full-gate lock. The full gate ran on the SHA above: `npm run build && npm run smokes`, log `/tmp/t24-slice2-test1-full.log`. The initial detached shell launch produced an empty log and no surviving process; the actual full invocation ran once to completion. The independent consumer browser gate `npm run smokes -- --jobs 1 suggestions-consumer-smoke.ts` passed 1/1, log `/tmp/t24-slice2-test1-consumer.log`. The full run also passed the consumer, producer, composer hint and consult mention smokes. No paid model or real external service was used.

## Spec checklist

| Requirement | Code | Evidence | Status |
| --- | --- | --- | --- |
| Fixture fake before UI, invented text | `FixtureGallery.tsx`, `fixture-data.ts` | `30f911d` precedes `5c4fa9a`; consumer browser smoke opens actual gallery | Pass |
| Live room/thread/completion correlation, invalidation, no replay; clear on send, switch and reconnect | `App.tsx:2819`, `App.tsx:4347`, `App.tsx:4637` | Consumer browser smoke injects frames on the actual room socket, navigates rooms, forgets thread, reconnects, reloads and sends | Pass |
| Placeholder priority, mention ownership and IME | `App.tsx:8950`, `in-room-chat.tsx:1095` | Consumer browser smoke and `composer-hint-smoke.ts`; approval/read-only paths inspected, not separately browser-driven | Pass; test debt below |
| Cyclic Tab/Shift+Tab, native focus at zero/one, Right Arrow accepts and consumes without send | `in-room-chat.tsx:1113` | Browser smoke checks Beta then Gamma and Alpha, wrapping and native focus | Pass |
| Typing/clearing, Escape and accessibility | `in-room-chat.tsx:915`, `in-room-chat.tsx:1240` | Browser smoke checks restoration, Escape, `aria-describedby` and hint | Pass |
| Text only, no action or untrusted markup | `in-room-chat.tsx:1240` | React textarea placeholder and text node; browser asserts inserted normal text | Pass |
| Existing mention/history and consent/refusal/turn contracts | Existing composer and room socket paths | `consult-mention-smoke.ts`, `room-send-edges-smoke.ts`, `room-steer-smoke.ts` passed in full run; Slice 2 does not change producer consent or turn semantics | Pass within Slice 2 |
| Same-provider generation, ownership, adoption and answer IDs | `room-socket.ts`, `persistent-agent-turns.ts` | Producer socket smoke passed; real producer-to-consumer integration belongs to Slice 3 | Slice 1 evidence only |

Architecture impact: level 3 under accepted ADR-0009 and the reviewed socket/composer boundaries. Slice 2 adds optional existing-component props, no route, dependency, external channel or new module. The tests drive public browser/socket paths; removing the consumer would fail both live placeholder and keyboard assertions. React escapes suggestion text. Fixture and fake-provider data are invented; no secrets or real external-system changes were identified. The accepted leading-window, no-background, refusal and logical-answer identity semantics were not redefined. The full diff includes Slice 1's producer and test fixture changes, which were inspected for scope and no-outward-effects; the separate Slice 3 end-to-end acceptance remains outstanding.

## Full gate failures and isolated reruns

Each exact failed filename was rerun once alone on the same SHA with `npm run smokes -- --jobs 1 <filename>` under the attributed full-gate lock. Logs are `/tmp/t24-slice2-test1-isolated-<filename>.log`.

| Smoke | Parallel | Isolated | Evidence and disposition |
| --- | --- | --- | --- |
| `thinking-levels-sweep-smoke.ts` | fail | fail | The `none` rung captures both `none` and the suggestion call's `low` and reports two calls. Slice 1 report records this exact baseline issue; the file is unchanged since `4c1dcdd`. |
| `cache-write-cost-smoke.ts` | fail | fail | Wallet fixture counts two usage rows and `0.211856`, instead of its one-turn amount. Slice 1 report records the extra suggestion usage and unresolved Wallet decision; file unchanged since `4c1dcdd`. |
| `persistent-room-effort-smoke.ts` | fail, expected ceiling but got `minimal` | fail, unknown level expected `low` but got `minimal` | The unchanged fixture records every model call (`persistent-room-effort-smoke.ts:86`) and selects the first after its count (`:233`, `:247`); suggestion generation appears in both logs. This is a Slice 1 baseline fixture interaction, not evidence of a consumer defect; the exact product effort behavior remains unproved by this smoke. |
| `chat-send-landing-smoke.ts` | fail, phone steps-card glide assertion | pass | Original assertion failure is retained; cause unresolved, not demonstrated to be a timeout or Slice 2 regression. |
| `persistent-room-detached-turn-reattach-smoke.ts` | fail, stopped copy lacked expected cut/note | pass | Original assertion failure is retained; cause unresolved, not demonstrated to be a timeout or Slice 2 regression. |

The full-gate verdict remains failed even though two reruns passed. The Slice 1 Wallet/Sweep issues and the two unexplained parallel failures need their own disposition; this review does not change them or claim the integration gate is green.

## Findings

No confirmed functional defect in the Slice 2 consumer. Under the explicit functional-only review rule the consumer verdict is pass; the failed full gate and unresolved baseline work remain separate integration blockers for the Controller.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | low | `apps/web-server/scripts/suggestions-consumer-smoke.ts` | Exercise approval and read-only suppression through the browser with matching live suggestions. |
| tests | medium | `apps/web-server/scripts/persistent-room-effort-smoke.ts:86` | Distinguish suggestion requests from chat requests without weakening effort assertions, after the Slice 1 owner decides the fixture change. |
| tests | medium | `apps/web-server/scripts/chat-send-landing-smoke.ts`, `apps/web-server/scripts/persistent-room-detached-turn-reattach-smoke.ts` | Investigate the parallel-only assertion failures and reproduce their cause. |
| tests | medium | `docs/specs/T24-suggestions.md:78` | Complete Slice 3's real producer-to-leading-consumer fake-model flow, including adoption and ordering. |

Not checked: Slice 3 end-to-end producer-to-browser flow, independent level-3 conformance, and the root cause of the two parallel-only failures. No load testing, deep security audit or real provider calls were performed.
