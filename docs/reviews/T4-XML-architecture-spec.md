# T4-XML architecture and spec review

Verdict: level-3
Spec: `~/controller-exxperts/analysis/T4-spec-R5.md`, SHA-256 `4a869bbda4b38d42238e73f1ebfbe2716cc3e98f816c56feab7a055ef7c38447`.
Preserved review: `25376f6cbbdb51c7057f9c7b89b47c3ea326a778:docs/reviews/T4-MERGE-architecture-spec.md`.
Inspected implementation/report/probe: `origin/agents/t4` at `22abf5c556fe661e4e404264702ed1b9d8faac12`.
Review base: `origin/main` at `c6ff24035cc430d266f9e5097315fa7168960085`.
Date: 2026-11-06. Scope: independent architecture/spec investigation only; no product implementation, integration approval, opener or full gate.

Decision: **no complete level-1 remedy was established**. Keep the accepted merge design. Do not add an Excel depth/element/object ceiling, discard extension content, patch a package, or replace the parser under that design's existing pass. The Controller must take the options below to Sascha if selecting a changed acceptance contract or XML processing technology, and record the selected level-3 decision in an accepted ADR before implementation. This report proposes a compatibility-preserving direction and its safety conditions; it does not certify an unbuilt parser or authorize that direction.

## What this change does

This review explains why the public ExcelJS merge bypass does not bound XML parsing. It independently reproduces the resource failure, checks the extension against published OOXML rules, and separates possible implementation work from decisions about accepted documents and parser ownership.

The reported nesting is permitted by the extension content model. Calling the file damaged solely because it has that depth would be wrong. Conversely, schema permission is not evidence that every private extension must be interpreted or that the entire generated package passed an independent OOXML conformance validator.

## Review checklist

- [x] Read issue #4, R5's acceptance/architecture/resource/OOXML/package contracts, ADR-0002/0003, the merge review at the exact requested commit, and the developer's exact pushed report/probe.
- [x] Inspect actual ExcelJS 4.4.0, its resolved saxes 5.0.1, loading, transforms, event delivery and namespace lookup.
- [x] Reproduce with invented data under a 512 MiB V8 heap and external deadline; independently validate complete XML with another parser.
- [x] Inspect the official strict/transitional extension schemas and public extension-preservation rules; distinguish structural permission from full conformance.
- [x] Compare depth/work accounting, public ignore options, namespace-aware projection, package changes and replacement parsing without assuming their approval.
- [x] Specify the candidate algorithm, exact decision points, independent route/browser obligations and remaining proof gaps.
- [x] Self-review scope, evidence, data rules and handback; change only this review file, sign the commit and push the review branch.

## Architecture impact

This report is level 1 documentation. Overall T4 remains the accepted level-3 feature under ADR-0002 and ADR-0003. The existing flow remains browser tabs → guarded preview GET → descriptor snapshot → disposable shelf child → validated display model → React. The separately authorized local-open POST continues to use the original guarded file and is outside this investigation.

The merge recommendation remains valid for **merge geometry**: bounded admission, public `ignoreNodes: ["mergeCells"]`, direct reconstruction, no ExcelJS remerge. It explicitly required a bounded XML plan and did not prove one. The later Controller approval for the ExcelJS-owned saxes 5.0.1 import permits that package ownership, not an arbitrary acceptance restriction or a different parser implementation. No prefactoring is needed merely to report this gap.

