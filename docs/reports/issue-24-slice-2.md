# Issue 24: Slice 2 consumer report

## Architecture impact

Level 3, within ADR-0009 and the accepted existing room socket and composer boundaries; no additional interface or data flow is authorized.

## Baseline

Slice 1 parent: `fc1049aa828ebddfb1d6a89fa58fabf8611a685f`. Pinned T23 integration parent: `40247f221286afe4b1195ce28dfc0d98547f6ce4`. Pre-UI merged diff base: `4c1dcdd7235fb57b33d4652f5225eca341b2d49d`. The T23 implementation merge `969da56` is an ancestor of this integrated baseline. The Slice 1-only base predates that integration; the coordinator directed this one pinned merge.

## Checklist and self-review

See `issue-24.md` for the in-progress checklist. The agreed test seams are the existing live room socket and composer, plus the fixture-gallery fake.

## Checks and evidence

Pending.

## Files, assumptions and debt

Pending. No screenshots captured.

## Red consumer checkpoint

`suggestions-consumer-smoke.ts` drives the existing composer and its live room socket using invented frames. The attributed browser gate reached the matching live completion/result case and failed waiting for `Alpha` to appear as the placeholder, as expected before implementation; 54 other script tests passed. Two earlier setup attempts failed before the consumer assertions: one lacked a configured fake provider and one used a serialized initializer that did not install the socket wrapper. The fake provider and initializer were corrected; neither was a product failure. This first red test is not yet complete coverage of the checklist.

The expanded red checkpoint adds wrong-room/thread, newer-completion, typing/clearing, IME, Escape, native focus and reconnect cases to the cyclic consumption sequence. Room navigation, mention ownership, send clearing and replay still require additional coverage before implementation.
