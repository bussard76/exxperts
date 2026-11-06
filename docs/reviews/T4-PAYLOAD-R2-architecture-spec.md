# T4-PAYLOAD-R2 architecture spec

Verdict: pass
Spec: `origin/agents/t4-payload-spec-r2:docs/specs/T4-PAYLOAD-R2.md`, exact commit `7c62e29a1466af1681b084133a1e7bd77b9c3e22`.
Prior independent review: `origin/agents/t4-payload-review:docs/reviews/T4-PAYLOAD-architecture-spec.md`, exact commit `eff68e577db9c1b8a585fdbd22e6db3da2822177`.
Review base: `origin/main` `cc075a4d371bbdfea6cead35f515df6086f8df28`, 2026-11-06.
Level: 1, confirmed for this documentation and the specified private, behavior-preserving desktop-stage transform.
Decision: the Controller's 2026-11-06 “T4 desktop package ownership direction” selects desktop staging only. F1 is corrected in this revision; the precision below binds implementation. This pass completes the second packaging spec review, not the Controller's implementation authorization, a product acceptance pass or permission to distribute an incomplete artifact.

What this change does: R2 confines the full-public ExcelJS bundle and exclusive-code reduction to the freshly extracted desktop app copy. It preserves the shared installation and archive CLI, keeps the synchronous pruning interface and carries forward all consumer, notice, runtime, target and count requirements.

## Architecture impact

The existing packaging module owns this work. Its seam is `pruneDesktopPayload(appDir, { log, maxFiles } = {})`, called synchronously at Step 2a of `apps/desktop/scripts/package.mjs`. That caller extracts a fresh archive, moves its independent app/vendor trees into `build/server`, calls the prune and exits on a thrown error before later packaging. `scripts/bundle-release.mjs` separately installs, bundles and copies the shared installation into its archive; it must not perform this reduction.

R2 preserves a normal return or synchronous throw, uses existing host esbuild 0.28.1 `buildSync`, and adds no export, option, dependency, parser, module, route, store, process seam or product flow. A private implementation at this seam fits level 1. Full T4 remains level 3 under accepted ADR-0002/0003. There is no maintained `ARCHITECTURE.md`. Any changed interface or ownership beyond this plan needs the applicable approval; a ceiling or fidelity failure is an escalation, not permission to widen scope.

## Fit checklist

