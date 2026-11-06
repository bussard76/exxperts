# T4 package payload research

Status: research complete; proposed design for independent review, with no product implementation or package acceptance claim.

## Architecture impact

Level 1: documentation and disposable local measurements only. Existing package identities, dependencies, public interfaces, routes, stores, data flows and the 2,500-file ceiling remain unchanged. Any implementation that exceeds the existing package seam needs Controller approval.

## Scope and checklist

The read-only research override supersedes the generic implementation dispatch and its report destination. This findings file is the only tracked change; the existing issue-4 developer report is not edited.

- [x] Read issue #4, current `origin/agents/t4`, earlier package reviews and approved R5 closure. Evidence: frozen sources and obligations below.
- [x] Inventory actual bundling/pruning tools and their coverage limits. Evidence: tool inventory below.
- [x] Independently measure installed package closure and the reported approximately 7,546-file interim payload, using only a disposable local tree. Evidence: counts below; whole release artifact not reproduced.
- [x] Identify exact runtime, dynamic-file, native and notice obligations, including ExcelJS's real use of es-abstract. Evidence: runtime probe and closure ledger below; release proofs remain explicitly open.
- [x] Compare bounded maintainable options against the unchanged 2,500-file ceiling, without removing formats or platforms. Evidence: concrete proposed design and accounting below; no implementation authorization inferred.
- [x] State unresolved independent producer, installed-tarball and post-prune proofs; self-review every task constraint; commit and push the research branch. Evidence: proof and self-review sections, signed research commits on `agents/t4-payload-research`.

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

Instrumented CommonJS resolution observed **81 distinct es-abstract files**, principally 2025 operations/helpers plus `2024/IsCallable`. The public ExcelJS entry eagerly includes streaming readers; a shortest path through its esbuild input graph is `excel.js` → `exceljs.nodejs.js` → `workbook-reader.js` → `unzipper/unzip.js` → `unzipper/lib/parse.js` → `binary/index.js` → `chainsaw/index.js` → `traverse/index.js` → `typedarray.prototype.slice/index.js` → its implementation → es-abstract. Inspecting its public-entry esbuild graph independently also found those 81 files. Thus neither “es-abstract is unused” nor “all older-year directories are unused” is valid. Another scan across all retained JS, including remaining tests, found literal inbound es-abstract requests and a 108-file relative closure; this conservative regex scan is not an exhaustive JavaScript/dynamic-resolution analysis and is not a deletion authorization.

Using existing esbuild 0.28.1 with `bundle: true`, `platform: "node"`, `format: "cjs"`, `target: "node20.6"`, `metafile: true`, `write: false`, `legalComments: "eof"`, and a synthetic `module.exports = require("exceljs")` entry produced 690 input modules, **2,545,492 bytes**, no warnings, only Node builtins as recorded external imports, and no textual `__dirname`, `__filename` or `require.resolve` sites. Both workbook variants and the damaged-input assertion passed against it, including a fresh Node subprocess that asserted zero `node_modules` modules in `require.cache`. This is useful evidence for bundling the full public package; absence of warnings or those strings is not a complete dynamic-load proof.

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
| Root NOTICE, runtime/LICENSE and runtime/NOTICE.md retained additionally | 3 | Proposed; no product edit |
| **Illustrative whole app subtotal** | **2,274** | Conditional on that 216-file app portion and unchanged other closure |
| **Remaining ceiling headroom** | **226** | Must also cover target differences and any required missing assets/notices |

The exact final equation is **2,055 + A + T + E**, where `A` is the actual complete app/non-node_modules file count including own notices, `T` is the signed per-target delta from the measured installed closure, and `E` is any additional required runtime/native/notice files not represented by this snapshot. The unchanged acceptance condition is **A + T + E ≤ 445**, with the final counter measuring the actual whole `app/` tree. There is no demonstrated final value of A/T/E because the product's final producer/assets and supported-target installs do not yet exist here. In particular optional node-canvas is absent from this probe; if required by an actual consumer, its whole additional closure must be counted. No “2,274-file release” or passing ceiling is claimed.

### Alternatives

