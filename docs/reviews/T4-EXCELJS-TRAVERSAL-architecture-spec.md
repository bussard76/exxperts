# T4-EXCELJS-TRAVERSAL independent architecture/source review

Verdict: change-spec
Reviewed implementation: `origin/agents/t4` frozen at `ce0556db86cbf27b6b41b9d106217576f0b24253`.
Review branch base: `cc075a4d371bbdfea6cead35f515df6086f8df28` (local `origin/main`).
Spec: `~/controller-exxperts/analysis/T4-spec-R5.md`, SHA-256 `4a869bbda4b38d42238e73f1ebfbe2716cc3e98f816c56feab7a055ef7c38447`; accepted review `2e7237a57c46f1acf1288936a8ed379682070bff:docs/reviews/T4-R5-architecture-spec.md`.
Related audit: `0ecbb3402b155cd446d9f8b04c8f78b23f2d3b87:docs/reviews/T4-SSF-BOUND-architecture-spec.md`.
Decision: frozen `docs/specs/T4-OOXML-containment.md`, accepted 2026-11-06, Decided by: Sascha; corresponding project Controller decision read locally.
Date: 2026-11-06. This is an independent review, not an implementation or producer acceptance.

`findRow`, `findCell` and `cellCount` permit a useful bounded indexed walk after its extents are established. Callback counters in ordinary `eachRow` cannot establish that admission: the library evaluates `hasValues` first and never calls the callback for styled blank rows. `includeEmpty` changes both the work and the workbook by creating missing objects before callbacks. Public sheet enumeration, determining extents, row-only metadata, conversion, validation and serialization must be accounted separately. A complete public-interface proof covering all those operations is not established here.

## Architecture impact

Level 1 for this review and a private traversal inside the existing `shelf-parse-worker.mjs`; overall #4 remains the accepted level-3 feature under ADR-0002/0003. Keep ExcelJS 4.4.0 for OOXML, the selected owned legacy decoder, SheetJS 0.20.3 for SSF, the existing child/parent seam and the shared display schema. No new export, route, store, dependency, process or document data flow is proposed. `ARCHITECTURE.md` is absent by the project's configured policy. No prefactoring is required.

The specialized read-only dispatch supersedes generic Developer implementation, checklist-report, fetch/merge and gate steps. Only this review file changes. Existing local git objects and the project's Controller files provide requirements; issue #4 was not fetched under the no-network restriction. The only remote operation for this task is its explicitly requested documentation branch push. No worker, real document, external service or opener was used.

## Exact artifacts and source evidence

The frozen lock specifies `exceljs` 4.4.0, registry artifact `https://registry.npmjs.org/exceljs/-/exceljs-4.4.0.tgz`, integrity `sha512-XctvKaEMaj1Ii9oDOqbW/6e1gXknSY4g/aLCDicOXqBE4M0nRWkUu0PTp++UPNzoFY12BNHMfs/VadKIS6llvg==`. The local npm-cache artifact matched that SHA-512 before extraction. No upstream git revision for these npm bytes was independently established.

`excel.js` loads `lib/exceljs.nodejs.js`, whose `Workbook` loads the doc implementation and ordinary XLSX reader. The probes use that public package entry, not a replacement parser. Source citations below are paths within this exact artifact, with 1-based line numbers.

| Source | SHA-256 |
| --- | --- |
| `excel.js` | `6d333aaa3b9a95067a5e71902eaa63f5fe774ee3b24ad6e427f33f2f59b5c4f2` |
| `index.d.ts` | `d10d70b4fe21847c61cb0ab72b60162d2cc23ef64e5606822d110cce2dbc9dd8` |
| `lib/doc/workbook.js` | `892d181e450227755f3a67e442202d232661c186293a5bd0287a83403014270b` |
| `lib/doc/worksheet.js` | `54f2bcd8105c0b5ed671ccd60c8b26112c19758d53af2b8b4e0431f20de89f01` |
| `lib/doc/row.js` | `73b25811a9deca01a4d4c14af17b5c97d3d211b9710a242941c92131d81aecf2` |
| `lib/utils/under-dash.js` | `85d95d542f8d2485bf5f5607e4a0be9e1e75e93e74824b4b38ab8b5d128c9d98` |
| `lib/xlsx/xlsx.js` | `0766abd994d57c2da21b9ebd3326bf5772ddc74f1d65e7dcf942a0b0a39516d5` |