| Requirement | Owning module and seam | Evidence and required disposition |
| --- | --- | --- |
| F1: shared installation/archive/CLI preservation | Desktop Step 2a and existing synchronous prune | R2:51–57 selects only `apps/desktop/build/server/app/`; source, packed dependency, release-root install, archive and vendor Node remain untouched. D1 byte hashes and D2/K1b real CLI consumers prove this later. |
| All desktop consumers and dependency ownership | `shippedPackageDirs`, actual retained server/children/helpers | R2:61–67 derives location-resolved other-consumer closure before mutation. Shared dependencies remain executable even when also embedded. Independently reproduced the historical 65/187 split; it must be recomputed for the final graph. |
| Full public ExcelJS identity | Existing `exceljs/excel.js` main | R2:63–65 pins 4.4.0, original manifest/main, full public CJS entry, ESM default interop and retained browser target. Independent synchronous bundle and narrow public probes pass below; no internal Workbook shim or browser replacement. |
| Dynamic and own-location imports | Private candidate audit before reduction | R2:64 requires input/location/version/digest review, builtin-only externals and refusal of unknown dynamic/own-location behavior. Existing server audit alone and a warning-free metafile cannot certify this output. D3 injects failures. |
| Owned parser closure, no new parser | ExcelJS-local saxes and location-resolved xmlchars | R2:74 preserves nested saxes 5.0.1, its main/manifest and xmlchars 2.2.0 XML/XMLNS files; root saxes 6.0.0 cannot substitute. Both versions independently resolved as stated. Retention does not authorize adding a direct parser read. |
| SheetJS and existing spreadsheet/text consumers | Existing FILE_PACKAGES and actual child consumer | R2:75 keeps unchanged 0.20.3 CDN ownership, full generic-pruned 18-file package, SSF/codepages/cpexcel and runtime spreadsheet/shelf consumers. Registration belongs to the approved consumer work; no new interpretation here. |
| Word and existing fetch_url | docx-preview/jsdom/JSZip file packages | Exact 0.4.1/26.1.0/3.10.1 and full file-relative closure retained, including generated DOM interfaces, XHR worker, js-globals, nested parse5/entities and encoding tables. Existing lazy source-URL/Readability extraction and loud missing-package behavior remain proving checks. |
| PDF/native/browser/regex resources | Existing file packages, copied assets and native loaders | R2:77–80 preserves PDF legacy parser/worker/CMaps/fonts/wasm/ICC, target canvas, all currently retained Koffi targets and four notices, Playwright drivers/data and recheck/synckit/native workers. Only the existing optional recheck-jar exclusion applies. |
| Complete actual attribution | Original inputs and private notice data → stage | R2:83–93 explicitly requires exact README/source/upstream/native/vendor texts, including shared embedded inputs. Pre-pruned text has a self-contained versioned source; absent/unverified attribution fails before reduction. Named files and license labels are insufficient. Actual complete notice verification remains implementation evidence. |
| Original lock and transformed-byte provenance | Existing lock/SBOM checks plus artifact evidence | Preserve exact declarations, versions, integrity, overrides and 23 libc annotations. Record original inputs, output and notice hashes separately; an unchanged manifest does not attest unchanged bytes. No dependency upgrade or override is approved. |
| Whole app ceiling and honest projection | Existing `countFiles(appDir)` | R2:95–111 retains <=2,500 for every file in actual app/, including entries/notices; archive separately stays <=15,000. The illustrative 2,274 is conditional and excludes additional E costs such as browser entry/source notices. No maxFiles increase, hidden archive or vendor relocation. |
| Node and supported targets unchanged | Ordinary install, release runtime and per-target stage | Keep Node >=20.6.0 and vendored 24.22.1; release win-x64/darwin-arm64/linux-x64, desktop first two. PDF's declared engine discrepancy remains unresolved until disposition/evidence. Linux and compiler syntax target establish no broader compatibility. |
| Test-first public behavior and artifact proof | D1–D4, K1a–K1d and existing P/B/O harnesses | Separate real tarball dependency install, release-root install/archive CLI and actual pruned desktop; use real child → guarded route → browser, invented files, literal expectations and fake services/openers. Negative/missing/mis-versioned assets and poisoned outside-root resolution remain mandatory. |
| R5 and later decisions, no scope reduction | Child/route/UI and local-open owners under accepted ADRs | All P1–P5, B1–B7, O1–O4, K1/H1 retained. Sascha's containment and Windows-host waivers apply exactly; missing-sheet/date-serial conflicts stay with Controller, not a packaging parser or partial success. |
| Honest checks and integration | Developer, independent Tester/Architect, Controller | R2 preserves failed 55/57 evidence and real runtime-build prerequisites; targeted Developer checks, gated browser proof, independent Tester/wave full gates and T4 conformance remain separate. No full gate in this review. |

## Findings and binding implementation precision

No design-relevant blocker remains. Prior F1 is addressed by changing the output owner rather than trying to justify shared-install deletion against only server roots. The Controller selection was checked directly in this project's `~/controller-exxperts/decisions.md`; it is not attributed to Sascha.

Carry the following precision into the Developer dispatch without another spec round:

1. **Prove all input isolation before the first write.** D1 includes the explicit R2 no-hardlink condition as well as physical symlink/path containment. Resolving a path inside the stage does not detect a hardlink to a source/archive inode. Use independent-copy fixtures and a linked-file refusal/control; source/archive hashes must remain identical on success and failed preflight. Host esbuild supplies the compiler only, never missing stage inputs. This implements R2:55/61, not a new artifact owner.
2. **Retain the original advertised browser entry and every required source notice.** D3/D4 must cover the real pinned package, not synthetic empty manifests. Include `dist/exceljs.min.js` and applicable companion/attribution files in E, and actually load the public CJS/ESM entries. Compare export/constructor behavior separately from narrow workbook fixtures; streaming exports existing does not prove all streaming behavior equivalent.
3. **Apply the existing pre-pruned-notice rule to every missing required text.** The packed `files` allowlist does not establish that root/runtime NOTICE/LICENSE paths exist in the extracted stage. Verify actual archive inputs; materialize absent applicable texts from the same exact, reviewed private-data mechanism or stop. Do not add a source-checkout/network dependency, weaken attribution, or change the shared archive to make the desktop operation work. Any separate source/archive attribution correction stays with the already approved package work. Complete source/native/upstream texts and obligations must be reviewed before implementation acceptance; this report does not certify them.
4. **Preserve executable checks independently from metadata closure.** Manifest-only inlined dependencies may remain for identity/lock accounting; an entry still consumed by a retained module may not become manifest-only. D2 executes another real shared consumer after pruning and unchanged archive settings/auth initialization. D4/K1 deliberately damage main/parser/resource/native/child files while leaving manifests plausible and require failure without source, parent, global or CDN rescue. Existing tests may be extended through public seams, never skipped or weakened.
5. **Do not convert design feasibility into acceptance.** Recompute the graph, complete notices and whole-app A/T/E for actual targets. Follow the test-first D1–D4 slices and real installed/pruned P/B/O/CLI checks; obtain Controller dispositions for the already escalated Excel fidelity/runtime conflicts. If actual preservation cannot fit <=2,500 or stay within the synchronous seam, stop and escalate. No new parser, XML pass, dependency or feature omission follows from this pass.

## Independent evidence

Used a disposable `git archive` of frozen research source `c780e72d6361b692f5ab09d18cc6907b9b5ff0bf` under this worktree's ignored `.build/`. Normal-lifecycle offline `npm ci --offline --no-audit --no-fund`, with `EXXETA_SKIP_BROWSER_INSTALL=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, installed 1,026 packages; the recorded completion exited 0. Installation was replayed once to retain an explicit completion receipt. Node 22.23.4/npm 10.9.9; esbuild 0.28.1. Lock SHA-256 stayed `241299ba3ea6768c6f23106795b572480494ffa1394b80df9bb63380753c6b6c`.

No live package producer, real installation prune, external package/advisory service, browser download, model API, document service or opener ran. The following are independent local experiments, not product implementation:

| Check run | Result and limit |
| --- | --- |
| `node .build/r2-public-probe.cjs`, exact `buildSync` public-entry flags | Passed synchronously: 690 inputs, 81 es-abstract inputs, 2,545,486 output bytes, zero warnings, only builtin recorded externals, no textual dirname/filename/require.resolve sites. Byte count depends on the synthetic source label; no byte identity with prior probes claimed. |
| Same probe: public surface and browser load | Original/candidate top-level and stream-xlsx export keys agree; Workbook/ModelContainer/stream constructors exist; dynamic import's default equals CJS exports. Original advertised browser file loads in a CommonJS VM context. This is neither browser rendering nor exhaustive API/stream equivalence. |
| Same probe: independently authored OOXML | Raw XML zipped with JSZip, never an ExcelJS writer: two named sheets, literal cached formula result 42, false boolean, bold/color/fill/left border/width/number format; xlsx and macro-enabled content-type variant pass through original and candidate. Damaged bytes reject. No VBA fidelity/execution or product preview claim. |
| Same probe: fresh isolated subprocess | Candidate loads the invented xlsx while every nonbuiltin load except the candidate itself is refused; empty NODE_PATH/NODE_OPTIONS and `--no-global-search-paths`. Original `excel.js` SHA-256 remains `6d333aaa3b9a95067a5e71902eaa63f5fe774ee3b24ad6e427f33f2f59b5c4f2`. This narrow probe runs under ignored fixtures, not the required future outside-checkout installed product. |
| `node .build/r2-closure-probe.mjs`, nonmutating package counts | Reproduced 252 locations, 7,974 files, 7,330 after `.d.ts` predicate and 6,542 after generic-prune predicates; other closure 65 locations/1,663 files; exclusive set 187 locations/371 manifest-or-named-notice files. Actual installed graph, not a deletion whitelist. |
| Same probe: package-local parser and notices | ExcelJS resolves nested saxes 5.0.1, root resolves 6.0.0, xmlchars is 2.2.0. Confirmed isarray 1.0.0 README copyright, absence of owned saxes named notice, and separate pako zlib/Gailly source notice. No complete upstream/native attribution certificate. |
| Same probe: F1 negative control | Disposable actual proper-lockfile/graceful-fs/retry/signal-exit packages: public lockSync import passes; manifest-only graceful-fs then fails with MODULE_NOT_FOUND under sanitized subprocess resolution. Untouched original import still passes. Confirms why shared-install reduction is forbidden; does not implement/test the future desktop transform. |
| Frozen `npm run test:scripts`, all four configured suites | **FAILED: 55/57 passed, 2 failed, 0 skipped.** Same exact missing-runtime prerequisites as prior review, detailed below; no product regression or passing source-suite claim. |

