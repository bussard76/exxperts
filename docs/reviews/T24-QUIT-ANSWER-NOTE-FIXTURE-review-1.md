# T24 quit-answer-note fixture review, round 1

Verdict: pass
Reviewed commit: 09f202352daf5341f277b2aa9748c29d7548e78e
Gates: focused host-locked Chromium smoke passed; full suite deferred to Controller as directed. Script typecheck passed after build.
Ponytail: reviewed the complete narrowly scoped fixture and report diff and connected request path; no functional finding. Expected load is a single local smoke against its fake provider.

## Scope and evidence

The specified comparison is against prior integration `d1c2e25eb8280f50f27adee70d4ef14cead1e384`, which already includes the accepted lab implementation. The wider diff from merge-base `40247f221286afe4b1195ce28dfc0d98547f6ce4` includes that prior work and is mixed; it is outside this focused repair review. Current `origin/main` was already an ancestor of the reviewed head; a temporary merge reported already up to date. The report-only head and fixture commit `ca7c2c3d6349100bba690c4f00cfb66e7cf0e3ac` both contain fixture blob `22281d41493053cab4b39b052b65ebd8e2faec07`.

The original isolated red evidence `/tmp/t24-lab-quit-isolated.log` records the unchanged smoke failing its last-message assertion. The developer report records an initial baseline pass followed by a failure with a different request order; this is timing-dependent evidence, not a deterministic red. Its green command used `gate` directly, not the host-lock wrapper.

On the exact reviewed head, `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` completed the normal lifecycle including the MCP adapter postinstall. Playwright's cached Chromium executable existed; `npm run build` passed. An early script typecheck failed because the clean checkout had not yet built its runtime workspace modules; after the build, `npm run typecheck:scripts` passed. The following unchanged smoke invocation ran once under the attributed host lock and exited 0 with `quit-answer-note smoke: ok`; Chromium was not skipped:

```sh
GATE_TASK='T24-QUIT-ANSWER-NOTE-FIXTURE' GATE_WORKER='t24-quit-answer-note-fixture-test1' GATE_ROLE='Tester' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' ~/controller-exxperts/full-gate.sh npx tsx apps/web-server/scripts/quit-answer-note-smoke.ts
```

The observed classifications were chat, chat, suggestion, chat, suggestion; the third recorded chat was `Thanks, that is all.` and the saved answer was `You are welcome.`. This exercises both classifier branches and the problematic interleaving, but does not assert delivery or display of the suggestion. No full suite, native gate, Docker or paid API was run.

## Spec checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Keep assertions and scenarios | Direct fixture diff changes only fake-provider classification, reply selection and diagnostic logging; existing browser and saved-thread assertions remain unchanged. | Pass |
| Route suggestions separately without consuming chat replies | `quit-answer-note-smoke.ts:106` matches the worker system prompt and the existing Anthropic fake-provider convention (`anthropic-api-key-provider-smoke.ts:109`); the host-locked run observed the interleaving and three correct chats. | Pass |
| Preserve ordinary suggestions | Suggestions remain enabled and receive a synthetic JSON array. The run observed two suggestion requests; it did not assert suggestion display or delivery. | Pass for routing; coverage debt below |
| Public behavior and failure evidence | The existing browser smoke drives a real local server, UI and socket, checks quit/restart, refusal, retry and note preservation. Its two note assertions would fail if the note were removed. Historical baseline failure depends on request ordering. | Pass |
| Level 1 and safety | Only the existing fake endpoint and report changed; no new import, export, dependency, route or product data flow. Invented temporary home and loopback provider with synthetic credentials; no real model calls, secrets or external effects. No changed rendering of untrusted content. | Pass |

## Findings

None.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/quit-answer-note-smoke.ts:106` | Add a deterministic assertion that a suggestion request is handled without consuming a chat reply and that the returned suggestion reaches its consumer; the current smoke can pass without observing a suggestion and does not assert its delivery. |