| Approach | Evidence and fit | Recommendation |
| --- | --- | --- |
| Existing generic metadata prune only | Approximately 6,758 whole files using the historical 216; far over 2,500 | Use existing behavior consistently but insufficient alone |
| es-abstract year/operation pruning, dayjs dist/locales, test/example trimming | 81 observed vs 2,478 package files; 108-file conservative scan; even total es-abstract removal leaves >4,000 package files. Other deletions need separate reachability proof | Possible secondary savings; do not ship trace-based or year-based deletions |
| Full public ExcelJS package-local bundle above | 690 inputs, narrow fixtures pass, conditional 2,274 whole app projection preserving manifests/named notices and other consumers | Best bounded candidate; needs artifact, notice and producer proofs before approval to implement |
| Bundle only several pure-JS es-abstract consumers at their current package paths | Existing esbuild can collapse their static graph; probe had 217 inputs/99 es-abstract files. Could preserve ExcelJS sources but adds several artifact owners and still needs more reductions | Less direct; measure a complete whole-payload plan before selecting |
| Bundle the entire shelf child/jsdom/Word/PDF graph | Reaches file-relative jsdom workers/data, pdf.js workers/fonts/wasm and native loaders; current broad externalization intentionally protects them | Avoid for this bounded task; no proven need to assume these risks |
| Change package identities/versions, add a pruner, drop formats/platforms, raise ceiling or hide files in an unpacked archive | Changes explicit constraints or merely shifts the count/runtime behavior | Outside scope; not proposed |

## Architecture level and decisions

This report and disposable experiments are **level 1**. The proposed transform can remain **level 1 inside the existing packaging module** only if it preserves public package/API identities, the existing child/data flow, all dependency declarations, supported platforms, exports and existing externally observable behavior. It changes the built artifact, so this research dispatch does **not** authorize implementing it: Controller must first accept the concrete packaging design and preservation/proof conditions. Independent review must validate that classification against the actual diff.

A new helper export, dependency or public package surface would be level 2 and needs Architect/Controller authorization; replacing parsers, changing responsibility/IPC/flows or supported technology/contract crosses the existing boundary and requires escalation under the repository's level-3 rules. Nothing here needs or implies a new parser or validator. Sascha's no-new-parser/no-validator direction and the existing containment decision remain unchanged. No limit increase or functional narrowing is proposed.

## Checks run and evidence limits

| Check | Result | What it proves |
| --- | --- | --- |
| Offline normal-lifecycle `npm ci`, browser skips set | Passed | Frozen candidate installation from existing cache; not all optional native completeness |
| `node --test scripts/bundle-release.test.mjs scripts/payload-lock-check.test.mjs` | **21/21 passed**, including final rerun after merging current origin/main | Existing pruning/lock-check fixture behavior; no final package acceptance |
| Frozen T4 `npm run test:scripts` | **55/57 passed** | Two built-runtime tests lack prerequisite generated `runtime/packages/coding-agent/dist/config.js` and `runtime/packages/ai/dist/utils/oauth/oauth-page.js` in this fresh unbuilt source snapshot. The suite explicitly requires prior runtime build; this is not a timeout/load flake or a new defect attributed to this documentation change. Full/runtime product builds were not run to satisfy that prerequisite under this research scope. |
| Public ExcelJS API, independently authored invented .xlsx and macro-enabled OOXML | Passed | Two sheets, literal cached result 42, font/fill/border/width/number format, boolean, damaged rejection |
| Same invented cases through disposable full-public CJS bundle | Passed | Narrow output agreement; no claim of all supported document features |
| Same bundle in fresh subprocess, zero node_modules require-cache entries | Passed, including final rerun | This public-package probe does not need checkout packages at runtime; not the production child, installed tarball or pruned app |
| @napi-rs/canvas and Koffi local module loads | Passed on Linux Node 22.23.4 | Load only; no host opener/system binding, native target or rendering correctness claim |
| `git fetch origin` / `git merge origin/main` | Already up to date at `cc075a4d371bbdfea6cead35f515df6086f8df28` | Research branch reconciled with current main; frozen T4 evidence deliberately unchanged |

No new product behavior was implemented, so no product regression test was added or existing test edited/relaxed. Disposable assert-based probes are research measurements, not a test-first implementation claim. Followed ponytail's smallest-change rule and read the TDD and diagnosis skills; the two missing-build prerequisites were inspected and recorded without an out-of-scope fix. No full build/smokes, browser gate, source-tarball installation, post-prune route, real external service, real user file, paid API, opener, or deployment was exercised. No load/environment retry was needed; one final targeted rerun is recorded above. No screenshots were captured.

