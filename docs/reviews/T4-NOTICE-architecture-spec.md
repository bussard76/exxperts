# T4-NOTICE evidence and architecture spec review

Verdict: change-spec
Spec: `origin/agents/t4-payload-spec-r2:docs/specs/T4-PAYLOAD-R2.md`, commit `7c62e29a1466af1681b084133a1e7bd77b9c3e22`, especially lines 65, 83–93 and D4.
Prior review: `origin/agents/t4-payload-r2-review:docs/reviews/T4-PAYLOAD-R2-architecture-spec.md`, commit `91ab0a35ceeda50f2a44ed795ea4d06f49b67c91`, especially fit-checklist attribution and binding precision 3.
Review base: local `origin/main`, `cc075a4d371bbdfea6cead35f515df6086f8df28`, 2026-11-06.
Decision: original full notices for three legacy packages remain unverified; this review grants no reduction, distribution, release or acceptance exception.

What this review does: independently checks the supplied local package and archival evidence against the frozen lockfile. It proposes an honest notice/evidence record without treating missing original permission text as recovered or secondary evidence as original-author attestation. This is a technical evidence review, not a legal opinion or a complete attribution audit.

## Architecture impact

Level 1, confirmed for this documentation-only review of the existing packaging module. No export, dependency, route, store, parser, module, process seam or data flow changes. The existing seam remains synchronous `pruneDesktopPayload(appDir, { log, maxFiles } = {})`, called after desktop archive extraction. Full T4 remains under accepted ADR-0002/0003. No maintained `ARCHITECTURE.md` exists; `docs/architecture.md` points to the product/developer guides.

Assumption: the final specialized, independent review-only dispatch supersedes the generic Developer implementation, issue-report, fetch, online issue access and gate instructions. Network research is forbidden; the only authorized remote operation is the final normal fork branch push. Existing local `origin/...` refs are frozen evidence, not a claim of fresh remote state. Only this findings file changes; no helper worker, installation, artifact generation, pruning, opener, product test or full gate runs.

## Fit checklist

| Requirement | Owning module and seam | Evidence or required disposition |
| --- | --- | --- |
| Exact package identity and integrity | Existing lock and package inputs | Five SHA-512 checks against the exact T4 lock pass; hashes below. No changed dependency or lock. |
| Entire recovered saxes notices | Private notice inputs to desktop packaging | Both supplied exact-commit LICENSE snapshots are identical, 3,011 bytes, with two ISC sections and historical MIT text. Preserve all of it and both version mappings. |
| Legacy original notices | Same private notice inputs | All tar members inspected; binary/buffers/chainsaw contain no recovered full permission notice. Three compared mirror files per available mirror also supply none. Original-notice condition remains open. |
| Honest provenance | Existing packaging evidence/sidecar | Separate registry release bytes, supplied upstream snapshots, unsigned mirror bytes, Debian maintainer assertions and a reported Apache discussion. No substituted author/year/permission assertion. |
| Runtime ownership and target retention | Existing desktop stage and count | No change to stage-only ownership, hardlink/symlink isolation, synchronous interface, retained executable entries, shared consumers or actual whole-app ceiling. Full notice/evidence costs count. |
| Acceptance and authority | Controller and original decision owner | Controller may correct evidence descriptions and preserve blockers. No recorded delegation permits silently replacing verified-original attribution with secondary evidence as a completed condition. |

## Independent local checks

Read-only input: `~/controller-exxperts/.build/t4-notice-sources/README.md` and every one of the bundle's 28 files. README SHA-256: `679460213714520a62f5bd589f347662ed13709d85c03fe8cd4d5c3169337c9e`. The README is the Controller's collection account; its historical retrieval/tag/tree statements are distinguished below from checks reproducible on supplied bytes.

Lock owner: `origin/agents/t4` at `f89debed3ab1c2a866e4695aaeae9285d678e18b`, `package-lock.json` SHA-256 `241299ba3ea6768c6f23106795b572480494ffa1394b80df9bb63380753c6b6c`. Independently compared `origin/agents/t4-payload-impl` at `59b08928499c2a91de41d5f9fa1656bc517fa316`: its lock has the same hash. These are package-evidence baselines, not this review branch's installed dependencies.

