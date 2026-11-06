# T4-MERGE architecture and spec review

Verdict: pass
Spec: `~/controller-exxperts/analysis/T4-spec-R5.md`, SHA-256 `4a869bbda4b38d42238e73f1ebfbe2716cc3e98f816c56feab7a055ef7c38447`.
Inspected implementation: `origin/agents/t4` at `27267aac6acc24498219eef2a20be5c0759124da`.
Scope: independent architecture/spec review of the ExcelJS merge blocker; no product implementation or functional integration approval.
Level: 1 for the recommended private implementation change; overall T4 remains the accepted level-3 feature.
Decision: recommend bounded preflight plus ExcelJS's **public** `ignoreNodes: ["mergeCells"]` option and direct reconstruction into the existing display model. No private monkeypatch, dependency upgrade, additional converter, or new ADR is required for this recommendation. The Controller records the selected technical direction; this review does not decide product scope for Sascha.

This pass is for the bounded design below. The inspected branch still has no successful spreadsheet producer: `shelf-parse-worker.mjs:778` refuses with `renderer_unavailable`, and `persistent-room-shelf-reading.ts:331` does not yet accept a spreadsheet result. It is not ready for integration. This review supersedes only the unresolved merge alternatives in `docs/reports/issue-4.md` under “Concrete ExcelJS merge blocker”; every other R5 obligation remains.

## Review checklist

- [x] Read issue #4, its complete R5 acceptance contract, the blocker report, accepted ADR-0002/0003, and connected producer/parent/route/browser/package code.
- [x] Reproduce the 30,000 disjoint-merge timeout with invented in-memory data and a hard process deadline/512 MiB V8 heap.
- [x] Inspect exact installed ExcelJS 4.4.0 merge import, cell styles/values, worksheet loading and public options.
- [x] Compare sanitized OOXML/reconstruction and isolated private reconciliation replacement; investigate a smaller public option.
- [x] Specify one bounded recommendation covering malformed/overlapping merges, styles/caches, all sheets, ZIP/XML and resource accounting.
- [x] Determine incremental architecture level, ADR implications, package/Node conditions and proving checks through real producers/routes/browser.
- [x] Self-review and prepare the review-only handback; signed commit/push and coordinator receipt accompany the final SHA.

## Architecture impact

The overall T4 remains level 3 under accepted ADR-0002 and ADR-0003. Implement merge admission/reconstruction privately inside the existing `shelf-parse-worker.mjs`; retain the existing parent validator, guarded GET and React display-model interface. This is an implementation of the already assigned OOXML parsing responsibility, using the already approved ExcelJS public interface. It adds no module, public export, route, persistent store, dependency artifact, process, external converter or data flow. No prefactoring is needed.

The accepted ADRs do not mandate ExcelJS's quadratic import algorithm. The recorded ExcelJS/no-extra-program decision is satisfied by continuing to use ExcelJS for OOXML values/styles. No new Sascha ADR is indicated merely because merge geometry is admitted and reconstructed by owned code: R5 already assigns geometry and numeric-cache preflight to the child. The separate OS-open action continues to receive the original guarded file, only on an explicit authorized click; preview transformations never replace that file or launch an application.

An additional parser dependency or public export is level 2 and needs the Controller's approval. A new parser module/responsibility, display-model contract, server-side parse flow, converter/service, isolation mechanism or changed authorization boundary must be reassessed under level 3 and requires an accepted Sascha ADR where applicable. This pass does not authorize those changes. A shipped fork/source patch or private-method replacement is a different technical choice needing explicit review of its exact implementation and package maintenance, even if its eventual architecture level stays 1; it is not an automatic fallback.

## What this change does

The proposed change removes the quadratic merge-comparison work from OOXML preview loading. The child validates the complete merge plan before ExcelJS runs, loads the same admitted snapshot with merge processing disabled through its public option, and builds the original model's merge rectangles and styled anchor cells itself. The original workbook, shelf text-reading behavior, route contracts and browser interface stay unchanged.

## Evidence and reproduction

