# T4-STAGE compatibility architecture review

Verdict: change-spec
Reviewed commit: 59b08928499c2a91de41d5f9fa1656bc517fa316
Spec: `docs/specs/T4-PAYLOAD-R2.md` at `7c62e29a1466af1681b084133a1e7bd77b9c3e22`
Prior review: `docs/reviews/T4-PAYLOAD-R2-architecture-spec.md` at `91ab0a35ceeda50f2a44ed795ea4d06f49b67c91`

## Architecture impact

Level 1, documentation-only independent compatibility review of the existing desktop packaging/prune module. No implementation, exports, dependencies, routes, stores or product data flows change. The specialized review-only dispatch supersedes the generic Developer implementation/report steps; this is the sole findings file, as required by the read-only reviewer rule. No full gate or actual packaging is authorized.

## Checklist and plan

Issue #4 acceptance is retained, not certified by this staging review:

| Item | Result or observable acceptance | Review scope/status |
| --- | --- | --- |
| R1 | PDF/image/Word/Excel tabs beside Markdown | Product implementation and browser proof remain outside this review |
| R2 | Reactivation without duplicate tab; active tree marking | Product proof remains open |
| R3 | Close active tab to neighbour; last closes pane | Product proof remains open |
| R4 | Every Excel sheet; switching/scrolling; stored results; fills/fonts/borders/widths/number formats | Staging must retain dependencies; producer/browser proof remains open |
| R5 | Word text/tables/images and basic look | Staging must retain dependencies; producer/browser proof remains open |
| R6 | Read-only, no editing/saving/downloading controls | Product proof remains open |
| O1 | Build/smokes including workspace-file-preview and workspace-file-tabs-ui | Independent Tester/wave; explicitly not run here |
| O2 | Invented styled two-sheet/cached-formula workbook and styled Word/image fixtures | Genuine producer proof remains separate from mock packaging fixtures |
| O3 | Display cached formula result, not formula | Product proof remains open |
| O4 | Sascha checks real Excel/Word appearance, sheet switching and tab return | Sascha only; no worker access to real files |

Review deliverables, in order; commit and push completed slices:

- [x] Read repository/worker rules, issue #4, skills and frozen target identifiers; establish a clean branch from fetched origin/main.
- [x] Trace actual extraction, platform support, prune callers and public tests; define trusted physical stage and stable identity with precise race limitations and adversarial checks.
- [ ] Specify coverage-preserving, test-first fixture migration and the exact approval needed to correct existing tests; distinguish mock provenance from unresolved real notices/artifact proof.
- [ ] Record bounded algorithm, architecture scope, risks, verdict and item-by-item self-review; reconcile current origin/main, run appropriate documentation checks, commit and push.

Assumptions: review-only instructions control; existing synchronous public prune is the agreed seam; isolated invented fixtures only; no real service, opener, browser, release or packaging run. No notices are invented or accepted by this review.

What this change does: this review separates trusted checkout aliases from links introduced into an extracted desktop payload. It specifies a bounded correction at the existing synchronous prune and packaging CLI seams, and a migration of the existing public tests without weakening the real artifact requirements.

## Actual ownership and platform evidence

All implementation line references below are to the frozen reviewed commit, not this documentation branch.

| Evidence | Consequence |
| --- | --- |
| `apps/desktop/scripts/package.mjs:38–40,137–157` | Paths come from the script location. Step 2 deletes old `build/server-stage` and `build/server`, extracts into the former, then moves `exxperts/app` and `vendor` into the latter. The extraction parent must be trusted before extraction; Step 2a is too late to protect extraction itself. |
| `package.mjs:58–79,137–140,158–174` and `electron-builder.yml:20–28,46–67` | Desktop targets are darwin-arm64 and win-x64. Native macOS/Windows tar handles their release tar/zip archives; cross-target Windows packaging consumes an existing matching archive. Linux is a diagnostic host, not another supported desktop target. Preserve target flags, signing behavior and separate vendor Node owner. |
| `scripts/bundle-release.mjs:558–590` | The archive producer copies dereferenced independent regular files/directories, preserving modes and rejecting broken links/cycles. There is no product need to retain archive-created symlinks inside the desktop stage. This justifies refusing all such links, including internal ones, rather than adding alias-aware recursive pruning. |
| `prune-payload.mjs:103–120` | Every lexical ancestor is rejected if linked. Physical preflight then scans the stage, permits internal symlinks without traversing them, and rejects regular-file hardlinks. It does not establish the caller's ownership or atomic race safety. |
| `prune-payload.mjs:121–143` and `scripts/bundle-server.mjs:371–441` | The original argument is reused after physical preflight; helpers also use lexical `path.resolve`/`path.join`. `checkServerFiles` accepts much of the synthetic manifest-only fixture. R2's complete executable/notice preflight is not implemented here. |
| Existing public tests | Desktop prune: 12 tests at this tip. The release-prune suite tests pruning policy, not `package.mjs` extraction. There is no existing public package-CLI extraction test proving the ownership assumptions. New tests belong in the existing desktop prune suite, invoking the CLI as a subprocess where needed, without exporting a helper or adding a stage-only option. |