The independent arithmetic supports only the stated conditional projection: 1,663 + 371 + 3 + 18 = 2,055 package files; with historical 216 app files and three own/runtime notices, 2,274. Final acceptance remains **2,055 + A + T + E <=2,500**, with A the actual complete app portion, T the signed target delta and E all unrepresented runtime/entry/source/native/notice costs. Browser retention alone adds an E cost. Neither optional native absence nor keeping manifests establishes the final graph or file ceiling.

The later implementation must separately report K1a (actual tarball dependency installation), K1b (release-root install and real archive CLI/settings/auth), K1c (actual desktop server entry, child, guarded route and real browser before/after prune), and K1d (physical resolution and deliberately damaged artifact controls without fallback). This review's standalone probes satisfy none of those installed-product checks. D1–D4 remain the test-first public prune/check/lock entry points; P/B/O preserve real producer and consumer assertions rather than fake display-model success.

The two script failures are `scripts/bundle-server.test.mjs:48` (missing generated `runtime/packages/coding-agent/dist/config.js`) and `:81` (missing `runtime/packages/ai/dist/utils/oauth/oauth-page.js`). The suite's header and test inputs require a real prior runtime build. These are reproducible prerequisite failures, not timeouts/load debt or foreign-host/network failures. No fake dist, test weakening, bypass or out-of-scope runtime build was used. Later authorized implementation/Tester checks must supply the real generated inputs and report the suites green before acceptance.

## Issue acceptance preservation checklist

These are future proof obligations, not product checks passed by this review. The specialized review-only dispatch supersedes the generic implementation/report instructions; `docs/reports/issue-4.md` is untouched.

| Issue item | Preserved behavior and named proving check | Status here |
| --- | --- | --- |
| Result 1 | PDF/image/Word/Excel tabs beside Markdown; P1–P4/B1/B3/B4/B7 | Preserved; product proof open |
| Result 2 | Reactivate one tab and active tree; B1/B2 | Preserved; product proof open |
| Result 3 | Close, right-then-left neighbour, last closes pane; B2 | Preserved; product proof open |
| Result 4 | Every sheet, sheet switching/two-axis scroll, stored results and basic fills/fonts/borders/widths/formats; P2/B3 | Preserved; package probe only, real producer/browser open |
| Result 5 | Word text/tables/decoded images and basic look; P3/B4 | Preserved; product proof open |
| Result 6 | Read-only, no edit/save/download/file mutation; B5 | Preserved; product proof open |
| Observable 1 | Full build/smokes with workspace-file-preview and workspace-file-tabs-ui; independent Tester/wave | Preserved; not run here; frozen script suite failed 2/57 |
| Observable 2 | Independent invented styled two-sheet/cache workbook and styled Word/image fixture; P2/P3/B3/B4 | Preserved; narrow package xlsx probe only |
| Observable 3 | Display cached result, no formula; P2/B3 | Preserved; literal 42 at package level only |
| Observable 4 | Sascha's own files, look, sheet switching/reactivation; H1 | Preserved; human acceptance only |
| Added signed-off action | Eligible header action, fixed labels/failure sentence, paired/shared hiding and guarded local POST; O1–O4/B6 | Preserved; fake-only worker checks, human OS/Electron acceptance |

