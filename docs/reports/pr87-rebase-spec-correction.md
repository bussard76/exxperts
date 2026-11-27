# PR #87 migration specification correction evidence

2026-11-27. This is a Developer evidence report, **not** an Architect pass. R2 `origin/agents/t87-rebase-r2-specreview:docs/reviews/T87-REBASE-R2-architecture-spec.md` said `change-spec`; fresh independent Architect review remains required before rebase or implementation.

## Inputs and scope

`git ls-remote https://github.com/EXXETA/exxperts.git refs/heads/main refs/pull/87/head` returned `b898e851813b4da0211e6a049e9537160391091f refs/heads/main` and `5fcffe1036b2d6f867d6583b29822c4985d36fba refs/pull/87/head` on 2026-11-27. Target is 0.16.2, replacing the Controller input's 0.16.1 `96d34adc65763a829704cdbc591e413389e96d28`; no EXXETA write, issue lookup, code rebase or implementation occurred. The historical report was read by `git show`, without merging its product code.

Sascha's 2026-11-27 Option A decision through Front, “Ja, nach Prüfung übernehmen, alle Formate bleiben”, retains all source formats and only feature-specific dependencies. Sascha also authorized two private seams: fenced structured listings and bounded preview bytes, and a fail-closed association/working-directory resolver. Front clarified 2026-11-27 that restoring source `workspace-files`, `workspace-image`, `workspace-preview`, `workspace-open` is included in the 2026-11-25 rebase approval; no other route is authorized. No extra store or interface is authorized.

## R2 findings and target evidence

1. **Fence and box:** `git show b898e851:apps/web-server/src/persistent-room-workspace-tools.ts` shows private `waited`, `callFence`, `filesFor`, `inTheBox`, `executeWorkspaceLs` and `executeWorkspaceRead`. The latter gives tool results, not snapshot bytes. `room-box/box-files.ts` `ListedEntry` has only name/kind/deck and `BoxFiles.read` is bounded; `file-worker.mjs` list omits size/mtime. The authorized private seam must extend these box-mediated operations while retaining wait/hold/fallback; copying source's host `readdirSync`/`readFileSync` or restoring its removed resolver would bypass the target. `room-files.ts` `roomFolder` rechecks the path hash and grant; `roomFilesFence` on shared servers is one flat shelf. `room-box/folder-offer.ts` at 0.16.2 specifically allows chosen iCloud Drive and CloudStorage account folders, not CloudStorage itself; this corrects the old target assumption. The spec fixes root representation, bytes, metadata, revalidation and failure states without granting extra roots.
2. **Association:** source `workspace-open-worker.mjs` calls `ShellExecuteExW` on the file with `lpDirectory:null`; source `room-settings-routes.ts` uses `/usr/bin/open` and `/usr/bin/xdg-open`. Target `connector-start-check.ts` checks an already known command/cwd against room-writable places; it does not resolve file associations. Front decided on 2026-11-27, as an implementation of Sascha's fail-closed boundary, that the existing route may directly start the exact executable and working directory returned by the resolver; inability to bind the checked result means refusal and notice. This is Front's decision, not a Sascha quote. The specification requires platform-specific resolution, a repeat check, direct dispatch with no generic second association lookup, and no dispatch for unresolvable or unsafe forms. The Architect must review feasibility and conformance; no review has yet passed.
3. **Producer/consumer:** source `room-settings-routes.ts`, `persistent-room-workspace-files.ts`, `persistent-room-shelf-reading.ts`, `shelf-parse-worker.mjs`, `workspace-files-api.ts`, `App.tsx`, preview components and `pptx-frame-entry.ts` establish the route fields, exact workbook validators, limits, frame messages and renderers cited in the task. The source `App.tsx` selects `.doc/.xls/.xlsm/.drawio/.dio` for guidance and `.pptx` for the frame; no Excalidraw preview renderer exists at this pin, despite broader historical prose. The source open allowlist excludes `.excalidraw`. The spec retains the actual source behavior and calls for a real XLSX browser → route → worker → UI acceptance check, with slice ownership and dependency ordering.

## Dependency decisions and registry metadata

Compared root, web-server and web-ui package manifests and `package-lock.json` using `git show` at both pinned commits. Source has root/server `docx-preview` `0.4.1`, root/server `exceljs` `4.4.0`, root/server optional `koffi` `2.16.2`, UI `@aiden0z/pptx-renderer` `1.4.0`, and root/server `jsdom` `26.1.0`. Target root already has `jsdom` `^29.1.1` resolving 29.1.1 and optional `koffi` `^2.9.0` resolving 2.16.2. Keep target root declarations and resolutions; add source docx/excel root and server declarations, source server optional koffi and UI renderer, and server jsdom `^29.1.1`. No other direct dependency, override, or unrelated drift is authorized. Source jsdom's 26.1.0 and its closure are historical comparison, not an instruction to downgrade or install them.

Read-only registry commands, separately for each package: `npm view docx-preview@0.4.1 name version license engines dependencies optionalDependencies --json`, similarly for `exceljs@4.4.0`, `@aiden0z/pptx-renderer@1.4.0`, `koffi@2.16.2`, `jsdom@29.1.1`; plus `npm view jsdom@26.1.0 license engines --json` and `npm view buffers@0.1.1 license engines --json`. Registry returned Apache-2.0 for docx-preview and pptx-renderer, MIT for exceljs, koffi and jsdom; ExcelJS engine `>=8.3.0`, jsdom 29 `^20.19.0 || ^22.13.0 || >=24.0.0`, jsdom 26 `>=18`; the others supplied no engine. buffers supplies no license metadata, engine `>=0.2.0`; do not infer a license. docx-preview depends on jszip; ExcelJS on tmp, uuid, dayjs, jszip, saxes, archiver, fast-csv, unzipper, readable-stream; PPTX renderer on jszip, echarts, mtx-decompressor. Full resolved nested closure and supplied lockfile license/engine metadata are inventoried below, including shared and already-present packages; absence of an engine is `{}`. Inventory is evidence of the two existing locks, not a prediction of the newly reconciled lock: npm resolution must be reviewed after implementation without importing unrelated source drift.