Audit identities: frozen lock SHA-256 `241299ba3ea6768c6f23106795b572480494ffa1394b80df9bb63380753c6b6c`; full-public probe bundle SHA-256 `d9f209f6dafa2f7ca185f4f4d52dc58eb654b5dbcdd9ecdd59c717a785c22295`. Bundle size includes the synthetic source label; changing that label changes bytes without changing the measured dependency graph. ZIP fixture bytes contain generated metadata; their hashes are not canonical format fixtures.

## Proofs still required before implementing/accepting the product change

The following are **open implementation/release proofs**, not remaining research work or permission to bypass them:

1. **Independent producer and consumer.** Implement and exercise the actual approved public preview route → existing real child → validated response → real browser consumer, using independently authored invented OOXML and legacy BIFF fixtures with literal expectations. The current ExcelJS package probe is not that producer. Prove all reachable sheets, caches including zero/false/empty/error/stale/missing results, basic styles, scrolling and controlled damage/containment. Preserve Word/PDF/image behavior and signed-off local-open flow, with fake openers only. Complete P1–P5, B1–B7 and O1–O4 as applicable; no parser/validator is added by this proposal.
2. **Installed source tarball versus release-root install.** Verify the actual packed product as a dependency outside any checkout separately from the existing lock-driven release-root installation. The existing release script's unpacked-root `npm ci` is not tarball-as-dependency proof. Verify exact child/package paths/versions, deliberate missing/wrong packages/child/parser/addon, no source/global fallback, and actual public route plus browser previews. Freeze produced hashes and installed graph before assessing pruning.
3. **Actual post-prune artifact.** Repeat those route/browser/consumer checks from the real pruned desktop/archive tree, not package stubs or this standalone bundle. Resolve ExcelJS's generated public main and direct owned saxes, SheetJS SSF/codepages, Word/jsdom resources, all PDF workers/fonts/CMaps/wasm, and native libraries from the artifact. Run `checkServerFiles` and lock checks, but also execute the consumers those metadata checks do not cover. Record actual whole `app/` count per target at ≤2,500, with no `maxFiles` override; recompute A/T/E and preserve named and embedded notices before any reduction is accepted.
4. **Existing consumers.** Preserve jsdom's lazy `fetch_url` parsing with source URL, Readability clone and loud missing-package behavior. Run `fetch-url-extraction-smoke`, `answer-display`, `chart-block`, `consult-mention`, `memory-ways-on`, `model-pick-control`, `step-cards`, doctor with demo/offline responses, shelf text/vision and workspace spreadsheet consumers, script/UI typechecks, and all four existing packaging test suites with their normal generated-runtime prerequisites. Browser-bearing checks run through `gate`; Tester/wave own full gates. No claim here substitutes for these checks.
5. **Node and supported targets.** Preserve root Node `>=20.6.0` and vendored **24.22.1**. `target: "node20.6"` controls emitted syntax; it does not certify package APIs, native ABI or pdf.js compatibility across all admitted Node versions. Test actual ordinary and vendored runtime behavior on the matching **win-x64, darwin-arm64 and linux-x64** release environments, preserving relevant glibc/musl optional selection where supported. Desktop packaging currently targets Windows/macOS; Linux measurements are diagnostic only. Report any observed advertised-runtime incompatibility to Controller. No host-only native reduction, platform policy change or silent minimum increase.
6. **Native and human evidence.** Preserve the issue's explicit waiver of a real Windows host for ticket completion; simulated Win32 tests still apply and actual Windows opener/native verification remains recorded debt. A real approved-host non-opening native probe, if later available, establishes only its measured loading/layout/COM/error-state behavior. Actual external-app display, Electron and Sascha's real files remain human acceptance; workers do not obtain or open them.
7. **Notices, integrity and advisories.** Complete exact upstream/versioned texts for saxes/binary/buffers/chainsaw and all applicable native/vendor notices; verify the new sidecar/source distribution includes README and pako zlib notices, JSZip MIT selection, both saxes versions, Koffi vendor/cnoke, PDF assets, Unicode profiles and own/runtime/Node attribution. Run the actual release-closure advisory review including CDN SheetJS, tmp, unzipper and ExcelJS-owned uuid 8.3.2; R5 records GHSA-w5hq-g745-h8pq and its narrow read-only reachability assessment, not a blanket safety proof. This research did not rerun a live advisory service or change dependencies/overrides.

