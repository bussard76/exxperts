# T13-R2 architecture spec

Verdict: change-spec
Spec: issue #13 and the Controller's round 2 revision in the dispatch; code base 9af05945343bf65502cbfbc6eb05fcb77e231e2d.
Level: 2 provisionally, as assigned by the Controller; the logging requirement cannot be implemented at the stated seam. A changed IPC contract or new data flow is level 3 and needs Sascha's accepted ADR before implementation.
Decision: Controller must resolve the two design gaps below and fix the affected ownership and interfaces in the spec. No build is approved on this revision.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| VML preview | `shelf-parse-worker.mjs`, `previewWord` and `sanitizeWordDocument` | Invented DOCX -> isolated worker -> bounded sanitized HTML -> existing IPC -> workspace-preview route -> sandboxed `WorkspaceWordPreview` iframe | No-op animation frame is already in 9af0594. The sanitizer removes SVG, so preserve only validated primitive geometry without relaxing CSP, network denial, output or node limits. |
| Text boxes | Same sanitizer | docx-preview produces SVG `foreignObject` containing HTML for `v:textbox` | Reconcile rejected `foreignObject` with text survival and specify the safe representation and its expected placement; see finding 2. |
| Diagnostics | Worker catch, `runShelfWorker` in `persistent-room-shelf-reading.ts`, route logging | Parent pipes and privately captures stderr; IPC failure has exact keys `ok`, `schemaVersion`, `code` | No existing path delivers worker diagnostic to server logs under the stated constraints; see finding 1. |
| Empty, hostile and bounded input | Existing worker preflight, sanitizer and route error mapping | Invalid/unexpected error remains `damaged_file` (HTTP 422); known preview codes remain unchanged | Tests should cover empty/no-shape documents, unexpected and known errors, hostile SVG attributes and nodes, and bounds. Never log raw messages, stderr, file content or paths. |
| Producer/consumer acceptance | Worker, route and UI | Actual route response consumed in the browser's sandboxed iframe | Invented body, header, footer and textbox fixtures must assert visible shape and textbox text, plus hostile content removal and no external resource loading. Independent Tester and full gate remain required. |

## Prefactoring

None for the geometry-only change. Do not introduce an additional module or public seam. The diagnostic transport requires a decision before its smallest fit can be identified.

## Findings

1. **Diagnostic delivery is not specified and cannot work within worker-only scope.** `runShelfWorker` forks with stderr piped and collects a bounded tail only for OOM classification; it never logs it. The worker's existing result is the only IPC message, and `runWorkspacePreviewWorker` rejects extra failure keys. Therefore a worker-only log on stderr does not appear in captured server logs, while adding fields or a diagnostic message changes IPC. Specify an authorized transport and owner, exact fixed values and validation, and how it reaches the server logger without ever logging arbitrary stderr. State the architecture level for that choice: an IPC contract or new data flow is level 3 under `AGENTS.md` and needs Sascha's decision in an accepted ADR. Alternatively revise the acceptance to remove server-side diagnostics. The test must demonstrate a generic unexpected failure and the exact allowed RAF case through the actual producer and consumer, with an invented secret absent from both response and captured logs.
2. **Textbox representation is unspecified.** The installed `docx-preview` maps `v:textbox` to `foreignObject` and renders its content as descendants (`parseVmlElement` and `renderVmlChildElement`). Rejecting that element as a subtree loses the required text; allowing SVG text alone does not preserve those HTML descendants. Specify how text is safely extracted or transformed, where it appears relative to the shape, and how nested/unsupported content is handled while rejecting `foreignObject` and hostile descendants. The browser acceptance must assert the resulting text is actually visible, not merely present in markup.

The Controller's dispatch fixes ownership of the remaining work to one Developer; no parallel implementation interface is specified. This is a defect in previously agreed behavior, so `docs/coordinator.md` exempts it from new-feature outside-in design exports. ADR-0004 retains existing Word limits and lifecycle. The issue's real-file Mac check remains Sascha's responsibility; no real files were inspected.

Graph: yes. The graph identified the worker sanitizer and network-denial calls but found no directed path to the parent worker; its broad route query was noisy. It did not materially help beyond the issue and code search. The graph update began before resetting the branch to 9af0594, so search and direct reads on that base verified all findings.
