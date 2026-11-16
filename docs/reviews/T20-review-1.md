# T20 review, round 1

Verdict: fail
Reviewed commit: 20b181399eb856eb4f9f57e3f3a06ef2165d1f4b
Gates: focused refusal tests pass; UI typecheck pass; scripts and desktop typechecks fail with missing local dependencies; full and browser/native gates not authorized.
Ponytail: full task diff considered under correctness, safety, load, tests, speed and simplicity; one functional finding below. Assumed load: a local user, including overlapping window actions.

What this change does: The continuation settles a current-stamp invalidated native close refusal through a matching abort, allowing a later fresh attempt. The task diff adds a detached document host with a chat-owned session and native lifecycle coordination.

## Scope and evidence

Fetched `origin/agents/t20-harden` at the reviewed SHA; `origin/main` and the merge base were both `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`. A temporary branch from the reviewed SHA merged current main cleanly (already an ancestor). The full diff is mixed: 52 paths, including code and tests. This round independently targets the continuation from `e3db67126e28d74e8b8e5403b23eba836ed7960a`; the full task diff and its acceptance map inform the review. The report records Sascha's C7 option B decision and the authorized C4 continuation; the latter preserves existing assertions apart from the expressly authorized sequence adjustment.

The pre-existing worktree modification to `package-lock.json` was not staged or altered. Tests ran with HEAD at the reviewed SHA, but this checkout lacks installed desktop Electron packages and built runtime package declarations, so those two typechecks cannot establish a clean result. No native, browser, server-native or full gate ran under the more specific restriction. No real systems, accounts, data, or model APIs were used. The reviewed continuation uses invented test IDs. No new dependency, route, public export, store or wire format was added by the continuation; the overall feature is level 3 under ADR-0009, while the recorded continuation is level 2 within the existing owner and shell.

## Assertion diff audit

Compared the entire parent and reviewed `apps/web-server/scripts/workspace-documents-owner-ui-smoke.ts` as bytes. The inserted block sends exactly one sequence 8 / ack 7 `native-abort` using the invalidated sequence 7 refusal's correlation; before the next prepare its assertion requires sequence 8 / ack 8, exactly one `abort-ack`, exact reply keys, binding and correlation. Removed those two new lines and subtracted one from numeric `sequence:`, `ack:`, and `.sequence ===` values between `const clean` and `const abortPage`: 38 sequence fields, 38 ack fields and 6 sequence assertions. The reconstructed file equals the parent byte for byte (39,068 bytes), including all 50 original assert calls; the reviewed file has 51. Thus no other assertion, state or expected value changed. The second page is unchanged. The modified browser smoke was not executed.

## Spec checklist

| Item | Requirement and implementation | Evidence / status |
| --- | --- | --- |
| I1 | Full detached host: `docs-window.ts`, `App.tsx`, workspace components | R1/R9/R11/R14 browser and native evidence not independently run. |
| I2 | One owner and host: `App.tsx`, `docs-window.ts` | R2/R7 not independently run; competing close defect below. |
| I3 | Chat references target current host: `App.tsx`, `in-room-chat.tsx` | R2/R4 not independently run. |
| I4 | Return and guarded tab close preserve source: editor and `App.tsx` | R3/R8/R9 not independently run. |
| I5 | Guarded native close, leave and cancellation: `App.tsx`, desktop `main.ts` | Invalidated contract tests pass; busy refusal cannot settle, finding below. |
| I6 | Save and unknown-write guard: `useMarkdownEditorSync.ts`, `App.tsx` | R5/R6/R8/R9 not independently run. |
| I7 | Recovery and bounds: `docs-window.ts`, `window-state.ts` | R1/R13/R14 not independently run. |
| I8 | Child input, previews and sandbox: workspace components, frame entries, `room-settings-routes.ts` | R10/R11/R14 not independently run; retained frame CSP and text-based labels inspected, no new continuation content rendering. Untrusted web content is the attacker position. |
| I9 | Cross-window drag: `WorkspaceFileBrowser.tsx`, `in-room-chat.tsx` | R12 not independently run; no OS drag claim. |
| I10 | Disclose Q5 limits and prove native entrypoints: report and ADR | Packed Mac R15 remains separate and unverified; no platform claim made here. |

## Findings

### [blocker] A busy native close cannot finish aborting

- Where: `apps/web-ui/src/App.tsx:1202`, `apps/web-ui/src/App.tsx:1312`, `apps/desktop/src/main.ts:346`.
- Problem: If another document action owns the arbiter while the shell's observed stamp is current, the owner returns `busy` without recording the refusal. The shell accepts it and sends matching `native-abort`, but the owner requires `nativePrepared`, which that busy branch never created. It therefore never sends the acknowledgement, even after the original action ends. The shell retains its abort attempt and later native close attempts cannot proceed normally.
- Violates: C4 refusal/abort settlement and I5 / R5–R7. This is a specified competing-action flow, not merely missing coverage; the report identifies it as outside the narrow invalidated fix.
- Fix: Settle the busy refusal with its own exact correlation without releasing or changing the already admitted action.
- Proving test: Drive the owner and shell with an existing pending action, a current-stamp native close, matching busy refusal and abort; require exact abort acknowledgement, preservation of the first action, and a later fresh close attempt.

## Scoped commands and results

All four commands had the requested `GATE_TASK`, `GATE_WORKER`, `GATE_ROLE`, `GATE_AGENT`, and `GATE_MODEL` environment assignments.

- `node --test apps/desktop/scripts/documents-owner-refusal.test.mjs apps/desktop/scripts/documents-refusal.test.mjs`: pass, 2/2. Historical report records both red tests before the fix; the owner test extracts the actual effect into a VM with mocked surrounding state, and shell test uses a mocked Electron environment. They do not prove the real integrated native exchange.
- `npx tsc --noEmit -p apps/web-ui/tsconfig.json`: pass.
- `npm run typecheck:scripts`: exit 2; numerous unresolved `@exxeta/exxperts-ai`, `@exxeta/exxperts-runtime`, and related runtime declarations, with cascading errors. Not resolved under the restricted command scope.
- `npm run typecheck --prefix apps/desktop`: exit 2; `electron` and `electron-updater` modules/types absent, with cascading errors. Not resolved under the restricted command scope.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/desktop/scripts/documents-owner-refusal.test.mjs` | Exercise the real integrated owner and shell with a permitted native/browser harness, including abort loss and replay; the extracted effect mocks admission. |
| tests | minor | `apps/web-server/scripts/workspace-documents-owner-ui-smoke.ts` | Run the preserved browser smoke and the R1–R15 entrypoint scenarios on the final candidate when authorized. |
| tests | minor | `docs/reports/issue-20.md` | Capture reason and stamps in a separately authorized Mac run before attributing the historical Mac failure to this counterexample. |

Not checked: real native/browser flows, actual multi-monitor/OS drag, full suites, clean dependency-equipped typechecks, and all runtime behavior outside the permitted focused tests. No conclusion that unexecuted acceptance items pass is implied.