## Self-review and handoff

- Scope: only this research findings file is tracked; no product code, dependency, lock, package identity, exported API, route, store, data flow, protected file or limit was changed. All edits trace to the read-only dispatch and the coordinator's concrete-design follow-up.
- Every issue Result/Observable acceptance item and added open action is enumerated above, preserved and explicitly not marked implemented by this research. No product checklist was silently checked off; `docs/reports/issue-4.md` belongs to the separate developer and was not edited.
- Every research item has evidence: frozen issue/review reads; named tool inspection; independently counted 252-location closure and exact 644-declaration reconciliation; public ExcelJS/runtime and static bundle probes; exact proposed artifact ownership, notice/native/dynamic ledger and conditional whole-file accounting; and the open installed/pruned/producer proof list. This is the smallest concrete design supported by these measurements, not a passing product review.
- Changes/tests: this file only; no tracked tests added or changed. Named check results and unbuilt-snapshot failures are reported without weakening tests. Small signed commits were pushed to `agents/t4-payload-research`; never main or upstream, no hook bypass.
- Assumptions: historical 216-file app portion is provisional; optional node-canvas absence may change a final required closure; no platform/Node or legal closure claim follows from Linux probes; final graph can change while T4 develops. All additional needed files count against the same limit.
- Existing debt for Controller: actual Windows opener/native verification (`tests`, major; run approved invented-data loading/installed-runtime and opener checks when an authorized Windows host is available), already explicitly accepted as host-proof debt. Notice ownership, final installed/pruned closure, Node/PDF compatibility and optional selection remain required proof, not optional debt. No new debt file or product fix was created by this research.
- Research uses only generated invented documents and local dependencies; temporary source snapshots are removed before worker completion. No binary or screenshot is committed, no other checkout/worker/live artifact was modified, no subagent was started, and coordinator communication used Orca orchestration only.

Recommended next step is an independent review of this packaging-only design and its unresolved attribution/whole-artifact budget, followed by a separately authorized implementation. There is no concrete research blocker requiring a changed dependency, parser, platform, public boundary or file ceiling.

## Appendix: exact observed Linux package ledger

This lists each installed package location once, its manifest version and its own file count after the existing generic prune. Nested package files belong to their own row. Counts include manifests/notices; they are not inferred runtime minima. Approved pending SheetJS 0.20.3 is separately budgeted at 18 files above.