On 2026-11-06, read issue #4 with `gh issue view 4 --repo bussard76/exxperts --json title,body`, R5's acceptance/architecture/display/resource/package contracts and binding technical instructions, accepted ADR-0002/0003, prior R4/R5 architecture reviews, blocker report and connected child/parent/route/grid/package source. `ARCHITECTURE.md` and `GLOSSARY.md` are absent. Fetched origin; review branch `agents/t4-merge-review` starts at the requested `27267aac6acc24498219eef2a20be5c0759124da`, rather than pretending current main contains this unfinished producer.

Installed the reviewed lock using `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci`, normal lifecycle scripts, no lock/manifests changed. Runtime: Node `v22.23.4`; installed ExcelJS `4.4.0`, JSZip `3.10.1`, ExcelJS-owned saxes `5.0.1` (the root also resolves saxes `6.0.0`). These versions are deliberately distinguished; a hoisted package name does not identify the parser actually used by ExcelJS. Source hashes:

| Installed source | SHA-256 |
| --- | --- |
| `exceljs/lib/doc/worksheet.js` | `54f2bcd8105c0b5ed671ccd60c8b26112c19758d53af2b8b4e0431f20de89f01` |
| `exceljs/lib/doc/cell.js` | `e83a9770507ea5d5cefc5ca6bb622d84af01dfa9bdf1990726c45d19577d1155` |
| `exceljs/lib/xlsx/xlsx.js` | `0766abd994d57c2da21b9ebd3326bf5772ddc74f1d65e7dcf942a0b0a39516d5` |

The exact red-capable baseline command was:

```sh
timeout --signal=KILL 35s node --max-old-space-size=512 apps/web-server/scripts/workspace-excel-merge-probe.cjs 30000
```

It printed 30,000 merges, 60,000 slots, 60,000 potential ExcelJS cells, 159,298 archive bytes and 938,569 worksheet bytes, then was killed at 35 seconds, exit 137, without a completion line. The archive is generated wholly in memory; timestamp/compression differences explain a byte difference from the earlier report. Its worksheet/input/extent quantities fit the stated limits. One independent baseline run was sufficient for this review; the builder's two earlier timeout runs are reported evidence, not reruns here. No load-flake retry or environment-failure rerun occurred. This is a diagnostic regression reproduction, not a public-route acceptance result or a general throughput benchmark.