Important correction to the dispatch's hypothesis: this entry does **not** use lodash `some`. `row.js:3,212–214` imports `../utils/under-dash`; `under-dash.js:16–23` delegates arrays to native `obj.some(cb)`. Native `some` skips absent-index predicate callbacks; that does not supply a source-level guarantee that sparse-array work is proportional to present cells. Do not count predicate invocations as visited array positions or claim a measured lodash loop that this artifact never calls. The package's deprecated transitive `lodash.isequal` is unrelated to this path.

## Fit checklist and actual producer state

| Requirement | Owning module and seam | Evidence / disposition |
| --- | --- | --- |
| Trace pre-callback work, including styled blanks | ExcelJS doc worksheet/row, private child consumer | Source table below and probes P1–P3. A callback-only counter is insufficient. |
| Bound model traversal without widening interfaces | Existing preview child → existing display model | Conditional indexed schedule below; enumerate/prework and zero-grid proof gaps remain explicit. |
| Account actual producer calls and validation | Frozen child and `persistent-room-shelf-reading.ts` | Child loads/discards workbook and returns unavailable; no model/SSF producer exists at this frozen SHA. Parent model validation already exists. |
| Respect containment decision | Existing child heap/deadline, accepted OOXML spec | Loading/ordinary merge processing has accepted containment; this review does not extend it to every later getter, SSF, legacy decoding or parent validation. |
| Preserve all-sheet, styled blanks and cached results | R5 P2/B3 and shared model | Existing-sheet enumeration is distinct from declared-sheet completeness. No partial success, formula serialization or raw serial round trip is authorized. |
| No product changes, new packages, network research or full gates | This review file only | Offline source/probe checks; no product or browser gates. |

At the frozen SHA, `apps/web-server/src/shelf-parse-worker.mjs:1289–1317` checks the spreadsheet kind, takes the existing CFB/BIFF path for `.xls`, or verifies/inflates ZIP entries and calls `await new ExcelJS.Workbook().xlsx.load(buffer)`. It discards the returned workbook and then throws `renderer_unavailable`. There are **no** `eachRow`, `eachCell`, model-construction or SSF calls in that producer. This review assesses the proposed traversal and its prerequisites; it cannot certify a later developer working copy or claim this producer's formatting gate is implemented.

Before load: `readPreviewSnapshot:267–287` checks file identity/25 MiB and reads owned bytes; `previewZipEntries:301+` checks directory/entry/size limits; `inflatePreviewEntry:947–955` inflates with the declared output bound and checks actual length/CRC. Spreadsheet loading repeats inflation through JSZip. Count the ZIP verification/inflation replay as prework; it is not paid by model cell callbacks. `denyPreviewNetwork:995+` runs before ExcelJS load. These are existing source facts, not an independent audit of all ZIP/network safety.

`persistent-room-shelf-reading.ts:202–265,350–376` forks the same child, uses its 512 MiB V8 ceiling and 30-second spreadsheet deadline, kills/reaps on settlement, and limits active previews to two. Spreadsheet success goes through `validPreviewWorkbook:291–323` and a full JSON-byte check before returning. The frozen route supplies the existing grid/cell/axis limits. This review did not execute that route or its containment tests.

## Creation, sparse storage and traversal trace

