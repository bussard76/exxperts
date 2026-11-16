# T20 review, round 2

Verdict: pass
Reviewed commit: 7a17ebee763ffdda20be2502539232b49cba54f6
Gates: focused refusal contracts 3/3 pass; script tests initially 55/57, after workspace builds 57/57 pass; UI and scripts typechecks pass. Full, browser and native gates explicitly not authorized.
Ponytail: reviewed the full task diff for correctness, safety, load, tests, speed and simplicity. Assumed load is one local user, including overlapping window actions. No independently established functional blocker in the continuation; limitations and prior unresolved native evidence are below.

What this change does: T20 moves a room's document host into a separate window while retaining a single owner and guarding close and return. This continuation settles invalidated and busy native close refusals by their matching abort, without granting the close or releasing another action.

## Scope and review evidence

Fetched `origin/agents/t20-harden` at the reviewed SHA. `origin/main` and the merge base were `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`; merging current main into a temporary branch from the reviewed head was already up to date, without conflicts. The actual merge-base diff is mixed: 52 paths, including non-Markdown source and tests. The temporary branch was deleted. Sascha's explicit round-two restriction overrides the normal full gate and browser/API flow steps; no native, browser, server-native or full-suite check ran. The pre-existing local modification to `package-lock.json` was neither staged nor changed.

Level: the overall new window data flow is level 3 under accepted ADR-0009. The C4 continuation was authorized at level 2 within the existing desktop shell and UI owner, without a new interface or contract; this rework adds one assignment inside the existing owner (level 1). No new dependency, route, persistent store, public package export or wire format was added by the continuation or rework. Reviewed the existing owner/desktop protocol, correlation and surrounding admission state, connected host and preview changes, specs, report, ADR, coding standards and round-one finding. The attacker considered for untrusted content is a remote web page or crafted document without machine write access; changed rendering uses React text or existing isolated frames and policies. No newly introduced secret, real identifier, real account or outward write was identified; tests use invented values and mocks. No live external system or model API was contacted.

## Round-one blocker and regression

`apps/web-ui/src/App.tsx:1203` stores the busy refusal's own correlation in the existing immediate-refusal slot. A matching abort goes through the exact binding, request, stamp and action validation and returns exactly one `abort-ack`; it clears only that slot, leaving the admitted pending action, prepared admission and in-flight write untouched. A wrong correlation is refused, and a fresh prepare succeeds once the admitted action has settled. The focused new test exercises the actual owner endpoint callback with mocked surrounding UI state; the shell contract test exercises the actual shell module with a fake owner and mocked Electron, not the integrated real native exchange.

Independent red/green: the new busy regression passed on the reviewed head. To exercise the identical current test against the prior owner without changing tracked files or a checkout, a Node `--import` data-URL preloader intercepted only `fs.readFileSync` for `App.tsx` and returned `git show 20b181399eb856eb4f9f57e3f3a06ef2165d1f4b:apps/web-ui/src/App.tsx`; `node --test --test-name-pattern='busy close abort' apps/desktop/scripts/documents-owner-refusal.test.mjs` exited 1 at line 62 because the matching abort was null. The reviewed source passes. This agrees with the builder's red report and proves the regression is sensitive to the owner change, but it is not a native integration test.

## Owner smoke assertion audit

Compared the entire `apps/web-server/scripts/workspace-documents-owner-ui-smoke.ts` at `e3db67126e28d74e8b8e5403b23eba836ed7960a` and the reviewed head. The only insertion before the fresh prepare is the approved sequence 8 / ack 7 `native-abort` using the invalidated refusal correlation and the assertion of sequence 8 / ack 8, one exact-shaped `abort-ack`, original binding and exact correlation. Removed those two lines and decremented only `sequence:` (38), `ack:` (38) and `.sequence ===` (6) values between `const clean` and `const abortPage`: the result is byte-for-byte identical to the 39,068-byte parent. The parent has 50 assert calls, the head 51; every other assertion and the second page are unchanged. The entire smoke file is unchanged between round-one head `20b181399eb856eb4f9f57e3f3a06ef2165d1f4b` and the reviewed head. No other existing assertion was edited in the rework. The browser smoke was not executed.

## Result and observable acceptance checklist

The spec's I1–I10 and R1–R15 are mapped below; “not independently run” means neither an acceptance pass nor a failure is claimed for that scenario. The report's historical results are evidence of past runs at their stated SHAs, not fresh proof at this head.