Expected use is one local packaging process working on one private extracted copy. A document/network attacker cannot change this tree. A competing packaging process or a process already able to replace the user's directories is a different writer; the latter is outside the repository's blocker threat model. That distinction must not be concealed in a claim of race immunity.

## Findings

### [major] F1 — blanket ancestor rejection breaks trusted checkout aliases

- Where: `apps/desktop/scripts/prune-payload.mjs:104–107`; test at `prune-payload.test.mjs:235–243`.
- Problem: a valid independent stage reached through a checkout directory symlink throws `stage path contains a link` before pruning. A macOS system ancestor alias has the same failure shape if the supplied path retains it. The fixture builder's `realpathSync(os.tmpdir())` change hides that spelling from ordinary tests; it does not prove compatibility. Node may already canonicalize the script path in some launch modes, so this is not a claim that every default macOS launch fails.
- Violates: supported darwin-arm64 desktop and R2 D1's physical-stage ownership requirement; ancestor aliases do not themselves prove that a stage file aliases source data.
- Fix: establish a trusted physical parent before creating the stage, then freeze and use the canonical physical app path for every subsequent operation. Reject links at or below the owned stage, not aliases above that trusted parent. Detailed algorithm below.
- Proving test: S2 below is already red through the actual public prune. Future A2/A3 must become green, with A4/A5 retaining malicious-link refusal.

### [major] F2 — lexical and physical path spellings can select different trees

- Where: `prune-payload.mjs:104–108,120–127` and its recursive helpers' `path.join` calls.
- Problem: on this Linux/Node host, `trusted/alias/../app`, with `alias -> other/subdir`, names `other/app` to the filesystem. `path.resolve` and non-native `realpathSync` instead selected `trusted/app` in the controlled probe. The public prune threw only after deleting files from that second, unselected tree. No concurrent writer was required. `package.mjs` currently constructs a normalized argument, so this is a public-prune path defect, not a demonstrated normal CLI exploit.
- Violates: D1's single physical output owner and refusal before unintended mutation. Under the generic review threat model this unusual caller spelling is edge-case debt; it is a required correction in this explicitly assigned stage-boundary review, not a newly claimed remote attack.
- Fix: reject raw parent-traversal components before lexical normalization at this seam, and obtain the physical identity with native realpath semantics. After acceptance never reuse the original spelling. Do not fix this by globally changing the shared resolver.
- Proving test: S4 below is already red; A8 must refuse synchronously with all fixture trees byte-identical.

### [major] F3 — the test fixtures cannot satisfy the accepted R2 preflight

- Where: `prune-payload.test.mjs:43–101,143–195,261–265`; R2 D2–D4 and prior review precision 2–4.
- Problem: the passing builder supplies most packages as version-1.0.0 manifests with no main code. ExcelJS has the pinned version but no `main`, `excel.js`, browser entry or executable owned saxes. Koffi's addon/notice bytes are explicitly invented. Merely tightening production preflight makes positive prune tests fail for fixture invalidity before their existing graph, keep/drop and ceiling assertions run.
- Fix: migrate fixture construction and overrides with approval, keep every existing behavior assertion, and add real-input transformation cases independently of the invented graph cases. No production fixture recognition, reduced preflight or fabricated upstream notice is permitted. Exact migration and approval are below.
- Proving test: S3 confirms the incompatibility on the current passing public prune. Future M1–M7 cover the corrected fixture and real-artifact obligations separately.

## Bounded physical-stage algorithm

This is a proposal for the existing packaging module, not implemented code or permission to begin deleting. No generalized filesystem framework or prefactoring is needed.