| Exact source | Work before the consumer can charge it |
| --- | --- |
| `xlsx/xlsx.js:257–315,360–364,411–415` | JSZip loads; entries inflate/decode and are chunked; worksheet xforms allocate intermediate models; reconciliation precedes `workbook.model = model`. No model callback runs before this work. |
| `xlsx/xform/sheet/row-xform.js:69–98,115–137`; `cell-xform.js:285+,428–469` | Allocate row/cell models, collect cell arrays, resolve styles/shared strings and date/cache conversion. Internal `maxRows`/`maxCols` options count parsed occurrences, not sparse coordinate spans; row's max-item check occurs after `push`. `XlsxReadOptions` at `index.d.ts:1460–1465` exposes only `ignoreNodes`. These internal options are not a public coordinate admission solution. |
| `doc/workbook.js:181–212`; `xlsx/xform/book/sheet-xform.js:14–21` | Parsed sheet IDs index sparse `_worksheets[id]`. The setter constructs each Worksheet and determines order using `value.sheets.findIndex`; this can rescan the declarations per sheet. A large ID need not mean many actual sheets. |
| `doc/worksheet.js:134–173`; `xlsx/xform/sheet/worksheet-xform.js:447–523` | Worksheet construction validates/truncates names and checks duplicates with `_worksheets.find`, so even name checks may scan previously sparse IDs during load. Worksheet reconciliation builds relationship/comment/hyperlink maps, filters/copies row and cell arrays, reconciles styles/conditional formatting, and constructs media/table references before doc objects are exposed. These remain loader prework, not consumer callback work. |
| `doc/worksheet.js:35–46,886–908` | `_rows=[]`; one Row is assigned at `row.number-1` per row model, including empty/style-only rows. Column reconstruction and merges also precede return. A sparse row coordinate controls length, independently of value-bearing row count. |
| `doc/row.js:10–15,367–411,45–52`; `doc/cell.js:13–29,338–355` | Each Row has `_cells=[]`. Row model import creates cells indexed by column, including explicit Null cells. `getCellEx` creates the Column/Cell; the Cell constructor creates a Null value and inherited style before applying imported model/style. Row style is JSON-copied during import. These allocations have already happened when traversal starts. |
| `doc/column.js:295–316`; `worksheet.js:242–261` | Column reconstruction sorts ranges and fills every gap through `max`; getting a far cell can create all preceding Columns. A small `<cols>` record can cause many Column objects. A consumer's `getColumn` is therefore not a nonallocating lookup. |
| `worksheet.js:612–632` | Normal merges first compare existing merges, then create/access every covered cell. Pairwise comparisons and area expansion precede traversal. The prior merge case remains subject to its explicitly recorded Front assumption, not a new decision here. |
| `worksheet.js:551–567`; `row.js:212–217` | Normal `eachRow` starts native `_rows.forEach`; each present row evaluates `hasValues` via native `_cells.some` before the callback. An all-Null styled row gets no callback at all. Early value success can shorten `some`, so neither callback count nor nonempty count is the scan bound. |
| `row.js:129–147` | Normal `eachCell` uses `_cells.forEach` and filters Null cells before callback. Styled Null cells disappear. `includeEmpty` loops through the full `_cells.length` and calls `getCell(i)` before the callback. |
| `worksheet.js:556–560` | `eachRow({includeEmpty:true})` captures `_rows.length`, then calls `getRow(i)` before the callback, creating missing Row objects. Even a callback's first rejection follows that creation. |
| `worksheet.js:343–375,378–384,313–333` | `rowCount` scans trailing undefined entries through `_lastRowNumber`; `actualRowCount` calls `eachRow`; `columnCount` and `actualColumnCount` call value-filtering iteration and can miss blank styles as well as do hidden scans. |
| `worksheet.js:186–196,570–578,842–883`; `row.js:165–174,229–247,333–364` | `dimensions`, `getSheetValues`, `values` and `.model` perform scans and/or construct arrays before returning. Dimensions exclude Null cells. A row with only style, no cells and no height has `row.model === null`; `.model` is not a fidelity-preserving inventory of every row. |
| `workbook.js:119–130,153–163` | `.worksheets` first slices the sparse backing array, sorts by `orderNo`, then filters to a dense array. `eachSheet` calls that getter before its first callback. Workbook `.model` calls it twice and materializes worksheet/row models. A later returned-array-length check cannot bound earlier copy/sort work. |

No JavaScript-engine-specific linear-time or physical-allocation guarantee follows from native `some`, `forEach`, `slice`, `sort` or sparse storage. Conservative source accounting covers the logical length and requested copies; measured timings are not proofs. The accepted heap ceiling is not a total RSS ceiling.