| Requirement | Implementation and proving test | Status |
| --- | --- | --- |
| I1 / R1: complete host, empty/error/blocked popup | `App.tsx`, `docs-window.ts`; `workspace-detached-documents-ui-smoke.ts` | Not independently run. |
| I2 / R2: one owner, context/host fencing | `App.tsx`, `docs-window.ts`; detached and two-window smokes | Not independently run. |
| I3 / R2, R4: chat references and context exits target current owner | `App.tsx`, `in-room-chat.tsx`; two-window and detached smokes | Not independently run. |
| I4 / R3, R8, R9: return and tab close preserve source and guard | `App.tsx`, `MarkdownEditorPane.tsx`; workspace tabs and detached smokes | Not independently run. |
| I5 / R3–R7: guarded native close, refusal, abort and first admitted action | `App.tsx`, desktop `main.ts`; owner/shell focused contracts and native/owner smokes | Busy refusal regression passes at owner seam; actual native exchange and remaining scenarios not independently run. |
| I6 / R5, R6, R8, R9: latest save, unknown write, conflict | `useMarkdownEditorSync.ts`, `App.tsx`; workspace tabs and detached smokes | Not independently run. |
| I7 / R1, R13, R14: recovery and visible bounds | `docs-window.ts`, desktop `window-state.ts`; native/detached smokes | Not independently run. |
| I8 / R10, R11, R14: host keyboard, overlays, frame bytes and policy | workspace preview components and frame entries, `room-settings-routes.ts`; preview and detached smokes | Not independently run; rendering and isolation inspected. |
| I9 / R12: real cross-window path drag | `WorkspaceFileBrowser.tsx`, `in-room-chat.tsx`; detached smoke | Not independently run; no real OS drag claim. |
| I10 / R15: Q5 limits and packed Mac entrypoints | `docs/reports/issue-20.md`, ADR-0009; separate packed Mac run | Limits documented; packed Mac result at this SHA not independently verified. |

## Findings

No confirmed functional blocker or major for this continuation under Sascha's functional-only rule. The earlier report records an actual-child native smoke hang and incomplete lifecycle observation; its cause and reproduction at this SHA remain unresolved, so it is not represented as a proven fixed flow or a new confirmed product defect. Mac-specific causation is also unproven. A pass here is limited to the authorized continuation review and is not native or platform acceptance.

## Commands and outcomes

Each test, typecheck and prerequisite build below was prefixed with `GATE_TASK='T20 C4 refusal settlement' GATE_WORKER='t20-c4-refusal-review2' GATE_ROLE='Tester' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra'`. HEAD stayed at the reviewed SHA for all checks.

- `node --test apps/desktop/scripts/documents-owner-refusal.test.mjs apps/desktop/scripts/documents-refusal.test.mjs`: pass, 3/3.
- `npm run test:scripts -- apps/desktop/scripts/documents-owner-refusal.test.mjs apps/desktop/scripts/documents-refusal.test.mjs`: initially 55/57; two unrelated bundle-server tests could not find generated `runtime/packages/coding-agent/dist/config.js` and `runtime/packages/ai/dist/utils/oauth/oauth-page.js`. After the prerequisite builds below, the same command passed 57/57. This npm script also runs its fixed packaging test list.
- `npx tsc --noEmit -p apps/web-ui/tsconfig.json`: pass.
- `npm run typecheck:scripts`: initially failed with absent local runtime declarations and cascading errors; after the builds below, the identical command passed.
- `npm run build --workspace runtime/packages/tui --workspace runtime/packages/ai --workspace runtime/packages/agent --workspace runtime/packages/coding-agent`: pass; these existing non-native workspace builds generated the runtime dependencies and declarations used by the checks. This was not a full product build or full gate.
- Prior-source regression rerun described above: expected exit 1; reviewed-head test passes. `git diff --check origin/main...HEAD`: pass.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/desktop/scripts/documents-owner-refusal.test.mjs` | Exercise the real owner and shell together at a permitted native/browser seam, including busy and invalidated abort and replay; the current tests mock their surroundings. |
| tests | minor | `apps/web-server/scripts/workspace-documents-owner-ui-smoke.ts` | Run the preserved smoke and R1–R15 on the final candidate when authorized; capture the unresolved actual-child hang and its lifecycle boundaries. |
| tests | minor | `docs/reports/issue-20.md` | Capture reason, stamps and lifecycle evidence in a separately authorized packed Mac run before attributing the historical Mac failure to this counterexample. |

Not checked: real native/browser flows, operating-system drag and multi-monitor behavior, full build/smoke gates and real integrated requester/guardian exchange. No platform support claim follows from these focused checks.
