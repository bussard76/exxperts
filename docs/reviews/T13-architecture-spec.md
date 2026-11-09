# T13 architecture spec

Verdict: change-spec
Spec: GitHub issue #13, read 2026-11-09 against 943f5ad3ccca867c22ad1c023538023e3d8cd66c
Level: 1 proposed; not yet confirmed for the complete task. The no-op globals alone are internal to the existing Word worker, but the shape output and logging decisions below may change its security or data-flow boundaries.
Decision: Controller must amend the spec and return it for architecture review; no level 3 decision is requested until a specific design is selected.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Render VML without a delayed callback | `shelf-parse-worker.mjs`, `previewWord` | Existing isolated child produces bounded HTML for the route | No-op globals can remain inside the one-shot child. `window.close()` runs in `finally`; do not schedule the callback. Existing limits and network denial remain in force. |
| Shape markup and browser evidence | Worker sanitizer → `runWorkspacePreviewWorker` → workspace preview route → sandboxed Word iframe | Existing sanitized HTML crosses the child IPC and route to the browser | **Needs design decision below:** current sanitizer removes the SVG containing the shape. No design export exists under `design/` for T13; this is a renderer defect, not a proposed UI redesign. |
| Find unexpected errors without document text | Worker catch → server logging | Child stderr is piped and captured as an 8192-character tail for OOM detection; child error IPC is exact-key validated | **Needs design decision below:** arbitrary exception messages may contain document data, and stderr is not forwarded to a server log. |
| Real producer and consumer | `workspace-file-preview-smoke.ts`, `workspace-file-tabs-ui-smoke.ts` | Invented DOCX → public route → Word frame | Existing tests cover real Word producer/consumer but no VML cases. Specify the expected output for body, header, footer and text box and exercise them through the route and browser. Sascha alone checks his real file on Mac. |
| Bounds and error states | Worker and route | Existing ZIP, DOM and output caps; `damaged_file` response | Retain limits, network denial, CSP, sandbox and existing error mapping; specify how diagnostic logging treats unexpected, malformed or non-Error throws without leaking content. |
| Parallel ownership | Issue #13 | No parallel slices or dependencies stated | If split, identify owners and dependencies and fix the precise shared fields and one real producer-to-consumer test before dispatch. |

## Prefactoring

None is needed for the no-op globals. Do not introduce a new module or dependency for that change. The minimum safe shape and diagnostic implementation depends on the decisions below.

## Findings

1. **Shape acceptance conflicts with the existing security implementation.** `docx-preview` 0.4.1 `renderVmlElement` creates an SVG containing the shape; `sanitizeWordDocument` explicitly removes `svg` and its descendants (`apps/web-server/src/shelf-parse-worker.mjs:596`). Thus adding the no-op produces HTML but cannot satisfy “the shape's markup is present”; it can also discard text nested inside a VML text box. The issue must state whether omission is acceptable (and what users should see, including text-box text) or select a bounded, safe representation that survives sanitization. If preserving SVG, define allowed elements, attributes, URL/resource handling, bounds and tests against active content; do not simply allow arbitrary SVG. This is a design and potentially security-boundary decision, not a precision-only instruction. The issue's note that dimensions are unmeasured does not address complete removal.

2. **The logging requirement cannot guarantee its privacy constraint as written.** `docx-preview` can throw `new Error(errorText)` where `errorText` is XML parser error text (`node_modules/docx-preview/dist/docx-preview.mjs:154`); arbitrary library exception names and messages can contain document content, paths, or other untrusted data. Truncation alone does not remove those values. Specify an allowlisted diagnostic policy with a safe fallback, including how the known `requestAnimationFrame is not defined` failure stays recognizable, and acceptance tests using an invented secret marker in an error and checking both server logs and the response. Also specify the logging seam: child stderr is captured but not logged (`persistent-room-shelf-reading.ts:204–215`), while workspace error IPC accepts only `{ok, schemaVersion, code}` (`persistent-room-shelf-reading.ts:359`). Do not forward arbitrary stderr or raw error objects. Preserve `damaged_file` to the caller and avoid duplicate or document-derived logs.

3. **Record architecture impact explicitly.** The issue says level 1 and names the worker, but has no `## Architecture impact` covering the diagnostic and output seams. Add the section with the selected design, modules, boundaries and resulting level. If a selected design changes a contract, data flow or security boundary, reassess against the repository's level 2/3 rules rather than assuming level 1.

Graph experiment: `graphify update .` completed (27,443 nodes); `graphify explain previewWord` identified the sanitizer and preflight calls, while the broad query was noisy and truncated. Search and source inspection independently verified the caller and sanitizer paths above. No test suites were run for this read-only review.