Parent validation also has its own work, outside the child deadline: frozen `validPreviewWorkbook:291–323` validates every style before checking sheet rectangles, creates key arrays for exact-shape checks, walks overrides/cells/runs, joins run text to compare it with cell text, and builds merge occupancy/anchor Sets before its second cell pass. It does check aggregate rectangular slots/cell counts before per-sheet cell and merge expansion; nonoverlap bounds admitted covered positions by the checked grids. The final `JSON.stringify`/UTF-8-size check at line 375 happens **after** these operations. Therefore the child must establish dense array lengths, string/run sizes, complete wire reservation and fixed object shapes before IPC; the later parent check is independent validation, not a pre-allocation bound on conversion or serialization. Account every validation replay, joined string and wire copy. A malicious/buggy child's malformed reply must fail controlled, not obtain coverage from the OOXML loading exception.

## Public alternatives and their limits

`worksheet.findRow(r)` (`worksheet.js:365–367`), `row.findCell(c)` (`row.js:40–42`) and `row.cellCount` (`row.js:216–217`) are public, nonallocating indexed lookups / direct length reads in this pinned implementation; they are declared at `index.d.ts:562,574,1202`. Use numeric indexes so no string address/key parsing is needed. `worksheet.columns` is a direct array getter (`203–205`); inspect its length before copying or scanning it, and use indexed entries, not `getColumn`. These calls avoid `hasValues`, preserve explicit styled Null cells and allow pre-operation reservations.

`lastRow` (`worksheet.js:357–362`, public at `index.d.ts:1195`) directly reads the final storage slot. Under **ordinary completed load with no intervening mutations**, `_parseRows` resets the array and assigns each normal integer row at its number minus one; merges only add rows. Therefore a nonempty indexed array ends in an existing Row. Its `lastRow.number` supplies the indexed upper extent without `rowCount`'s trailing-hole scan. This is a source-derived invariant for this path/version, not a general promise about ExcelJS workbooks. `spliceRows` can leave trailing undefined slots; P4 demonstrates `lastRow === undefined` while `rowCount === 1`. Do not silently interpret that state as empty if any mutation enters the production path.

That invariant does not validate all hostile coordinates. An invented row `r="4294967296"` loads as a non-index property invisible to array length, `lastRow`, normal iteration and `.model`; `findRow(4294967296)` still finds it. A loaded `c r="A2"` inside row 1 can have `cell.row === 1` and `cell.address === "A2"`. These bounded malformed controls show why load success is not a trusted coordinate validation certificate. Public accessors alone do not establish absence of all unknown non-index properties. A new XML pass, private monkeypatch or arbitrary scan-to-N does not follow from this finding.

There is no corresponding public raw worksheet-array length accessor before `.worksheets` does its work. `getWorksheet(number)` is direct only when the correct ID is already known; sequentially guessing IDs cannot prove no later/unnumbered sheet. `getWorksheet()`/name lookup and `eachSheet` scan/enumerate first. No approved OOXML sheet-ID ceiling exists here; `biffSheets:1024` is a legacy inventory limit, and ZIP-entry count limits physical entries, not sparse sheet IDs. Do not introduce either as an ID cap. A one-sheet workbook with ID 100,000 passes the bounded public load probe.

Using private `_worksheets`, `_rows`, `_cells` directly would expose lengths before some work, but would add reliance on undocumented vendor representation. The **existing private child seam is not a declaration that vendor internals are a stable public interface**. Shape/version checks after copying cannot make a copy pre-bounded. Even direct private lengths do not supply a permitted sheet-ID limit or solve malformed named properties. This review does not authorize private method replacement, dependency patching, a second parser or a claimed upgrade-safe adapter.

## A source-backed conditional model schedule

The following is safe for the **established indexed model and admitted extents**, not a complete claim about arbitrary OOXML. It uses existing limits without inventing a CPU budget. The enumeration/coordinate and zero-grid questions below must remain explicit before calling the whole pipeline proved.

