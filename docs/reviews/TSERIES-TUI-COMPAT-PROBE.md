# Series TUI compatibility probe

This is non-acceptance research, not graph approval or a policy decision. On the tested Linux/Node 22 host, the ancestor candidate changes the actual TUI and three runtime workspaces' selected Node and undici types, and makes a Node 22-only `node:fs` export typecheck where the clean base rejects it. The existing TUI output, including its actual emitted declarations, is byte-identical in this experiment; no actual use of that export was found in TUI sources. This does not establish minimum-Node compatibility, complete provenance or closure. The shield in `601d2b2` was discarded by clean npm ci and is not a working alternative. Independent Architect review and a Controller decision remain necessary before selection changes.

## Inputs and environment

Read R3 `7dbec5243269a42d0ea2e7a385eabd991e96eec1`, shield `601d2b2a5001c8d305f53d9c8c2858fb9538e9cf`, and R2 ancestor generator in `1f50fc144d5e024a11db227326f3ca0886b4c166`. The untouched input was `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, lock SHA-256 `c4b4553fd6a054ae042c239bffe3980b25044becc0c380ffa8bc6f79262ae488`. The exact generator extracted from the prior report has SHA-256 `b0d83687313f29a8262af481641e2c172fc615a91edaae58ff0aeb1cf4689c82`; its candidate lock SHA-256 `2d5f0a3e01abc6251e78db3531bfc5db9884673ee6104c1e3468096abd52316c`, matching the prior probe. This moves only the reviewed 24.12.2/7.16.0 entries to the runtime ancestor and adds only their approved source fields. Manifests and versions were unchanged; lock hashes stayed unchanged through installs.

Host: Node `v22.23.4`, npm `10.9.9`, Linux x86_64, glibc `2.39`. The TUI manifest declares Node `>=20.0.0`; root and coding-agent declare `>=20.6.0`, also documented in `README.md` and `docs/operations.md`. Only Node 22 and 24 were available in the local nvm installation; the declared minimums were **not tested**. Separate archives, empty homes and caches were used; normal scripts ran, including browser downloads, with no install or script suppression. This did not touch the active Series worktrees or stashes.

The candidate retains **154** non-link `node_modules/` lock entries missing resolved or integrity metadata. They are unchanged and remain unresolved; this experiment does not waive their provenance or locked-integrity requirements, nor establish fetched-byte provenance for them. No source fields were changed for these entries.

## Results

| Check | Clean base | Ancestor candidate |
| --- | --- | --- |
| Normal root `npm ci` | 0 | 0 |
| `npm ls --all` | 1, `ELSPROBLEMS`: 20.19.40 invalid for three `^24.3.0` workspace requirements | 0 |
| TUI build | 0 | 0 |
| AI, agent, coding-agent builds | all 0 | all 0 |
| TUI tests | 570 passed | 570 passed |
| Two actual coding-agent TUI consumer tests | 27 passed | 27 passed |
| Packed-declaration consumer, `skipLibCheck false` | 0 | 0 |

Both TUI `dist` trees, including 25 `.d.ts` files, compared byte for byte with `diff -ru`; their packed TUI tarballs also match SHA-256 `d15e2779411c35514284a49e4159d5bfa45816d0d52dc1f058e2089331ab7d86`. `stdin-buffer.d.ts` exposes Node's `EventEmitter` and `Buffer`, so identical text does not guarantee identical interpretation under every downstream type environment. The downstream test extracted the actual tarball into an isolated consumer's `node_modules`, used the installed graph for dependencies, imported `Container`, `Text`, `visibleWidth` and `Component`, and compiled with strict checking and `skipLibCheck false`. It is one example, not exhaustive downstream compatibility.

Node `createRequire` was measured from root, every `runtime/packages/*` workspace, pi-package, web-server and web-ui, resolving `@types/node/package.json`, direct `undici-types/package.json`, and undici from the actual selected types package. Base selected root `node_modules/@types/node` 20.19.40 and `node_modules/undici-types` 6.21.0 for all these locations. Candidate selected those root paths for root, pi-package and both web workspaces; all four runtime workspaces selected `runtime/node_modules/@types/node` 24.12.2 and `runtime/node_modules/undici-types` 7.16.0, both directly and from the types package. These are actual filesystem resolutions, not manifest inference.

After dependency builds, `tsgo --traceResolution --noEmit` on each of the four runtime build configs exited 0 in both trees. Full traces record compiler resolution for every module: TUI's explicit Node type reference resolved respectively to root `@types/node/index.d.ts` and runtime-ancestor `@types/node/index.d.ts`; its undici type import resolved to 6.21.0 and 7.16.0 respectively. The coding-agent examples config exited 2 in both trees with the same three diagnostics: missing `packages/coding-agent/src/config.js`, a `ThinkingLevel` mismatch in `preset.ts`, and a model literal mismatch in `12-full-control.ts`. The initial traces before dependency builds also failed for agent and coding-agent due to unbuilt workspace declarations; final traces above supersede those runs, not the examples failure.

A disposable `compatibility-probe.ts` in each TUI directory contained `import { glob } from "node:fs"; void glob;`. With identical `tsgo` options and actual TUI type lookup, base failed TS2305, candidate passed. Candidate's installed `fs.d.ts` marks `glob` as added in Node 22.0.0, above both declared minimums. The actual TUI sources contain no `glob` reference; a search of coding-agent sources found `globSync` imported from the separate `glob` package, not `node:fs`. This example proves the selection permits at least one newer API; it does not show an existing runtime failure or exhaustively prove all current calls safe at the minimum.

## Commands and evidence

All gate commands below were prefixed unchanged with `GATE_TASK='Series TUI compatibility' GATE_WORKER='tseries-tui-compat-probe' GATE_ROLE='Analyst' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra'`. The complete command scripts, compiler traces, resolution output, install/test/pack logs and status files are retained locally in ignored `.build/tui-compat-probe/evidence.tar.gz`, SHA-256 `757959e3291cd65399ef1cb813b966e2a7cab352775bf077d216cac0e2ce3d2f`; they are not part of the pushed report. Original clean directories and caches were removed. Relevant commands, executed from each archive root with distinct empty `HOME` and `npm_config_cache`:

```sh
git archive 461e6485bf932f5cba85ac3dde8e0104e47d5dec | tar -x -C "$checkout"
# Extract generate.cjs verbatim from 1f50fc1:docs/reviews/TSERIES-LOCK-PROBE.md.
node generate.cjs "$base/package-lock.json" "$candidate/package-lock.json"
npm ci
npm ls --all
./node_modules/.bin/tsgo -p runtime/packages/{tui,ai,agent,coding-agent}/tsconfig.build.json --traceResolution --noEmit # run separately for each path
./node_modules/.bin/tsgo -p runtime/packages/coding-agent/tsconfig.examples.json --traceResolution --noEmit
npm run build --workspace @exxeta/exxperts-tui
npm test --workspace @exxeta/exxperts-tui
npm run build --workspace @exxeta/exxperts-ai
npm run build --workspace @exxeta/exxperts-core
npm run build --workspace @exxeta/exxperts-runtime
./node_modules/.bin/vitest --run runtime/packages/coding-agent/test/footer-width.test.ts runtime/packages/coding-agent/test/interactive-mode-status.test.ts
npm pack --workspace @exxeta/exxperts-tui --pack-destination "$packdir"
./node_modules/.bin/tsgo --noEmit --strict --skipLibCheck false --target ES2022 --module Node16 --moduleResolution Node16 consumer/consumer.mts
# From runtime/packages/tui, after writing the two-line probe above:
../../../node_modules/.bin/tsgo --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module Node16 --moduleResolution Node16 --types node compatibility-probe.ts
```

The evidence archive contains the exact `resolve.cjs`, `check.sh` and `follow.sh`, including consumer source and all output. An initial targeted test named a nonexistent file and exited 1; the two real consumer tests above replaced it. The first API probe omitted `--ignoreConfig` and both trees returned TS5112; the corrected command above produced the reported difference. The first pack wrote both tarballs to the same temporary directory; the subsequent separate-directory packs produced the matching hashes above.

## Open limits

Minimum Node 20.0/20.6, other platforms, other downstream type selections, full runtime tests and the Series/composed graphs were not tested. This probe does not establish full R2 closure, license, native/optional platform coverage or provenance, or approve a revised graph. The compiler acceptance difference warrants independent review along with the unresolved 154 metadata entries; this report makes no acceptance or architecture decision.
