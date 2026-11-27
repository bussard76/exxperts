# T24 quit-answer-note fixture repair

## Architecture impact

Level 1: the smoke's fake Anthropic endpoint routes its own traffic; no product boundary or API changes.

## Diagnosis and comparison

Base: integration merge `d1c2e25eb8280f50f27adee70d4ef14cead1e384`, with lab parent `25b0a229ff772593941752e890be580a8cbfb517`. The original fixture blob is `eabe53172a70a6ee63aa304037e74403951c4423`; fixed fixture commit `ca7c2c3d6349100bba690c4f00cfb66e7cf0e3ac` has blob `22281d41493053cab4b39b052b65ebd8e2faec07`. Only the fixture differs between the compared runs.

The server's suggestion worker sends system prompt `Generate next prompt suggestions` and renders its context as `User: ...\nAssistant: ...` in the user message. The original endpoint counts every post-restart request in `received`, selecting the scripted response by its index. In the red run, the counted sequence was chat `Say hello` with note, chat `Say hello` with note, suggestion context `User: Say hello\nAssistant: Hello there.`, then chat `Thanks, that is all.`; the suggestion consumed the third chat reply, and the last chat received `Done.`. The assertion that the third chat ends in `Thanks, that is all.` failed. The fixture now identifies the Anthropic system prompt using the existing fake-provider pattern, returns a synthetic suggestion array, and reserves `received` and scripted replies for chat calls. The green run classified the sequence chat, chat, suggestion, chat, suggestion; the third chat carried `Thanks, that is all.` and the saved reply was `You are welcome.`.

Assertion diff against base: empty; no assertion, expected value, or user scenario was changed. The existing browser smoke supplies the failing-first regression evidence. Suggestions remain enabled.

## Checks

- Existing lifecycle-installed dependencies and cached Chromium were used; `npm run build -w apps/web-ui` exited 0. Playwright's executable existed in the standard cache; both smoke runs used the fixture's ordinary `chromium.launch()` headless settings, its isolated temporary invented home, and the same local fake Anthropic provider.
- On base, the command below first exited 0 (the suggestion arrived after the third chat), then exited 1 on the second unchanged run with `a message sent the moment the noted message's answer ended carries a note again`. This captures the timing-dependent red without altering the fixture.
- On the fixed fixture commit, the identical command exited 0 and printed `quit-answer-note smoke: ok`, with no browser skip.
- `npm run typecheck:scripts` exited 0; the normal commit hook also passed it.

```sh
GATE_TASK='T24-QUIT-ANSWER-NOTE-FIXTURE' GATE_WORKER='t24-quit-answer-note-fixture' GATE_ROLE='Developer' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate npx tsx apps/web-server/scripts/quit-answer-note-smoke.ts
```

No full or native gate, Docker, paid provider, or unrelated test was run. Independent review and the integration gate remain for the Controller.