1. Retain the workbook from the one existing load. Establish complete ordered sheet inventory and the permitted treatment of enumeration prework before taking a copied list. Do not obtain `.model`, dimensions, actual counts, values, or `eachSheet` as a preflight shortcut. Capture any admitted sheet list once, not inside per-cell loops. Preserve empty/hidden sheets and normalize outgoing IDs by workbook order.
2. Determine indexed row extent through the documented no-mutation `lastRow` invariant, and direct column-array length. Validate safe integer coordinates/geometry. For every required retained row/column/cell/merge, preserve existing `maxRow=100000`, `maxColumn=16384`; do not create an additional raw-storage cap or pretend all storage slots necessarily define visible extent. A storage extent beyond the admitted axes needs an explicit justified refusal/classification, not a successful clipped traversal.
3. Before each numeric row lookup, record the row-position visit, including gaps and style-only rows. Inspect any existing row's metadata, direct `cellCount`, and row identity before scanning cells. Compute the maximum required column extent from stored cells **including Null styles**, column overrides and merges. Preserve required row/column inherited style and geometry; their conversion cannot be deferred until a value callback that never occurs.
4. Let `R_s,C_s` be the required output extents, `L_sr` the admitted row's cell-array length, and `K_s` the admitted column-array length. Before constructing the grid or display cells, reserve `R_s*C_s` against **aggregate rectangular** `gridSlots=200000`, using checked arithmetic (`R_s > floor(remaining/C_s)` for positive `C_s`). Reserve serialized cell occurrences separately against `cells=100000`. Neither counter pays a row lookup, style copy or SSF call by definition.
5. Walk numeric rows with `findRow`, then `c=1..L_sr` with `findCell`, recording each attempted position before access. Holes create no objects. Existing Null cells are inspected for effective basic style; required styled blanks are emitted. Do not use `getRow`, `getCell`, includeEmpty iteration, `.text`, formula-expression access, or `.model` to discover content. Formula `cell.result` is a direct stored-cache read (`cell.js:817–819`); `cell.formula` may translate a shared formula (`799–800`). Check primitive cache kinds, absence versus zero/false/empty text, and preserve original date-serial decisions separately.
6. Before allocating output, reserve every emitted cell/style/run/merge/row or column override, retained text and the complete escaped JSON contribution. Rich runs and combined text both count. Numeric SSF calls, including cached numeric formulas, cross the unchanged SSF audit's pre-call admission and work/output reservations. Repeated cells pay repeated formatting/output work. Never make SSF or string materialization part of discovering sparse lengths.
7. Validate the entire admitted model in the child before IPC; only one complete reply or controlled failure. Account validation passes, merge-occupancy construction, final stringify and IPC copies separately. Keep the parent validator, policy recheck and controlled errors; a partial model never becomes success. The browser later proves actual rendering and all-sheet reachability.

For a sheet with positive admitted extents and `L_sr<=C_s`, `sum_r L_sr <= R_s*C_s`. Thus a preliminary row pass plus an indexed cell pass can be charged analytically as at most `2*sum_s R_s + sum_sr L_sr` row/cell-position operations, plus a separately recorded `sum_s K_s` metadata scan. For positive grids, `sum R_s`, `sum C_s` and `sum L_sr` each fit within aggregate grid slots. This is an operation schedule, **not a redefinition of gridSlots**. Merge areas, style/run conversion, validation, SSF and output require their own schedules; the formula is not their budget.

For zero-grid sheets, that dominance does not hold. A stored style-only row can have positive row extent, zero cells and zero `columnCount`; a declared empty sheet still costs inventory, name and output work. Row-only scanning is `sum R_s` even when every rectangle has zero area. Keep a separate analytic row/metadata-visit ledger; do not spend `gridSlots` as arbitrary work credits, invent a `max(1,C_s)` rectangle, manufacture a cell, or add a blanket workbook work cap. Conditional on the existing checked ZIP path and this reader, recognized worksheets number at most 10,000: each comes from a matched physical entry and reconciliation only filters/reorders. With admitted indexed row extent at most 100,000, a deliberately loose row-pass bound is 1,000,000,000 visits per pass. That finite source bound is not timely completion, and it does not bound sparse-ID enumeration prework. Zero-grid row/column metadata also needs fidelity treatment: the current parent requires both output dimensions to be zero or both positive, and override indexes must be within those dimensions. The schema has geometry overrides, not row-style objects. Do not silently drop required basic style or choose new minimum dimensions to fit it.