| Requirement | Owning module and seam | Boundary/data flow | Evidence / required change |
| --- | --- | --- | --- |
| Immutable admitted bytes | `room-settings-routes.ts`, `readPreviewSnapshot` in `shelf-parse-worker.mjs` | Existing guarded route and child | Preserve descriptor/policy rechecks; no pathname reread or server-process parsing. |
| ZIP resource and integrity admission | Existing private ZIP/inflate functions in the child | Snapshot → admitted entries | Preserve 25 MiB input, 10,000 entries, 32 MiB/entry, 128 MiB aggregate, 200:1, CRC and actual output checks. |
| XML before ExcelJS allocation | Proposed OOXML admission in the same child | Entry bytes → parser/model | Current approved saxes entry point has object-per-depth state and inherited-namespace ancestor searches. The missing bound is concrete. |
| ExcelJS values/styles and merge bypass | Exact ExcelJS 4.4.0 public load | Admitted snapshot → existing workbook display model | Preserve ExcelJS role, caches/styles/all sheets and the merge review. An approved projection would deliberately change the library's input representation. |
| Child containment and consumer validation | `runWorkspacePreviewWorker` and `WorkspaceSpreadsheetPreview.tsx` | Child → parent → browser | Retain two slots, cleanup, deadline, 48 MiB result and whole-document failure. These are not pre-allocation guarantees. |

At the inspected SHA, spreadsheet mode still inflates entries and then returns `renderer_unavailable` (`shelf-parse-worker.mjs:879–893`); the parent still lacks a successful spreadsheet branch (`persistent-room-shelf-reading.ts:305–357`). Therefore this is a library-path reproduction and design review, not evidence of a crashing deployed preview route or a successful real spreadsheet producer.

## Independent evidence

Installed a **research-only** dependency closure under ignored `.build/xml-review/` with `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci --prefix .build/xml-review --no-audit --no-fund`, normal lifecycle scripts. The scratch manifest names ExcelJS 4.4.0 and JSZip 3.10.1; 201 resolved package entries and their integrity metadata were copied by dependency resolution from the implementation lock at `22abf5c`. No product manifest/lock was edited. This reduced research graph is not the installed product, packaging or supported-platform proof. An initial scratch-closure generator had a root-path bug, so its first `npm ci` attempt refused the absent lock; the corrected generation/install succeeded. No `npm install`, lifecycle bypass or browser download was used.

Runtime: Node `v22.23.4`, ExcelJS `4.4.0`, ExcelJS-owned saxes `5.0.1`, JSZip `3.10.1`. Resolve saxes through `createRequire(require.resolve("exceljs"))`; a different hoisted saxes is not equivalent evidence.

| Inspected source | SHA-256 |
| --- | --- |
| `exceljs/lib/utils/parse-sax.js` | `14c05f86bc7eb0a698ad263b479ccaa53335821b9c082bb977fca980a93b1b27` |
| `exceljs/lib/xlsx/xlsx.js` | `0766abd994d57c2da21b9ebd3326bf5772ddc74f1d65e7dcf942a0b0a39516d5` |
| `exceljs/lib/xlsx/xform/sheet/worksheet-xform.js` | `d95a66d9febb6f5d79eff3e6b7f9cb3115bb2615063dabc120de7ec6ec97b950` |
| ExcelJS-owned `saxes/saxes.js` | `68e8f0dc9fb3237a481132211ba779865ce80b25e11fc03d1dbcf4dfc67ed5fb` |
| Official Part 4 transitional `sml.xsd` | `495debc8fa967b77ed37799747b049832f2c95b2ecdb9f19ddcd68f8c9f96ab9` |

The exact builder probe was copied from that commit into the scratch dependency root, without changing its content. Reproduction, from that directory:

```sh
ulimit -c 0
/usr/bin/time -f 'elapsed=%e maxRSS_KiB=%M exit=%x' \
  timeout --signal=KILL 35s node --expose-gc --max-old-space-size=512 depth.cjs 2000000
```

| Experiment | Actual observation |
| --- | --- |
| Exact probe, public `ignoreNodes: ["mergeCells"]` | Printed `xmlBytes: 22000823`, `archiveBytes: 22016347`, `gridSlots: 0`; fatal V8 heap exhaustion, SIGABRT, 2.77 s, maximum RSS 657,596 KiB. |
| Same probe, only option changed to `["mergeCells", "extLst"]` | Same byte counts; fatal heap exhaustion, SIGABRT, 2.93 s, maximum RSS 660,936 KiB. |
| Full original worksheet, Python Expat 2.6.1 namespace mode, 16 KiB feeds, no DOM | Parsed all 22,000,823 bytes, 4,000,018 open/close callbacks, maximum element depth 2,000,004, final depth zero; 2.140 s, maximum RSS 316,800 KiB. Ran under a 512 MiB virtual-address limit. |

