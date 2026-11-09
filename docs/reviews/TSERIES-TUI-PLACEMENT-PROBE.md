# Series TUI placement probe

Result: **stopped before generation**. The pinned base has missing source metadata beyond the two approved pairs; the task requires stopping if metadata is missing. The TUI shield hypothesis remains untested, and this report does not propose an exception or establish that npm would install the shield.

## Evidence

The input was commit `461e6485bf932f5cba85ac3dde8e0104e47d5dec`, root lock SHA-256 `c4b4553fd6a054ae042c239bffe3980b25044becc0c380ffa8bc6f79262ae488`. The R3 review (`7dbec524`), R2 review (`3a1cef0`) and prior probe (`1f50fc1`) were read. The lock's root `@types/node` 20.19.40 and `undici-types` 6.21.0 entries have `resolved` and `integrity`; the three copies each of Node types 24.12.2 and undici types 7.16.0 lack both, as anticipated by the approved two URL/SRI pairs. The proposed runtime ancestor and TUI-specific lock paths are absent. This is a lock inspection, not a filesystem ownership or installation check.

Counting all non-link lock entries whose path contains `node_modules/` and lacks either `resolved` or `integrity` gives **160**, all missing both fields. Six are the three pairs covered by the approved metadata; **154 other entries** lack both. For example, `apps/web-ui/node_modules/@babel/helper-plugin-utils` version 7.28.6, `apps/web-ui/node_modules/@rolldown/pluginutils` version 1.0.0-beta.27, and `apps/web-ui/node_modules/@types/babel__core` version 7.20.5 each lack both fields. This independently confirms the count reported as unresolved in R3; it does not establish which entries apply on a given platform or their sources. Reproduce the inventory from the pinned object without modifying a checkout:

```sh
git show 461e6485bf932f5cba85ac3dde8e0104e47d5dec:package-lock.json | node -e 'let s=""; process.stdin.on("data", x => s += x).on("end", () => { const p = JSON.parse(s).packages; const six = new Set(["agent", "ai", "coding-agent"].flatMap(n => [`runtime/packages/${n}/node_modules/@types/node`, `runtime/packages/${n}/node_modules/undici-types`])); const missing = Object.entries(p).filter(([k, v]) => k.includes("node_modules/") && !v.link && (!v.resolved || !v.integrity)); console.log("total", missing.length, "approved paths", missing.filter(([k]) => six.has(k)).length, "other", missing.filter(([k]) => !six.has(k)).length); for (const [k, v] of missing.filter(([k]) => !six.has(k))) console.log(k, v.version, Boolean(v.resolved), Boolean(v.integrity)); });'
```

The inspection host reports Node `v22.23.4`, npm `10.9.9`, Linux x86_64 and glibc `2.39`. No lock generator, install, `npm ls`, compiler resolution, build, declaration comparison, gate, second checkout, or test was run after the stop condition. Consequently there are no candidate diffs, hashes, installed resolutions or declaration results to report. No supported-runtime or platform compatibility is inferred. Independent review, Controller decision, candidate and platform closure proof remain outstanding if the missing metadata issue is resolved under the applicable policy.

The worker's pre-existing modified `package-lock.json` and existing stashes were left untouched. No real data, active Series worktree or source repository was changed.