The backing arrays worth distinguishing are therefore: sparse vendor worksheet IDs (no public pre-admission length); sparse row positions (conditional public `lastRow` extent); sparse cell positions (direct public `cellCount`); column objects (direct public `columns.length`); and newly constructed dense display sheets/cells/styles/runs/merges (reserved before construction). A bound on one array is not a bound on another. The 48 MiB JSON limit bounds wire payload after proper reservation, not an earlier sparse span, arbitrary getter prework or total heap.

## Findings and safe options

### [major] Callback admission omits required blank styles and misses prior work

Where: ExcelJS `worksheet.js:551–567`, `row.js:129–147,212–217`; R5 spreadsheet extent/fidelity contract.
Problem: normal iteration skips styled Null rows/cells, and all `hasValues` work precedes its consumer. Switching to includeEmpty creates objects before the same consumer. This is a functional/style loss when used for #4, not merely a release performance concern. No such consumer is implemented at the frozen SHA.
Required change: use the admitted indexed schedule; cover all required blank and inherited styles without value filtering or allocation to discover holes. Proving tests: real producer/route styled-blank row, high-column blank control and empty/hidden multi-sheet inventory; assert visible style through B3, no partial workbook, and rejection before any disallowed construction/SSF operation. P1–P3 below establish package behavior only.

### [major] A public indexed walk is not yet an end-to-end prework/completeness proof

Where: `workbook.js:119–130,181–212`, `worksheet.js:343–375,886–908`, R5 and frozen producer `shelf-parse-worker.mjs:1312–1315`.
Problem: sheet getter allocation/sort precedes any returned-list check; a general rowCount read can scan; non-index coordinates and missing declared sheets can be lost from array-based inventory. Row-only metadata is not paid by rectangular area. None is repaired by a later output byte check.
Required change: record the exact getter/load invariant, enumeration and row-only accounting in the build specification, with bounded package and actual-child correspondence. Preserve the existing missing-sheet and raw-serial/DTD decision questions; do not claim these questions settled. A proof for well-formed indexed models must say so.

Safe options, with architectural classification:

| Option | What it establishes / remaining decision | Level |
| --- | --- | --- |
| Public indexed traversal inside the existing child after explicit extent/inventory admission | Smallest useful implementation slice. Proves the bounded post-admission walk; ordinary-load `lastRow`, direct `cellCount` and indexed finds avoid the callback defect. Does not independently solve preceding sheet enumeration, malformed-coordinate completeness, zero-grid fidelity or SSF. | 1, no new interface/dependency/data flow. |
| Treat a specifically named OOXML getter/prework operation as part of accepted containment | Physically it runs in the same child, so the existing timer/heap still apply. **Authorization to use containment for that distinct obligation is not established by that fact.** The Controller must reconcile this precise unresolved scope if choosing it; this report neither infers an extension nor requests a blanket cap/waiver. Preserve correctness and complete-or-error requirements. | A requirements/decision clarification, not a numeric cap invented by the Developer; changed product contract needs the existing decision process. |
| Private pinned representation inspection | Might expose lengths without public getter work, but needs an exact source-specific design, artifact/shape checks and upgrade tests; no stable vendor interface is proved. It still lacks a permitted ID cap and complete source inventory. Not a certified solution or implicit authorization from this report. | Private code can remain 1 only if interfaces/technology/flow remain; a new public export or dependency is 2. |
| Switch to streaming reader, another parser/formatter, patch vendor parsing, add XML inventory, or change schema/process flow | No proven equivalent fidelity/completeness bound here; not a routine accessor substitution. The accepted decision forbids reviving the bounded XML redesign/new parser for this problem. Do not implement as a workaround. | Dependency/export additions at least 2; changed parser technology, protocol, responsibility or flow is 3 and needs the accepted ADR/Sascha process. |

The accepted OOXML decision specifically permits an exhausting workbook to fail under existing heap/deadline containment, with one plain preview sentence and a surviving server. It is **not** a pre-operation allocation guarantee. ExcelJS object creation/reconciliation/ordinary loading must not be reported as pre-bounded by later model counters. The 30,000-merge extension is explicitly a Front assumption in the accepted spec; do not promote it into a Sascha decision. The SSF audit remains `change-spec` for unproved admission and demonstrated wrong basic results; this traversal review does not broaden OOXML containment to SSF, BIFF/CFB or main-process validation. No additional blanket limit or waiver is sought.