The external deadline did not cause either Node failure. `time` printed `exit=0` alongside “Command terminated by signal 6”; that field is not a passing status for a signalled process. Core files were disabled; the timeout wrapper's core-dump wording is not evidence of a written core. Both failures were captured, not relabeled as green tests or load flakes. The builder's two failures remain separately reported evidence, not additional independent reruns here.

The Expat experiment generated the same invented workbook to an ignored scratch file, read only its worksheet, forbade DTDs, and used `ParserCreate(namespace_separator="|")`. Start/end callbacks only counted events/depth; no Python element tree was built. It independently proves XML and namespace well-formedness, not XSD/package conformance, bounded behavior of the shipped parser, or permission to ship Expat/Python. The probe's argument counts repeated inner `x:a` tags; the extra foreign wrapper and worksheet/extLst/ext account for its actual depth.

### Where the memory and work go

`xlsx.js:282–313` fully materializes entry content and queues 16 KiB string pieces in an object-mode stream. `parse-sax.js:9–27` constructs `new SaxesParser()` with namespace processing **off**, retains tag objects in the parser, accumulates callbacks into an event array for each `write`, then yields that batch. `saxes.js:1398–1411,1955–1968` allocates a tag plus attributes object and pushes it for every open element. At this depth, millions of live tag objects exist independently of cell count or ignored display features. Text/attribute/name buffers also require accounting.

The event array is not one four-million-event array on this load path: the 16 KiB feed bounds each normal batch. Smaller chunks reduce batch liveness but do not remove the cross-chunk open-tag stack or large single-token buffers. The worksheet transform only sees events afterwards (`base-xform.js:59–77`, `worksheet-xform.js:359–375`), so `ignoreNodes` cannot prevent those allocations. Ignoring extLst also does not constitute namespace validation or an inert-subtree security boundary.

The approved standalone admission parser with `{ xmlns: true }` has another relevant cost. `saxes.js:1845–1861` resolves inherited prefixes by searching ancestor tag namespace maps. With a prefix declared only at the root, repeated nested use requires repeated searches. A bounded independent inline harness parsed `<r xmlns:x="urn:invented">` plus N nested `x:a` pairs, used error-throwing handlers, 16 KiB writes and `close()`, with a 20 s external deadline and 512 MiB heap:

| N | Namespace off | Namespace on |
| --- | --- | --- |
| 4,000 | 17.3 ms | 127.9 ms |
| 8,000 | 12.3 ms | 428.9 ms |
| 16,000 | 11.8 ms | 1,604.3 ms |

Each run completed, with N+1 peak depth and 2N+2 callbacks; the observed maximum callbacks in one feed was 3,277. Warm-up makes the namespace-off values unsuitable for throughput comparison. The namespace-on progression and source establish the ancestor-search hazard; these narrow timings are not a supported-runtime performance promise. No need to run a two-million-depth quadratic experiment.

Changing only the heap flag, deadline, catch clause, XML chunk size or public ignored-node list does not establish a pre-operation guard. Catching an ordinary parse error cannot catch fatal V8 exhaustion. A namespace-off parser plus raw local-name matching would avoid this particular lookup cost by losing required namespace semantics.

## Normative and public format evidence

