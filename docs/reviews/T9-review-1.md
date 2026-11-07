# T9 review, round 1

Verdict: fail
Reviewed commit: cf043a686a38f028708d88cf796cf5aa84d983f3
Base commit: 981719c9f54042965f4a5802d5aa897b4f497007
Gates: build passed; full smokes failed (373/377); targeted browser and public API checks below.
Ponytail: full diff and connected callers reviewed; one functional finding and debt below. Assumed load: one local user with a room and a granted workspace; no load test was run.

What this change does: It adds framed PPTX and Excalidraw previews, text and JSON previews, and adjusts the Word preview, workspace tabs, tooltips and dividers. The latest issue comment explicitly drops draw.io: its unsupported message and Open button are expected.

## Spec checklist

Issue #9's body and its later comments were checked together; later Sascha decisions take precedence. No T9 builder report or T9 architecture review is present on this branch.

| Requirement | Code / evidence | Test / status |
| --- | --- | --- |
| Word pages, footer and horizontal scrolling | `apps/web-server/src/shelf-parse-worker.mjs` CSS filter and wrapper | Existing Word UI smoke passed; multi-page, footer and both edges are not covered by new tests. Mac report from coordinator: 53/54 opened, one damaged message; appearance not checked. |
| Metadata-only change previews, content change returns `file_changed` | `shelf-parse-worker.mjs:266`; `room-settings-routes.ts:344` | **Fail** for text replacement: public API test below returned 200. Metadata-only case not independently checked. |
| PPTX preview, broken file and size limit | `WorkspaceFramedPreview.tsx`, `pptx-frame-entry.ts`, `room-settings-routes.ts:352` | Invented broken file displayed the plain sentence in browser; limit and a valid deck were not independently checked. Coordinator reports Mac real-file 5/5; appearance not checked. |
| Excalidraw without frames, one/two frames, deleted elements and invalid JSON | `excalidraw-frame-entry.ts` | Invented rectangle rendered in browser; requested frame/deletion/invalid cases lack tests. |
| draw.io, including pages and failure cases | `App.tsx:628`, `App.tsx:8684` | Dropped by Sascha's 2026-11-07 issue comment. Plain unsupported sentence observed in browser. |
| Frame zoom, pointer anchor, limits, drag, buttons, tabs, resize and themes | `frame-canvas.ts` | No new tests; these controls were not independently exercised. |
| Text/JSON, invalid JSON, UTF-8, 16 MB and literal markup | `WorkspaceTextPreview.tsx`, `room-settings-routes.ts:344` | Invented markup displayed as text in browser; public routes returned 200 for text and JSON. Remaining cases lack tests. |
| Multiple framed tabs, switch/reorder, hidden and close during load | `App.tsx:8691`, `WorkspaceFramedPreview.tsx` | Existing workspace tab UI smoke passed; new framed cases have no tests. |
| Opaque frames, blocked requests, escaping, source check and one-time handoff | `room-settings-routes.ts:335`, `WorkspaceFramedPreview.tsx:32` | Sandbox and restrictive CSP observed via public API. React text and tooltip content are escaped; `event.source` is checked. A local intercepted replacement frame received the same 500 invented bytes again; cross-origin navigation test did not complete, so external exposure was not proven. See debt. Hostile-file cases per format are missing. |
| Workspace policy, secret files, local Open, identity checks | `room-settings-routes.ts:258`, `:283` | Existing policy and fake-opener checks precede the stale assertion in the preview smoke. New text and framed reads do not recheck identity or bound the read after stat; see finding. No real opener was invoked in review. |
| Word/PDF/Excel real-file check | Coordinator-provided Mac evidence | Word 53/54, PDF 10/11 (one damaged and one too-complex file, both plain errors), Excel 8/8; appearance not checked. Not independently reproduced here; no real files accessed by reviewer. |
| Tree full-name tooltip, 720px sidebar, Markdown header; both dividers | `workspace-hover-tooltip.tsx`, `in-room-chat.tsx`, `03-room-shell.css`, `43-room-workspace.css` | Browser with invented files: full tree and nested tab tooltips, 720px End, no visible filename in Markdown header, both 1px lines, 9px grab areas, drag and adjacent clicks passed. |
| Notices, shipped payload/size, audit, desktop CSP/build and upstream readiness report | Dependencies pinned in `apps/web-ui/package.json`; no T9 report or notice changes | Missing from branch; not independently measured. Electron and upstream conflicts were not checked. No upstream writes. |
| Level and conformance | Issue initially calls this a level-3 candidate; Sascha's later comment accepts level 3 and requires an ADR and the two corrections | Two pinned dependencies, new frame data flow, new UI modules and worker build setting are present; no T9 accepted ADR or architect conformance report on this branch. Await architect/coordinator; this alone is not a functional verdict under the task rule. |
| Full build/smokes and independent review | See gate evidence | Build passed; smoke gate failed. Review complete with fail for the functional finding below. Architect conformance, integration and Sascha preview remain open. |

## Findings

