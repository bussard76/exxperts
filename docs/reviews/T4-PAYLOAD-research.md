# T4 package payload research

Status: research in progress; no product implementation or package acceptance claim.

## Architecture impact

Level 1: documentation and disposable local measurements only. Existing package identities, dependencies, public interfaces, routes, stores, data flows and the 2,500-file ceiling remain unchanged. Any implementation that exceeds the existing package seam needs Controller approval.

## Scope and checklist

The read-only research override supersedes the generic implementation dispatch and its report destination. This findings file is the only tracked change; the existing issue-4 developer report is not edited.

- [x] Read issue #4, current `origin/agents/t4`, earlier package reviews and approved R5 closure. Evidence: frozen sources and obligations below.
- [x] Inventory actual bundling/pruning tools and their coverage limits. Evidence: tool inventory below.
- [x] Independently measure installed package closure and the reported approximately 7,546-file interim payload, using only a disposable local tree. Evidence: counts below; whole release artifact not reproduced.
- [x] Identify exact runtime, dynamic-file, native and notice obligations, including ExcelJS's real use of es-abstract. Evidence: runtime probe and closure ledger below; release proofs remain explicitly open.
- [x] Compare bounded maintainable options against the unchanged 2,500-file ceiling, without removing formats or platforms. Evidence: concrete proposed design and accounting below; no implementation authorization inferred.
- [ ] State unresolved independent producer, installed-tarball and post-prune proofs; self-review every task constraint; commit and push the research branch.

Every original issue acceptance item remains owned by the product implementation and independent acceptance stages: R1 tabs for PDF/image/Word/Excel; R2 reactivation and active tree; R3 close/neighbour/last pane; R4 all-sheet Excel with cached results and basic styles; R5 Word text/tables/images and basic look; R6 read-only controls; A1 full build/smokes; A2 invented appearance fixtures; A3 cached formula results; A4 Sascha's local real-file acceptance; and the signed-off local external-open action. This research must preserve these requirements and supplies no implementation or acceptance pass for them. Full gates, browser execution, real openers and real files are outside this dispatch.

## Assumptions and measurement plan

The reported 7,546 files are an interim developer observation, not an independently reproduced release artifact. Freeze the inspected T4 SHA; use a local source snapshot, normal `npm ci` with the approved browser-download skip, and isolated invented workbook fixtures. Measure the current closure and potential reductions separately from correctness; one exercised import trace cannot establish a safe deletion list.

Checks: inspect the current package scripts and R5 contracts; count retained files by package and subtree; exercise ExcelJS with invented data; use the already installed bundler only for disposable experiments if available; record exact failures and distinguish candidate counts from installed/pruned release proof.

## Frozen evidence

