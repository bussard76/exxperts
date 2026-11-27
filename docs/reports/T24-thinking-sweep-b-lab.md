# T24 Thinking Sweep lab implementation

## Architecture impact

Level 2, as reviewed in `docs/reviews/T24-THINKING-SWEEP-B-R3-architecture-spec.md`: the existing room socket validates private lab startup prerequisites and guards the existing suggestion invocation; the existing fake-provider smoke owns the lab child and state. No public interface, recorder contract, client exclusivity or accounting design changed.

## Evidence

Base: `76e4c023e42405bbb28dde81a0006516d7d0eddf`. The reviewed spec and R3 report are included in this branch. The fake profile uses invented credentials and the loopback fake provider. The fake's actual receipt count and the recorder's unfiltered request records are compared, including the final rung; the lab checks suggestion requests, frames and usage. The unchanged fifteen-row, retry, tool, timeout, proxy, error, budget and recorder assertions remain.

Every `gate` command below was prefixed with `GATE_TASK='T24-THINKING-SWEEP-B-LAB' GATE_WORKER='t24-thinking-sweep-b-lab' GATE_ROLE='Developer' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra'`.

- `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci --no-audit --no-fund`: passed with the normal lifecycle and the approved browser download skip.
- `gate bash -c 'cd runtime && npm run build'`: passed.
- Before implementation, `gate npx tsx apps/web-server/scripts/thinking-levels-sweep-smoke.ts` failed with `lab must not launch suggestions, received 15 suggestion requests`. After adding the startup regression but before implementation the same command failed with `switch alone must fail startup before provider traffic`.
- After implementation, the same sweep command passed: `thinking-levels-sweep-smoke: 14 checks passed`. The startup cases cover switch alone, missing, mismatched and out-of-home marker, malformed switch, missing or unrelated preload, missing hosts and unwritable log; the original ordinary assertions were retained.
- `gate npx tsx apps/web-server/scripts/suggestions-producer-smoke.ts`: passed (exit 0), without lab activation.
- `gate npm run typecheck:scripts`: passed (exit 0).
- A gated temporary-directory interruption probe ran the smoke under `timeout --foreground -s TERM 15s node --import tsx ...`; timeout returned 124, the child stopped, and no `exxperts-sweep-smoke-*` state remained. An initial broader empty-directory assertion failed because tsx and Node leave their own compilation caches under TMPDIR; the corrected assertion checked the lab state specifically.
- A gated synthetic failure probe injected a temporary `fs.readFileSync` failure for the fake profile preflight. It produced `thinking-levels-sweep-smoke FAILED: synthetic preflight failure`, stopped the child, exited nonzero, and left no lab state.

The temporary marker and auth token are not evidence of exclusivity against another same-user client. Socket totals are observed costs, not complete bills; missing usage and failed calls may have unknown cost. Only configured hosts and exercised transports are covered by the recorder. Independent Tester review, full gate and level-2 architecture conformance are outstanding. Graph: no; direct source search located the approved seam.

The two passing cleanup probe commands (with the same gate attribution prefix) were:

```sh
gate bash -c 'test_root=$(mktemp -d); trap '\''rm -rf "$test_root"'\'' EXIT; mkdir "$test_root/tmp"; TMPDIR="$test_root/tmp" timeout --foreground -s TERM 15s node --import tsx apps/web-server/scripts/thinking-levels-sweep-smoke.ts >"$test_root/output" 2>&1; status=$?; cat "$test_root/output"; printf "timeout status: %s\n" "$status"; find "$test_root/tmp" -maxdepth 1 -mindepth 1 -printf "%f\n"; test "$status" -eq 124 && ! compgen -G "$test_root/tmp/exxperts-sweep-smoke-*" >/dev/null && echo "interruption cleanup passed"'
gate bash -c 'test_root=$(mktemp -d); trap '\''rm -rf "$test_root"'\'' EXIT; mkdir "$test_root/tmp"; printf '\''import fs from "node:fs"; const read = fs.readFileSync; fs.readFileSync = function (file, ...args) { if (String(file).endsWith("/.exxperts/agent/models.json")) throw new Error("synthetic preflight failure"); return read.call(this, file, ...args); };\n'\'' >"$test_root/fail.mjs"; TMPDIR="$test_root/tmp" node --import "$test_root/fail.mjs" --import tsx apps/web-server/scripts/thinking-levels-sweep-smoke.ts >"$test_root/output" 2>&1; status=$?; rg "synthetic preflight failure|smoke server stopped" "$test_root/output"; test "$status" -ne 0 && ! compgen -G "$test_root/tmp/exxperts-sweep-smoke-*" >/dev/null && echo "failure cleanup passed"'
```
