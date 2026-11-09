# TSERIES lock placement probe

Result: the bounded placement hypothesis passed twice on this one Linux toolchain. This is evidence for an experimental baseline candidate only, not approval to apply it to either Series or to relax R2 acceptance. Independent review and Controller approval remain required before either Developer applies any change.

## Inputs and scope

- Immutable base: `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, root `package-lock.json` SHA-256 `c4b4553fd6a054ae042c239bffe3980b25044becc0c380ffa8bc6f79262ae488`. The test extracted this commit with `git archive` into two initially empty disposable directories; no Series worktree was used.
- Fork comparison: `f919c8a956090cfc7657b1a4d060c4855626d35a`, root lock SHA-256 `aee9e062730930dccc6fba6b380a7148af0ce57b021c99c207ed97a6a7dfb1f1`. Its six relevant entries exactly match the base entries. This experiment did not combine Series dependency graphs.
- Review: `a2651f9:docs/reviews/TSERIES-LOCK-architecture-spec.md`; R2 reviews at `eb90f669c3f5bebcfee1597f64f76ee5d121ba0d:docs/reviews/TSERIES1-R2-architecture-spec.md` and `5873f4ee17a9678d1835fc336815aeb5f86f8ffd:docs/reviews/TSERIES2-R2-architecture-spec.md`; Controller metadata decision SHA-256 `a5a4951bab5d80b1b003779c72383196919d515430225e507a7b184e06705055`.
- Node `v22.23.4`, npm `10.9.9`, Linux x64, glibc `2.39`; empty disposable home and separate empty npm cache per extraction; base `.npmrc` contains `allow-remote=root`; `omit` empty and `ignore-scripts=false`. Browser download alone was suppressed using `EXXETA_SKIP_BROWSER_INSTALL=1`. Normal root lifecycle ran, including both postinstall scripts. No nested install, `npm install`, manifest change, or lifecycle suppression was used.

## Placement and compatibility

The base has no `runtime/node_modules/@types/node` or `runtime/node_modules/undici-types` lock paths. Under `runtime/`, the only locked dependency edges naming these packages are the three runtime workspace dev requirements `@types/node: ^24.3.0` and their three `@types/node` requirements `undici-types: ~7.16.0`. All six local entries agree: types 24.12.2 (`dev: true`, MIT, dependency `~7.16.0`) and undici 7.16.0 (`dev: true`, MIT). The proposed versions satisfy those ranges. The generator asserts identical source entries, missing target paths, expected versions and ranges; it places one copy of each at the ancestor, retaining source fields and adding only the separately authorized URL and SRI, then removes the six superseded copies. All other lock entries and values are unchanged. The root 20.19.40 types and 6.21.0 undici entries remain unchanged. The `runtime/package.json` standalone `^22.10.5` request belongs to a different nested workspace/install, not the root workspaces, and was not tested by a nested install.

Downloaded official tarballs independently matched the authorized SHA-512 SRI values in the generator. Their SHA-256 hashes were `d0d6910fab205566ade23a582838e93187f4337b03e63a799cd3443839943ed7` (node types) and `53b5e2fa12a4118a4838e80b1cc6e1d8cd30d6f7e5bea69640e5386f6eb3f8af` (undici types). npm also checked locked integrities during its two clean installs.

## Reproduction

Save the following exactly as `generate.cjs` (SHA-256 `b0d83687313f29a8262af481641e2c172fc615a91edaae58ff0aeb1cf4689c82`):

```js
const fs = require('fs');
const assert = require('assert');
const lock = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const p = lock.packages;
const consumers = ['agent', 'ai', 'coding-agent'];
const metadata = {
  '@types/node': ['24.12.2', 'https://registry.npmjs.org/@types/node/-/node-24.12.2.tgz', 'sha512-A1sre26ke7HDIuY/M23nd9gfB+nrmhtYyMINbjI1zHJxYteKR6qSMX56FsmjMcDb3SMcjJg5BiRRgOCC/yBD0g=='],
  'undici-types': ['7.16.0', 'https://registry.npmjs.org/undici-types/-/undici-types-7.16.0.tgz', 'sha512-Zz+aZWSj8LE6zoxD+xrjh4VfkIG8Ya6LvYkZqtUQGJPZjYl53ypCaUwWqo7eI0x66KBGeRo+mlBEkMSeSZ38Nw==']
};
for (const [name, [version, resolved, integrity]] of Object.entries(metadata)) {
  const target = `runtime/node_modules/${name}`;
  assert(!p[target], `collision: ${target}`);
  const paths = consumers.map(c => `runtime/packages/${c}/node_modules/${name}`);
  const entry = p[paths[0]];
  assert(entry && entry.version === version && !entry.resolved && !entry.integrity);
  for (const path of paths) assert.deepStrictEqual(p[path], entry, `inconsistent ${path}`);
  p[target] = { ...entry, resolved, integrity };
  for (const path of paths) delete p[path];
}
for (const c of consumers) assert.strictEqual(p[`runtime/packages/${c}`].devDependencies['@types/node'], '^24.3.0');
assert.strictEqual(p['runtime/node_modules/@types/node'].dependencies['undici-types'], '~7.16.0');
fs.writeFileSync(process.argv[3], JSON.stringify(lock, null, 2) + '\n');
```

Generate twice from the first untouched root lock and compare; independently generate from the second untouched root lock and compare with the first candidate. Copy the candidate to each root `package-lock.json`. Both independent extractions produced candidate SHA-256 `2d5f0a3e01abc6251e78db3531bfc5db9884673ee6104c1e3468096abd52316c`, unchanged after install. For example, with an empty disposable directory, isolated home and cache:

```sh
git archive 461e6485bf932f5cba85ac3dde8e0104e47d5dec | tar -x -C "$probe_checkout"
node generate.cjs "$probe_checkout/package-lock.json" "$probe_candidate1"
node generate.cjs "$probe_checkout/package-lock.json" "$probe_candidate2"
cmp "$probe_candidate1" "$probe_candidate2"
cp "$probe_candidate1" "$probe_checkout/package-lock.json"
cd "$probe_checkout"
GATE_TASK='Series lock' GATE_WORKER='tseries-lock-probe' GATE_ROLE='Analyst' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' HOME="$probe_home" npm_config_cache="$probe_cache" EXXETA_SKIP_BROWSER_INSTALL=1 npm ci
GATE_TASK='Series lock' GATE_WORKER='tseries-lock-probe' GATE_ROLE='Analyst' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' HOME="$probe_home" npm_config_cache="$probe_cache" npm ls --all
```

For resolution, from each checkout, run:

```sh
node - <<'JS'
const {createRequire} = require('node:module');
const path = require('node:path');
for (const dir of ['.', 'runtime/packages/ai', 'runtime/packages/agent', 'runtime/packages/coding-agent']) {
  const req = createRequire(path.resolve(dir, 'probe.cjs'));
  const n = req.resolve('@types/node/package.json');
  const u = createRequire(n).resolve('undici-types/package.json');
  const d = req.resolve('undici-types/package.json');
  console.log(dir, path.relative(process.cwd(), n), require(n).version,
    path.relative(process.cwd(), u), require(u).version,
    path.relative(process.cwd(), d), require(d).version);
}
JS
```

## Results and logs

| Check | First extraction | Second extraction |
| --- | --- | --- |
| Generate and `cmp` | exit 0, matching SHA-256 above | exit 0, matching SHA-256 above |
| Root `npm ci` | exit 0; 822 packages added, 831 audited; postinstall ran | exit 0; 822 packages added, 831 audited; postinstall ran |
| Root `npm ls --all` | exit 0 | exit 0 |
| Resolution command | exit 0 | exit 0, same paths and versions |

The complete captured stdout/stderr log SHA-256 values were: first `npm ci` `b82354d7393442c9d7dff17e1a25445cff4351672eb36acb396c0978f8eb39ea`, first `npm ls --all` `2bb5cb543f2484d00e4d51cbc6252fadb47ac8c669cd318d8a4c5865ee612a65`, second `npm ci` `b82354d7393442c9d7dff17e1a25445cff4351672eb36acb396c0978f8eb39ea`, second `npm ls --all` `fc7135d4a250048a5ec3cd4a8ade1bbe2a1ace3b4e56c8f2d1fbdb15f4e67a2a`. The install logs show the MCP patch script and `[exxperts] EXXETA_SKIP_BROWSER_INSTALL=1 — skipping Chromium download.` The logs' npm audit summary reported zero vulnerabilities; that is not a security audit conclusion. Complete logs were temporary and are not retained; their hashes identify the observed runs, and the commands above reproduce them, subject to npm output and network variation.

Both resolution runs produced the following (undici was checked both from the types package and directly from each consumer):

```text
. node_modules/@types/node/package.json 20.19.40 node_modules/undici-types/package.json 6.21.0 node_modules/undici-types/package.json 6.21.0
runtime/packages/ai runtime/node_modules/@types/node/package.json 24.12.2 runtime/node_modules/undici-types/package.json 7.16.0 runtime/node_modules/undici-types/package.json 7.16.0
runtime/packages/agent runtime/node_modules/@types/node/package.json 24.12.2 runtime/node_modules/undici-types/package.json 7.16.0 runtime/node_modules/undici-types/package.json 7.16.0
runtime/packages/coding-agent runtime/node_modules/@types/node/package.json 24.12.2 runtime/node_modules/undici-types/package.json 7.16.0 runtime/node_modules/undici-types/package.json 7.16.0
```

One initial attempt to start the second extraction command was rejected before execution because its working directory did not yet exist; it was rerun from the worker workspace, creating the empty directory before changing into it. No gate ran in that attempt. No other deviation from the bounded method was observed.

## Limits

This checks one baseline lock on one platform and toolchain, not either Series candidate or their composition. It does not establish supported-platform native/optional closure, full dependency provenance, licences/notices, shipped size, build, pack, browser, jsdom, product behavior or all R2 gates. It does not prove why npm omitted the original entries, that relocation is minimal, or that this candidate is acceptable in a Series graph. The active worker workspace's pre-existing modified root lock and all pre-existing stashes were preserved; the candidate was never staged or committed.