Research date: 2026-11-06. Base `origin/main`: `cc075a4d371bbdfea6cead35f515df6086f8df28`; inspected `origin/agents/t4`: `c780e72d6361b692f5ab09d18cc6907b9b5ff0bf`. Read [issue #4](https://github.com/bussard76/exxperts/issues/4), including its six decision comments, `docs/reviews/T4-R5-architecture-spec.md` on that branch, and this project's Controller files `analysis/T4-spec-R5.md`, `analysis/T4-package-lock.md` and `analysis/T4-package-audit.md`. No other project's Controller or another worker's artifacts were read or modified. `ARCHITECTURE.md` is absent.

The R5 review approves ExcelJS 4.4.0, docx-preview 0.4.1, jsdom 26.1.0, SheetJS 0.20.3 for SSF/codepages, JSZip 3.10.1, pdfjs-dist 5.4.394, locked @napi-rs/canvas 0.1.100 and Koffi 2.16.2. Existing jsdom consumers and the actual nested/native closure remain required. Later issue decisions waive the OOXML pre-operation bound in favour of existing child containment, and waive a real Windows-host proof for ticket completion; neither waives package completeness or establishes Windows compatibility. The 2,500-file desktop ceiling remains binding.

Created an isolated source snapshot with `git archive <T4 SHA>`, under this worktree's ignored `.build/`, without switching or modifying the T4 worktree. `EXXETA_SKIP_BROWSER_INSTALL=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --offline --no-audit --no-fund` passed: 1,026 packages, normal lifecycle scripts, no browser download, no dependency or lock edits. Node 22.23.4 / npm 10.9.9; esbuild 0.28.1. All 23 existing Linux optional `libc` annotations are present in the frozen lock. Optional node-canvas was absent in this offline install; @napi-rs/canvas and Koffi both loaded locally. No native platform equivalence follows.

## Actual tools and limits

| Existing seam/tool | What it actually does | Limit relevant to this task |
| --- | --- | --- |
| `scripts/bundle-server.mjs` / esbuild 0.28.1 | Bundles server and reviewed imports, copies `BUNDLE_ASSETS`, audits dynamic loads and own-location reads, writes `server.mjs.licenses.txt` | The shelf and opener children are copied plain files. Their packages remain external/file packages; their dependency JavaScript is not collapsed. |
| `shippedPackageDirs` | Traverses dependencies, optional dependencies and peers by Node-like installed location, bounded to app root | Package closure, not file reachability. Keeps all editions of es-abstract, dayjs locales/plugins, alternate distributions and tests within selected packages. Missing optional packages are not completeness proof. |
| `checkServerFiles` | Checks required bundle assets/manifests, ExcelJS-owned saxes 5.0.1, Koffi pin/loader/Win32 addon/notices, missing closure | Does not prove arbitrary runtime files, document fidelity, native operation, or complete notice text. |
| `scripts/bundle-release.mjs` | Builds/packs, unpacks a root project, copies lock, uses `npm ci --omit=dev`, verifies lock membership, bundles in that tree, dereferences links and applies generic prune | Distinct from installing the tarball as a dependency. Target must match host; Node download/archive/full build were not executed here. Archive ceiling is separately 15,000; it does not replace desktop's 2,500. |
| `scripts/bundle-release-prune.mjs` | Removes maps, declarations, third-party TS and Markdown; protects own runtime/MCP packages and named license/notice/copying files | Its static check only detects pruned relative TS imports. README-carried or source-carried notices need explicit preservation. |
| `apps/desktop/scripts/prune-payload.mjs` | Keeps `DESKTOP_KEEP`, package closure, drops optional recheck-jar, removes `.d.ts`, checks assets and counts all files in `app/` | Does not itself remove maps/Markdown/tests/alternate JS distributions. Limit is hard-failed at 2,500. Native/dynamic files cannot be removed merely because a Linux probe never loaded them. |
| `scripts/payload-lock-check.mjs` | Validates each actual package name/version against non-dev lock entries, including nested folders | Does not validate package source bytes, all assets, imported functions, or runtime correctness. |
| Other installed tools | Rollup 4.60.3 and Vite 6.4.5 are available | No installed ncc, nft, webpack, node-prune or modclean was found by module resolution. Adding one is outside this level-1 research. `npm prune` concerns packages, not file-level bundling. |

esbuild explicitly leaves non-analyzable imports for runtime resolution; moving jsdom/native loaders into a bundle is therefore not automatically safe ([official API](https://esbuild.github.io/api/#non-analyzable-imports)). Its legal-comment handling is not a substitute for collecting all applicable package/vendor notices ([official legal-comments documentation](https://esbuild.github.io/api/#legal-comments)). npm's package pruning does not solve this file-count problem ([official npm prune documentation](https://docs.npmjs.com/cli/v10/commands/npm-prune/)).

## Independent file measurements

Resolved the frozen branch's actual shipped roots with `shippedPackageDirs(root, { exclude: ["recheck-jar"] })`, copied each selected installed package once into a disposable tree, preserving nested package locations and excluding nested node_modules from each parent's own copy. This yielded 252 package locations and no reported required missing package. Counts below concern those package files, not a complete built app.

| Measurement | Files |
| --- | ---: |
| Installed package closure, before file pruning | 7,974 |
| After current desktop `.d.ts` removal only (644 removed) | 7,330 |
| After existing release generic pruning as well | 6,542 |
| Generic pruning removals: maps / declarations / TS / Markdown | 313 / 650 / 40 / 429 |

The developer's frozen report describes 8,190 total files, 7,974 in node_modules, then 7,546 total after desktop declaration removal. Independently reproduced package arithmetic is **7,974 − 644 = 7,330**; adding its reported 216 outside-node_modules files gives **7,546**. The 216-file app portion and that earlier whole artifact were not independently built here. Applying the existing generic release prune would instead imply 6,542 + 216 = 6,758 for the same app portion, still 4,258 over the ceiling. This reconciles the interim number without claiming a release proof or increasing a limit.

Largest package-owned file counts after generic pruning, excluding their nested package files:

| Package | Files |
| --- | ---: |
| es-abstract 1.24.2 | 2,478 |
| jsdom 26.1.0 | 499 |
| dayjs 1.11.21 | 369 |
| ExcelJS 4.4.0 | 346 |
| pdfjs-dist 5.4.394 | 281 |
| async 3.2.6 | 135 |
| Koffi 2.16.2 | 106 |
| playwright-core 1.60.0 | 89 |
| cssstyle 4.6.0 | 85 |
| ExcelJS-owned uuid 8.3.2 | 63 |

There are only 248 remaining files under directories named test/tests/example/examples across the generic-pruned closure. Even treating all as removable would not close the gap, and blanket deletion is not established safe. Likewise, replacing all 2,478 es-abstract files by even the observed 81 plus its manifest/license would still leave approximately 4,147 package files before app assets. One-package trimming cannot solve the ceiling.

## ExcelJS probe: what really loads

The disposable probe used **ExcelJS's public `require("exceljs")` and `new Workbook().xlsx.load(buffer)`**. Its independently authored raw OOXML fixture was zipped with existing JSZip, not produced by ExcelJS: two named sheets, cached `SUM(20,22)` result 42, bold colored text, yellow solid fill, thin left border, width 24, `#,##0.00`, a boolean cell, plus a macro-enabled workbook content-type variant and damaged bytes. Literal assertions passed against the installed public package and a disposable bundle. This establishes a narrow package API observation, not a product producer/route/browser or macro fidelity proof.

Instrumented CommonJS resolution observed **81 distinct es-abstract files**, principally 2025 operations/helpers plus `2024/IsCallable`. The public ExcelJS entry eagerly includes streaming readers; the graph goes through unzipper's open path, graceful-fs and its legacy streams, readable-stream 2, buffer-from, typedarray.prototype.slice and then es-abstract. Inspecting its public-entry esbuild graph independently also found those 81 files. Thus neither “es-abstract is unused” nor “all older-year directories are unused” is valid. Another scan across all retained JS, including remaining tests, found literal inbound es-abstract requests and a 108-file relative closure; this conservative regex scan is not an exhaustive JavaScript/dynamic-resolution analysis and is not a deletion authorization.

Using existing esbuild 0.28.1 with `bundle: true`, `platform: "node"`, `format: "cjs"`, `target: "node20.6"`, `metafile: true`, `write: false`, `legalComments: "eof"`, and a synthetic `module.exports = require("exceljs")` entry produced 690 input modules, **2,545,492 bytes**, no warnings, only Node builtins as recorded external imports, and no textual `__dirname`, `__filename` or `require.resolve` sites. Both workbook variants and the damaged-input assertion passed against it. This is useful evidence for bundling the full public package; absence of warnings or those strings is not a complete dynamic-load proof.

Comparison probes: importing only internal `exceljs/lib/doc/workbook` produced 1,131,651 bytes / 287 inputs / zero es-abstract inputs; bundling selected es-abstract consumers produced 224,812 bytes / 217 inputs / 99 es-abstract inputs. The internal-path probe explains eager-load costs but is **not recommended**: it changes consumer assumptions, depends on a private library path and does not preserve the selected public package surface. Full-public bundling offers sufficient potential file reduction without that shortcut. Byte size is secondary to file count here.

## Required runtime, dynamic and native closure

The complete observed package-location/version ledger is appended below. It is the exact frozen Linux installation inventory, not the final supported-platform closure: it excludes optional packages npm did not install and the approved child SheetJS registration still pending on T4. Never derive a platform-independent deletion list from it.

| Owner | Files/behavior that must remain reachable in a proposed payload |
| --- | --- |
| Server and children | `apps/web-server/dist/server.mjs`, `server.mjs.licenses.txt`, `shelf-parse-worker.mjs`, `workspace-open-worker.mjs`, `unicode-cfb-notice.md`, `photon_rs_bg.wasm`, `app-bridge.bundle.js`. Preserve their relative layout and existing child IPC/process/heap/time containment. No new parser, validator or document admission stage. |
| ExcelJS 4.4.0 | Public package main `excel.js`, original manifest/version and full public exports. Preserve ExcelJS-owned `node_modules/saxes` 5.0.1, its `saxes.js` and manifest, and xmlchars 2.2.0 files; the child resolves this parser independently using `createRequire(import.meta.resolve("exceljs"))`. Root saxes 6.0.0 belongs to jsdom and cannot replace 5.0.1. |
| Word | docx-preview 0.4.1's ESM/CJS entries and JSZip 3.10.1 closure; jsdom 26.1.0's `lib/api.js`, generated interfaces, DOM implementations, `browser/js-globals.json`, package-relative resources and `living/xhr/xhr-sync-worker.js`. Keep nested parse5 7.3.0/entities 6.0.1, cssstyle/rrweb-cssom, encoding tables and other actual dependencies. No blanket jsdom bundle or deletion based on the Word happy path; existing fetch_url uses it too. |
| SheetJS 0.20.3 | Preserve selected SSF/codepage imports, `xlsx.js` / `xlsx.mjs`, exports targets and `dist/cpexcel` assets used by the reviewed legacy path, manifest and notices. The full package after generic pruning is only **18 files**; retain all as the initial bounded policy rather than hand-trimming. Its child registration is required by R5 but absent from this frozen `FILE_PACKAGES`. Keep existing runtime/shelf text consumers. |
| PDF | Keep pdfjs-dist 5.4.394's legacy parser and worker, `cmaps`, `standard_fonts`, `wasm`, `iccs` where needed by supported PDF paths, and their notices. Actual local URL/worker/asset resolution still needs installed-producer proof; retaining paths alone does not show the current child uses every required font/CMap correctly. No UI plugin/CDN substitute. |
| PDF/image native renderer | @napi-rs/canvas 0.1.100 loader plus the correct optional native package for each target. This Linux fixture loaded `@napi-rs/canvas-linux-x64-gnu/skia.linux-x64-gnu.node`; neither that observation nor optional-load error handling proves Windows, macOS, musl or other advertised runtime compatibility. Preserve relevant native metadata and notices. Optional jsdom `canvas` absence here is recorded, not declared harmless for every consumer. |
| Windows opener | Koffi 2.16.2 `index.js`, original manifest, `build/koffi/win32_x64/koffi.node`, and existing platform-dependent loader/ABI behavior. Retain all currently shipped Koffi platform binaries in this initial proposal; no host-only trimming. Its own/vendor notices are named below. Linux loading 2.16.2 proves no Win32 layout, COM, error-state or handoff behavior. No opener or system binding was invoked. |
| Existing browser/regex consumers | Retain playwright/playwright-core 1.60.0 driver bundles, browser registry/data and runtime resources. Retain recheck 4.5.0's synckit worker plus synckit and its supported-target native checker; only the already documented optional recheck-jar exclusion applies. No browser launch or new exclusion was used here. |
| Remaining app files | Preserve every `DESKTOP_KEEP` path: built UI, runtime themes/interactive assets/export HTML, runtime manifest, server-entry/state-profiles/room-lock/product-state helpers, doctor and searxng scripts, own license/version/release notes. Their actual generated file count belongs to the whole-payload check. |

## Notice inventory and concrete gaps

Named notice counts are not the complete legal/source-notice inventory. Existing `licenceText` examines only package-root filenames beginning license/licence/notice/copying; `legalComments: "eof"` retains only recognized legal comments. Neither guarantees README or ordinary source-comment notices survive. The following exact installed evidence prevents using those mechanisms alone:

- `isarray` **1.0.0** has its complete MIT copyright/permission text in `README.md`, no named license file. Generic Markdown pruning removes it. The nested isarray **2.0.5** copies have their own LICENSE files and do not substitute for 1.0.0's attribution.
- Both `saxes` **5.0.1** and **6.0.0** manifests say ISC, but neither installed root contains a named license/notice file, and searches of their READMEs found no license/copyright text. Preserve an exact upstream notice with version provenance before distribution; an ISC label alone is not a supplied notice. This research did not retrieve or certify that missing text.
- JSZip **3.10.1** `LICENSE.markdown` explicitly permits selecting MIT or GPLv3. Preserve its MIT selection/text and `lib/license_header.js`; do not delete the file for being Markdown.
- `pako` **1.0.11** has a root MIT LICENSE and separate zlib-derived notices in `lib/zlib/*`, including `inflate.js`/`deflate.js`. Those include origin/altered-source/source-notice conditions. The disposable public ExcelJS bundle **does not contain** the checked zlib notice phrase or its Gailly author attribution, or isarray's copyright, despite `legalComments: "eof"`. A generated complete notice sidecar, with original source copies retained where appropriate, is mandatory before treating that bundle as distributable.
- `binary` **0.3.0** README identifies MIT but has no named notice file; `buffers` **0.1.1** lacks a license field and named notice; `chainsaw` **0.1.0** says MIT/X11 without a named notice. Carry these unresolved earlier package-review items into the exact upstream attribution inventory; do not manufacture license text or infer “no obligation”.
- Koffi keeps **all four** `LICENSE.txt`, `src/cnoke/LICENSE.txt`, `vendor/node-addon-api/LICENSE.md`, `vendor/node-api-headers/LICENSE`. PDF keeps its root LICENSE, CMap LICENSE, ICC LICENSE, Foxit/Liberation font licenses and OpenJPEG/QCMS/PDFJS wasm notices. Own `NOTICE`, runtime notices, vendored Node LICENSE, photon and native-library notices need explicit ownership in their respective shipped artifacts; the current desktop keep list does not list the root `NOTICE` separately. Preserve it in the proposed budget.
- Existing server bundle notices and the Unicode profile notices remain separate owned artifacts. Any new compiler output must carry input-path/package/version provenance and all applicable copyright/license/vendor texts, including nested versions, without relying on a package manifest alone.

These are packaging closure concerns, not an authorization to change licenses, dependencies, formats or platforms. Complete native/vendor attribution is still unproved, including any additional upstream notices not present in the installed npm artifact.

## Proposed packaging-only design for independent review

**Recommendation: first pursue a package-local bundle of the full pinned ExcelJS public entry, keeping every other file-package policy unchanged.** This uses the existing esbuild and the existing release/bundle/prune seam. No product parser, validator, public export, dependency, route, store or document data flow is introduced. It is a proposed build-artifact transformation, not an implementation or approval request in this report.

1. **Source and ownership.** In the disposable installed release tree, after ordinary locked `npm ci` and existing postinstall patching, and before staging/pruning, resolve the installed ExcelJS 4.4.0 public entry and all actual inputs from that root only. The existing `scripts/bundle-server.mjs` owns this additional private build operation; no new exported helper or standalone runtime module. Generate the full-public CJS bundle with existing esbuild using the flags above and `write: false`; audit its metafile and dynamic/own-location reads before writing anything. Emit it at the staged package's **existing `node_modules/exceljs/excel.js`** path. Keep the package manifest/name/version/exports unchanged and leave source-tarball dependencies unchanged. Record original lock integrity/input versions and generated output digest separately: generated bytes are not the original registry tarball bytes.
2. **Keep the established seam.** Shelf child still imports `exceljs` by its approved name. Preserve `import.meta.resolve("exceljs")` → owned saxes 5.0.1 resolution from that same package location, including negative wrong-version/missing-parser checks. Do not substitute a browser ExcelJS distribution, a private doc/workbook entry or a custom Workbook shim. Source development still uses the original package; installed and pruned checks must catch any artifact-only divergence.
3. **Bound the removal.** Recompute closure from every existing shipped root other than ExcelJS. In this frozen installation it is **65 package locations / 1,663 files** after generic pruning. The **187 ExcelJS-exclusive locations / 4,879 files** may have code represented by the bundle, but only after all their runtime sites are reviewed. Keep every one of the 187 original package manifests and all named notices (371 files together), plus the direct owned saxes JavaScript. Shared packages remain as complete files for their other consumers even when the bundle includes a duplicate copy. Anything newly shared in a later graph is automatically retained; reject an unknown dynamic or package-location load rather than assuming it unnecessary.
4. **Notices and assets before deletion.** Collect notices from original inputs before transforming/removing files. Retain named files and add **one `node_modules/exceljs/excel.js.licenses.txt`** sidecar containing complete applicable texts/provenance from source headers, README-only notices and missing upstream notices after verification. The same text must cover duplicated inlined shared code; existing source copies are preserved too. Keep all native/dynamic packages identified above intact and include SheetJS's full 18-file package after generic prune. Any unresolved upstream/native notice keeps distribution proof open; it is not hidden by the one-file budget.
5. **Fail closed on changes.** Use the existing public packaging tests and package entry checks to prove exact version/entry ownership, no source/global fallback, dynamic path resolution, missing/wrong assets and counts. The new compiled artifact must be reviewed against every input's own-location/dynamic behavior as server.mjs already is. Do not weaken `shippedPackageDirs`, `checkServerFiles`, lock checks or the 2,500 limit to make a manifest-only tree look complete. Update their existing behavior tests for the generated package artifact only after Controller accepts this design.

This is maintainable only as a small, explicit transform of one pinned public package, derived from the installed graph with deterministic input/output/notice records. A hand-maintained whitelist of thousands of transitive files or a new generalized tracer/pruner is not the recommendation.

### Whole-payload accounting, including pending closure

| Proposed accounting component | Files | Status |
| --- | ---: | --- |
| Other shipped roots' full generic-pruned closure | 1,663 | Measured in frozen Linux install |
| All 187 ExcelJS-exclusive manifests and named notices | 371 | Measured; this preserves all 252 original manifests overall |
| Full public ExcelJS CJS artifact at existing main | 1 | Generated only as a disposable probe |
| Approved child SheetJS package after generic prune | 18 | Measured separately; registration still pending |
| ExcelJS-owned saxes.js retained for direct child require | 1 | Manifest already included in 371; xmlchars runtime already shared |
| Complete ExcelJS input notice sidecar | 1 | Proposed; verified missing upstream texts still needed |
| **Node_modules subtotal** | **2,055** | Projection, not a valid pruned artifact |
| Earlier report's outside-node_modules app files | 216 | Historical interim count, not final producer output |
| Root NOTICE retained additionally | 1 | Proposed; no product edit |
| **Illustrative whole app subtotal** | **2,272** | Conditional on that 216-file app portion and unchanged other closure |
| **Remaining ceiling headroom** | **228** | Must also cover target differences and any required missing assets/notices |

The exact final equation is **2,055 + A + T + E**, where `A` is the actual complete app/non-node_modules file count including own notices, `T` is the signed per-target delta from the measured installed closure, and `E` is any additional required runtime/native/notice files not represented by this snapshot. The unchanged acceptance condition is **A + T + E ≤ 445**, with the final counter measuring the actual whole `app/` tree. There is no demonstrated final value of A/T/E because the product's final producer/assets and supported-target installs do not yet exist here. In particular optional node-canvas is absent from this probe; if required by an actual consumer, its whole additional closure must be counted. No “2,272-file release” or passing ceiling is claimed.

### Alternatives

| Approach | Evidence and fit | Recommendation |
| --- | --- | --- |
| Existing generic metadata prune only | Approximately 6,758 whole files using the historical 216; far over 2,500 | Use existing behavior consistently but insufficient alone |
| es-abstract year/operation pruning, dayjs dist/locales, test/example trimming | 81 observed vs 2,478 package files; 108-file conservative scan; even total es-abstract removal leaves >4,000 package files. Other deletions need separate reachability proof | Possible secondary savings; do not ship trace-based or year-based deletions |
| Full public ExcelJS package-local bundle above | 690 inputs, narrow fixtures pass, conditional 2,272 whole app projection preserving manifests/named notices and other consumers | Best bounded candidate; needs artifact, notice and producer proofs before approval to implement |
| Bundle only several pure-JS es-abstract consumers at their current package paths | Existing esbuild can collapse their static graph; probe had 217 inputs/99 es-abstract files. Could preserve ExcelJS sources but adds several artifact owners and still needs more reductions | Less direct; measure a complete whole-payload plan before selecting |
| Bundle the entire shelf child/jsdom/Word/PDF graph | Reaches file-relative jsdom workers/data, pdf.js workers/fonts/wasm and native loaders; current broad externalization intentionally protects them | Avoid for this bounded task; no proven need to assume these risks |
| Change package identities/versions, add a pruner, drop formats/platforms, raise ceiling or hide files in an unpacked archive | Changes explicit constraints or merely shifts the count/runtime behavior | Outside scope; not proposed |

## Architecture level and decisions

This report and disposable experiments are **level 1**. The proposed transform can remain **level 1 inside the existing packaging module** only if it preserves public package/API identities, the existing child/data flow, all dependency declarations, supported platforms, exports and existing externally observable behavior. It changes the built artifact, so this research dispatch does **not** authorize implementing it: Controller must first accept the concrete packaging design and preservation/proof conditions. Independent review must validate that classification against the actual diff.

A new helper export, dependency or public package surface would be level 2 and needs Architect/Controller authorization; replacing parsers, changing responsibility/IPC/flows or supported technology/contract crosses the existing boundary and requires escalation under the repository's level-3 rules. Nothing here needs or implies a new parser or validator. Sascha's no-new-parser/no-validator direction and the existing containment decision remain unchanged. No limit increase or functional narrowing is proposed.