For each `source.tgz`, recomputed SHA-256 and base64 SHA-512 directly from compressed bytes, matched SHA-512 to the lock's exact `integrity`, checked manifest name/version, enumerated every regular member, searched all member contents for license/copyright/permission markers, and read the candidate manifests/READMEs/source notices. All five supplied manifest and five README copies match their tar members byte for byte. No tar extraction or package execution was needed.

| Package | Exact locked location | Tar SHA-256 | Regular members | Original full notice in tar |
| --- | --- | --- | ---: | --- |
| saxes 5.0.1 | `node_modules/exceljs/node_modules/saxes` | `d39d114627a8c29d1c26fb295dc4c1b81e8805a619f827d39177dfc39904a24b` | 5 | None; manifest says ISC |
| saxes 6.0.0 | `node_modules/saxes` | `1cdf52fbbe1ccbd175c365d2b8e63f46e590e74aff23fa6a44a6ec51522e96db` | 5 | None; manifest says ISC |
| binary 0.3.0 | `node_modules/binary` | `940bc9b40fb2a875876e3ca1be3d05a7a419881e4201c76c83ffbb05568b6909` | 40 | None; manifest and README say MIT |
| buffers 0.1.1 | `node_modules/buffers` | `f8de49c60e467005182d9687b5d87775bbcec6385ac63220b7741327441deb6d` | 6 | None; no manifest license field or text marker |
| chainsaw 0.1.0 | `node_modules/chainsaw` | `01586a6aa1d1174ae07aff69822d01e0704fe30f23ac22221c9b804bab976cfb` | 7 | None; manifest says MIT/X11 |

All 63 regular members were inspected, including nested source/example/test files, not just root filenames. None has a license/licence/copyright/notice/copying path. Binary's README ends with only its MIT label; chainsaw's only license marker is its manifest field; buffers has none. This establishes absence of a recovered full notice in these artifacts, not absence of a license, public-domain status, an exhaustive historical search or proof that no original text ever existed. A lock-integrity match proves agreement with the recorded package bytes; it does not authenticate author permission.

### Supplied saxes upstream snapshots