The target's `engines.node` is `>=20.6.0` while jsdom 29 requires 20.19+ on Node 20, 22.13+ on Node 22, or >=24; target CI `setup-node` uses Node 20 for build/smoke and Node 22 for other jobs, without pinning a patch. This pre-existing support-floor mismatch means the declared minimum is not established as compatible; CI's major-only pin does not demonstrate 20.6 support. Record as engine compatibility debt and test supported CI/runtime versions in the later implementation; do not silently lower jsdom or change the target engine contract.

## Audit and debt

In isolated temporary directories, `git archive <pin> | tar -x -C /tmp/t87-audit-{target,source}` followed separately by `npm audit --package-lock-only --ignore-scripts --json --prefix /tmp/t87-audit-target` and the same for source; no install or lock changes. npm registry audit is time-sensitive. Target: 0 total. Source: 10 package findings, 2 low, 8 moderate, 0 high/critical. Feature closure: direct ExcelJS 4.4.0 → uuid 8.3.2, moderate [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), buffer bounds in v3/v5/v6. Security debt candidate; no override, ExcelJS change or added package without another Sascha decision.

Unrelated pinned-source drift: low fast-xml-parser [GHSA-474x-hrwr-fgx4](https://github.com/advisories/GHSA-474x-hrwr-fgx4), propagated to @aws-sdk/xml-builder; moderate @hono/node-server [GHSA-qv5m-9pm6-hqp3](https://github.com/advisories/GHSA-qv5m-9pm6-hqp3) and [GHSA-jpvv-r467-5p4w](https://github.com/advisories/GHSA-jpvv-r467-5p4w); basic-ftp [GHSA-5pm8-86m8-9m6r](https://github.com/advisories/GHSA-5pm8-86m8-9m6r) and [GHSA-r4jh-29pc-gfqr](https://github.com/advisories/GHSA-r4jh-29pc-gfqr), propagated through get-uri, pac-proxy-agent and direct proxy-agent; hono [GHSA-4m76-xfj5-7975](https://github.com/advisories/GHSA-4m76-xfj5-7975), [GHSA-h7mg-cq63-vhpq](https://github.com/advisories/GHSA-h7mg-cq63-vhpq), [GHSA-3gg2-335m-rxc6](https://github.com/advisories/GHSA-3gg2-335m-rxc6), [GHSA-46wx-v44x-9hh2](https://github.com/advisories/GHSA-46wx-v44x-9hh2), [GHSA-4h7h-rv7c-7m2v](https://github.com/advisories/GHSA-4h7h-rv7c-7m2v). These are source-lock observations, not additions authorized for the target. Count is vulnerable package nodes, not advisory IDs. Re-audit the reconciled lock in the appropriate later review; this audit does not establish its future result.

## Reproduction of the closure and comparison

The read-only traversal command was `node /tmp/t87-closure.cjs > /tmp/t87-closure.txt`. Its complete program follows; it reads only the two archived locks and does not invoke npm or mutate either lock:

```js
const fs=require('fs'),path=require('path');
for(const which of ['source','target']) {
 const pkgs=JSON.parse(fs.readFileSync(`/tmp/t87-audit-${which}/package-lock.json`)).packages;
 const roots=which==='source'?['docx-preview','exceljs','@aiden0z/pptx-renderer','koffi','jsdom']:['koffi','jsdom'];
 const seen=new Set(),missing=new Set();
 function resolve(from,n){let d=from;for(;;){let p=(d?d+'/':'')+'node_modules/'+n;if(pkgs[p])return p;let i=d.lastIndexOf('/node_modules/');if(i>=0)d=d.slice(0,i);else if(d.startsWith('node_modules/'))d='';else if(d){d=path.posix.dirname(d);if(d==='.')d='';}else return null;}}
 function visit(p){if(seen.has(p))return;seen.add(p);const x=pkgs[p];for(const n of Object.keys({...x.dependencies,...x.optionalDependencies})){let q=resolve(p,n);if(q)visit(q);else missing.add(p+' -> '+n)}}
 for(const n of roots){let p=resolve('',n);if(p)visit(p);else missing.add('ROOT '+n)}
 console.log('\n'+which+' '+seen.size+' nodes');for(const p of [...seen].sort()){const x=pkgs[p];console.log([p,x.version||'',x.license||'NOT SUPPLIED',JSON.stringify(x.engines||{})].join(' | '))}console.log('MISSING', [...missing].join('; '));
}
```

The comparison scans the source inventory and compares each resolved name/version to every package in the target lock; it records the target's distinct versions when the source version is absent. This is a set comparison, not a proposed lockfile. Source-only jsdom 26 dependencies must be removed from the migration candidate, as explained above.

## Complete lock closure evidence

The following inventory traverses dependencies and optionalDependencies in the source lock from `docx-preview`, `exceljs`, `@aiden0z/pptx-renderer`, `koffi`, `jsdom`, and the target lock from `koffi`, `jsdom`, resolving nested `node_modules` upward as Node/npm do. Source includes old jsdom 26 for comparison; target includes existing jsdom 29. The traversal resolves every listed edge, with no missing edges; peer dependencies already installed in the lock are represented when reached as dependency edges. Each row is lock location | resolved version | supplied lock license | supplied engine. `{}` means none supplied. The duplicated names at nested paths preserve distinct resolutions. Source 247 nodes; target 40. This is the full closure, including common packages rather than treating all entries as incremental additions.

```text

source 247 nodes
node_modules/@aiden0z/pptx-renderer | 1.4.0 | Apache-2.0 | {}
node_modules/@asamuzakjp/css-color | 3.2.0 | MIT | {}
node_modules/@asamuzakjp/css-color/node_modules/lru-cache | 10.4.3 | ISC | {}
node_modules/@csstools/color-helpers | 5.1.0 | MIT-0 | {"node":">=18"}
node_modules/@csstools/css-calc | 2.1.4 | MIT | {"node":">=18"}
node_modules/@csstools/css-color-parser | 3.1.0 | MIT | {"node":">=18"}
node_modules/@csstools/css-parser-algorithms | 3.0.5 | MIT | {"node":">=18"}
node_modules/@csstools/css-tokenizer | 3.0.4 | MIT | {"node":">=18"}
node_modules/@fast-csv/format | 4.3.5 | MIT | {}
node_modules/@fast-csv/format/node_modules/@types/node | 14.18.63 | MIT | {}
node_modules/@fast-csv/parse | 4.3.6 | MIT | {}
node_modules/@fast-csv/parse/node_modules/@types/node | 14.18.63 | MIT | {}
node_modules/agent-base | 7.1.4 | MIT | {"node":">= 14"}
node_modules/archiver | 5.3.2 | MIT | {"node":">= 10"}
node_modules/archiver-utils | 2.1.0 | MIT | {"node":">= 6"}
node_modules/archiver-utils/node_modules/balanced-match | 1.0.2 | MIT | {}
node_modules/archiver-utils/node_modules/brace-expansion | 1.1.21 | MIT | {}
node_modules/archiver-utils/node_modules/glob | 7.2.3 | ISC | {"node":"*"}
node_modules/archiver-utils/node_modules/minimatch | 3.1.5 | ISC | {"node":"*"}
node_modules/archiver-utils/node_modules/readable-stream | 2.3.8 | MIT | {}
node_modules/archiver-utils/node_modules/safe-buffer | 5.1.2 | MIT | {}
node_modules/archiver-utils/node_modules/string_decoder | 1.1.1 | MIT | {}
node_modules/array-buffer-byte-length | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/arraybuffer.prototype.slice | 1.0.4 | MIT | {"node":">= 0.4"}
node_modules/async | 3.2.6 | MIT | {}
node_modules/async-function | 1.0.0 | MIT | {"node":">= 0.4"}
node_modules/available-typed-arrays | 1.0.7 | MIT | {"node":">= 0.4"}
node_modules/base64-js | 1.5.1 | MIT | {}
node_modules/big-integer | 1.6.52 | Unlicense | {"node":">=0.6"}
node_modules/binary | 0.3.0 | MIT | {"node":"*"}
node_modules/bl | 4.1.0 | MIT | {}
node_modules/bluebird | 3.4.7 | MIT | {}
node_modules/buffer | 5.7.1 | MIT | {}
node_modules/buffer-crc32 | 0.2.13 | MIT | {"node":"*"}
node_modules/buffer-indexof-polyfill | 1.0.2 | MIT | {"node":">=0.10"}
node_modules/buffers | 0.1.1 | NOT SUPPLIED | {"node":">=0.2.0"}
node_modules/call-bind | 1.0.9 | MIT | {"node":">= 0.4"}
node_modules/call-bind-apply-helpers | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/call-bound | 1.0.4 | MIT | {"node":">= 0.4"}
node_modules/chainsaw | 0.1.0 | MIT/X11 | {"node":"*"}
node_modules/compress-commons | 4.1.2 | MIT | {"node":">= 10"}
node_modules/concat-map | 0.0.1 | MIT | {}
node_modules/core-util-is | 1.0.3 | MIT | {}
node_modules/crc-32 | 1.2.2 | Apache-2.0 | {"node":">=0.8"}
node_modules/crc32-stream | 4.0.3 | MIT | {"node":">= 10"}
node_modules/cssstyle | 4.6.0 | MIT | {"node":">=18"}
node_modules/data-urls | 5.0.0 | MIT | {"node":">=18"}
node_modules/data-view-buffer | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/data-view-byte-length | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/data-view-byte-offset | 1.0.1 | MIT | {"node":">= 0.4"}
node_modules/dayjs | 1.11.21 | MIT | {}
node_modules/debug | 4.4.3 | MIT | {"node":">=6.0"}
node_modules/decimal.js | 10.6.0 | MIT | {}
node_modules/define-data-property | 1.1.4 | MIT | {"node":">= 0.4"}
node_modules/define-properties | 1.2.1 | MIT | {"node":">= 0.4"}
node_modules/docx-preview | 0.4.1 | Apache-2.0 | {}
node_modules/dunder-proto | 1.0.1 | MIT | {"node":">= 0.4"}
node_modules/duplexer2 | 0.1.4 | BSD-3-Clause | {}
node_modules/duplexer2/node_modules/readable-stream | 2.3.8 | MIT | {}
node_modules/duplexer2/node_modules/safe-buffer | 5.1.2 | MIT | {}
node_modules/duplexer2/node_modules/string_decoder | 1.1.1 | MIT | {}
node_modules/echarts | 6.1.0 | Apache-2.0 | {}
node_modules/echarts/node_modules/tslib | 2.3.0 | 0BSD | {}
node_modules/end-of-stream | 1.4.5 | MIT | {}
node_modules/es-abstract | 1.24.2 | MIT | {"node":">= 0.4"}
node_modules/es-abstract-get | 1.0.0 | MIT | {"node":">= 0.4"}
node_modules/es-define-property | 1.0.1 | MIT | {"node":">= 0.4"}
node_modules/es-errors | 1.3.0 | MIT | {"node":">= 0.4"}
node_modules/es-object-atoms | 1.1.2 | MIT | {"node":">= 0.4"}
node_modules/es-set-tostringtag | 2.1.0 | MIT | {"node":">= 0.4"}
node_modules/es-to-primitive | 1.3.4 | MIT | {"node":">= 0.4"}
node_modules/exceljs | 4.4.0 | MIT | {"node":">=8.3.0"}
node_modules/exceljs/node_modules/saxes | 5.0.1 | ISC | {"node":">=10"}
node_modules/exceljs/node_modules/uuid | 8.3.2 | MIT | {}
node_modules/fast-csv | 4.3.6 | MIT | {"node":">=10.0.0"}
node_modules/for-each | 0.3.5 | MIT | {"node":">= 0.4"}
node_modules/fs-constants | 1.0.0 | MIT | {}
node_modules/fs.realpath | 1.0.0 | ISC | {}
node_modules/fstream | 1.0.12 | ISC | {"node":">=0.6"}
node_modules/function-bind | 1.1.2 | MIT | {}
node_modules/function.prototype.name | 1.2.0 | MIT | {"node":">= 0.4"}
node_modules/functions-have-names | 1.2.3 | MIT | {}
node_modules/generator-function | 2.0.1 | MIT | {"node":">= 0.4"}
node_modules/get-intrinsic | 1.3.0 | MIT | {"node":">= 0.4"}
node_modules/get-proto | 1.0.1 | MIT | {"node":">= 0.4"}
node_modules/get-symbol-description | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/globalthis | 1.0.4 | MIT | {"node":">= 0.4"}
node_modules/gopd | 1.2.0 | MIT | {"node":">= 0.4"}
node_modules/graceful-fs | 4.2.11 | ISC | {}
node_modules/has-bigints | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/has-property-descriptors | 1.0.2 | MIT | {}
node_modules/has-proto | 1.2.0 | MIT | {"node":">= 0.4"}
node_modules/has-symbols | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/has-tostringtag | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/hasown | 2.0.4 | MIT | {"node":">= 0.4"}
node_modules/html-encoding-sniffer | 4.0.0 | MIT | {"node":">=18"}
node_modules/http-proxy-agent | 7.0.2 | MIT | {"node":">= 14"}
node_modules/https-proxy-agent | 7.0.6 | MIT | {"node":">= 14"}
node_modules/ieee754 | 1.2.1 | BSD-3-Clause | {}
node_modules/immediate | 3.0.6 | MIT | {}
node_modules/inflight | 1.0.6 | ISC | {}
node_modules/inherits | 2.0.4 | ISC | {}
node_modules/internal-slot | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/is-array-buffer | 3.0.5 | MIT | {"node":">= 0.4"}
node_modules/is-async-function | 2.1.1 | MIT | {"node":">= 0.4"}
node_modules/is-bigint | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/is-boolean-object | 1.2.2 | MIT | {"node":">= 0.4"}
node_modules/is-callable | 1.2.7 | MIT | {"node":">= 0.4"}
node_modules/is-data-view | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/is-date-object | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/is-document.all | 1.0.0 | MIT | {"node":">= 0.4"}
node_modules/is-finalizationregistry | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/is-generator-function | 1.1.2 | MIT | {"node":">= 0.4"}
node_modules/is-map | 2.0.3 | MIT | {"node":">= 0.4"}
node_modules/is-negative-zero | 2.0.3 | MIT | {"node":">= 0.4"}
node_modules/is-number-object | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/is-potential-custom-element-name | 1.0.1 | MIT | {}
node_modules/is-regex | 1.2.1 | MIT | {"node":">= 0.4"}
node_modules/is-set | 2.0.3 | MIT | {"node":">= 0.4"}
node_modules/is-shared-array-buffer | 1.0.4 | MIT | {"node":">= 0.4"}
node_modules/is-string | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/is-symbol | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/is-typed-array | 1.1.15 | MIT | {"node":">= 0.4"}
node_modules/is-weakmap | 2.0.2 | MIT | {"node":">= 0.4"}
node_modules/is-weakref | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/is-weakset | 2.0.4 | MIT | {"node":">= 0.4"}
node_modules/isarray | 1.0.0 | MIT | {}
node_modules/jsdom | 26.1.0 | MIT | {"node":">=18"}
node_modules/jsdom/node_modules/entities | 6.0.1 | BSD-2-Clause | {"node":">=0.12"}
node_modules/jsdom/node_modules/parse5 | 7.3.0 | MIT | {}
node_modules/jszip | 3.10.1 | (MIT OR GPL-3.0-or-later) | {}
node_modules/jszip/node_modules/readable-stream | 2.3.8 | MIT | {}
node_modules/jszip/node_modules/safe-buffer | 5.1.2 | MIT | {}
node_modules/jszip/node_modules/string_decoder | 1.1.1 | MIT | {}
node_modules/koffi | 2.16.2 | MIT | {}
node_modules/lazystream | 1.0.1 | MIT | {"node":">= 0.6.3"}
node_modules/lazystream/node_modules/readable-stream | 2.3.8 | MIT | {}
node_modules/lazystream/node_modules/safe-buffer | 5.1.2 | MIT | {}
node_modules/lazystream/node_modules/string_decoder | 1.1.1 | MIT | {}
node_modules/lie | 3.3.0 | MIT | {}
node_modules/listenercount | 1.0.1 | ISC | {}
node_modules/lodash.defaults | 4.2.0 | MIT | {}
node_modules/lodash.difference | 4.5.0 | MIT | {}
node_modules/lodash.escaperegexp | 4.1.2 | MIT | {}
node_modules/lodash.flatten | 4.4.0 | MIT | {}
node_modules/lodash.groupby | 4.6.0 | MIT | {}
node_modules/lodash.isboolean | 3.0.3 | MIT | {}
node_modules/lodash.isequal | 4.5.0 | MIT | {}
node_modules/lodash.isfunction | 3.0.9 | MIT | {}
node_modules/lodash.isnil | 4.0.0 | MIT | {}
node_modules/lodash.isplainobject | 4.0.6 | MIT | {}
node_modules/lodash.isundefined | 3.0.1 | MIT | {}
node_modules/lodash.union | 4.6.0 | MIT | {}
node_modules/lodash.uniq | 4.5.0 | MIT | {}
node_modules/math-intrinsics | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/minimist | 1.2.8 | MIT | {}
node_modules/mkdirp | 0.5.6 | MIT | {}
node_modules/ms | 2.1.3 | MIT | {}
node_modules/mtx-decompressor | 1.8.0 | MPL-2.0 | {}
node_modules/normalize-path | 3.0.0 | MIT | {"node":">=0.10.0"}
node_modules/nwsapi | 2.2.28 | MIT | {}
node_modules/object-inspect | 1.13.4 | MIT | {"node":">= 0.4"}
node_modules/object-keys | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/object.assign | 4.1.7 | MIT | {"node":">= 0.4"}
node_modules/once | 1.4.0 | ISC | {}
node_modules/own-keys | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/pako | 1.0.11 | (MIT AND Zlib) | {}
node_modules/path-is-absolute | 1.0.1 | MIT | {"node":">=0.10.0"}
node_modules/possible-typed-array-names | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/process-nextick-args | 2.0.1 | MIT | {}
node_modules/punycode | 2.3.1 | MIT | {"node":">=6"}
node_modules/readable-stream | 3.6.2 | MIT | {"node":">= 6"}
node_modules/readdir-glob | 1.1.3 | Apache-2.0 | {}
node_modules/readdir-glob/node_modules/balanced-match | 1.0.2 | MIT | {}
node_modules/readdir-glob/node_modules/brace-expansion | 2.1.7 | MIT | {}
node_modules/readdir-glob/node_modules/minimatch | 5.1.9 | ISC | {"node":">=10"}
node_modules/reflect.getprototypeof | 1.0.10 | MIT | {"node":">= 0.4"}
node_modules/regexp.prototype.flags | 1.5.4 | MIT | {"node":">= 0.4"}
node_modules/rimraf | 2.7.1 | ISC | {}
node_modules/rimraf/node_modules/balanced-match | 1.0.2 | MIT | {}
node_modules/rimraf/node_modules/brace-expansion | 1.1.21 | MIT | {}
node_modules/rimraf/node_modules/glob | 7.2.3 | ISC | {"node":"*"}
node_modules/rimraf/node_modules/minimatch | 3.1.5 | ISC | {"node":"*"}
node_modules/rrweb-cssom | 0.8.0 | MIT | {}
node_modules/safe-array-concat | 1.1.4 | MIT | {"node":">=0.4"}
node_modules/safe-array-concat/node_modules/isarray | 2.0.5 | MIT | {}
node_modules/safe-buffer | 5.2.1 | MIT | {}
node_modules/safe-push-apply | 1.0.0 | MIT | {"node":">= 0.4"}
node_modules/safe-push-apply/node_modules/isarray | 2.0.5 | MIT | {}
node_modules/safe-regex-test | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/safer-buffer | 2.1.2 | MIT | {}
node_modules/saxes | 6.0.0 | ISC | {"node":">=v12.22.7"}
node_modules/set-function-length | 1.2.2 | MIT | {"node":">= 0.4"}
node_modules/set-function-name | 2.0.2 | MIT | {"node":">= 0.4"}
node_modules/set-proto | 1.0.0 | MIT | {"node":">= 0.4"}
node_modules/setimmediate | 1.0.5 | MIT | {}
node_modules/side-channel | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/side-channel-list | 1.0.1 | MIT | {"node":">= 0.4"}
node_modules/side-channel-map | 1.0.1 | MIT | {"node":">= 0.4"}
node_modules/side-channel-weakmap | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/stop-iteration-iterator | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/string.prototype.trim | 1.2.11 | MIT | {"node":">= 0.4"}
node_modules/string.prototype.trimend | 1.0.10 | MIT | {"node":">= 0.4"}
node_modules/string.prototype.trimstart | 1.0.8 | MIT | {"node":">= 0.4"}
node_modules/string_decoder | 1.3.0 | MIT | {}
node_modules/symbol-tree | 3.2.4 | MIT | {}
node_modules/tar-stream | 2.2.0 | MIT | {"node":">=6"}
node_modules/tldts | 6.1.86 | MIT | {}
node_modules/tldts-core | 6.1.86 | MIT | {}
node_modules/tmp | 0.2.7 | MIT | {"node":">=14.14"}
node_modules/tough-cookie | 5.1.2 | BSD-3-Clause | {"node":">=16"}
node_modules/tr46 | 5.1.1 | MIT | {"node":">=18"}
node_modules/traverse | 0.3.10 | MIT | {"node":">= 0.4"}
node_modules/typed-array-buffer | 1.0.3 | MIT | {"node":">= 0.4"}
node_modules/typed-array-byte-length | 1.0.3 | MIT | {"node":">= 0.4"}
node_modules/typed-array-byte-offset | 1.0.5 | MIT | {"node":">= 0.4"}
node_modules/typed-array-length | 1.0.8 | MIT | {"node":">= 0.4"}
node_modules/typedarray.prototype.slice | 1.0.6 | MIT | {"node":">= 0.4"}
node_modules/unbox-primitive | 1.1.0 | MIT | {"node":">= 0.4"}
node_modules/unzipper | 0.10.14 | MIT | {}
node_modules/unzipper/node_modules/readable-stream | 2.3.8 | MIT | {}
node_modules/unzipper/node_modules/safe-buffer | 5.1.2 | MIT | {}
node_modules/unzipper/node_modules/string_decoder | 1.1.1 | MIT | {}
node_modules/util-deprecate | 1.0.2 | MIT | {}
node_modules/w3c-xmlserializer | 5.0.0 | MIT | {"node":">=18"}
node_modules/webidl-conversions | 7.0.0 | BSD-2-Clause | {"node":">=12"}
node_modules/whatwg-encoding | 3.1.1 | MIT | {"node":">=18"}
node_modules/whatwg-encoding/node_modules/iconv-lite | 0.6.3 | MIT | {"node":">=0.10.0"}
node_modules/whatwg-mimetype | 4.0.0 | MIT | {"node":">=18"}
node_modules/whatwg-url | 14.2.0 | MIT | {"node":">=18"}
node_modules/which-boxed-primitive | 1.1.1 | MIT | {"node":">= 0.4"}
node_modules/which-builtin-type | 1.2.1 | MIT | {"node":">= 0.4"}
node_modules/which-builtin-type/node_modules/isarray | 2.0.5 | MIT | {}
node_modules/which-collection | 1.0.2 | MIT | {"node":">= 0.4"}
node_modules/which-typed-array | 1.1.24 | MIT | {"node":">= 0.4"}
node_modules/wrappy | 1.0.2 | ISC | {}
node_modules/ws | 8.21.0 | MIT | {"node":">=10.0.0"}
node_modules/xml-name-validator | 5.0.0 | Apache-2.0 | {"node":">=18"}
node_modules/xmlchars | 2.2.0 | MIT | {}
node_modules/zip-stream | 4.1.1 | MIT | {"node":">= 10"}
node_modules/zip-stream/node_modules/archiver-utils | 3.0.4 | MIT | {"node":">= 10"}
node_modules/zip-stream/node_modules/balanced-match | 1.0.2 | MIT | {}
node_modules/zip-stream/node_modules/brace-expansion | 1.1.21 | MIT | {}
node_modules/zip-stream/node_modules/glob | 7.2.3 | ISC | {"node":"*"}
node_modules/zip-stream/node_modules/minimatch | 3.1.5 | ISC | {"node":"*"}
node_modules/zrender | 6.1.0 | BSD-3-Clause | {}
node_modules/zrender/node_modules/tslib | 2.3.0 | 0BSD | {}
MISSING (none)

target 40 nodes
node_modules/@asamuzakjp/css-color | 5.1.11 | MIT | {"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}
node_modules/@asamuzakjp/dom-selector | 7.1.1 | MIT | {"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}
node_modules/@asamuzakjp/generational-cache | 1.0.1 | MIT | {"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}
node_modules/@asamuzakjp/nwsapi | 2.3.9 | MIT | {}
node_modules/@bramus/specificity | 2.4.2 | MIT | {}
node_modules/@csstools/color-helpers | 6.1.0 | MIT-0 | {"node":">=20.19.0"}
node_modules/@csstools/css-calc | 3.2.1 | MIT | {"node":">=20.19.0"}
node_modules/@csstools/css-color-parser | 4.1.9 | MIT | {"node":">=20.19.0"}
node_modules/@csstools/css-parser-algorithms | 4.0.0 | MIT | {"node":">=20.19.0"}
node_modules/@csstools/css-syntax-patches-for-csstree | 1.1.6 | MIT-0 | {}
node_modules/@csstools/css-tokenizer | 4.0.0 | MIT | {"node":">=20.19.0"}
node_modules/@exodus/bytes | 1.15.1 | MIT | {"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}
node_modules/bidi-js | 1.0.3 | MIT | {}
node_modules/css-tree | 3.2.1 | MIT | {"node":"^10 || ^12.20.0 || ^14.13.0 || >=15.0.0"}
node_modules/data-urls | 7.0.0 | MIT | {"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}
node_modules/decimal.js | 10.6.0 | MIT | {}
node_modules/html-encoding-sniffer | 6.0.0 | MIT | {"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}
node_modules/is-potential-custom-element-name | 1.0.1 | MIT | {}
node_modules/jsdom | 29.1.1 | MIT | {"node":"^20.19.0 || ^22.13.0 || >=24.0.0"}
node_modules/jsdom/node_modules/entities | 8.0.0 | BSD-2-Clause | {"node":">=20.19.0"}
node_modules/jsdom/node_modules/parse5 | 8.0.1 | MIT | {}
node_modules/koffi | 2.16.2 | MIT | {}
node_modules/lru-cache | 11.3.6 | BlueOak-1.0.0 | {"node":"20 || >=22"}
node_modules/mdn-data | 2.27.1 | CC0-1.0 | {}
node_modules/punycode | 2.3.1 | MIT | {"node":">=6"}
node_modules/require-from-string | 2.0.2 | MIT | {"node":">=0.10.0"}
node_modules/saxes | 6.0.0 | ISC | {"node":">=v12.22.7"}
node_modules/source-map-js | 1.2.2 | BSD-3-Clause | {"node":">=0.10.0"}
node_modules/symbol-tree | 3.2.4 | MIT | {}
node_modules/tldts | 7.4.5 | MIT | {}
node_modules/tldts-core | 7.4.5 | MIT | {}
node_modules/tough-cookie | 6.0.1 | BSD-3-Clause | {"node":">=16"}
node_modules/tr46 | 6.0.0 | MIT | {"node":">=20"}
node_modules/undici | 7.30.1 | MIT | {"node":">=20.18.1"}
node_modules/w3c-xmlserializer | 5.0.0 | MIT | {"node":">=18"}
node_modules/webidl-conversions | 8.0.1 | BSD-2-Clause | {"node":">=20"}
node_modules/whatwg-mimetype | 5.0.0 | MIT | {"node":">=20"}
node_modules/whatwg-url | 16.0.1 | MIT | {"node":"^20.19.0 || ^22.12.0 || >=24.0.0"}
node_modules/xml-name-validator | 5.0.0 | Apache-2.0 | {"node":">=18"}
node_modules/xmlchars | 2.2.0 | MIT | {}
MISSING (none)
```

No tests, builds, installs, typechecks, smokes or gates were run for this documentation-only correction. The existing worktree's package-lock modification predated the task and is not part of this change.

### Source closure version delta against the entire target lock

The following entries are source-closure resolutions for which the target lock has no identical package/version anywhere. “Absent” means no package of that name in the target lock; otherwise the target versions are shown. Rows belonging only to source jsdom 26 are historical drift and must not be imported. Identical-version entries in the full inventory above are shared or already present; lock placement can still differ. This comparison does not treat unrelated target dependencies as removals.

```text
node_modules/@aiden0z/pptx-renderer@1.4.0: absent
node_modules/@asamuzakjp/css-color@3.2.0: target 5.1.11
node_modules/@asamuzakjp/css-color/node_modules/lru-cache@10.4.3: target 11.3.6, 5.1.1, 7.18.3
node_modules/@csstools/color-helpers@5.1.0: target 6.1.0
node_modules/@csstools/css-calc@2.1.4: target 3.2.1
node_modules/@csstools/css-color-parser@3.1.0: target 4.1.9
node_modules/@csstools/css-parser-algorithms@3.0.5: target 4.0.0
node_modules/@csstools/css-tokenizer@3.0.4: target 4.0.0
node_modules/@fast-csv/format@4.3.5: absent
node_modules/@fast-csv/format/node_modules/@types/node@14.18.63: target 20.19.40
node_modules/@fast-csv/parse@4.3.6: absent
node_modules/@fast-csv/parse/node_modules/@types/node@14.18.63: target 20.19.40
node_modules/archiver@5.3.2: absent
node_modules/archiver-utils@2.1.0: absent
node_modules/archiver-utils/node_modules/balanced-match@1.0.2: target 4.0.4
node_modules/archiver-utils/node_modules/brace-expansion@1.1.21: target 5.0.12
node_modules/archiver-utils/node_modules/glob@7.2.3: target 14.0.3
node_modules/archiver-utils/node_modules/minimatch@3.1.5: target 11.0.4
node_modules/array-buffer-byte-length@1.0.2: absent
node_modules/arraybuffer.prototype.slice@1.0.4: absent
node_modules/async@3.2.6: absent
node_modules/async-function@1.0.0: absent
node_modules/available-typed-arrays@1.0.7: absent
node_modules/big-integer@1.6.52: absent
node_modules/binary@0.3.0: absent
node_modules/bl@4.1.0: absent
node_modules/bluebird@3.4.7: absent
node_modules/buffer@5.7.1: absent
node_modules/buffer-indexof-polyfill@1.0.2: absent
node_modules/buffers@0.1.1: absent
node_modules/call-bind@1.0.9: absent
node_modules/chainsaw@0.1.0: absent
node_modules/compress-commons@4.1.2: absent
node_modules/concat-map@0.0.1: absent
node_modules/crc-32@1.2.2: absent
node_modules/crc32-stream@4.0.3: absent
node_modules/cssstyle@4.6.0: absent
node_modules/data-urls@5.0.0: target 7.0.0
node_modules/data-view-buffer@1.0.2: absent
node_modules/data-view-byte-length@1.0.2: absent
node_modules/data-view-byte-offset@1.0.1: absent
node_modules/define-data-property@1.1.4: absent
node_modules/define-properties@1.2.1: absent
node_modules/docx-preview@0.4.1: absent
node_modules/duplexer2@0.1.4: absent
node_modules/echarts@6.1.0: absent
node_modules/echarts/node_modules/tslib@2.3.0: target 2.8.1
node_modules/es-abstract@1.24.2: absent
node_modules/es-abstract-get@1.0.0: absent
node_modules/es-set-tostringtag@2.1.0: absent
node_modules/es-to-primitive@1.3.4: absent
node_modules/exceljs@4.4.0: absent
node_modules/exceljs/node_modules/saxes@5.0.1: target 6.0.0
node_modules/exceljs/node_modules/uuid@8.3.2: target 14.0.0
node_modules/fast-csv@4.3.6: absent
node_modules/for-each@0.3.5: absent
node_modules/fs-constants@1.0.0: absent
node_modules/fs.realpath@1.0.0: absent
node_modules/fstream@1.0.12: absent
node_modules/function.prototype.name@1.2.0: absent
node_modules/functions-have-names@1.2.3: absent
node_modules/generator-function@2.0.1: absent
node_modules/get-symbol-description@1.1.0: absent
node_modules/globalthis@1.0.4: absent
node_modules/has-bigints@1.1.0: absent
node_modules/has-property-descriptors@1.0.2: absent
node_modules/has-proto@1.2.0: absent
node_modules/has-tostringtag@1.0.2: absent
node_modules/html-encoding-sniffer@4.0.0: target 6.0.0
node_modules/inflight@1.0.6: absent
node_modules/internal-slot@1.1.0: absent
node_modules/is-array-buffer@3.0.5: absent
node_modules/is-async-function@2.1.1: absent
node_modules/is-bigint@1.1.0: absent
node_modules/is-boolean-object@1.2.2: absent
node_modules/is-callable@1.2.7: absent
node_modules/is-data-view@1.0.2: absent
node_modules/is-date-object@1.1.0: absent
node_modules/is-document.all@1.0.0: absent
node_modules/is-finalizationregistry@1.1.1: absent
node_modules/is-generator-function@1.1.2: absent
node_modules/is-map@2.0.3: absent
node_modules/is-negative-zero@2.0.3: absent
node_modules/is-number-object@1.1.1: absent
node_modules/is-regex@1.2.1: absent
node_modules/is-set@2.0.3: absent
node_modules/is-shared-array-buffer@1.0.4: absent
node_modules/is-string@1.1.1: absent
node_modules/is-symbol@1.1.1: absent
node_modules/is-typed-array@1.1.15: absent
node_modules/is-weakmap@2.0.2: absent
node_modules/is-weakref@1.1.1: absent
node_modules/is-weakset@2.0.4: absent
node_modules/jsdom@26.1.0: target 29.1.1
node_modules/jsdom/node_modules/entities@6.0.1: target 4.5.0, 8.0.0
node_modules/jsdom/node_modules/parse5@7.3.0: target 5.1.1, 6.0.1, 8.0.1
node_modules/lazystream@1.0.1: absent
node_modules/listenercount@1.0.1: absent
node_modules/lodash.defaults@4.2.0: absent
node_modules/lodash.difference@4.5.0: absent
node_modules/lodash.escaperegexp@4.1.2: absent
node_modules/lodash.flatten@4.4.0: absent
node_modules/lodash.groupby@4.6.0: absent
node_modules/lodash.isboolean@3.0.3: absent
node_modules/lodash.isequal@4.5.0: absent
node_modules/lodash.isfunction@3.0.9: absent
node_modules/lodash.isnil@4.0.0: absent
node_modules/lodash.isplainobject@4.0.6: absent
node_modules/lodash.isundefined@3.0.1: absent
node_modules/lodash.union@4.6.0: absent
node_modules/lodash.uniq@4.5.0: absent
node_modules/minimist@1.2.8: absent
node_modules/mkdirp@0.5.6: absent
node_modules/mtx-decompressor@1.8.0: absent
node_modules/normalize-path@3.0.0: absent
node_modules/nwsapi@2.2.28: absent
node_modules/object-keys@1.1.1: absent
node_modules/object.assign@4.1.7: absent
node_modules/own-keys@1.0.2: absent
node_modules/path-is-absolute@1.0.1: absent
node_modules/possible-typed-array-names@1.1.0: absent
node_modules/readdir-glob@1.1.3: absent
node_modules/readdir-glob/node_modules/balanced-match@1.0.2: target 4.0.4
node_modules/readdir-glob/node_modules/brace-expansion@2.1.7: target 5.0.12
node_modules/readdir-glob/node_modules/minimatch@5.1.9: target 11.0.4
node_modules/reflect.getprototypeof@1.0.10: absent
node_modules/regexp.prototype.flags@1.5.4: absent
node_modules/rimraf@2.7.1: absent
node_modules/rimraf/node_modules/balanced-match@1.0.2: target 4.0.4
node_modules/rimraf/node_modules/brace-expansion@1.1.21: target 5.0.12
node_modules/rimraf/node_modules/glob@7.2.3: target 14.0.3
node_modules/rimraf/node_modules/minimatch@3.1.5: target 11.0.4
node_modules/rrweb-cssom@0.8.0: absent
node_modules/safe-array-concat@1.1.4: absent
node_modules/safe-array-concat/node_modules/isarray@2.0.5: target 1.0.0
node_modules/safe-push-apply@1.0.0: absent
node_modules/safe-push-apply/node_modules/isarray@2.0.5: target 1.0.0
node_modules/safe-regex-test@1.1.0: absent
node_modules/set-function-length@1.2.2: absent
node_modules/set-function-name@2.0.2: absent
node_modules/set-proto@1.0.0: absent
node_modules/stop-iteration-iterator@1.1.0: absent
node_modules/string.prototype.trim@1.2.11: absent
node_modules/string.prototype.trimend@1.0.10: absent
node_modules/string.prototype.trimstart@1.0.8: absent
node_modules/tar-stream@2.2.0: absent
node_modules/tldts@6.1.86: target 7.4.5
node_modules/tldts-core@6.1.86: target 7.4.5
node_modules/tmp@0.2.7: absent
node_modules/tough-cookie@5.1.2: target 6.0.1
node_modules/tr46@5.1.1: target 6.0.0
node_modules/traverse@0.3.10: absent
node_modules/typed-array-buffer@1.0.3: absent
node_modules/typed-array-byte-length@1.0.3: absent
node_modules/typed-array-byte-offset@1.0.5: absent
node_modules/typed-array-length@1.0.8: absent
node_modules/typedarray.prototype.slice@1.0.6: absent
node_modules/unbox-primitive@1.1.0: absent
node_modules/unzipper@0.10.14: absent
node_modules/webidl-conversions@7.0.0: target 8.0.1
node_modules/whatwg-encoding@3.1.1: absent
node_modules/whatwg-mimetype@4.0.0: target 5.0.0
node_modules/whatwg-url@14.2.0: target 16.0.1
node_modules/which-boxed-primitive@1.1.1: absent
node_modules/which-builtin-type@1.2.1: absent
node_modules/which-builtin-type/node_modules/isarray@2.0.5: target 1.0.0
node_modules/which-collection@1.0.2: absent
node_modules/which-typed-array@1.1.24: absent
node_modules/zip-stream@4.1.1: absent
node_modules/zip-stream/node_modules/archiver-utils@3.0.4: absent
node_modules/zip-stream/node_modules/balanced-match@1.0.2: target 4.0.4
node_modules/zip-stream/node_modules/brace-expansion@1.1.21: target 5.0.12
node_modules/zip-stream/node_modules/glob@7.2.3: target 14.0.3
node_modules/zip-stream/node_modules/minimatch@3.1.5: target 11.0.4
node_modules/zrender@6.1.0: absent
node_modules/zrender/node_modules/tslib@2.3.0: target 2.8.1
```