| Location relative to isolated app root | Version | Files |
| --- | --- | ---: |
| `node_modules/@asamuzakjp/css-color` | 3.2.0 | 16 |
| `node_modules/@asamuzakjp/css-color/node_modules/lru-cache` | 10.4.3 | 8 |
| `node_modules/@csstools/color-helpers` | 5.1.0 | 4 |
| `node_modules/@csstools/css-calc` | 2.1.4 | 4 |
| `node_modules/@csstools/css-color-parser` | 3.1.0 | 4 |
| `node_modules/@csstools/css-parser-algorithms` | 3.0.5 | 4 |
| `node_modules/@csstools/css-tokenizer` | 3.0.4 | 4 |
| `node_modules/@fast-csv/format` | 4.3.5 | 9 |
| `node_modules/@fast-csv/format/node_modules/@types/node` | 14.18.63 | 2 |
| `node_modules/@fast-csv/parse` | 4.3.6 | 19 |
| `node_modules/@fast-csv/parse/node_modules/@types/node` | 14.18.63 | 2 |
| `node_modules/@napi-rs/canvas` | 0.1.100 | 7 |
| `node_modules/@napi-rs/canvas-linux-x64-gnu` | 0.1.100 | 2 |
| `node_modules/@pkgr/core` | 0.1.2 | 5 |
| `node_modules/agent-base` | 7.1.4 | 4 |
| `node_modules/archiver` | 5.3.2 | 8 |
| `node_modules/archiver-utils` | 2.1.0 | 4 |
| `node_modules/archiver-utils/node_modules/balanced-match` | 1.0.2 | 4 |
| `node_modules/archiver-utils/node_modules/brace-expansion` | 1.1.21 | 3 |
| `node_modules/archiver-utils/node_modules/glob` | 7.2.3 | 5 |
| `node_modules/archiver-utils/node_modules/minimatch` | 3.1.5 | 3 |
| `node_modules/archiver-utils/node_modules/readable-stream` | 2.3.8 | 20 |
| `node_modules/archiver-utils/node_modules/safe-buffer` | 5.1.2 | 3 |
| `node_modules/archiver-utils/node_modules/string_decoder` | 1.1.1 | 4 |
| `node_modules/array-buffer-byte-length` | 1.0.2 | 8 |
| `node_modules/arraybuffer.prototype.slice` | 1.0.4 | 14 |
| `node_modules/async` | 3.2.6 | 135 |
| `node_modules/async-function` | 1.0.0 | 11 |
| `node_modules/available-typed-arrays` | 1.0.7 | 8 |
| `node_modules/base64-js` | 1.5.1 | 4 |
| `node_modules/big-integer` | 1.6.52 | 6 |
| `node_modules/binary` | 0.3.0 | 39 |
| `node_modules/bl` | 4.1.0 | 9 |
| `node_modules/bluebird` | 3.4.7 | 43 |
| `node_modules/buffer` | 5.7.1 | 3 |
| `node_modules/buffer-crc32` | 0.2.13 | 3 |
| `node_modules/buffer-indexof-polyfill` | 1.0.2 | 7 |
| `node_modules/buffers` | 0.1.1 | 5 |
| `node_modules/call-bind` | 1.0.9 | 10 |
| `node_modules/call-bind-apply-helpers` | 1.0.2 | 13 |
| `node_modules/call-bound` | 1.0.4 | 8 |
| `node_modules/chainsaw` | 0.1.0 | 6 |
| `node_modules/compress-commons` | 4.1.2 | 12 |
| `node_modules/concat-map` | 0.0.1 | 6 |
| `node_modules/core-util-is` | 1.0.3 | 3 |
| `node_modules/crc-32` | 1.2.2 | 7 |
| `node_modules/crc32-stream` | 4.0.3 | 5 |
| `node_modules/cssstyle` | 4.6.0 | 85 |
| `node_modules/data-urls` | 5.0.0 | 4 |
| `node_modules/data-view-buffer` | 1.0.2 | 8 |
| `node_modules/data-view-byte-length` | 1.0.2 | 8 |
| `node_modules/data-view-byte-offset` | 1.0.1 | 8 |
| `node_modules/dayjs` | 1.11.21 | 369 |
| `node_modules/debug` | 4.4.3 | 6 |
| `node_modules/decimal.js` | 10.6.0 | 4 |
| `node_modules/define-data-property` | 1.1.4 | 8 |
| `node_modules/define-properties` | 1.2.1 | 7 |
| `node_modules/docx-preview` | 0.4.1 | 6 |
| `node_modules/dunder-proto` | 1.0.1 | 11 |
| `node_modules/duplexer2` | 0.1.4 | 3 |
| `node_modules/duplexer2/node_modules/readable-stream` | 2.3.8 | 20 |
| `node_modules/duplexer2/node_modules/safe-buffer` | 5.1.2 | 3 |
| `node_modules/duplexer2/node_modules/string_decoder` | 1.1.1 | 4 |
| `node_modules/end-of-stream` | 1.4.5 | 3 |
| `node_modules/es-abstract` | 1.24.2 | 2478 |
| `node_modules/es-abstract-get` | 1.0.0 | 14 |
| `node_modules/es-define-property` | 1.0.1 | 8 |
| `node_modules/es-errors` | 1.3.0 | 13 |
| `node_modules/es-object-atoms` | 1.1.2 | 10 |
| `node_modules/es-set-tostringtag` | 2.1.0 | 7 |
| `node_modules/es-to-primitive` | 1.3.4 | 15 |
| `node_modules/exceljs` | 4.4.0 | 346 |
| `node_modules/exceljs/node_modules/saxes` | 5.0.1 | 2 |
| `node_modules/exceljs/node_modules/uuid` | 8.3.2 | 63 |
| `node_modules/fast-csv` | 4.3.6 | 3 |
| `node_modules/for-each` | 0.3.5 | 9 |
| `node_modules/fs-constants` | 1.0.0 | 4 |
| `node_modules/fs.realpath` | 1.0.0 | 4 |
| `node_modules/fstream` | 1.0.12 | 22 |
| `node_modules/function-bind` | 1.1.2 | 9 |
| `node_modules/function.prototype.name` | 1.2.0 | 18 |
| `node_modules/functions-have-names` | 1.2.3 | 8 |
| `node_modules/generator-function` | 2.0.1 | 11 |
| `node_modules/get-intrinsic` | 1.3.0 | 7 |
| `node_modules/get-proto` | 1.0.1 | 10 |
| `node_modules/get-symbol-description` | 1.1.0 | 9 |
| `node_modules/globalthis` | 1.0.4 | 15 |
| `node_modules/gopd` | 1.2.0 | 8 |
| `node_modules/graceful-fs` | 4.2.11 | 6 |
| `node_modules/has-bigints` | 1.1.0 | 8 |
| `node_modules/has-property-descriptors` | 1.0.2 | 7 |
| `node_modules/has-proto` | 1.2.0 | 11 |
| `node_modules/has-symbols` | 1.1.0 | 12 |
| `node_modules/has-tostringtag` | 1.0.2 | 12 |
| `node_modules/hasown` | 2.0.4 | 7 |
| `node_modules/html-encoding-sniffer` | 4.0.0 | 3 |
| `node_modules/http-proxy-agent` | 7.0.2 | 3 |
| `node_modules/https-proxy-agent` | 7.0.6 | 4 |
| `node_modules/ieee754` | 1.2.1 | 3 |
| `node_modules/immediate` | 3.0.6 | 6 |
| `node_modules/inflight` | 1.0.6 | 3 |
| `node_modules/inherits` | 2.0.4 | 4 |
| `node_modules/internal-slot` | 1.1.0 | 10 |
| `node_modules/is-array-buffer` | 3.0.5 | 8 |
| `node_modules/is-async-function` | 2.1.1 | 8 |
| `node_modules/is-bigint` | 1.1.0 | 8 |
| `node_modules/is-boolean-object` | 1.2.2 | 9 |
| `node_modules/is-callable` | 1.2.7 | 8 |
| `node_modules/is-data-view` | 1.0.2 | 9 |
| `node_modules/is-date-object` | 1.1.0 | 9 |
| `node_modules/is-document.all` | 1.0.0 | 8 |
| `node_modules/is-finalizationregistry` | 1.1.1 | 8 |
| `node_modules/is-generator-function` | 1.1.2 | 10 |
| `node_modules/is-map` | 2.0.3 | 10 |
| `node_modules/is-negative-zero` | 2.0.3 | 9 |
| `node_modules/is-number-object` | 1.1.1 | 9 |
| `node_modules/is-potential-custom-element-name` | 1.0.1 | 3 |
| `node_modules/is-regex` | 1.2.1 | 8 |
| `node_modules/is-set` | 2.0.3 | 10 |
| `node_modules/is-shared-array-buffer` | 1.0.4 | 8 |
| `node_modules/is-string` | 1.1.1 | 8 |
| `node_modules/is-symbol` | 1.1.1 | 9 |
| `node_modules/is-typed-array` | 1.1.15 | 9 |
| `node_modules/is-weakmap` | 2.0.2 | 9 |
| `node_modules/is-weakref` | 1.1.1 | 8 |
| `node_modules/is-weakset` | 2.0.4 | 10 |
| `node_modules/isarray` | 1.0.0 | 7 |
| `node_modules/jsdom` | 26.1.0 | 499 |
| `node_modules/jsdom/node_modules/entities` | 6.0.1 | 23 |
| `node_modules/jsdom/node_modules/parse5` | 7.3.0 | 33 |
| `node_modules/jszip` | 3.10.1 | 50 |
| `node_modules/jszip/node_modules/readable-stream` | 2.3.8 | 20 |
| `node_modules/jszip/node_modules/safe-buffer` | 5.1.2 | 3 |
| `node_modules/jszip/node_modules/string_decoder` | 1.1.1 | 4 |
| `node_modules/koffi` | 2.16.2 | 106 |
| `node_modules/lazystream` | 1.0.1 | 8 |
| `node_modules/lazystream/node_modules/readable-stream` | 2.3.8 | 20 |
| `node_modules/lazystream/node_modules/safe-buffer` | 5.1.2 | 3 |
| `node_modules/lazystream/node_modules/string_decoder` | 1.1.1 | 4 |
| `node_modules/lie` | 3.3.0 | 9 |
| `node_modules/listenercount` | 1.0.1 | 6 |
| `node_modules/lodash.defaults` | 4.2.0 | 3 |
| `node_modules/lodash.difference` | 4.5.0 | 3 |
| `node_modules/lodash.escaperegexp` | 4.1.2 | 3 |
| `node_modules/lodash.flatten` | 4.4.0 | 3 |
| `node_modules/lodash.groupby` | 4.6.0 | 3 |
| `node_modules/lodash.isboolean` | 3.0.3 | 3 |
| `node_modules/lodash.isequal` | 4.5.0 | 3 |
| `node_modules/lodash.isfunction` | 3.0.9 | 3 |
| `node_modules/lodash.isnil` | 4.0.0 | 3 |
| `node_modules/lodash.isplainobject` | 4.0.6 | 3 |
| `node_modules/lodash.isundefined` | 3.0.1 | 3 |
| `node_modules/lodash.union` | 4.6.0 | 3 |
| `node_modules/lodash.uniq` | 4.5.0 | 3 |
| `node_modules/math-intrinsics` | 1.1.0 | 21 |
| `node_modules/minimist` | 1.2.8 | 22 |
| `node_modules/mkdirp` | 0.5.6 | 5 |
| `node_modules/ms` | 2.1.3 | 3 |
| `node_modules/normalize-path` | 3.0.0 | 3 |
| `node_modules/nwsapi` | 2.2.28 | 6 |
| `node_modules/object-inspect` | 1.13.4 | 32 |
| `node_modules/object-keys` | 1.1.1 | 9 |
| `node_modules/object.assign` | 4.1.7 | 19 |
| `node_modules/once` | 1.4.0 | 3 |
| `node_modules/own-keys` | 1.0.2 | 8 |
| `node_modules/pako` | 1.0.11 | 25 |
| `node_modules/path-is-absolute` | 1.0.1 | 3 |
| `node_modules/pdfjs-dist` | 5.4.394 | 281 |
| `node_modules/playwright` | 1.60.0 | 50 |
| `node_modules/playwright-core` | 1.60.0 | 89 |
| `node_modules/possible-typed-array-names` | 1.1.0 | 7 |
| `node_modules/process-nextick-args` | 2.0.1 | 3 |
| `node_modules/punycode` | 2.3.1 | 4 |
| `node_modules/qrcode-terminal` | 0.12.0 | 20 |
| `node_modules/readable-stream` | 3.6.2 | 22 |
| `node_modules/readdir-glob` | 1.1.3 | 3 |
| `node_modules/readdir-glob/node_modules/balanced-match` | 1.0.2 | 4 |
| `node_modules/readdir-glob/node_modules/brace-expansion` | 2.1.7 | 4 |
| `node_modules/readdir-glob/node_modules/minimatch` | 5.1.9 | 4 |
| `node_modules/recheck` | 4.5.0 | 6 |
| `node_modules/recheck-linux-x64` | 4.5.0 | 3 |
| `node_modules/reflect.getprototypeof` | 1.0.10 | 13 |
| `node_modules/regexp.prototype.flags` | 1.5.4 | 15 |
| `node_modules/rimraf` | 2.7.1 | 4 |
| `node_modules/rimraf/node_modules/balanced-match` | 1.0.2 | 4 |
| `node_modules/rimraf/node_modules/brace-expansion` | 1.1.21 | 3 |
| `node_modules/rimraf/node_modules/glob` | 7.2.3 | 5 |
| `node_modules/rimraf/node_modules/minimatch` | 3.1.5 | 3 |
| `node_modules/rrweb-cssom` | 0.8.0 | 30 |
| `node_modules/safe-array-concat` | 1.1.4 | 8 |
| `node_modules/safe-array-concat/node_modules/isarray` | 2.0.5 | 3 |
| `node_modules/safe-buffer` | 5.2.1 | 3 |
| `node_modules/safe-push-apply` | 1.0.0 | 8 |
| `node_modules/safe-push-apply/node_modules/isarray` | 2.0.5 | 3 |
| `node_modules/safe-regex-test` | 1.1.0 | 8 |
| `node_modules/safer-buffer` | 2.1.2 | 5 |
| `node_modules/saxes` | 6.0.0 | 2 |
| `node_modules/set-function-length` | 1.2.2 | 8 |
| `node_modules/set-function-name` | 2.0.2 | 6 |
| `node_modules/set-proto` | 1.0.0 | 10 |
| `node_modules/setimmediate` | 1.0.5 | 3 |
| `node_modules/side-channel` | 1.1.1 | 9 |
| `node_modules/side-channel-list` | 1.0.1 | 9 |
| `node_modules/side-channel-map` | 1.0.1 | 9 |
| `node_modules/side-channel-weakmap` | 1.0.2 | 9 |
| `node_modules/stop-iteration-iterator` | 1.1.0 | 8 |
| `node_modules/string.prototype.trim` | 1.2.11 | 13 |
| `node_modules/string.prototype.trimend` | 1.0.10 | 14 |
| `node_modules/string.prototype.trimstart` | 1.0.8 | 14 |
| `node_modules/string_decoder` | 1.3.0 | 3 |
| `node_modules/symbol-tree` | 3.2.4 | 6 |
| `node_modules/synckit` | 0.9.2 | 5 |
| `node_modules/tar-stream` | 2.2.0 | 7 |
| `node_modules/tldts` | 6.1.86 | 14 |
| `node_modules/tldts-core` | 6.1.86 | 26 |
| `node_modules/tmp` | 0.2.7 | 3 |
| `node_modules/tough-cookie` | 5.1.2 | 21 |
| `node_modules/tr46` | 5.1.1 | 6 |
| `node_modules/traverse` | 0.3.10 | 4 |
| `node_modules/tslib` | 2.8.1 | 10 |
| `node_modules/typed-array-buffer` | 1.0.3 | 8 |
| `node_modules/typed-array-byte-length` | 1.0.3 | 8 |
| `node_modules/typed-array-byte-offset` | 1.0.5 | 8 |
| `node_modules/typed-array-length` | 1.0.8 | 8 |
| `node_modules/typedarray.prototype.slice` | 1.0.6 | 14 |
| `node_modules/unbox-primitive` | 1.1.0 | 9 |
| `node_modules/unzipper` | 0.10.14 | 19 |
| `node_modules/unzipper/node_modules/readable-stream` | 2.3.8 | 20 |
| `node_modules/unzipper/node_modules/safe-buffer` | 5.1.2 | 3 |
| `node_modules/unzipper/node_modules/string_decoder` | 1.1.1 | 4 |
| `node_modules/util-deprecate` | 1.0.2 | 4 |
| `node_modules/w3c-xmlserializer` | 5.0.0 | 5 |
| `node_modules/webidl-conversions` | 7.0.0 | 3 |
| `node_modules/whatwg-encoding` | 3.1.1 | 5 |
| `node_modules/whatwg-encoding/node_modules/iconv-lite` | 0.6.3 | 30 |
| `node_modules/whatwg-mimetype` | 4.0.0 | 7 |
| `node_modules/whatwg-url` | 14.2.0 | 16 |
| `node_modules/which-boxed-primitive` | 1.1.1 | 9 |
| `node_modules/which-builtin-type` | 1.2.1 | 7 |
| `node_modules/which-builtin-type/node_modules/isarray` | 2.0.5 | 3 |
| `node_modules/which-collection` | 1.0.2 | 8 |
| `node_modules/which-typed-array` | 1.1.24 | 7 |
| `node_modules/wrappy` | 1.0.2 | 3 |
| `node_modules/ws` | 8.21.0 | 18 |
| `node_modules/xml-name-validator` | 5.0.0 | 3 |
| `node_modules/xmlchars` | 2.2.0 | 7 |
| `node_modules/zip-stream` | 4.1.1 | 3 |
| `node_modules/zip-stream/node_modules/archiver-utils` | 3.0.4 | 4 |
| `node_modules/zip-stream/node_modules/balanced-match` | 1.0.2 | 4 |
| `node_modules/zip-stream/node_modules/brace-expansion` | 1.1.21 | 3 |
| `node_modules/zip-stream/node_modules/glob` | 7.2.3 | 5 |
| `node_modules/zip-stream/node_modules/minimatch` | 3.1.5 | 3 |