The Controller reports tag v5.0.1 → `6ef6a275b20f19cb67808daf0d8f64e06aaf5b0e` and v6.0.0 → `211fa0ebec9b628affc09219199639887174bfc3`. Reported original-source locations are [5.0.1 LICENSE](https://raw.githubusercontent.com/lddubeau/saxes/6ef6a275b20f19cb67808daf0d8f64e06aaf5b0e/LICENSE) and [6.0.0 LICENSE](https://raw.githubusercontent.com/lddubeau/saxes/211fa0ebec9b628affc09219199639887174bfc3/LICENSE), with `package.json` at the same commits. These links record supplied provenance; none was accessed by this worker.

Both local `upstream-LICENSE` files independently hash to `0fac2374380621b22e6b50451057721a9c52935b02d16d106a9f04897f061d0e` and compare byte for byte. Each contains:

- The complete Contributors ISC copyright, permission and disclaimer.
- The complete inherited sax ISC section naming Isaac Z. Schlueter and Contributors, including its explanatory paragraph.
- The complete historical Mathias Bynens `String.fromCodePoint` MIT section and its explanation that the code is no longer used.

Do not shorten this to the first ISC block or manufacture a year. Retaining the historical section does not assert its code is present in these releases. The upstream manifest hashes are `d6614eb3d8f62608adea8fbfde612210e6deeb45c073078d1661c92f575e763f` (5.0.1) and `b2206ba4678ba63836ddc85c6425ac4207f0d92b23fd96e059814742f97fdf3a` (6.0.0). Parsed manifests match the corresponding npm manifests except for upstream `private: true`; name, version and remaining fields agree.

These are supplied copies attributed to the original repository at exact commits, stronger than an unversioned label. No upstream Git objects, tag response, signature or npm registry metadata containing gitHead is supplied. The tar manifests themselves have no gitHead. Thus this worker independently verifies content hashes, full text and manifest correspondence, but does not independently authenticate tag peeling, remote retrieval or the README's separate npm-gitHead claim. Preserve that provenance limitation; do not describe the local check as a signed upstream attestation.

### Unsigned release mirrors

The README attributes binary's mirror to [Casear/node-binary at 21a98b1](https://github.com/Casear/node-binary/tree/21a98b1cf0ffe33e992886f28fb0a34ac0e8b3f7), tag `0.3.0`, and chainsaw's to [franchb/node-chainsaw-substack-orig at d1daf26](https://github.com/franchb/node-chainsaw-substack-orig/tree/d1daf26f9c1c3cf21badd9d4206dc441568e733f), tag `0.1.0`. Compared all six supplied files independently:

| Package | File in both npm release and mirror snapshot | SHA-256, identical bytes |
| --- | --- | --- |
| binary 0.3.0 | `index.js` | `f8a30b774d7aa965de3d4d103c5370fd2c63ac4eb9bb5d8713dab72845a090c0` |
| binary 0.3.0 | `package.json` | `355ec61b56448e3d9ad74b286fa07e1b18bcbf153f45223b1a4f68d86bec891f` |
| binary 0.3.0 | `README.markdown` | `0088ddd654bee85917fa48e9e13721fb07437e68f21423e19d9d3734213c9f59` |
| chainsaw 0.1.0 | `index.js` | `2fd46e18cf7cc2f90684023a951f0289c01316f4fb76cec197da14d0449106ba` |
| chainsaw 0.1.0 | `package.json` | `51910ad64abca4eb8c2c23abb2f713ba5220db89ed89c9fd198d27241a5a70ea` |
| chainsaw 0.1.0 | `README.markdown` | `bab1502b1c34cf1ca7fa2086e576f127440f18a7a6b6cabaeb6b591d1cce3042` |

This corroborates identity of the compared release files and their lack of full notice text. It does not make the mirror an author-controlled primary source or authenticate the tag. No complete Git tree/recursive-tree response or signatures are included locally: the README's `truncated: false` and no-notice-path results are collector-reported, not independently repeated here. No exact buffers source mirror is supplied. Do not infer whole-mirror equality from these selected files, or global historical absence from this finite search.

### Debian and Apache archival evidence

| Evidence | Independent local result | Scope and limitation |
| --- | --- | --- |
| [Debian node-buffers 0.1.1-2 copyright](https://sources.debian.org/data/main/n/node-buffers/0.1.1-2/debian/copyright) | `debian-copyright.txt`, 1,649 bytes, SHA-256 `97423a03bc4476a98de2bf3fa7efff55b3f338da76a7b3cbf747b4dc6f52a056` | Maintainer file assigns upstream `Files: *` to James Halliday, 2015, MIT, and cites upstream commit `1b745ee35d33eb166e15ef1866073a07c6d7de87`. That commit's content is not supplied; the locked npm tar has no license field. Preserve both facts. |
| [Debian node-chainsaw 0.1.0-1 copyright](https://sources.debian.org/data/main/n/node-chainsaw/0.1.0-1/debian/copyright) | `debian-copyright.txt`, 1,575 bytes, SHA-256 `50052e6460b658e38cb910e62ea03580f60627b6b4909142eedff10ad7132987` | Maintainer file assigns upstream `Files: *` to James Halliday with no numeric year, MIT. Its full text includes an additional restriction on advertising with the holders' names. Do not replace it with a generic MIT template that loses that paragraph. |
| [Apache archived discussion](https://lists.apache.org/thread/z8qg22wrx84t6z7plnnnyk72oxx9hb24) | Only a URL and summary in README: discussion references three repositories and a 2010 copyright/MIT statement | No saved message, raw headers, author identity evidence, version binding or checksum is present in the 28-file bundle. Cannot verify exact wording, full permission text, provenance or applicability offline. |

Both Debian files have complete permission/disclaimer text and separate `Files: debian/*` attribution. They are primary evidence of what Debian maintainers recorded, secondary evidence for original upstream licensing. Neither is proven to reproduce the author's exact original notice for the npm release. Do not move Debian packaging authors into upstream attribution, adopt Debian's buffers 2015 year as an original-release fact, invent a chainsaw year, or transfer the Apache summary's 2010 date to all three packages. Debian's chainsaw text and npm MIT/X11 label must both remain visible, without declaring their legal equivalence.

The reported binary Debian 404 is also only the collector's account, not a request repeated here. Binary currently has no supplied full permission text even from these archival files. An organizational discussion archive would attest to a recorded message if its bytes were supplied; that alone would not establish original-author permission for a specific release. No legal conclusion follows from these observations.

## Findings and proposed exact treatment

### F1 — major: the original-full-text condition cannot presently be met for three inputs

Where: R2 `docs/specs/T4-PAYLOAD-R2.md:65` and `:87`–`:90`; prior review's binding precision 3.

The supplied original npm artifacts contain no full notice for binary 0.3.0, buffers 0.1.1 or chainsaw 0.1.0. The compared mirror files add no such text. Consequently this evidence cannot pass the existing verified-original requirement. It is possible to document the finite negative search accurately; it is not possible to turn it into a recovered original notice. This does not overturn the prior architecture feasibility pass; it identifies an unfulfilled implementation prerequisite which that review expressly retained.

Proposed factual correction, suitable for a revised specification:

> Record notice discovery separately from package license metadata. Preserve every verified original text in full. For binary 0.3.0, buffers 0.1.1 and chainsaw 0.1.0, record “Full original notice not found in the inspected integrity-matched npm release; original full text remains unverified,” with the inspected hashes and precise mirror coverage. Retain each exact manifest and README. Preserve supplied archival texts separately and identify their source and evidential status. Neither a missing-text record, a license label, a standard license template nor secondary archival evidence satisfies the current verified-original condition. Stop before reduction while that condition is unresolved.

This correction does not require an invented copyright or permission grant. It does not prove redistribution rights or waive any source-retention condition. Stronger evidence may later resolve a package individually; do not make all five packages share one undifferentiated “verified” flag.

### Proposed notice/evidence contents, conditional on the applicable decision

1. Keep R2's existing `node_modules/exceljs/excel.js.licenses.txt` owner for bundle attribution. For both saxes versions, include the **entire** 3,011-byte supplied LICENSE, separately mapped to the exact version/location, tar integrity and original-repository commit/URL. Mark the provenance as Controller-collected, locally hash-checked snapshots. One shared text may be referenced by both version entries only if the mapping and complete text remain self-contained; do not lose the root 6.0.0 consumer's attribution in an ExcelJS-only record.
2. For binary, retain the exact manifest and original README's MIT label; add the explicit unresolved sentence above, exact tar hash and three-file mirror comparison. There is no supplied full original or secondary permission body to insert. Do not fill it with another package's notice, guess a holder/year, or treat an author field as a copyright notice.
3. For buffers and chainsaw, retain the exact original manifests/READMEs and unresolved original-text status. If archival evidence is included in a candidate evidence/notice section, append the **entire unchanged** respective Debian copyright file with source URL, Debian source version, local hash and heading “Third-party archival evidence; not verified original-author notice.” Keeping the complete file preserves its scope annotations and chainsaw's extra paragraph. It does not assert that Debian packaging is bundled or that its authors authored upstream code. Do not silently normalize this into a purported original upstream license.
4. Record the Apache link as an **unverified investigation lead** only. Do not reproduce an unprovided quotation or manufacture a permission body from the README summary. A later authorized collector would need exact message bytes, stable source details/date, author/authority and release-applicability evidence; a fresh reviewer would hash and assess those inputs locally. This worker does not initiate that access.
5. Keep package-location/version/input-path evidence, original integrity and each original-text digest distinct from transformed bundle/sidecar digests. Preserve the unresolved status and decision reference in the existing packaging report/sidecar record; no new runtime protocol, public option, store or generic license framework is needed. Private reviewed data in the existing packaging script can supply approved missing-from-stage texts, as R2 already requires. A host checkout, cache or network lookup at packaging time is not a substitute.

This is an exact evidence-preservation proposal, **not an approved alternative satisfaction of R2**. Source and permission uncertainty remains explicit even if all these bytes are retained. A candidate must not use a header claiming every section is an original notice. Do not ship an empty sidecar, a link-only attribution record or a generic “MIT” sentence as completed verification.

## Authority and decision needed

The Controller's local `decisions.md`, “T4 desktop package ownership direction” and “T4 desktop package R2 implementation” (2026-11-06), authorizes the reviewed stage-only transform **subject to complete notices and every binding R2/review condition**. `docs/coordinator.md` reserves undelegated decisions to Sascha; assumptions are not decisions.

- Within Controller authority: correct factual source descriptions, retain whole recovered texts, distinguish evidence classes, require the checks below, and keep the current failure condition. Selecting self-contained private notice data within the existing seam preserves the level-1 design; no prefactoring is needed.
- Not established by that authorization: deeming secondary MIT text or a missing-original declaration equivalent to verified original permission; accepting uncertainty as a completed attribution/release condition; omitting packages, supported targets or required source texts to make the count fit. Those changes cannot be smuggled in as a precision-only implementation detail.
- If the proposed archival treatment is to replace the original-full-text acceptance requirement, send one explicit choice through the Front under **Needs Sascha**, with the per-package uncertainty and binary's absence of any supplied full body. Recommended current disposition: retain the blocker while an authorized decision owner obtains suitable original/authoritative evidence or decides the permissible alternative. An informed product decision still is not this review's legal clearance. Record the exact dated decision and revised criterion, then obtain independent review of that exact revision before treating it as satisfied.

A factual documentation correction alone is level 1. An attribution-acceptance exception is a decision question, not automatically a new architecture level or an ADR requirement. If the chosen response changes a dependency/public interface, apply level 2; if it changes responsibilities, technology, contract or flow, apply level 3 and require the accepted Sascha-decided ADR. This report makes no such change and does not approve one.

## Retention and proof conditions for the authorized implementation owner

These are future public-entry checks, not tests run or added by this review:

| Check | Positive proof | Negative control |
| --- | --- | --- |
| Existing `apps/desktop/scripts/prune-payload.test.mjs`, D1/D4 → public `pruneDesktopPayload` | Complete exact notices and provenance present before mutation; returned stage contains required sidecar and retained source notices. Packaging is self-contained with outside source/cache/network candidates unavailable. | Missing/truncated/one-byte-changed text, wrong package/version/location, substituted single saxes ISC block, or omitted chainsaw paragraph synchronously refuses before any destructive change. Source/archive/stage-before-failure digests prove isolation. |
| Same D4 seam, unresolved policy | Under current R2, a legacy unresolved record fails; after any explicitly approved revision, assert its exact per-package status, complete permitted evidence and decision reference. | License label, generic template, another version's text, unlabeled Debian substitution, fabricated copyright/year or silent unknown-to-verified conversion cannot satisfy acceptance. No test is weakened to accommodate a false claim. |
| Existing lock/payload checks and D3/D4 | Exact package identity/integrity matched against original inputs; record separate transformed output/text hashes. Whole saxes file equality and both owned locations verified. | Intact plausible manifest with corrupted bytes, wrong-version notice, or root saxes substituted for ExcelJS-owned 5.0.1 fails. A manifest/license-field success alone is insufficient. |
| Actual K1a/K1b/K1c/K1d artifact inventory | Inspect installed source tarball, release/archive and actual pruned desktop separately, including real consumers. All applicable source/native/vendor attribution and executable resources physically remain; actual per-target count/hashes recorded. | A manifest-only dependency, sidecar left only in a checkout, deleted required source header, missing native notice or fallback to parent/global/source/CDN must fail honestly. |
| Whole-app `countFiles(appDir)` and target selection | Every generated notice/evidence/source file in actual desktop app counts toward unchanged <=2,500. Keep release win-x64/darwin-arm64/linux-x64 and desktop win-x64/darwin-arm64; retain existing Koffi targets and target-native notices. | Excess files outside node_modules still fail; no larger maxFiles, hidden compressed evidence, vendor relocation or host-only trim. Linux byte checks do not certify Windows/macOS behavior. |

Retain R2's other notice obligations in full: isarray 1.0.0 README attribution, both JSZip notice sources, pako root and zlib/Gailly/Adler source notices, Koffi/cnoke/node-addon-api/node-api-headers, canvas/native/vendor, PDF/font/CMap/ICC/wasm, photon, Unicode, own/runtime and vendored Node texts. This five-package evidence check is not their audit or permission to drop them. Already-missing source/archive attribution stays with the separately approved package work; R2 must not mutate shared input trees to repair it. An obligation requiring original sources cannot be satisfied merely by copying a notice string.

The provisional 2,274 projection remains conditional; use R2's actual `2,055 + A + T + E <= 2,500`, including added notice/evidence/source costs in E or the recomputed baseline, without double counting. No final artifact was generated or counted here. Sascha's Windows-host waiver does not waive target files/notices; the resource-containment decision does not waive licensing evidence. All original six Result/four Observable items and the added local-open action retain their R2 P/B/O/K1/H1 proof obligations. None is marked implemented or accepted by this review.

## Review checks and self-review

| Binding review item | Executed evidence / result |
| --- | --- |
| Local-only sources and exact refs | Read the 28 supplied files, frozen R2 spec/review and both identical lock baselines; no fetch, `gh`, online source, real documents, model API or external service call. Remote push only as explicitly authorized. |
| Independent integrity and bytes | Inline Python stdlib checks: 5/5 SHA-512 lock matches and declared SHA-256 matches; all 63 regular tar members inventoried/scanned; 10/10 extracted manifest/README comparisons; 6/6 mirror byte matches. Five in-memory one-byte-damaged tar controls no longer match their locked SHA-512; input files remain unchanged. |
| Whole notice content | Both saxes LICENSE hashes/byte equality/length and both ISC plus historical MIT sections checked; both upstream manifests compared field by field. Both Debian hashes/lengths and complete bodies/scopes checked. |
| Honest limits and decision authority | No Apache snapshot or saved Git tree/tag/signature present. Collector claims labeled; missing originals remain open. R2 and existing Controller authority compared without attributing an agent choice to Sascha. |
| Smallest scope, architecture and acceptance | Only this review file; no implementation or new interface; no changed issue acceptance or notice requirement. Independent check is evidence-only and does not certify product/release behavior. |
| TDD, tests and gates | No behavior change, so no behavior tests added/changed. Proposed public-seam positives/negatives above stay with implementation. Typechecks, browser, build/smokes/full gates, dependency installation and release/pruning deliberately not run under the override. |
| Data, outward effects and repository rules | No real work data/secrets, opener, additional checkout, screenshot/binary or protected-file edit. Normal signed commit and branch-only origin push use active hooks without bypass. |
| Documentation verification | Passed hash-literal checks against local evidence, table shape, required sections/obligations and one-file scope. Whitespace checked before commit; local origin/main reconciled without network. Exact signed final SHA/check results in Orca handoff. |

Reconciliation: `git merge --no-edit origin/main` reported already up to date at the review base. During validation the shared local `origin/agents/t4` ref advanced to `386d0dcdfbd1f5defcd1ce87c91f6861dfb8e8cc`; its lock still hashes identically. The first document check rejected comparing that moving ref with the frozen SHA recorded above. Replayed validation against the explicit frozen objects, preserving the original evidence baseline rather than silently changing it. This is a documentation-check correction, not a product test failure or load/environment retry.

Files changed: this review only. Tests added/changed: none. Environment/load retries: zero. Debt candidates: none newly established by this finite evidence review; missing originals and provenance gaps are explicit unresolved requirements, not reclassified optional debt. Earlier R2 55/57 missing-runtime source-suite results are historical, were not rerun here and are not reported green. No assumption of distribution permission, legal equivalence, authenticated remote history, complete attribution or actual target compatibility is made.

Not checked: live source/tag/registry identity, Apache message content, full mirror trees, authoritative missing original notices, whole dependency/native attribution, actual packaged retention/count, product flows or release acceptance. Next owner action: preserve these unresolved conditions, correct the specification's evidence description and obtain the applicable recorded decision before any alternative is treated as satisfying original-notice verification.