Downloaded Part 1/3/4 from the [official ECMA-376 standard page](https://ecma-international.org/publications-and-standards/standards/ecma-376/) into ignored research space. Inspected the bundled strict and transitional `sml.xsd`, not an unrelated drawing or Office-2019 extension schema. The PDF text extractor was unavailable; no claim of independently reading the entire PDFs is made. Relevant schema facts:

- Part 4 transitional `sml.xsd:232–237` defines `CT_Extension` with one `xsd:any`, `processContents="lax"`, default namespace wildcard, and a token `uri` attribute. The strict schema contains the same wildcard form.
- `CT_ExtensionList` contains `ext` elements; `CT_Worksheet:2170–2217` permits extLst as its final optional child after the required sheetData. The probe inserts it there.
- The private `urn:invented` payload has one foreign root with nested children and no supplied schema. Lax wildcard validation does not impose a finite nesting bound on that undeclared subtree. Its declared prefix, matching names and token identifier satisfy the relevant extension structure. XML well-formedness is independently checked above.

This supports **structural permission for this extension and arbitrary finite depth**, not a blanket certification of the ExcelJS writer's OPC package, Strict conformance, private extension meaning, or interoperability with Excel. The generated workbook uses the transitional namespace; inspecting a Strict schema too does not turn it into a Strict fixture.

The [public SpreadsheetML extension reference](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.extension?view=openxml-3.0.1), reproducing ISO/IEC 29500-1 §18.2.7, bases recognition on `uri`. It requires preservation of unprocessed extensions and does not require their namespaces to appear in `mc:Ignorable`. Thus absence of `mc:Ignorable` does not invalidate this fixture. Not understanding a private payload is different from deleting it from a produced workbook.

The [XML 1.0 grammar](https://www.w3.org/TR/xml/#sec-well-formed) defines nested elements recursively without a numeric depth ceiling; the [namespace specification](https://www.w3.org/TR/xml-names/#scoping) defines scoped bindings and expanded names. Neither makes a hostile-sized, well-formed extension malformed solely because of depth. They also require more than counting angle brackets: matching names, legal characters, comments, CDATA, declarations, references, encoding and namespace/attribute constraints still apply in content that will not be displayed.

MCE processing is separate from extLst. The [Microsoft MCE presentation](https://download.microsoft.com/download/0/F/1/0F1B141A-9C69-4BEA-97EE-BDC50C7DA114/day2/20160420_Open_session8.pdf) distinguishes `ProcessContent`, `MustUnderstand` and `AlternateContent`. A projection cannot delete every foreign namespace: an ignorable wrapper may require processing its children, a fallback can carry ordinary cells/styles, and an unknown must-understand requirement cannot become a successful partial workbook. Final implementation requires checking those rules against the normative Part 3 text, not treating this presentation as a full processor specification.

ExcelJS itself recognizes some extension data. `ext-lst-xform.js` maps lexical `x14:conditionalFormattings`; `worksheet-xform.js:398–401` reconciles it with normal conditional formatting. R5 permits omission of conditional formatting with the unusual-format notice, but that is not a general allowance to erase basic fonts/fills, rich text, cached results, sheets or arbitrary known extensions. Namespace-aware decisions must use URI, parent and extension identity, not literal prefixes or substring matching. The immutable original must survive any projection; no rewritten workbook is exposed, saved or passed to the opener.

## Alternatives and decisions

| Option | Consequence / unresolved obligation | Decision level |
| --- | --- | --- |
| Continue approved merge bypass with unchanged raw XML | Preserves current input path but reproduces fatal allocation. Deadline/heap contain failure, not pre-operation work. May remain explicitly recorded load/security debt under repository policy; cannot be described as resource-bound compliance. | No new architecture; no complete fix established. Controller can track debt, but cannot silently waive binding R5 limits or claim the missing producer is complete. |
| Add an explicit XML complexity admission contract | Could bound the existing parser before work, if token strings, attributes, live frames, namespace work and retained models are all included. A depth-only guard or a guard after SAX allocation is incomplete. Numeric values and error behavior must be specified and approved; this file chooses none. | **Level 3** when it excludes previously admitted OOXML by a new depth/event/attribute/model ceiling: acceptance-contract change, accepted Sascha ADR required. Implementation can then stay private. |
| Compact XML validation plus a private, semantics-preserving parser projection | Can preserve current byte/grid/output limits and accept this private extension without exposing its depth to ExcelJS. Requires an owned XML/MCE processing implementation, preservation policy, reachable styles/strings and a measured copy/work ledger. It is larger than merge handling alone. | **Level 3 proposed**: new XML processing technology and derived parser input treatment. Obtain accepted Sascha ADR; additional dependency/export, if chosen, also needs explicit level-2 approval. Not authorized by the merge pass. |
| Reviewed compact-stack/event/namespace changes to saxes/ExcelJS | Could avoid projection and preserve bytes, but must change the actual retained state, ancestor lookup and model expansion, not suppress callbacks. Package patch/fork, exact artifact identity, maintenance/licensing and all consumers need review. | At least **level 2** for a changed shipped dependency artifact; a replacement parsing technology/responsibility or changed acceptance contract raises it to **level 3**. No such artifact is approved here. Do not monkeypatch a transitive module globally. |
| Different OOXML parser, native helper, service or converter | Would need fresh fidelity, resource, package and runtime proof; replacing ExcelJS also conflicts with its recorded selection. Python/Expat was a research validator only. | **Level 3** for changed technology/responsibility; dependency approval alone is insufficient. Extra conversion program is not authorized. |

**Recommendation:** if current input semantics and limits must remain, seek approval for the compact validation/projection direction, with the conditions below, rather than inventing rejection thresholds. If the priority is a smaller implementation with the current packages, ask Sascha to accept a precisely defined complexity contract instead. The review does not select on Sascha's behalf. Neither general “too complex” wording nor a measured process crash supplies the missing numerical policy.

The ADR must record: whether additional valid XML may be refused and under exactly which counters; whether a temporary parser projection is permitted; what extension/MCE semantics are retained or intentionally omitted; the selected XML technology/package owner; unchanged original/open behavior; preserved R5 ceilings and failures; maintenance and independent acceptance tests. ADR-0002/0003 authorize workspace access and local opening, not these additional choices. Keep them and the merge pass intact; adopt the new decision separately using the repository ADR template and `Decided by: Sascha (<date>)` with dated evidence. No proposed ADR is written by this report.

## Precise proposed compatibility-preserving algorithm

This is a design for a **decision**, not ready-to-build approval or a proof of a complete bounded implementation. The intended output is the same schema-version-1 model. The following are safety conditions, not an arbitrary new depth/element cap.

1. **Admit bytes once in the existing child.** Keep the guarded immutable snapshot, existing ZIP bounds, actual streaming-inflate ceilings, integrity/identity checks and two-slot lifecycle. Process one inflated XML part at a time. Retain original source bytes for the job; no source replacement or outward effect. Admit all parts that ExcelJS will actually encounter, including comments, tables, drawings, themes, relationships and styles, not just worksheet filenames. Reconcile actual load paths and relationships; no orphan alias may bypass admission.

2. **Validate complete XML using bounded source descriptors.** Decode the supported OOXML encoding forms strictly, without replacement characters or an unrestricted decoded copy; preserve declaration/BOM consistency. The finalized implementation must cite the applicable encoding rules. The validator is iterative and scans every byte, including omitted content. It implements XML names/characters, quoted attributes, line-end/reference normalization, comments, PI, CDATA, entity/reference rules and EOF/root/nesting checks; reject DTD/entity declarations under R5 before resolving them. Never regex-delete a substring or assume a foreign subtree is opaque syntactically.

   Store source start/length/checkpoint indexes in packed arrays, not an object/name copy per nesting level. Match the closing lexical QName to the opening source span, validate expanded names, and reject duplicate expanded attribute names. Attribute checking needs a bounded index or deterministic sort, not a quadratic scan or an object for every attribute. Recognize namespace declarations only after attribute normalization; preserve the distinct rules for default element versus unprefixed attribute namespaces and reserved `xml`/`xmlns` bindings. Namespace changes use an active binding index plus an undo log at frame checkpoints; lookups cannot walk every ancestor. Use deterministic indexed/sorted structures, or explicitly account for worst-case hashing/collision work.

   Capacity derives from admitted byte length and grammar, not an invented count ceiling. For illustration, in B bytes of well-formed ASCII XML, D nested nonempty one-letter elements require at least 7D bytes. Three 32-bit indexes per frame require at most `12 * floor(B/7)` requested bytes: 57,521,880 bytes at a 32 MiB entry, and about 24 MB for the reported depth. This calculation covers **only those stack arrays**, not namespaces, attributes, decoded text, the original snapshot, later models or RSS. It is not a heap proof. Invalid inputs must also be bounded: count the actual lexical opens first or allocate by the looser `floor(B/3)` open-tag bound before complete matching is known; the well-formed bound alone must not underallocate a malformed prefix of `<a>` tags. Any growth/allocation must be admitted before performing it. Avoid geometric growth with overlapping old/new buffers unless both copies are reserved.

3. **Compute a semantic plan without interpreting private content.** Resolve namespace plus legal parent context, workbook sheet order/identity/targets, all cells/cached primitive values, dimensions, styles/rich runs, theme/indexed/tint colors and merges. Preserve R5 grammar and error rules. Maintain original source spans for unknown extension content and explicitly record recognized/unrecognized extension identities. Apply the normative MCE rules, including required understanding, fallback selection and processed children. A foreign `mergeCell`, `row`, `extLst` or `sheetData` is never a worksheet record merely because its name matches an ExcelJS transform. A lexical prefix is not a namespace identity.

4. **Make projection eligibility explicit.** Unknown extension payloads are not interpreted. Preserve them in the immutable original/span plan and omit them **only from the private library view**, if that preservation model is approved. Do not round-trip/save the library view as a conforming edited workbook. Preserve ordinary required content and supported extension effects. Known conditional-format/chart decoration may be omitted only under R5's already accepted unusual-format notice. No other known required semantics may disappear. An unrepresentable required feature gets the specified whole-document failure, never a plausible-looking partial success. This condition requires a reviewed extension/MCE inventory; “all extLst is irrelevant” is not an implementation rule.

5. **Feed a bounded canonical view to the pinned public parser.** Construct parser input from the admitted plan/source spans with explicit namespace-safe names and relationships that exact ExcelJS understands. If emitting a temporary ZIP, regenerate and validate its sizes, names, relationships and CRC. Keep it private/in-memory in the same child; no new file store or cache. Reserve its compressed/uncompressed representation, strings and JSZip copies before generation/load. Transformation expansion must be proved within the existing resource envelope; do not silently apply the 25 MiB source cap to a larger internal representation or reject a previously admitted original because copying exhausted an unapproved internal cap.

   Projected content must have a verified schema-context depth bound for the actual **retained grammar**, not an assumed universal depth constant. Unknown/irrelevant content must not reach ExcelJS anywhere in the package through a second path. Bound retained unused style/shared-string/metadata material as well: extLst filtering alone leaves other amplification paths. Where unused records can be excluded safely, resolve and remap the full reachable reference closure first, preserving defaults, inherited fonts/fills, run styles, cached results, numeric serials and all sheet identities. ExcelJS remains the value/style parser. If this mapping requires replacing its role, stop and revise the architecture decision.

6. **Keep the accepted merge and formatting design.** Invoke public `xlsx.load(projectedBytes, { ignoreNodes: ["mergeCells"] })` once, if projection was selected; direct display reconstruction remains mandatory and no ExcelJS merge helper runs. Compare every resulting sheet and required value/style/reference to admission. Retain occupancy/extent checks, preserved caches, bounded SSF calls, all sheets, per-cell text, output and formatting limits from R5 and the merge review. No second workbook interpretation or silent truncation.

7. **Prove live memory and work, then emit.** Supply a source-corresponding table of simultaneously live original/part/decoder/index/binding/style/string/projected ZIP/JSZip/ExcelJS/grid/model/JSON/IPC allocations and their copy multiplicities. Release each phase's scratch before the next phase; include GC liveness and retained references rather than assuming `gc()` in production. Count lexical scans, attribute sorting, namespace lookups, reference edges and formatter work before their operations. Packed arrays alone do not bound JavaScript/native allocation. Check 48 MiB escaped UTF-8 JSON before emission and validate it independently in the parent. Valid approved-budget excess is controlled 413, malformed XML 422, unsupported required semantics the existing controlled error. Retain crash/deadline cleanup as residual containment, not the success criterion.

**Unresolved proof:** no implementation or complete live-allocation/canonicalization/MCE ledger establishes steps 2–7 on the full accepted OOXML set. The Expat result shows that syntax validation is feasible for this input; it does not solve those obligations in the shipped JS graph. A bespoke XML processor can be substantially larger and riskier than a new explicit complexity policy. This is why the verdict is a decision request, not another conditional level-1 pass.

## Independent proving checks required after the decision

These are **future** tests, not results claimed by this review. Extend the real `workspace-file-preview-smoke.ts` and `workspace-file-tabs-ui-smoke.ts`, without weakening existing cases. Use independently authored raw XML/ZIP generators and literal expected results, not only ExcelJS-writer fixtures or mocked display JSON.

| Named check | Public entry point and required assertion |
| --- | --- |
| P5 / `XML deep private extension` | Authenticated guarded preview GET → real disposable child → exact parser. STORE workbook with the 22,000,823-byte worksheet, private URI and unchanged simple cells; independently confirm sizes/CRC. Projection option: 200 with complete expected workbook. New-policy option: exact approved controlled 413 **before** the denied parser operation. Fatal heap failure/timeout/503 is not the resource guard. Never execute the destructive probe in the test runner/server process. |
| P5 / `XML namespace inheritance and restoration` | Deep declared-once prefix, prefix rebinding/default namespace changes, foreign same-named records, repeated lexical `ext`/`extLst`, alias prefixes, duplicate expanded attributes and undeclared prefixes. Correct semantic records only; malformed cases 422. Instrument the real child's selected operation path to prove the denied next operation never happened; instrumentation must not replace the parser. |
| P5 / `XML full validation in omitted content` | Mismatched/truncated tags at the end of a private extension, malformed comment/CDATA/reference, invalid code point, DTD/entity declaration, quoted `>` and split multibyte/encoding boundaries. Full malformed document refused; projection cannot hide damage. UTF-8 and applicable UTF-16 fixtures must preserve ordinary required content. |
| P2/P5 / `extension and MCE semantics` | Unknown extension before/after required data, supported extension controls, known conditional-format omission with notice, must-understand unknown, processed children and chosen fallback carrying visible values/styles. Compare source hash and required display values; no invented blanket foreign-node omission. Include numeric/date/shared/missing caches, rich fonts, fill/borders and empty/hidden/macro-enabled sheets. |
| P5 / `all parser-consumed parts and live copies` | Deep/large content in styles, shared strings, comments, themes, tables, drawings and relationship-selected sheets; unused records, repeated references, many short attributes, long single tokens and flat event bursts. Assert the selected pre-operation budgets/copy counts; retain exact/one-over existing ZIP/grid/output checks. Exercise malicious malformed open-tag prefixes separately from well-formed depth. |
| P1/P5 / `resource cleanup and authorization` | After refusal or contained child failure, valid real workbook still gets a slot; concurrent requests preserve the two-slot limit and bounded cleanup. Abort/revocation/file replacement fail safely, with no partial model or original-file mutation. No real opener; source bytes are unchanged. |
| B3 / `real producer extension workbook` | Real server/child and browser, no workbook-response mock: all sheets reachable, formatted cached value and rich text, colors/fill/borders/width/merge visible, two-axis scroll, empty/hidden sheets, light/dark, tab reuse/selection. Deep unknown extension must not lose these values; approved complexity refusal must show the existing plain error state with no partial sheet. Assert computed geometry/styles and literal values; never show formula expressions. |
| B5 / `inert extension content` | Invented external `.invalid` references, links and formula-like text; intercept/abort before any DNS/request/navigation and assert zero document-origin attempts. No OS opener is invoked, no binary written outside the test workspace, no edit/save/download control. |
| K1 / `actual parser and projection closure` | Installed tarball and post-prune child, outside checkout: exact ExcelJS/parser identities, full dynamic closure/notices, no source/global fallback, wrong/missing versions refuse, payload ceiling unchanged. Repeat on advertised Node/platform closure. A patched artifact requires its own approved identity and maintenance proof. |

Developer runs targeted typechecks/affected suites and these affected browser specs through `GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate bash -c '<targeted command>'`. The independent Tester/wave own the full gates. This review ran neither a route/browser suite nor full build/smokes; its base lacks the completed producer, and its explicit dispatch overrides generic implementation/gate instructions.

## Preserved acceptance and debt

R1–R3/R6 and the signed local-open result are unchanged. R4/A2/A3 still require the actual complete styled workbook, all sheets and cached results; the parser failure cannot be turned into successful omission. R5 Word is unchanged. A1 remains the independent full-gate obligation after the build. A4/H1 remain Sascha's local real-file/Electron checks; workers never obtain those files. Existing R5 P/B/O/K requirements remain; this report adds precision to their XML proof, not a replacement acceptance list.

Under `docs/coordinator.md`/`docs/review-protocol.md`, resource/security/load observations are debt candidates, not a new functional-only integration failure by themselves. The attacker here only supplies crafted workbook bytes through an allowed preview input, without machine write access; no real external-system reach was demonstrated. The **architecture decision** about changing parser technology/acceptance is separate and still blocks unapproved implementation. No general release resource-safety claim is justified until the selected design is independently proved.

| Category | Severity | Evidence | Proposal |
| --- | --- | --- | --- |
| load/security | high | In-budget private extension exhausts child heap; namespace admission has ancestor-search amplification | Resolve selected XML contract/technology, add P5 and B3 proofs before resource-safety/release claims; do not use an unapproved cap. |
| tests | medium | No completed real spreadsheet producer/parent at inspected SHA | Independent actual producer→route→browser and installed payload tests remain mandatory; mocked consumer evidence is insufficient. |

## Self-review and handback

| Binding instruction | Evidence / result |
| --- | --- |
| Review-only override, own worktree, no helper workers/product implementation/full gate | Only this findings file is tracked as changed. No subagent, other checkout, implementation/test edit or full gate. Research scratch is ignored and is not a product dependency change. |
| Preserve exact R5/merge acceptance | Exact hash/commit recorded; merge bypass retained; no depth/element cap, sanitizer, format exclusion, parser patch or new runtime dependency approved. |
| Actual parser internals and independent bounded reproduction | Exact versions/hashes, two controlled Node runs, independent complete namespace-aware Expat validation and bounded saxes scaling experiment recorded above. |
| Normative validity and ignored-extension caveats | Official strict/transitional schemas inspected; public preservation/URI rules distinguished from full conformance and from MCE. No Excel application or full validator certification claimed. |
| Precise alternatives, algorithm, tests and architecture/ADR decisions | Tables and numbered candidate algorithm identify what must be proved, decision levels and independent public route/browser/installed checks. Unresolved allocation/MCE proof is explicit. |
| Repo, dependency, data and outward-effect rules | Fork-only reads/push, normal `npm ci`, invented workbook/scratch only; no real user files/services/model calls, opener or secrets. Public standards/package acquisition is research, not a real product service interaction. No hooks bypassed. |
| Checks and deliverable | `git diff --check` and report-only changed-file inspection required before signed commit/push; no typecheck of unchanged code represented as new evidence. Review branch/HEAD and coordinator receipt accompany worker_done. |

Files changed: only `docs/reviews/T4-XML-architecture-spec.md`. Tests added: none, as instructed; executed diagnostic experiments are listed above. Assumption: the explicit independent XML review overrides the generic Developer implementation/report/full-gate template. Screenshots: none. Binary fixtures/public-standard downloads stay ignored under `.build/xml-review/`; none are committed. No extra checkout was created. No host-load/environment reruns occurred; the two Node runs deliberately changed one parser option and both failed, rather than being flaky test reruns.

Ponytail verdict: obtain the XML contract/technology decision first; do not claim a small public-option fix. Not checked: finished route/browser fidelity, complete XML/MCE implementation, full live-memory proof, full OOXML conformance, other supported Node/platform/package closures, full gates or Sascha's local acceptance.