## Independent bounded checks

Node `v22.23.4`, npm `10.9.9`. Root offline install used `EXXETA_SKIP_BROWSER_INSTALL=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --offline --no-audit --no-fund` with normal lifecycle scripts: exit 0, 875 packages, browser download skipped. The existing main has no ExcelJS dependency. For public-package probes, an ignored scratch package requested only ExcelJS 4.4.0, with package identities/resolutions copied from the frozen lock; `npm ci --prefix <scratch> --offline --no-audit --no-fund` with the same browser-skip environment completed normally, 878 packages. This scratch install is source inspection, not a product dependency or installed/pruned artifact acceptance proof. No dependency was added to the repository manifests or lock.

One probe process ran `ulimit -c 0` then `timeout --signal=KILL 15s node --max-old-space-size=128 <scratch>/probe.cjs`. It used public `Workbook`, `xlsx.load`, `xlsx.writeBuffer`, getters/finds/iteration, `spliceRows`, and local JSZip edits of invented in-memory workbooks. No library monkeypatch, instrumentation, private storage mutation, network, real files, binary fixture or product server was used. All 10 named controls below passed, exit 0 in about 0.34 seconds; no timeout, load rerun or foreign-network retry. These are deliberately small package controls, not a load benchmark, a product regression suite or evidence of the product's 30-second containment.

| Probe | Invented input and assertion actually run |
| --- | --- |
| P1 styled blank/indexed walk | Row 8, column 1,024, solid fill and Null value: `eachRow`/ordinary `eachCell` give zero callbacks, row `cellCount=1024`, worksheet `rowCount=8`, `columnCount=0`; numeric finds discover the blank style and leave missing row 1 absent. |
| P2 ordinary load | Public writeBuffer/load round trip of P1 retains the exact fill and cellCount; `eachRow` still gives zero callbacks. |
| P3 includeEmpty | On loaded P1, missing row 1 exists by the time its row callback runs; missing cell 1 in row 8 exists by the time its cell callback runs. Both were absent before their respective includeEmpty calls. |
| P4 trailing holes | A1=1; get row 1,024, then public `spliceRows(1024,1)`: `lastRow` is undefined while `rowCount=1`. |
| P5 row-only style | Row 8 font bold, no cells/height: lastRow number 8, cellCount zero, `row.model=null`, `worksheet.model.rows.length=0`; direct row font remains bold. |
| P6 sparse sheet ID | Change only generated workbook `sheetId="1"` to `100000`: ordinary load succeeds; direct `getWorksheet(100000)` finds the sheet, returned `worksheets.length=1`. No giant-ID experiment was run. |
| P7 malformed non-index row | Add `<row r="4294967296" ht="30" customHeight="1"/>` after ordinary A1: load succeeds; rowCount/lastRow stay 1, but `findRow(4294967296)` returns that row. This does not allocate a 4-billion-position array: the non-index property is the point of the control. |
| P8 existing axis boundary | Add row 100,001 with height 30: load succeeds and both rowCount/lastRow expose 100,001; this supplies an existing maxRow counterexample, not a new limit. |
| P9 address consistency | Change generated cell address A1 to A2 without changing owning row: loaded numeric finds return value 7, `cell.row=1`, `cell.address="A2"`. |
| P10 ordinary sheet inventory | Public write/load of three empty sheets, middle hidden: exact names/order and states survive. This does not prove missing-declared-sheet or chart-sheet completeness. |

Minimal reusable public control, after installing the exact approved package locally:

```js
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
assert.equal(require('exceljs/package.json').version, '4.4.0');
const w = new ExcelJS.Workbook();
const s = w.addWorksheet('Invented');
s.getRow(8).getCell(1024).fill = {
  type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF12AB34'},
};
let calls = 0;
s.eachRow(() => calls++);
assert.equal(calls, 0);
assert.equal(s.findRow(8).cellCount, 1024);
assert.equal(s.columnCount, 0);
assert.equal(s.findRow(8).findCell(1024).fill.fgColor.argb, 'FF12AB34');
assert.equal(s.findRow(1), undefined);
s.eachRow({includeEmpty: true}, row => {
  assert.equal(s.findRow(row.number), row);
});
assert.notEqual(s.findRow(1), undefined);
```