### [major] A replaced file is previewed instead of reported as changed

- Where: `apps/web-server/src/room-settings-routes.ts:344` and `:352`.
- Problem: The new text and framed paths check the initial stat, then read the pathname without checking the opened file or its identity afterwards. In a deterministic public API test using invented files, replacing `race.txt` between the stat and read returned HTTP 200 with the replacement contents rather than `file_changed`.
- Violates: issue #9's file-check requirement and Sascha's later instruction for bounded, identity-checked reads for text and framed bytes.
- Fix: Read a bounded snapshot from a checked descriptor and recheck file identity and workspace policy before returning, as appropriate to these formats.
- Proving test: Through the public preview route, replace or change an invented text file and an invented framed file between check and read; each must return `file_changed`. Also show that metadata-only changes still preview and a stable file succeeds.

## Gate evidence

Both trees merged current `origin/main` cleanly (already an ancestor). The actual diff against the base is mixed, not documentation-only. The checkout was clean before build; dependencies were installed with `npm ci --ignore-scripts`. No Docker, real model API, real account or real external service was used. Each command below ran through `~/controller-exxperts/full-gate.sh` with `GATE_TASK=T9 GATE_WORKER=t9-review-1 GATE_ROLE=Tester GATE_AGENT=codex GATE_MODEL=gpt-6.1-terra`.

- On `e96e6c3f26e41a634e2ade5aa23d04de223cce98`, `bash -c 'npm run build && npm run smokes'`: build passed, 373/377 smokes passed. The four files listed below failed in parallel and each failed in its required `bash -c 'npm run smokes -- --jobs 1 <filename>'` isolated rerun on the same commit.
- On final `cf043a686a38f028708d88cf796cf5aa84d983f3`, the same full command: build passed, 373/377 smokes passed, gate exit 1. All four files failed in parallel and each failed again alone on this same commit using the same exact isolated command form.

| Smoke file | Parallel and isolated outcome on both commits | Disposition |
| --- | --- | --- |
| `workspace-file-preview-smoke.ts` | Fail: line 579 still expects `notes.txt` to be refused. | Sascha decided on 2026-11-07 to replace the negative example with a still-unapproved extension and add a `.txt` success case. Tests were not changed by the reviewer. |
| `answer-content-smoke.ts` | Fail: one-KaTeX check sees both `excalidraw-frame-entry-BRkx_NQ3.js` and `katex-RYEII7GN.js`. | Resolve whether the check concerns only the app page or whether the isolated bundle must omit its KaTeX copy; do not change either until that purpose/bundle decision. |
| `mcp-oauth-issuer-smoke.ts` | Fail: multiple mock issuer, credential and stored-token assertions, including a mock refresh token sent to mock server B. | Attribution to this diff or environment is unresolved; no baseline run was made. Synthetic local servers only. |
| `persistent-room-mcp-scope-smoke.ts` | Fail: granted mock connector missing from manifest. | Attribution to this diff or environment is unresolved; no baseline run was made. |

Original gate failures remain failures even though the verdict here follows the requested functional-only rule. The full logs and isolated logs were examined; no other failed smoke files were reported. The existing workspace-file-tabs UI smoke passed on both gate runs. Final-head browser and API exercises used temporary invented files and a fake opener. The handoff replay used an intercepted local fake destination, not an external service; an attempted cross-origin destination did not complete. No tests were added by this reviewer.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| security | major | `WorkspaceFramedPreview.tsx:36` | Send file bytes once: a replacement document in the same frame can repeat `frame-ready` and receive them again; test an intercepted navigation and repeated messages. External exposure was not established in this review. |
| tests | major | New preview paths and `apps/web-server/scripts/workspace-file-preview-smoke.ts:579` | Add public route and browser cases listed in issue #9; replace the stale negative `.txt` case and add its positive case per Sascha's decision. |
| tests | major | `answer-content-smoke.ts:354` | Decide whether its one-KaTeX assertion applies to isolated frame bundles before changing the assertion or bundle. |
| tests | major | MCP smoke failures above | Diagnose both failures on a clean baseline and preserve their mock credential-isolation assertions. |
| security | major | Frame renderer routes | Add hostile invented PPTX and Excalidraw fixtures covering links, script-like labels, external images, direct navigation and `postMessage`; confirm no cookies, API, network fetch or forms. |
| load | minor | `room-settings-routes.ts:341`, `:347`, `:355` | Measure synchronous whole-file and bundle reads under concurrent previews; use bounded snapshots for file input. |
| style | minor | `App.tsx:628` and preview-kind conditions | Consolidate the repeated format lists only if the next format change needs it. |
| tests | minor | Packaged payload, licences and Electron | Verify payload limits and bundled renderer notices, measure size and audit the tree, and test desktop CSP/build before release. |

Needs Sascha / coordinator: record the accepted level-3 ADR and architect conformance; produce the requested upstream readiness report and decision on the KaTeX assertion. The current branch has no T9 report. Do not infer a new appearance sign-off: Sascha signed off the current look, and later changes are limited to defects.
