# T4 package payload research

Status: research in progress; no product implementation or package acceptance claim.

## Architecture impact

Level 1: documentation and disposable local measurements only. Existing package identities, dependencies, public interfaces, routes, stores, data flows and the 2,500-file ceiling remain unchanged. Any implementation that exceeds the existing package seam needs Controller approval.

## Scope and checklist

The read-only research override supersedes the generic implementation dispatch and its report destination. This findings file is the only tracked change; the existing issue-4 developer report is not edited.

- [x] Read issue #4, current `origin/agents/t4`, earlier package reviews and approved R5 closure. Evidence: frozen sources and obligations below.
- [x] Inventory actual bundling/pruning tools and their coverage limits. Evidence: tool inventory below.
- [x] Independently measure installed package closure and the reported approximately 7,546-file interim payload, using only a disposable local tree. Evidence: counts below; whole release artifact not reproduced.
- [ ] Identify exact runtime, dynamic-file, native and notice obligations, including ExcelJS's real use of es-abstract.
- [ ] Compare bounded maintainable options against the unchanged 2,500-file ceiling, without removing formats or platforms.
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