Future proving tests, not run or added here: actual route → actual child `spreadsheet indexed admission` with styled blank, row-only/column-only style, sparse IDs, address mismatch, gaps, empty/hidden sheets and no partial reply; existing exact/one-over aggregate 200,000 slots, 100,000 emitted cells, 100,000 row and 16,384 column coordinates across multiple sheets; reservation-before-construction/SSF assertions at the private test seam; validation and complete JSON reservation controls; existing malformed/missing-sheet/DTD/date-serial controls retained unchanged; server-survival containment check using the existing invented exhausting workbook; B3 proving visible basic style, cached formatted results and every admitted sheet. Boundary fixtures must respect intersecting limits: a 100,000-by-16,384 rectangle cannot be a positive 200,000-slot control. Do not assert successful rendering from the frozen producer's interim 503 or run real services to make these tests pass.

## Acceptance preservation and self-review

| Binding item | Disposition / named evidence |
| --- | --- |
| R1–R3: tabs/tree/close | Untouched. Existing P1/B1/B2 feature checks remain required; this review does not claim browser evidence. |
| R4: every sheet, scrolling, styles/formats/results | P1/P2 prove the blank omission mechanism; P10 checks ordinary existing-sheet order only. P2/B3 product checks remain required. No all-sheet count shortcut or successful omission. |
| R5: Word look | Untouched; R5 Result 5 is distinct from specification revision R5. P3/B4 feature checks remain. |
| R6: read-only | No source workbook/file mutation outside invented in-memory test objects, no opener; P1–P4/B5 feature checks remain. |
| A1: full build/smokes/browser | Not run, per specialized review scope and docs-only exemption; independent Tester/wave retain those gates. |
| A2/A3: invented appearance and stored formula results | Existing real producer/browser P2/P3/B3/B4 obligations retained. Direct result-access source traced; no SSF or formatting success claimed. |
| A4 / external opening | Sascha's real-file/Electron/human acceptance and O1–O4/B6 remain separate. No Windows evidence waiver is reversed. |
| Exact versions, producer and prior audits | Frozen SHAs, integrity/hashes and accepted R5/SSF/containment recorded above; public controls use the exact package. No current working-copy claim. |
| Pre-callback creation and sparse work | Source trace plus P1–P9; corrected native-some attribution. Normal/includeEmpty, model getters, columns, merges, load/reconcile and sheet enumeration accounted distinctly. |
| Public alternative / ledger meaning | Conditional indexed schedule and lastRow invariant explicit; no stable private-interface claim, invented sheet cap, redefined gridSlots or blanket waiver. Row-only accounting and remaining proof gaps named. |
| Missing-sheet / DTD / original serial | Frozen accepted containment spec leaves all three with Controller. Do not weaken the real tests, add a regex/private XML workaround, return partial sheets or synthesize original serials from Date. Workbook reconciliation (`workbook-xform.js:166–184`) can omit missing/chartsheet targets; indexed walking cannot recover them. |
| Delivery and boundaries | Only this Markdown review authored; signed commit and branch push with active `.githooks`. No product changes, new dependencies, helper workers, screenshots or binaries committed. Scratch probes/extracted source removed before handoff. |

Files changed: `docs/reviews/T4-EXCELJS-TRAVERSAL-architecture-spec.md` only. Tests added/changed: none, review-only. Assumptions: the proposed optimized path consumes one completed, unmodified ordinary ExcelJS load inside the existing private child; where that invariant or extent admission is absent, the bounded-traversal conclusion does not apply. No product behavior is implemented or certified by this report.

Debt candidates: `tests` — repeat exact artifact/public-path and invariant checks for installed/pruned payloads and advertised Node versions; `load` — later release tests should measure sparse-sheet enumeration and repeated empty/style-only sheet work. Those observations do not alter the accepted containment decision. The missing admission/fidelity proof above remains explicit rather than being silently converted into a new load cap or a claimed waiver.

Not checked: product producer success, route/server containment behavior, browser, full gates, installed/pruned artifacts, other runtimes/platforms or total VM/RSS guarantees. The review is complete; the full traversal/formatting/declared-sheet contract is not yet proved.
