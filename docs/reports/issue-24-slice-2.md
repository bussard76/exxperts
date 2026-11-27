# Issue 24: Slice 2 consumer report

## Architecture impact

Level 3, within ADR-0009 and the accepted existing room socket and composer boundaries; no additional interface or data flow is authorized.

## Baseline

Slice 1 parent: `fc1049aa828ebddfb1d6a89fa58fabf8611a685f`. Pinned T23 integration parent: `40247f221286afe4b1195ce28dfc0d98547f6ce4`. Pre-UI merged diff base: `4c1dcdd7235fb57b33d4652f5225eca341b2d49d`. The T23 implementation merge `969da56` is an ancestor of this integrated baseline. The Slice 1-only base predates that integration; the coordinator directed this one pinned merge.

## Checklist and self-review

The agreed seams are the existing live room socket and composer, plus the fixture gallery. Product and test code at `5c4fa9a` is based on the pre-UI merge above.

| Binding item | Evidence |
| --- | --- |
| Fixture fake precedes implementation; no model or network source | The fixture was pushed at `30f911d`; `suggestions-consumer-smoke.ts` opens the actual gallery through local Vite preview and cycles its invented prompts. The final fixture uses the existing composer. |
| Same room, thread and live completion ID; ordered invalidation; stale rejection | `suggestions-consumer-smoke.ts` injects wrong-room, wrong-thread, missing and mismatched completion, a newer completion and invalidation into the live socket. |
| Clear on send, answer start, room and thread switch, disconnect and reconnect; no replay | `suggestions-consumer-smoke.ts` covers normal and accepted consult sends, invalidation, room and same-room thread change, socket close/reconnect, reload and injected replay frames. The producer publishes invalidation at answer start; this consumer consumes the same frame for both causes. |
| Placeholder priority, mention ownership, focus and IME | `suggestions-consumer-smoke.ts` checks active-answer and disconnected priority, mention Tab, native focus at zero/one, and composing Tab. `composer-hint-smoke.ts` checks the existing hint states, and `consult-mention-smoke.ts` covers existing mention behavior. Approval/read-only gating is additionally checked by inspection; see the test debt below. |
| Exact cyclic selection and consumption | `suggestions-consumer-smoke.ts` checks `[Alpha, Beta, Gamma]` selected at Beta, accepts Beta, cycles Gamma/Alpha in both directions, accepts Gamma then Alpha, and checks native Tab and ordinary placeholder at the end. |
| Typing, clearing and Escape | `suggestions-consumer-smoke.ts` checks restoration of the selected unconsumed item after typing and clearing, and Escape hiding until a new completion. |
| Accessibility and text-only insertion | `suggestions-consumer-smoke.ts` asserts the suggestion and exact keyboard hint in `aria-describedby`, and Right Arrow inserts text without sending. React renders the strings as a textarea placeholder and text. |
| Preserve T23 and existing assertions | The pinned T23 merge is an ancestor of the tested tree. `consult-mention-smoke.ts` exercises its existing Up/Down and Escape history assertions alongside mentions. No existing assertion was removed or weakened. |
| Boundaries and data | Changes are in the existing socket consumer, composer, fixture and docs; no dependency, new route, new export, store or network path was added. Tests use local fake services and invented data. Slice 1 Wallet/Sweep and Slice 3 remain outside this task. |

## Checks and evidence

- Clean `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` completed with normal lifecycle scripts. Chromium was already available at the Playwright executable path. The runtime workspace build was needed to generate declarations after the clean install; the UI workspace build produced the browser assets.
- `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed, including the commit hook at `5c4fa9a`.
- The attributed gate with `NODE_OPTIONS='--import tsx' npm run test:scripts apps/web-server/scripts/suggestions-consumer-smoke.ts apps/web-server/scripts/consult-mention-smoke.ts apps/web-server/scripts/composer-hint-smoke.ts` passed 57/57 (`/tmp/t24-slice2-final-gate.log`). The final extended consumer and fixture check passed 55/55 (`/tmp/t24-slice2-fixture-gate3.log`).
- The consult-send regression was red in `/tmp/t24-slice2-consult-red.log` and green in both final gates. The first gallery verification used the application server, which does not serve `fixtures.html`; the next used Vite but waited for its proxied `/healthz`, which returned 500. The final test waits on the fixture page itself and passes. The first post-implementation thread test used `dialog` where the UI uses `alertdialog`; the corrected selector passes. These were test-setup failures, not load reruns.
- Foreign-host network-failure reruns: 0. No full root build or full smokes were run, as directed. No screenshots captured.

## Files, assumptions and debt

Changed relative to `4c1dcdd`: `apps/web-ui/src/App.tsx`, `apps/web-ui/src/components/in-room-chat.tsx`, `apps/web-ui/src/fixtures/FixtureGallery.tsx`, `apps/web-ui/src/fixtures/fixture-data.ts`, `apps/web-server/scripts/suggestions-consumer-smoke.ts`, `docs/developer.md`, `docs/reports/issue-24.md` and this report. The browser smoke is the added test.

Assumptions: the accepted live socket and composer are the approved consumer test seam; the coordinator's pinned main commit is the only authorized integration merge. Graph: no; 11 tool calls preceded the first report edit, and direct source searches found the relevant files without a graph comparison.

Debt candidate (`tests`, low): approval and read-only suggestion suppression is checked by the existing hint suite and code inspection rather than separate browser scenarios; add those scenarios when hardening. Slice 3's real producer-to-consumer test, independent Tester review and level-3 conformance review remain for the Controller. The final push is the report commit containing this text; `5c4fa9a` identifies the tested product tree.

## Red consumer checkpoint

`suggestions-consumer-smoke.ts` drives the existing composer and its live room socket using invented frames. The attributed browser gate reached the matching live completion/result case and failed waiting for `Alpha` to appear as the placeholder, as expected before implementation; 54 other script tests passed. Two earlier setup attempts failed before the consumer assertions: one lacked a configured fake provider and one used a serialized initializer that did not install the socket wrapper. The fake provider and initializer were corrected; neither was a product failure. This first red test is not yet complete coverage of the checklist.

The expanded red checkpoint adds wrong-room/thread, newer-completion, typing/clearing, IME, Escape, native focus and reconnect cases to the cyclic consumption sequence. The later green run covers room navigation, mention ownership, send clearing and injected replay.

The red browser specification also names the accessibility hint, mention picker Tab ownership, immediate send clearing and reload/no-persistence behavior. The later green run covers room/thread switches, replay injection and disconnect; approval/read-only priority has the limit recorded above.

The browser specification now also injects replay frames and enters a second invented room. The later green run covers same-room thread replacement and active-answer/disconnect priority; approval/read-only priority has the limit recorded above.

A synthetic Forget flow now specifies same-room thread replacement and rejection of the old completion. Active-answer priority and IME Tab pass in the green browser run; approval/read-only priority has the limit recorded above.