Sascha's “Abbruch reicht” accepts existing isolated-child heap/deadline containment and a plain failure sentence with server survival. It does not authorize a parser, XML validator, second saxes pass or silently missing sheets. The 30,000-merge application remains a Front assumption; exploratory 5,000-merge timing is not a guaranteed threshold. The ordinary ExcelJS original-serial/missing-declared-sheet conflicts remain explicit Controller decisions to settle, not scope reductions accepted by this review.

“Ohne Windows-Nachweis” waives the mandatory real Windows host for ticket completion. Keep simulated Win32 coverage, supported target files and explicit real-system opener/native debt; do not reinstate the waived host prerequisite or claim unrun Windows evidence. Exact jsdom 26.1.0 supersedes 29.1.1; other package approvals, existing consumers, bounded legacy decoder contracts, source/native notices and release advisory obligations remain. The approved stale Koffi fixture correction preserves rejection with unshipped tsx and independent Koffi negatives; it grants no general test weakening.

## Prefactoring

None. Keep this private inside the existing desktop prune module; reuse the package-closure and audit approaches without new public helpers, a tracing framework or a generalized pruner. The current extraction/call/error structure is sufficient.

## Checks, self-review and handoff

| Binding instruction | Review disposition and evidence |
| --- | --- |
| Exact revision, independence and scope | Read exact 7c62e29 and eff68e5, research 1ad61128cf541b0460ef88536481e9f4c43ab8b8, R5 approval/contracts, package/Node review conditions, actual packaging code, accepted ADRs and this project's Controller decisions. No helper worker or product implementation. |
| Think first, smallest complete review, architecture level | Stated review-only assumption first; traced stage ownership and synchronous seam, independently checked feasibility and concrete F1 failure. Level 1 confirmed; no public/import/flow widening or scope reduction. |
| TDD/public seams and honest future evidence | R2 D1–D4 prescribe failing public tests before each behavior slice; K1a–K1d/P/B/O cover actual installed/pruned route/browser/CLI and negatives. No product tests added by this prose review; disposable probes are not claimed as test-first product work. |
| Every acceptance item and prior finding | All six Result/four Observable rows plus added action mapped above; F1 correction and all binding preservation conditions traced in the fit checklist. No acceptance row marked implemented. |
| Build/test ownership and failure honesty | No full gate, browser or product build here. Frozen four-suite result recorded as failed 55/57 with exact real prerequisites. Future targeted checks, gated browser, independent Tester/wave and T4 conformance remain binding. |
| Files, data and outward effects | Only this review file is tracked/committed. No product/dependency/lock/protected file changed, real user data read, real service/opener/model call, screenshot/binary commit, issue comment or upstream write. Invented disposable fixtures only. |
| Ponytail review and diagnosis | Reviewed connected consumers, correctness/retention, expected local desktop/CLI use and minimal seam. Reproduced concrete F1 public-import refusal and missing-runtime test failures; no speculative defect or style blocker added. |
| Report and assumptions | Tests added/changed: none. Historical 216 app files/closure and target costs remain assumptions. Complete notices, product correctness, actual installed/pruned count and Node/target evidence are required future work, not hidden passes. |

Existing debt candidate: `tests`, major — real Windows opener/native behavior remains unverified under the explicit waiver; perform authorized invented-data verification when a suitable host/user is available. Missing notice texts, actual artifact count/closure, unresolved Excel fidelity and advertised-runtime disposition are preserved obligations, not newly optional debt. No separate debt file is edited.

Final reconciliation: fetched origin and merged origin/main; already up to date at `cc075a4d371bbdfea6cead35f515df6086f8df28`. The required final frozen affected-suite rerun again returned **55/57 passed, 2 failed, 0 skipped**, at the same missing-runtime inputs. This was a reconciliation rerun, not a successful flake retry. Environment/load retries: zero. Review contract/table/one-file scope and whitespace checks are repeated before the signed push; temporary source snapshot, probe scripts and invented fixtures are removed before handoff. Exact final `agents/t4-payload-r2-review` SHA is supplied in the Orca handoff.

Not checked: full/runtime build, real packaging or desktop prune, installed product/CLI initialization, real producer/route/browser fidelity, complete upstream/native notice texts, other Node/target execution, live advisories and human acceptance. This design pass must not be used as evidence that those checks passed.
