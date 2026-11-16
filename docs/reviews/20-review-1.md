# 20 freshness continuation review, round 1

Verdict: pass
Reviewed commit: a51e5b98e2cbb443bbe9adf11b6861c7a9bca453
Gates: focused non-native tests and browser pass after prerequisite build; initial browser gate failed on missing runtime build output, recorded below. Native/Mac evidence remains outstanding.
Ponytail: full bounded continuation reviewed; no functional findings. Expected load is one desktop shell per chat owner, with one outstanding exchange per shell.

## Scope and architecture

The reviewed branch tip fetched from `origin/agents/t20-c4-c5-freshness-dev` is the SHA above. Its merge-base with current `origin/main` is `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`; merging main into a temporary branch from the reviewed head was already up to date. The actual main-base diff is mixed (54 paths including code); the explicit dispatch limits this round's substantive review to `b59918f408835cc047a90b12a79643375784e6f6..a51e5b98e2cbb443bbe9adf11b6861c7a9bca453`, the C4/C5 freshness continuation. Earlier T20 implementation is the accepted baseline. The continuation is level 3 as stated in the accepted ADR-0009 amendment and passing `T20-C4-C5-FRESHNESS-architecture-spec.md`: ordering changes within the existing private shell/owner protocol, with no new export, dependency, route, channel or store. Architect conformance remains a separate step.

What this change does: the shell prevents the native action, waits for an outstanding exchange, and samples owner status once before sending Prepare with that exact stamp. Owner admission remains authoritative; invalid status and refused or unknown preparation do not authorize continuation.

## Spec checklist

| Requirement / acceptance | Code and evidence | Status |
| --- | --- | --- |
| I5, R3/R5/R6/R7/R15: prevent and retain disposition/request, finish outstanding exchange, sample once afterwards | `apps/desktop/src/main.ts` `requestDocumentsAction` and `poll`; `documents-freshness.test.mjs` held exchange and close listener | Pass for non-native seam; Mac outstanding |
| Complete envelope, sequence, binding, stamp; exact stamp to one Prepare, sample is not allow | `main.ts` `accept` and sample transition; held-exchange and invalid status tests; owner browser gate | Pass for non-native seam |
| Missing, malformed, mismatched, failed or late status fails closed; queued controls remain valid | `main.ts` `accept`/`poll`; missing, malformed, session, binding, throwing, timeout and queued-control tests | Pass for tested cases |
| Changed stamp after sample: invalidated refusal, correlated abort/ack, no retry; later event resamples with new request | `main.ts` abort handling; changed-stamp and unknown-preparation tests, existing refusal tests | Pass for non-native seam |
| C5 null reservation, matching commit, explicit no-child completion, abort and replay; session appearing invalidates null | `main.ts` existing correlation and `App.tsx` private owner endpoint; empty reservation, replay and appearing-session tests; owner browser gate | Pass for tested cases |
| I1–I4 and I6–I10; R1–R2, R4 and R8–R14 | Accepted prior T20 baseline; no changes to their implementation in this bounded continuation. Existing issue inventory and prior evidence in `docs/reports/issue-20.md` remain applicable. | Outside this continuation; no new acceptance claimed |
| Privacy, no outward effects and escaping | Changed protocol carries control and identity/status stamps; JSON serialization in `main.ts` supplies the existing private endpoint. Fixture uses invented identities and local test server; no content rendering, real services, real data or secrets added. | Pass within bounded diff |

## Test changes and red-first evidence

- `apps/desktop/scripts/documents-freshness.test.mjs` is new (13 tests). It exercises the actual shell producer and owner consumer through the existing private hook with controlled Electron/window and owner state, including exact stamp, invalid samples, queued control, C5 null reservation, stale-after-sample abort/no-retry and later fresh event. This is not native acceptance.
- `apps/desktop/scripts/documents-refusal.test.mjs`: exactly two pre-existing assertions change. The strict `assert.deepEqual` (from `node:assert/strict`, hence deep strict equality) expected sequence changes from `["hello", "native-prepare", "native-abort", "poll"]` to `["hello", "poll", "native-prepare", "native-abort", "poll"]`; the following assertion changes only `received[2]` to `received[3]`, preserving `.items[0].correlation.stamp.hostGeneration` and equality to `2`. These are the two dated Sascha-approved changes.
- `apps/web-server/scripts/workspace-documents-owner-ui-smoke.ts`: exactly three `browser.newPage()` calls gain `{ userAgent: "ExxpertsDesktop/1.0" }`; all assertions are unchanged. These are the only changed pre-existing test files. No other pre-existing assertion was removed, weakened, loosened, skipped or made conditional.
- Independently reconstructed the original `0402d6a` red test with shell and owner source from `b59918f` in a temporary directory, using the installed test dependencies. `node --test` failed 0/1 with actual `hello, poll, native-prepare, native-abort` versus expected `hello, poll, poll, native-prepare`, exactly as reported. The shell source at `0402d6a^` and `b59918f` is byte-identical. The temporary directory was removed. The later green test checks the same held-response ordering and exact stamp; the C5 test also fails if the reservation/commit path is removed.

## Independent checks

All checks below ran at the reviewed SHA; the pre-existing uncommitted `package-lock.json` setup change was left untouched and is outside the reviewed diff. `git diff --check b59918f a51e5b9` passed. Full build/smokes gates, server-native tests, native Electron tests, Docker and release gates were excluded by the explicit Sascha instruction.

- `node --test apps/desktop/scripts/documents-freshness.test.mjs apps/desktop/scripts/documents-refusal.test.mjs apps/desktop/scripts/documents-owner-refusal.test.mjs`: pass 16/16.
- `npm run test:scripts -- apps/desktop/scripts/documents-freshness.test.mjs apps/desktop/scripts/documents-refusal.test.mjs apps/desktop/scripts/documents-owner-refusal.test.mjs`: initial 68/70, the two `scripts/bundle-server.test.mjs` cases could not resolve unbuilt runtime `dist/config.js` and `dist/utils/oauth/oauth-page.js`. After prerequisite build, reran same command: pass 70/70.
- `npm run build`: pass, to create missing local runtime and UI artifacts; no native test or server-native gate invoked.
- `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts`: initial UI check passed but scripts check failed on missing runtime declarations; after build, same command passed. `npm run typecheck --prefix apps/desktop` initially failed for missing Electron declarations; after `ELECTRON_SKIP_BINARY_DOWNLOAD=1 EXXETA_SKIP_BROWSER_INSTALL=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix apps/desktop`, it passed. No Electron binary or native test was run.
- Attributed browser gate: `GATE_TASK='T20 Freshness' GATE_WORKER='t20-c4-c5-freshness-tester' GATE_ROLE='Tester' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' GATE_SLOTS=1 GATE_E2E_SLOTS=1 ~/controller-exxperts/full-gate.sh bash -c 'npm run smokes -- --jobs 1 workspace-documents-owner-ui'`. Initial run failed 0/1 before the flow because runtime `dist/index.js` was missing. After the build, the same isolated command passed 1/1; it runs the actual owner in Chromium with the desktop user agent and invented fixture data. The original gate failure is retained here and is a missing-build-prerequisite failure, not evidence of a functional defect in this continuation.

## Findings

No functional defect found in the bounded continuation. Native/Mac testing of the actual packed application and native entrypoints remains outstanding; the mock shell and browser owner do not establish native acceptance.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/desktop/scripts/documents-freshness.test.mjs` | Complete the assigned Mac native run at the final candidate SHA to verify real event ordering and continuation. |
