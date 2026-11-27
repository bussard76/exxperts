# T23-UPARROW review, round 1

Verdict: pass
Reviewed commit: 6d3ea202b528955ac883d815fda3944d16a79289
Gates: full gate **failed** (build passed; 379/381 smokes passed); targeted composer browser smoke passed after the gate. See gate evidence below.
Ponytail: full diff and connected send, transcript, composer, reset and keyboard paths reviewed; no functional findings. Expected load: a person using a room locally.

What this change does: The room composer recalls the current transcript's sent prompts with Up and Down, preserving the draft for Down or Escape. It uses the existing transcript and keyboard handling, with no separate history store.

## Spec checklist

All smoke references below are to `apps/web-server/scripts/consult-mention-smoke.ts`; the browser section uses invented rooms and a local fake model server.

| # | Requirement | Code | Test | Status |
|---|---|---|---|---|
| 1 | Up/Down navigate in order, stop at bounds and restore the exact draft; Down outside browsing stays native | `apps/web-ui/src/components/in-room-chat.tsx:1110` | Browser navigation and empty history, smoke:596–614 | Pass |
| 2 | Escape restores draft; recalled text is editable, caret at end; recall does not send | `apps/web-ui/src/components/in-room-chat.tsx:1098` | Browser caret, edit, Escape and transcript count, smoke:613–628 | Pass |
| 3 | Start only on first line or empty; no history leaves native handling | `apps/web-ui/src/components/in-room-chat.tsx:1115` | Browser multiline and empty-history checks, smoke:596–600, 625–628 | Pass |
| 4 | Mention and IME own their keys; preserve overlay, approval and existing send precedence | `apps/web-ui/src/components/in-room-chat.tsx:1079` | Component picker, overlay, approval and send tests, smoke:327–369; browser IME, smoke:637–639 | Pass |
| 5 | Room switch cannot retain history or saved draft | `apps/web-ui/src/components/in-room-chat.tsx:911` | Browser room switch, smoke:640–650 | Pass |
| 6 | Reload recalls the restored transcript without another store | `apps/web-ui/src/components/in-room-chat.tsx:1112`, `apps/web-ui/src/App.tsx:2595` | Browser reopen and reload, smoke:651–657 | Pass |
| 7 | Collapse consecutive exact eligible duplicates; exclude empty attachments, whitespace-only sends, consults and wire-only text | `apps/web-ui/src/components/in-room-chat.tsx:1112`, `apps/web-ui/src/App.tsx:4552` | Component duplicate checks, smoke:322–326; browser sends, attachments, consult and handoff, smoke:601–610, 658–664, 763–775 | Pass |

## Findings

No functional defect found. The level remains 1: an existing internal composer prop receives the already available UI transcript; there is no new dependency, route, storage or cross-module contract. The existing exported component is a smoke seam, and its added optional prop is supplied inside the same UI module. The changed tests exercise the textarea and real browser send/transcript/reload path; without recall the navigation and draft-restoration assertions fail by inspection. The implementation places prompt text into a textarea through React state rather than HTML, and the added data and credentials are invented; the changed path has no outward service operation. The fake gateway binds localhost.

## Gate evidence

Current `origin/main` at review was `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`; merging it into a clean temporary branch at the reviewed SHA was already up to date, with no conflicts. The diff is mixed, not documentation-only. The full attributed gate ran once on that SHA: build passed, smokes failed, **379/381 passed**. The two failures and same-commit isolated outcomes were:

- `persistent-room-mcp-scope-smoke.ts`: failed in parallel and failed alone because the granted connector was absent from the manifest.
- `mcp-oauth-issuer-smoke.ts`: failed in parallel and failed alone with 18 OAuth checks, including missing issuer stamps.

The reviewer prepared the clean checkout with `npm ci --ignore-scripts`, inadvertently omitting the normal `postinstall` MCP adapter patch. After running `node scripts/patch-mcp-adapter.mjs`, each same-commit isolated smoke passed once. This explains the two failures as review-environment setup errors; the original full gate remains **failed**, and was not rerun. The full run reported parts skipped for missing `fd` and a case-insensitive-filesystem case, plus Windows/macOS-only checks unavailable on Linux. No foreign-host network-failure reruns were made.

After the full gate, the attributed `consult-mention-smoke.ts` ran alone and passed, including the browser checks with the fake service and demo data. Its four viewport/theme cases include the real send, recall, switch and reload path. No real model or external service was called by the changed smoke.

## Debt candidates

| Category | Severity | Where | Proposal |
|---|---|---|---|
| tests | minor | `apps/web-server/scripts/consult-mention-smoke.ts:327` | Add mutation evidence for the added picker and keyboard-precedence assertions when those paths next change; their individual red capability was not demonstrated in the implementation report. |