The installed import path is `xlsx.load` → `workbook.model` → `worksheet.model` → `_parseMergeCells` → `mergeCellsWithoutStyle` → `_mergeCellsInternal`. The latter enumerates every previous merge before adding the next (`worksheet.js:612–632`). For 30,000 disjoint merges that is 449,985,000 intersection checks. The known report supplied a narrow diagnosis; source tracing and the controlled bypass experiment replace an unnecessary open-ended hypothesis search. The [pinned upstream worksheet implementation](https://github.com/exceljs/exceljs/blob/v4.4.0/lib/doc/worksheet.js) independently exposes the same import/comparison behavior.

ExcelJS 4.4.0 documents `ignoreNodes` in its installed `README.md:2147` and types it in `index.d.ts:1464`. `worksheet-xform.js:95–97,359–375,418` leaves merge parsing unselected and its merge model empty when `mergeCells` is ignored. That prevents subsequent merge application; it does not just skip rendering. See the [pinned worksheet transform](https://github.com/exceljs/exceljs/blob/v4.4.0/lib/xlsx/xform/sheet/worksheet-xform.js).

Two additional inline, timeout-limited probes ran without writing a fixture or changing a package:

| Invented in-memory experiment | Observed result |
| --- | --- |
| Same 30,000 `A1:B1` … `A30000:B30000` worksheet, public `xlsx.load(bytes, { ignoreNodes: ["mergeCells"] })` | 153.3 ms load, 159,297-byte archive, one sheet, zero ExcelJS merges. Row count is **zero**, so reconstruction must include merge-only extent. |
| Same worksheet, remove its merge container in the test harness, generate a STORE ZIP, ordinary ExcelJS load | 13.6 ms including ZIP generation/load, 16,266-byte merge-free archive, zero ExcelJS merges. This simple fixture shrinks; it says nothing about worst-case copy memory. |
| Three sheets, hidden/empty sheet, cached formula `54`, bold colored anchor, solid fill, currency format, width 24, separately styled covered cells | Ordinary and public-skip loads preserved anchor cache/style, distinct covered right/bottom borders, widths, sheet order/names and hidden state; assertions passed. |
| Same small workbook with an independently inserted merge covering a meaningful non-anchor string | Ordinary load replaced that cell's value with the anchor formula object; skip retained the original string. A reconstruction that silently hides that string would violate R5. |
| Overlap `A1:B2` + `B2:C3`, duplicate `A1:B2`, row zero `A0:B1`, out-of-grid `A1:XFE1` | The public-skip load accepted all four cases. Therefore the option alone is not a validator. |

To repeat the public-option timing against the existing diagnostic fixture without editing a file:

```sh
timeout --signal=KILL 20s node --max-old-space-size=512 <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('apps/web-server/scripts/workspace-excel-merge-probe.cjs', 'utf8');
const original = '.xlsx.load(bytes)';
assert.equal(source.split(original).length, 2);
process.argv[2] = '30000';
new Function('require', source.replace(original,
  '.xlsx.load(bytes, { ignoreNodes: ["mergeCells"] })'))(require);
NODE
```

This transforms only the trusted diagnostic program in memory, not the package or untrusted document code. Verified this exact documented command separately: exit 0, 648.9 ms load, 159,297 archive bytes and zero rows. Its completion still proves load behavior only: zero ExcelJS rows/merges is expected until the production reconstruction exists. The two public-option observations are narrow host timings, not a calibrated performance guarantee.

The small styles/caches probe had literal assertions; its source ZIP used the ExcelJS writer as a convenience, with merge XML inserted independently. It is not an independently validated Excel/LibreOffice fixture, browser fidelity proof, full cache matrix, or demonstration that all OOXML parsing is bounded. All timed alternatives ran with a 20-second external kill and 512 MiB V8 heap. No RSS maximum was measured.

## Alternatives

| Approach | Exact consequence | Assessment |
| --- | --- | --- |
| Ordinary ExcelJS merge import after geometry preflight | Preflight does not remove the later pairwise scan. A valid small file still times out. | Cannot meet this demonstrated case. No lower merge/grid cap or longer deadline is approved. |
| Preflight + merge-free sanitized OOXML + direct display reconstruction | Removes merge nodes from every admitted worksheet, regenerates ZIP metadata/CRC, then loads via public ExcelJS. Preserves styles/caches only if unrelated XML/parts survive exactly. Adds bounded XML rewriting, ZIP copies and a second compressed representation. | Feasible but larger than necessary for merges. Must not use regex replacement on untrusted XML or regenerate through ExcelJS's workbook writer. The simple timing probe is not certification of this path. |
| Preflight + public `ignoreNodes: ["mergeCells"]` + direct display reconstruction | Keeps the immutable source bytes, avoids ZIP rewrite and invokes no ExcelJS merge helper. Requires the same complete geometry/fidelity reconstruction as the sanitized path. | **Recommended**, verified against the installed pin. No new artifact or private method coupling. |
| Replace `_mergeCellsInternal` or `_parseMergeCells` in the isolated child | Can replace the pairwise check with an occupancy check while retaining cell merge behavior. Must preserve `ignoreStyle`, release/reference behavior, `_merges`, dimensions, blank cells and malformed-input semantics; a no-op loses them. Still overwrites covered values unless preflight catches them. | Not approved by default. Requires reviewed exact patch, source/version identity, child-only scope, equivalence/negative tests, licence/maintenance and installed-payload proof. Child isolation limits crash impact; it does not prove fidelity, finite work or safe package coupling. |

## Binding bounded implementation design

1. **Keep ownership and order.** Use the existing guarded route and bounded descriptor snapshot. Perform all document-dependent ZIP/XML admission in the disposable preview child before `xlsx.load`, on the same immutable owned bytes that will be loaded. No pathname reread, externally mutable buffer, persistent cache or server-process workbook parsing. `readPreviewSnapshot` already copies a checked descriptor; stat checks are change detection, not an atomic snapshot guarantee for concurrent in-place writes. Preserve the parent policy/file recheck, two-slot admission, one settlement, kill/reap and slot release.

2. **Validate ZIP and XML before library expansion.** Retain 25 MiB input, 10,000 entries, 32 MiB per inflated entry, 128 MiB aggregate and 200:1 ratio. Validate local/central records, names, duplicate/normalized aliases, spans, descriptors/ZIP64, encryption, actual output length and CRC; cap inflate before allocation rather than `JSZip.file().async()` followed by a length check. Do not confuse the source compressed-byte ceiling with the inflated XML budget. Reuse the generic ZIP mechanics, not Word-specific image or DOM limits as new Excel restrictions. The current spreadsheet branch calls only `previewZipEntries`; metadata validation alone is insufficient.

   Parse complete worksheet/workbook/style/string XML with existing shipped XML facilities and a bounded event/field plan; no regex-only merge extraction. Reject DTD/entity declarations and malformed nesting, handle declared encodings/character references, namespace and parent context correctly, and associate only worksheet-local merge elements. A same-named element in an extension/comment/foreign namespace is not a merge. Meter lexical bytes, tokens, strings and reference uses before building arrays/objects; do not transplant Word's 200,000-element cap, invent a smaller accepted Excel limit, or build an unrestricted DOM first. Choose and name the actual existing parser entry point in the implementation report; if a new dependency/import ownership or parser module is necessary, obtain the corresponding approval before using it. No new parser dependency is implicitly authorized by the public skip option.

3. **Create one sheet plan and one merge plan.** Resolve workbook sheet order/relationship targets, names/visibility and sheet identity, including sparse sheet IDs and empty/hidden sheets. Inspect every worksheet ExcelJS will actually load, and compare its resulting sheets to the admitted plan; no regex-path/relationship mismatch or silent missing sheet. The existing reader recognizes worksheet paths and can drop sheets it cannot map; its array index or `sheet1.xml` naming must not replace verified identity. Retain R5's all-sheet rule, including macro/chart-sheet reconciliation: supported complete model or the specified whole-document failure, never chart-omission success hiding a sheet.

   Validate merge references against the OOXML worksheet-local range grammar and required coordinate bounds before using a library's permissive `Range` decoder. Numeric endpoints must be safe positive integers, within row/column bounds and consistently ordered; no clipping or accidental reversal normalization of invalid input. Account for legal single-cell/absolute-reference forms with normative invented fixtures rather than declaring stricter syntax from a guess. Missing/malformed references, overlapping/duplicate/nested rectangles, conflicting merge containers or inconsistent required structure are controlled 422 `damaged_file`; valid numerical budget excess is 413. Do not trust `count` or `dimension` attributes to allocate or to hide content. Include actual styled cells and merge endpoints in model extent; handle stale advertised dimensions explicitly without enumerating them.

4. **Bound overlap and reconstruction by admitted grid area.** Let `G` be the sum of sheet rectangular slots (at most 200,000), `C` the admitted source cell records and `M` the actual merge count. Admit dimensions and checked products before allocating a per-sheet owner grid. For each rectangle, validate its area against the already admitted sheet rectangle, then test/set each slot once, rejecting at the first previously owned slot. For successful disjoint plans the sum of areas is at most `G`; rejected duplicates stop promptly instead of repeatedly scanning earlier rectangles. Reuse that owner index to join cells, identify anchors, derive perimeter styles and suppress covered display cells. No cell-by-merge search, pairwise intersection list, repeated sheet rescan per merge, or `getCell` loop over an unadmitted rectangle.

   A `Uint32Array` owner grid needs at most 800,000 requested bytes; a packed plan with sheet ordinal and four endpoints uses 20 bytes per merge. Nonoverlap implies `M <= G` if single-cell merges are admitted (at most 4,000,000 requested plan bytes); area-at-least-two merges imply `M <= G/2`. The route's `biffMerges: 100000` is a legacy-specific guard, not authority to add a new OOXML cap on legal singleton merges. The blocker report's “100,000 merges” need not become an extra admission rule. Do not materialize an unnecessary synthetic cell for every covered slot. Preserve the actual 100,000 **serialized** cell limit, counting emitted anchors/styles/empty styled cells correctly.

   Geometry/joins can be `O(G + C + M)` after XML scan; sorting sparse cells or plans, if needed, is bounded `O(C log C + M log M)`, not claimed linear. Charge a fixed number of complete passes: admission, occupancy, cell join/perimeter reconstruction and model emission. Combined occupancy passes may revisit a slot a few times, but do not hide those visits. Reserve plan/grid, raw cache descriptors, style/run/model objects, formatted text, escaped JSON and IPC copies before construction; typed-array arithmetic is not a JavaScript object/RSS measurement. Retain the 48 MiB UTF-8 complete-envelope cap, 32,767-character display-cell cap, original geometry/font caps and bounded SSF work. Heap/deadline remain failure containment, not the pre-operation guard.

5. **Load once through the public option; do not remerge.** Invoke exact ExcelJS 4.4.0 with `xlsx.load(snapshot, { ignoreNodes: ["mergeCells"] })`. Build display `merges` directly from the admitted plan, never through `mergeCells`, `mergeCellsWithoutStyle`, setting `worksheet.model`, a private `_merges` write, or serializing/rereading an ExcelJS workbook. ExcelJS remains the OOXML value/style parser. The option is static product code, not supplied by the document, client, environment or test bypass. Missing/wrong package or unsupported option behavior fails honestly; do not fall back to the slow path. Tests must prove absence of merge reconciliation through the actual child, not merely observe a short elapsed time.

6. **Reconstruct visible meaning, not only rectangles.** Emit every admitted merge exactly once, with its top-left anchor and dimensions even when no physical cells exist. For styled/value cells, preserve resolved font/fill/alignment/format/rich text at the anchor and the effective row/column/cell inheritance. Keep covered cells' source styles available until the perimeter is resolved; the import normally uses `ignoreStyle=true` precisely because covered cells can differ. Do not assign the anchor style to all covered cells or simply take its four borders. A normal merged box can store its right/bottom borders in the last column/row: fold each uniform outside edge into the emitted anchor's respective border, with independent expected literals and computed-browser checks.

   The existing schema has only one border per side and forbids emitted covered cells (`WorkspaceSpreadsheetPreview.tsx:67–74`). It cannot encode arbitrarily different border segments along one merged edge. Do not claim universal merged-border fidelity: if an accepted basic-look fixture requires a representation this model cannot express, escalate that concrete mismatch before changing the schema or inventing an omission/422 policy. Same rule for required visible formatting not representable by the anchor. No such real-file claim or scope reduction follows from this review.

   Inspect original non-anchor cells **before** suppressing them. Styled blanks are expected; a meaningful stored value, formula/cache or rich text that would be erased is a structural conflict under R5's controlled-422 rule, not permission to silently discard data or to duplicate anchor text. Test empty-string, zero and false distinctions so a truthiness check cannot authorize loss. Retain the original numeric serial/cache metadata for anchor formulas, including missing/empty/stale/shared/array caches, and both date systems. ExcelJS's `FormulaValue._copyModel` uses truthiness (`cell.js:751–765`), so reading only `.value.result` loses zero/false; the raw bounded cache plan and typed result access remain necessary. Never read a translated `.formula` to display results, recalculate, or send formula expressions/URLs to the browser.

7. **Keep the existing trust contract.** Document-controlled data becomes only the exact typed workbook model and approved notices. The parent independently validates fields, references, disjoint merges, aggregate extent, sorted/unique cells, text/geometry and complete byte size before HTTP success; React validates and renders escaped values and typed styles. No partial workbook after an error. The original file, `.xls` owned decoder, SSF selection, Word/PDF/image/shelf consumers and explicit local-opening authorization are unchanged by this merge choice. Do not run VBA, resolve external relationships/resources, invoke a converter/opener or enable formulas/links during parsing. Deny document-phase network APIs before parser/library entry and keep CSP/React containment. The child still has OS privileges: neither API shims nor V8 heap limits are an OS/network sandbox.

## Resource and fidelity limits of this conclusion

Bypassing merge reconciliation fixes this specific quadratic path; it does **not** certify ExcelJS's remaining work. For example, `data-validations-xform.js:218–224` expands `sqref` rectangles address by address, while `defined-names.js:182–190` → `cell-matrix.js:25–31` can expand workbook-defined ranges independently of visible cells. Column span expansion, strings/rich runs/style references, theme parsing, shared formulas, media and bounded SSF also need the existing R5 pre-operation accounting. A tiny visible grid or valid ZIP sizes alone is not that certificate.

Required preflight must account for actual invoked library operations or safely remove/ignore only metadata irrelevant to this read-only representation. Publicly ignoring editing-only `dataValidations` can avoid that particular expansion if traced and tested; `ignoreNodes` is a worksheet option and does not by itself remove workbook-defined names. Do not reject ordinary in-budget visible content merely because it carries a large irrelevant name/validation range, or claim merge preflight proves these other paths safe. A necessary bounded sanitization of irrelevant metadata is a separate explicit implementation detail to review, with same-snapshot/copy/fidelity accounting; it does not justify a private monkeypatch or a new converter. These are retained R5 obligations, not newly claimed passing checks or an audit of every ExcelJS path.

Threat position considered: a document author can supply untrusted workspace bytes without write access to the exxperts program/user account. ZIP names, relationship targets, XML, formulas and styles are data. None authorizes filesystem extraction, module selection, network use or host application opening. No real file, account, external application or model API was used. Public GitHub/registry reads were source/dependency research and the explicitly requested fork issue read, not application integrations.

## Required proving checks

These are binding implementation validations, **not checks passed by this review**. Use the production route and actual child for producer claims, with independently specified invented OOXML/BIFF and literal expectations. Test fixtures must not be only a writer agreeing with its own reader. Keep existing tests/assertions; mocks prove only the seam they replace.

| Check | Required evidence |
| --- | --- |
| P2/P5: real-route merge regression | The exact 30,000 disjoint `A1:B1` … `A30000:B30000` workbook succeeds within the unchanged 30-second child deadline, with all 30,000 rectangles, 30,000×2 extent, no missing sheets/partial content. A separate controlled child harness proves bounded slot/reference operations and zero calls to quadratic merge reconciliation; a timeout-only test is insufficient. |
| P2/P5: structure and boundaries | Shared-edge adjacency is allowed; true overlap, containment, duplicate, malformed/missing refs, zero/out-of-range/reversed-invalid endpoints and conflicting containers fail before ExcelJS merge work. Singleton merges, merge-only empty sheets, far-edge extents, global exact/one-over reachable grid/cell/output limits, sparse IDs, unsorted merges and the same coordinates on different sheets. Distinguish invalid structure from valid budget excess. |
| P2: real producer fidelity | Independent ordinary merged boxes with all four edge borders on covered cells, row/column inheritance, styled blanks, solid/theme/tint fills, fonts, rich runs, unequal widths/heights, dates and formula results; merge anchors containing zero/false/empty/missing/stale caches, shared/array formulas. Preserve `.xlsx` and `.xlsm`, every hidden/empty/ordinary sheet and the agreed macro/chart-sheet treatment; `.xls` retains its separately reviewed owned decoder. UTC/non-UTC formatting literals remain required. |
| P2/P5: covered content | A covered styled blank succeeds with correct perimeter; an independently inserted meaningful non-anchor value/formula/cache receives the specified whole-document 422, never silent erasure, duplicated value or false unavailable marker. Keep original cell/cache distinctions before any ExcelJS normalization. |
| P5: ZIP/XML/resource guard | Stored/deflated ZIPs, descriptors/ZIP64, declared/actual length disagreement, CRC/overlap/duplicate/path aliases, expansion and XML encoding/namespace/entity/nesting cases. Denied operation must not occur. Prove amplification guard behavior for remaining invoked ranges/strings/styles/SSF as well as merges, and account for copies before model/JSON/IPC allocation. No arbitrary new Excel XML-element ceiling. |
| P1/P5: parent/route/lifecycle | Real child results pass the strict parent validator; forged/malformed or over-budget envelopes fail. Existing policy/file-change, current read permission, stale reply, abort/timeout/crash/duplicate settlement, two slots and reap/release cases remain intact; no original-file writes or opener dispatch. |
| B3 and existing B1/B2/B5 | `workspace-file-tabs-ui-smoke` must consume actual OOXML/legacy child → guarded GET → real React model, asserting merged dimensions, formatted caches and computed four-edge styles in both themes, all sheets reachable, both-axis scrolling, cached sheet/scroll state across tab activation and no edit/save/download/formula control. The existing mocked model checks and our inline probe do not prove this chain. |
| Other accepted consumers | Preserve R1–R3/R5/R6 and A2/A3 plus Word/PDF/image/shelf behavior; run affected shelf spreadsheet/vision and jsdom consumers when connected implementation changes touch them. Merge bypass must be confined to preview mode, never a process-global change to shelf import semantics. Signed O1–O4/B6 local opening remains separately guarded and fake-only. |
| K1 / Node / packaging | Real installed tarball and post-prune payload outside checkout must resolve exact ExcelJS/JSZip/XML/SSF packages and the plain `.mjs` child with no global/source fallback; missing/wrong artifacts fail. Retain notices, required runtime files, supported optional/native closure, the 2,500-file ceiling and unchanged Node `>=20.6.0` policy. Test the actual supported Node closure and vendored 24.22.1; Node 22 source probes prove only this host. Windows/macOS/package/native obligations and approved non-opening Windows probe remain. |
| Complete #4 acceptance | Preserve every R1–R6/A1–A4 item and signed open action, P1–P5/B1–B7/O1–O4/K1/H1 in the builder's report. Developer runs targeted typechecks/suites and affected browser specs through `gate`; independent Tester/wave own full build/smokes/browser gates and level-3 conformance. Sascha alone checks real files/Electron/application display on his computer. |

## Self-review and handback

| Binding instruction | Result / evidence |
| --- | --- |
| Independent architecture/spec review only, no implementation/helper workers/full gate | Only this findings file is changed; no product/test/package/lock edit, additional checkout or subagent. The generic Developer implementation/report/full-gate instructions are overridden by the explicit review scope. |
| Exact target, spec, accepted decisions and concrete failure | Target SHA and R5 hash recorded above; ADR-0002/0003 remain the authority. Existing red baseline reproduced, source call path traced, both requested alternatives assessed, public alternative actually probed. |
| Bounded precise recommendation and no silent narrowing | Steps 1–7 name ownership, preflight order, linear-area overlap checks, public load, style/cache reconstruction and parent trust; existing limits retained. Singleton/BIFF cap distinction, non-anchor data loss and unrepresentable border cases explicitly addressed. |
| Tests and limitations truthfully separated | Evidence table lists only executed inline probes; required-check table names future P/B/K acceptance checks. No public-route/browser/fixture/installed-platform/full-OOXML bound is claimed as passed. No timeout retry is relabeled a pass. |
| Repo/data/outward-effect rules | Own worktree, fork origin only, invented in-memory documents, normal `npm ci`, no secrets, real documents/services/openers or model calls; no hook bypass. Review is signed off and pushed only on its review branch. |

Ponytail: public skip is the smallest verified way to avoid the pairwise import; it removes the need for merge-specific ZIP rewriting or private patch maintenance. No unrelated code quality/style work or full task audit is claimed. Additional security/load/edge-case coverage belongs to debt under the repository policy; demonstrated failures of an explicit resource/fidelity contract must still be fixed, and this design pass does not erase the known producer blocker.

Files changed: only `docs/reviews/T4-MERGE-architecture-spec.md`. Tests added: none (review-only); existing diagnostic probe and inline invented-data assertions executed as recorded. Assumptions: the final dispatch's independent review overrides its generic Developer template, and current source parsing/packaging still needs its named R5 proofs. Debt candidates: heterogeneous merged-border representation/fidelity, if not already covered by accepted ordinary fixtures, needs a concrete example and Controller disposition; broad release load/security and supported-runtime/package evidence remain tracked by R5 rather than waived here. No screenshot or binary artifact was created.

Not checked: public producer-to-route-to-browser success, independent full fixture compatibility, all remaining ExcelJS/SSF allocation paths, supported Node/platform/installed payload, full gate and Sascha's real-file acceptance. Remaining risk: public skip is intentionally permissive; without the complete preflight and reconstruction it would accept invalid geometry or hide data. Builder implements and proves the selected design, independent Tester/conformance review verifies the finished feature, and the Controller retains the rest of #4's unfinished work.