1. **Trust establishment belongs to the caller.** `package.mjs` owns a freshly extracted private copy; `pruneDesktopPayload` cannot infer extraction provenance from an arbitrary string. Before Step 2's cleanup, resolve the existing trusted build parent physically, using native realpath semantics and directory identity. Allow legitimate system/check-out aliases above this point. Freeze this parent once; construct the owned `server-stage`, `server` and final `app` paths from it. Reject a linked owned child rather than following it. Do not use an `app` suffix, repository prefix or matching package name as proof of ownership. The direct public-prune caller likewise must select a private independent fixture/stage; this trust precondition is not a new option or token.
2. **Keep archive trust distinct.** Input must be the project's trusted matching release archive. Existing `tar -xf` runs before prune and is not an untrusted-archive sandbox. Do not claim that preflight prevents tar member traversal, links or writes made during extraction. Handling hostile arbitrary archives would require a separately scoped extraction design; no such contract is introduced here. Fixture tests fake the runner and never extract or package a real release.
3. **Freeze physical app identity.** Refuse parent-traversal components in the raw app argument before `path.resolve` can erase them. Require the app leaf to be an actual directory, not a symlink/junction. Resolve the physical path once and bind it to the trusted parent's expected child and a directory identity tuple such as bigint `(dev, ino, type)`. Do not use mtime/ctime as stable directory identity: own writes change them. Compare canonical containment with platform `path.relative`, refusing absolute results and `..` segments; never use an unseparated string prefix or unconditional lowercasing. Include the expected physical parent identities. If a supported host cannot supply usable identity information, stop and report that platform limitation; do not silently turn identity checking off.
4. **Complete immutable preflight.** Traverse the physical stage without following links. Reject every symlink/junction inside the owned tree, broken/cyclic links, nonregular special files and every regular file with `nlink != 1`, including manifests, inputs, resources, outputs and notices. Check the complete tree, not only the bundle inputs. A copied inode need not match the source inode; independent copies and original-input hashes provide provenance. Native Windows reparse types need corresponding host evidence; a Linux symlink test is not comprehensive Windows reparse proof. Preserve the archive producer's executable modes. Snapshot identities and content hashes for the approved input/notice inventory and compute the complete retention/deletion plan before the first write.
5. **Use one root everywhere.** All counters, `shippedPackageDirs`, input resolution, compiler resolution directory, output paths, pruning and `checkServerFiles` receive that same frozen physical root. No original caller spelling or host package fallback is used again. Build/audit candidate bytes in memory with the R2 pinned public-entry settings. Missing inputs, entry shapes, provenance or original notices fail before mutation. Do not mark the currently partial implementation as doing this already.
6. **Fail on observed replacement; require exclusive writers.** Recheck root/parent and affected path identities before each mutation phase and at handoff; revalidate any executable inspection subprocess's inputs afterward. Enumerate from the physical root and remove only the inventoried non-link entries in postorder; avoid blindly recursive deletion of a path whose descendants were not checked. Do not call caller-supplied logging during mutation; log only after the operation has finished. A changed inode, new entry/link, file hash or hardlink count aborts before touching that affected path. Fail closed and recreate a fresh stage after partial in-stage failure; no rollback or permission to repair/delete the source/archive is implied.
7. **Keep supported behavior unchanged.** Return normally or throw synchronously. Keep the same export and options, default whole-app ceiling exactly 2,500, public ExcelJS entry/API and browser file, all retained consumers/resources/notices and original manifests. No maxFiles increase, vendor relocation, host-only native trim, new dependency, route, public seam, process, durable store or shared-archive mutation.

**Race limit:** native realpath, inode checks, synchronous JS and a process lock do not make a later pathname-based write atomic. A hostile writer can replace a directory between the final check and the filesystem call; canonical ancestors can also be renamed. Portable Node pathname APIs here do not expose a cross-platform descriptor-relative, no-follow traversal/mutation guarantee. Therefore the level-1 recommendation explicitly requires a trusted, exclusively owned stage and stable physical ancestors for its lifetime. Repointing an allowed lexical checkout alias after root capture must not redirect operations; observed owned-path replacement must fail. An arbitrary same-user adversarial mid-syscall swap cannot honestly be promised safe by this plan.

If the Controller requires protection against that stronger writer instead of the repository's stated attacker model, return to architecture review before implementation. Handle-relative/native confinement or a new isolated runner/sandbox changes technology/contract and is level 3, requiring Sascha's accepted ADR. Repeated lstat calls, a Linux-only `/proc/self/fd` trick or chmod against a same-user attacker is not an acceptable substitute. This review supplies no such technology or guarantee.

## Exact stage tests to add first

Future test labels below describe required cases, not tests already committed or passing. Call only the existing public prune or the existing package CLI; no new public production hook. All source/archive/outside paths are invented sibling directories inside the disposable test root. Snapshot all bytes, paths and relevant modes outside the approved stage before and after success/refusal, not just the list of names.

