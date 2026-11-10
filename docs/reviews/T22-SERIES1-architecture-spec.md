# T22-SERIES1 architecture spec

Verdict: change-spec

Spec: [fork issue #22](https://github.com/bussard76/exxperts/issues/22), read at `updatedAt: 2026-11-10T11:19:53Z`, and the T22-SERIES1 dispatch. Reviewed upstream `461e6485bf932f5cba85ac3dde8e0104e47d5dec` and `origin/agents/upstream-series-1` at `2e1b3937b65edb7d1c0da5c8a7d5e87efe5f37c2`. Supporting approved scope: Controller `specs/series-1-spec-revised.md`, `series-shared-contract.md`, `series-controller-decisions.md`, and passing independent review `eb90f669c3f5bebcfee1597f64f76ee5d121ba0d:docs/reviews/TSERIES1-R2-architecture-spec.md`.

Level: **1 confirmed for T22**, conditional on implementing only the already approved manifest selections and their necessary lock delta, evidence and licence/NOTICE work. The dependency and interface decisions belong to the previously reviewed level-2 extraction, with its product flows covered by accepted ADR-0002/0003/0004. T22 introduces no additional dependency selection, public export, route, permission, data flow or supported-Node decision. There is no maintained `ARCHITECTURE.md`.

Decision: Sascha's 2026-11-10 decisions are recorded explicitly in #22: dependency-caused lock changes travel with each series; no separate PR 0; the lock bar is no worse than upstream. The 160 pre-existing metadata gaps and the identified baseline `npm ls` failure need not be repaired. This supersedes the earlier perfect-lock/zero-exit-ls requirements for those baseline defects, without waiving checks for new dependencies. **Clarify the Node-floor acceptance matrix before implementation; finding F1 is the reason for change-spec.** No new product or policy decision is proposed here.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Finite approved dependencies | Root, server and UI manifests; root npm lock | Approved direct edges → resolved package closure → existing renderers | Exact entries below; no new direct packages, type relocation or runtime manifest changes. |
| Minimal lock delta | `package-lock.json` consumed by normal root `npm ci` | Upstream lock + justified dependency delta → clean install | Enumerate every added, removed and changed path and field with a dependency reason; preserve unrelated fields. Variant C is evidence, not a lock to copy unchanged. |
| Baseline exception | npm lock metadata and dependency-tree diagnostics | Exact upstream → candidate under the same toolchain | Retain the 160-path baseline inventory and compare identities, not just totals or exit codes; no new missing metadata or dependency-tree errors. |
| Node-floor proof | Runtime build, UI/scripts typechecks, actual server/worker/browser checks | Clean install → built runtime declarations → actual series consumers | F1: define common versus series-only commands, success conditions and actual Node selection for subprocesses. Previous 235-diagnostic comparison is inconclusive. |
| Licences and shipped ownership | Existing NOTICE files, bundle and pruned payload | Exact new/transitive packages → actual retained notices and shipped bytes | Preserve the approved source/NOTICE and artifact checks; `buffers@0.1.1` remains an explicit unresolved item, not an inferred licence. |
| Product interfaces and privacy | Listing, guarded resolver, image helper, preview worker, local opener and UI | Existing authenticated room policy → bounded read/preview → real consumer | No changes authorized by T22. Keep approved errors, limits, snapshots, empty/loading/error states, sandbox and fake-only opener/provider tests. |
| Outside-in evidence | Signed T5/T4 designs and approved exact contracts | Tree/tab/drag/preview logic → route and browser acceptance | Read designs at `b702c9d269f4daa69076c089325172daa59be72d:design/workspace-files/README.md` and `bc3b7485734aea7473dae2a5be4a607469e7f285:design/workspace-file-previews/{README.md,tree.md}`. This task needs no new screen or logic diagram. |
| Shared infrastructure/composition | Series 1 canonical listing/image/tab/drag; Series 2 Markdown; Controller staging | Two standalone contributions → separately reconciled composed tip | Preserve the shared contract and real producer-to-consumer composition gate; neither series merges or edits the other. A dependency-only pass cannot establish composition. |

## Exact scope and lock boundaries

At the reviewed Series 1 tip, all manifests and both root/runtime lockfiles are unchanged from upstream. Product code already imports the approved packages: the shelf child uses `docx-preview`, `exceljs` and `jsdom`; `pptx-frame-entry.ts` imports the PPTX renderer; the Windows opener requires Koffi version `2.16.2`. The necessary manifest realization is:

| File and field | Exact permitted changes from upstream |
| --- | --- |
| `package.json` dependencies | Add `docx-preview: "0.4.1"`, `exceljs: "4.4.0"`; replace `jsdom: "^29.1.1"` with `"26.1.0"`. |
| `package.json` optionalDependencies | Replace `koffi: "^2.9.0"` with `"2.16.2"`. |
| `apps/web-server/package.json` dependencies | Add `docx-preview: "0.4.1"`, `exceljs: "4.4.0"`, `jsdom: "26.1.0"`. |
| `apps/web-server/package.json` optionalDependencies | Add `koffi: "2.16.2"`. |
| `apps/web-ui/package.json` dependencies | Add `@aiden0z/pptx-renderer: "1.4.0"`. |

Mirror only these edges in root-lock `packages[""]`, `packages["apps/web-server"]` and `packages["apps/web-ui"]`. Other lock paths must be the complete, justified direct/transitive/peer/optional closure of these edges. Necessary replacement/removal of the old jsdom graph is included: “add only” cannot mean retaining incompatible jsdom 29 metadata at the same path. The baseline already resolves Koffi `2.16.2`; pinning its declaration does not authorize another Koffi version.

Keep unrelated package fields, root lock identity/version/lockfileVersion, overrides, scripts, workspace declarations, engines, existing notices and source URLs unchanged. In particular preserve base PDF.js `5.4.394`, canvas, JSZip and SheetJS selections and the existing nonregistry SheetJS tarball URL. Do not edit `runtime/package.json`, runtime workspace manifests or `runtime/package-lock.json`, move Node/undici types, add a floor guard, repair the baseline type conflict, add TipTap/Excalidraw, or import further product hunks. Root Node remains `>=20.6.0`; standalone TUI's existing `>=20.0.0` contract is not reclassified by T22.

The path/reason evidence should identify operation, exact lock path, changed fields and old/new values, the approved edge that requires it, and source identity/integrity. This is an evidence format, not a new product interface. A deterministic reconciliation of the retained evidence with the pinned base is sufficient in principle; prove repeatable output and clean consumption. The previous variant-C permission to run `npm install --package-lock-only` was measurement-only and does not by itself authorize that command for this build. If that mechanism is needed, obtain its bounded authorization; normal-lifecycle `npm ci` remains the consumer. No separate PR 0 or wholesale regenerated lock is authorized.

## Evidence checked and baseline treatment

Read `~/controller-exxperts/evidence/series-lock-variant-c-2026-11-10/summary.txt`, the retained locks, path/registry inventories, generation script, Node-floor script and selected logs. The retained baseline lock is JSON-identical to upstream's lock; the current Series 1 lock is also identical to that base. Read-only JSON comparisons confirm:

- Baseline has **160** package paths lacking both `resolved` and `integrity`; variant C Series 1 has **155**. Count missing URL and missing integrity separately as well, preserve the baseline path inventory, and reject a newly deficient path even if removal of an old gap keeps the total below 160. Baseline exceptions attach to unchanged path/version identities; new, version-changed or relocated packages require complete evidence.
- Variant C versus its regenerated PR-0 comparison is `+171/-14/~22` paths, including 18 existing-path version changes. Against actual upstream it is `+171/-14/~46`: **24 additional changed paths are incidental**. They remove `libc` from 23 Linux native paths under `@mariozechner/clipboard-*`, `@napi-rs/canvas-*` and `@rollup/rollup-*`, and remove `dev`, `optional`, `peer` from `packages["runtime"]`. Preserve those upstream fields. The remaining graph changes, including `source-map-js.dev`, require the per-path causal explanation; raw counts alone are not an allowlist.
- The retained registry inventory has **189/189** integrity matches for new/version-changed Series 1 entries, no missing registry signatures, and **187/189** absent attestation fields. These are distinct facts; signature-audit success is not universal attestation coverage or a licence review. Bind the checks to the final candidate and exact fetched artifacts, not merely the earlier experiment's package names/counts.
- Baseline and Series 1 logs show `ELSPROBLEMS`, invalid root `@types/node@20.19.40` against `^24.3.0` from `runtime/packages/{ai,agent,coding-agent}`. Compare the complete problem set and edges, normalizing only checkout/log locations and presentation order. Equal exit code 1 is insufficient. A new invalid, missing, extraneous or peer error is an abort, even if the known error remains.
- Recorded `npm ci` and `npm audit signatures` success applies to the experiment. Re-establish both exit 0 on the final clean candidate using the same baseline toolchain, normal lifecycle and approved browser-download suppression. Preserve optional/native/platform metadata and inspect actual consumer resolution; no ignore-scripts, omitted dependency classes or loosened bundle checks.

The existing server bundle already retains Koffi, the DOCX/XLSX file packages and the private worker asset; it inspects both private workers' imports. Keep these checks and existing negative tests. Actual installed/pruned/shipped sizes, jsdom's existing `fetch_url` consumer, doctor, bundle and desktop pruning evidence remain required by the approved series spec. T22 does not authorize changing that infrastructure to make a new graph pass. Unavailable Windows/Electron or other platform checks stay explicitly unverified.

## Findings

### F1 — major: Node-floor acceptance can accept an unexercised dependency graph

#22 step 3 requires the minimum to be proven, then says baseline and series must show “the same result”; its abort rule catches only a series failure where baseline passes. It does not state what happens when both still fail after building the runtime, or how the comparison applies to a smoke whose feature is absent upstream. For example, the actual `workspace-series1-ui-smoke.ts` is new, while `persistent-room-workspace-default-api-smoke.ts` contains added preview assertions against routes absent upstream. Running those unchanged against upstream cannot establish the same successful feature result. Treating matching nonzero exits as pass would leave the new DOCX/XLSX/PPTX graph unproven.

The retained experiment cannot fill this gap: `run.sh` constructed upstream plus dependency edits, not the actual product Series 1 tip, and `node-floor.py` ran UI/scripts compilers without first building runtime declarations. The 235 identical scripts diagnostics on Node 20.0/20.6 remain explicitly inconclusive. They are not a newly approved baseline exception.

Revise step 3 with a finite command/case matrix and expected outcomes before build:

1. Pin actual upstream and Series 1 candidate SHAs, Node **20.6.0** and an exact Node 22 patch, npm version, clean-install environment and runtime-build ordering. Specify the runtime build's required result too. Build runtime before `tsc --noEmit -p apps/web-ui/tsconfig.json` and `npm run typecheck:scripts` for each tree. State whether a build-host Node differs from the tested runtime and how that still proves the intended claim; do not silently raise engines.
2. Separate unchanged common baseline/series regression cases from new Series 1 feature cases. Name the exact scripts, arguments and source/bundled modes. Common cases compare the same scenarios; **series-only tests must succeed on the actual series** at both target Nodes and are baseline-inapplicable rather than expected baseline failures. Include actual child → route → browser rendering of Word, spreadsheet and PPTX plus the jsdom existing-consumer regression, retaining the approved preview/authorization/packaging acceptance.
3. State explicitly that matching failures after the runtime build are reported as unresolved, not proof of a supported floor. New dependency, renderer and series-only failures must not inherit an exception from unrelated baseline errors. A baseline pass/series failure aborts as already required; unavailable prerequisites, skipped Chromium and failed setup must remain visible and cannot count as pass.
4. Ensure the chosen Node runs spawned npm/tsx, the server and `process.execPath` child workers as well as the top-level compiler. The actual UI smoke can spawn `npx` or `process.execPath` depending on `SERIES_PACKAGED`; invoking only the top-level file with a downloaded Node binary does not fix the Node selected through PATH. Record executable/version evidence and prerequisite UI/server artifacts rather than accidentally testing an old build.

This is a missing acceptance definition, not a request for another floor-analysis module or a perfect-lock policy. The Controller can make the matrix explicit within the current scope; a concrete need to change supported versions or product behavior must return for separate classification.

### Remaining instructions within the approved scope

Licence listing must cover every actual new/version-changed direct, transitive, peer and optional package, with authoritative package-source licence/NOTICE evidence and attribution retained in actual shipped artifacts. `buffers@0.1.1` has no registry licence field; report that exact uncertainty and a source-backed proposal to Sascha. Neither a missing field nor a guessed SPDX value establishes permission, and merely flagging it does not make licence/NOTICE acceptance green. Do not resolve it by replacing a dependency or broadening policy. Preserve applicable PPTX bundled notices and base `NOTICE`/`runtime/NOTICE.md`; do not import excluded editor/Excalidraw notices. This follows the approved series licence gate, not a new policy imposed by this review.

Abort/report exact evidence for new npm-tree problems, newly missing metadata, a higher gap count, wrong/missing integrity or source, unrelated path/field changes, an unapproved dependency/version/owner, an incompatible peer/platform closure, or a new Node/series-only failure. Do not hide these behind the accepted baseline error. Missing legal or required artifact evidence remains open. T22's evidence report must distinguish accepted baseline debt, candidate regression, unavailable verification and unresolved licence questions.

## Shared ownership, dependencies and composition

The shared contract SHA-256 is `94cea4dbe2222954b4167042171918274cb174d6b1806dca77d7e0b1d1de8d3e`. Series 1 owns canonical `workspace-files`/`workspace-image`, guarded resolver integration, the image-only helper and single `PersistentRoomWorkspaceMarkdownError` identity, tab keys `{agentId, conversationId, path}`, callbacks and distinct file/tab drag MIME types. Series 2's independent implementation must match those exact fields/signatures; it owns Markdown GET/PUT, editor and conflict/navigation behavior. No changes to those interfaces are needed for T22.

Series 1 remains standalone from the pinned upstream base, with inert read-only Markdown, no Markdown save route/editor, no Excalidraw, no #12 or later #16. Its existing dependencies are the already approved series spec, shared contract, finite direct-package decisions and the baseline exception recorded in #22. Series 2's lock result is not an input or a shared writable artifact for this task.

The Controller owns later composition on a separate staging branch: apply Series 1, reconcile Series 2's overlapping shell/routes/helpers/lock, avoid duplicate owners and run an independent composed-tip check crossing the real Series 1 listing/image producer and actual Series 2 browser consumer. Cover Markdown/local image, zero external-image requests, conflict/Keep mine, failed-save retention, Save/Discard/Cancel, tabs/drag and retained preview cases. Neither standalone green evidence nor #22's dependency report establishes that result. All work and reports stay on the fork; no EXXETA writes, PRs or comments.

## Prefactoring

None. Existing module ownership and seams fit the task. Realize only the approved dependency edges and minimal metadata delta; do not revisit product code, type placement, public contracts or supported floors.

## Review limits and reproducibility

Source hashes: revised Series 1 spec `15afde2a44ce448ecbac2ab01aba76bb401b09df81daa0e5dc22d758a3d3981a`; Controller series decisions `6906ea2eaf50854a3ff43104389b8af13880b3d7489cffe00d06e00cdbef5484`; experiment summary `272b5c5c42d35e52438f10827382275e3c4712de28c8fc68c708a01d89e6c22b`; experiment Series 1 registry inventory `c550bb80f51c2cbc245f922cedd8c869ca478288e785af3c4d7c0b0a4639d934` (SHA-256).

Read-only inspection and JSON/hash comparisons only; no install, build, typecheck, smoke suite, gate, paid API or real-data access. No current graph, licence, platform or composition pass is claimed. Only this report is committed. An unexpected local lock rewrite that blocked the initial branch switch was preserved in a named stash and excluded from the report branch.