| ID | Public case | Exact observable assertion |
| --- | --- | --- |
| A1 | Independent canonical source/archive/stage copies, valid preflight | Synchronous `undefined`; only stage changes; every source/archive byte/mode stays equal. Repeat the existing graph and keep/drop assertions. |
| A2 | Same stage through a trusted checkout ancestor directory alias | Same output and count as A1; normal return. No source/archive mutation. This is S2's red-to-green case. |
| A3 | Two trusted aliases modeling a macOS temporary/system ancestor, plus spaces and non-ASCII invented directory names | Same result as canonical path, without writing `/var`, `/tmp` aliases or any real system path. A later authorized native macOS run, not the Linux simulation, proves host behavior. |
| A4 | App leaf is a symlink/junction to source, archive or sibling | Throw before any mutation; retain existing root-link refusal. Also reject owned `server`/`server-stage` substitution at the package CLI before cleanup/extraction. |
| A5 | Stage contains file/directory symlink to source/archive/parent, prefix sibling `app-extra`, dangling link, cycle or link that leaves and re-enters | Throw before mutation for every case, even if the final target appears internal. A wholly internal link also fails: archive production already dereferences these. |
| A6 | A kept file, removable file or manifest is hardlinked to a source/archive file; separately a link entirely within stage | Throw before mutation in each case; all bytes unchanged. Link independence cannot be proved by realpath alone. |
| A7 | Package exists only in poisoned parent/host install, or stage resource resolves outside root | Throw before mutation; zero parent/global fallback. Missing owned saxes cannot be rescued by root saxes. |
| A8 | Raw `alias/../app` spelling from S4 | Synchronous refusal and both lexical/physical trees byte-identical. Relative ordinary paths may still work; canonical-root use is verified by A2. |
| A9 | Repoint a trusted lexical checkout alias after physical-root capture | It cannot redirect pruning to the new target; pinned original stage only, or controlled abort. Never mutate the new invented target. |
| A10 | Replace owned root/parent, or insert a linked/hardlinked file after preflight but before a mutation phase | An observed identity mismatch throws; outside trees stay unchanged. Preserve the explicit atomic-race limitation; passing this scheduled case is not universal race proof. |
| A11 | Case/drive/UNC-like target spelling and Windows directory junction | Native Windows behavior must keep containment and identity; simulated platform strings prove only their pure checks. Preserve the real-Windows-host waiver and record remaining native verification as debt. No claim that Linux validates Windows semantics. |
| A12 | Existing package CLI, fake tar/node/npx runners, invented matching archive pathname | Positive runner copies an invented tree and reaches Step 2a; negative runner substitutes owned links and is refused before prune or later npx. Stop the harness at a fake runner sentinel before fetching icons/tools or invoking electron-builder. No actual release archive, network, signing or external app. |

A9/A10 require controlled scheduling, not a sleep-based race that sometimes passes. At the CLI, the fake extraction runner can deterministically alter the invented tree before returning, proving post-extraction refusal. For finer in-prune timing there is no existing public scheduling seam. Do not introduce a production test option or replace these cases with a private-helper assertion. The Controller must explicitly approve a test-only scheduling harness around real filesystem calls (without faking their results) if finer timing is required; otherwise record the unproved race coverage and retain the single-writer limitation. No such harness was added in this review.

## Independent reproductions performed

Frozen target extracted with `git archive` into ignored `.build/t4-stage-review-source`; no implementation file in the worktree was changed. Installed its exact lock using `EXXETA_SKIP_BROWSER_INSTALL=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --offline --no-audit --no-fund`, normal lifecycle: 1,026 packages, exit 0. All test temp paths were redirected beneath this worktree's `.build/t4-stage-fixtures`. No full suite/runtime build, browser, actual release extraction, package or opener ran.

| Invocation | Result and limit |
| --- | --- |
| `TMPDIR="$PWD/.build/t4-stage-fixtures" node --test .build/t4-stage-review-source/apps/desktop/scripts/prune-payload.test.mjs` | **12/12 passed**, zero skips. Unchanged frozen tests, diagnostic host only. |
| Same command selecting `stage-review-probe.test.mjs`, first run | **2/3 passed, 1 failed**: S1 canonical synchronous prune passed; S2 trusted checkout alias failed with `stage path contains a link`; S3 confirmed the successful synthetic fixture lacks ExcelJS main/browser/owned-parser files. |
| Same probe after adding S4 | **2/4 passed, 2 failed**: S1/S3 passed; S2 same failure; S4 failed because the unselected lexical tree lost files before the public prune threw. These intentional red reproductions are evidence, not a passing implementation check. |
| Native-path semantics probe, invented directories only | Lexical/non-native realpath selected `trusted/app`; native realpath and actual read selected `other/app`. No filesystem mutation outside its invented root. |

Probes reused only the frozen test builder and invoked the actual unmodified public prune; no esbuild/prune/checker was mocked. S3 is evidence of fixture limits, not a counterfeit artifact. No timing/race reproduction or native macOS/Windows execution is claimed. Environment/load retries: zero. Temporary source snapshot/probes/fixtures will be removed before handoff.
