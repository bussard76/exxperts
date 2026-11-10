# T17-18-ADR architecture conformance

Verdict: pass
Reviewed commit: 028012127b8686ac0215fe30a4f3d3c3bb2af742
Reviewed branch: origin/bussard76/t17-raw-edit
Review branch: agents/t17-18-adr-conformance
Base: origin/main at 9111063fdd58ad96ad27f9bd1967dbe5a8de2a13
Decision: accepted ADR-0007, Decided by: Sascha (2026-11-10), option B
Decision source: origin/agents/t17-18-adr at 03ec9b3df8cf54194d6b69d696e7d97c84f8c152, docs/adr/0007-markdown-raw-task-helper.md
Spec review: origin/agents/t17-18-addendum-specreview at 42bca9d4e9eb09f09a1ae3670c103c7b42742b16, docs/reviews/T17-18-ADDENDUM-architecture-spec.md
Functional review: b56f1096fd8bcc3b4082d2809949dacea6e34493, docs/reviews/T17-18-review-final.md, Verdict: pass on the same reviewed commit
Requirements: fork issues [#17](https://github.com/bussard76/exxperts/issues/17) and [#18](https://github.com/bussard76/exxperts/issues/18)

## Architecture impact

Level: **3, independently confirmed** for the combined change. Issue #17 changes the existing editor implementation; issue #18 adds the internal `apps/web-ui/src/markdown-raw-tasks.ts` module and exports its operations to the editor. The issues' expected level 1 does not cover that module. The earlier spec review's actual verdict is `level-3`, not `pass`; ADR-0007 subsequently records the decision that was missing.

ADR-0007 covers the actual helper interface, including **both runtime exports and the exported type**: `cycleTaskLines(value, start, end): TaskToggleResult`, `isTaskLine(value, position): boolean`, and `TaskToggleResult` with `value`, `selectionStart`, and `selectionEnd`. Its Decision section explicitly identifies the existing result type as describing the approved result, rather than an additional external contract. There are no further helper exports. The private `SurfaceHandle` additions and the toolbar's optional `raw: {taskActive, onTask}` prop are within the pane/toolbar seam expressly covered by the ADR.

**No further level-3 decision or other architecture authorization is needed for this exact implementation.** The approval covers the additional module and its actual interface; it does not authorize later expansion or a Series 2 port. No prefactoring is required for conformance to option B.

## Boundary checks

| Check | Evidence | Assessment |
| --- | --- | --- |
| Helper responsibility and exports | `apps/web-ui/src/markdown-raw-tasks.ts:5`, `:28`, `:34`; the helper has no imports, I/O, persistent state or framework dependency | String/position transformations only; all three exported declarations match ADR-0007. |
| Production consumers and imports | `MarkdownEditorPane.tsx:25`, `:419`, `:525`; repository search finds the pane as the only production helper consumer | No forbidden import or cross-tier production dependency. The other consumer is the focused smoke script under `apps/web-server/scripts`, not server production code. |
| Pane and toolbar ownership | `MarkdownEditorPane.tsx:106`, `:286`, `:295`, `:415`, `:525`, `:630`; `MarkdownEditorToolbar.tsx:23`, `:35`, `:94` | Pane owns textarea selection and draft updates; toolbar receives active state and callback. No helper access to the editor, workspace or save lifecycle. |
| Issue #17 persistence and dirty-navigation seam | `MarkdownEditorPane.tsx:223`, `:286`, `:425`, `:500`, `:572`, `:588`; unchanged `useMarkdownEditorSync.ts` and `workspace-markdown-api.ts` | RAW typing calls `setRaw`, mirrors the pane draft and dirty state, and uses the existing surface save and pane persist/conflict paths. `rawRef` is transient exact-source state, not a second durable store or save channel. Public `MarkdownEditorHandle` remains unchanged. |
| Issue #18 task operations | `MarkdownEditorPane.tsx:419`, `:525`, `:630`; `MarkdownEditorToolbar.tsx:74`, `:94`; helper operations | RAW toolbar actions use the approved helper and the same `setRaw` path; Edit retains its existing task-list action. This follows issue #18 reading 1 plus verification of reading 2; other RAW formatting operations were not added. |
| Contracts, dependencies and stores | Full six-file task diff against the base; no package manifest, tracked lockfile, workspace API, route or server production change | No additional public API, dependency, request/response shape, route, durable store or protocol. GET/PUT Markdown still use the existing room-scoped URL, file shape and `{content, revision}` request. |
| Data flow and real external systems | Existing workspace API and ADR-0002; new helper has no I/O; new browser smoke uses a temporary synthetic home, invented files, loopback URLs and a fake provider | Existing browser → room → granted workspace flow and server authority remain intact. No new external fetch or path to a real external system is introduced. No tests or real services were invoked by this review. |
| Local presentation | `43-room-workspace.css` task diff | Pane sizing, RAW textarea layout and checkbox alignment remain within the existing editor surface. No responsibility or import change. |

## Findings

No blocking architecture findings. The accepted ADR was read from its exact source commit using `git show`; it was not merged into the reviewed tree. The review branch was created directly at the full reviewed SHA and contains no integration merge.

The spec review's source-preservation and concurrency checks concern implementation behavior within the approved seam. Their functional assessment remains with the independent Tester; this coarse review does not re-run those scenarios or infer their correctness from ADR acceptance. The supplied functional reassessment at `b56f1096fd8bcc3b4082d2809949dacea6e34493` records a pass and retains its limitations and debt.

## Debt and acceptance items

| Category | Severity | Evidence | Disposition |
| --- | --- | --- | --- |
| style | minor | `MarkdownEditorToolbar.tsx:97` hides Delete table in RAW instead of showing it disabled | Retain the functional review's debt and Sascha preview item: select a table in Edit, switch to RAW, and assess the absent control. This does not introduce an architecture change or require another level-3 decision; no implementation change is made here. |
| tests | minor | Functional review at `b56f1096fd8bcc3b4082d2809949dacea6e34493` | Retain its coverage, isolated Stop-copy timing and platform-test debt; do not treat this architecture pass as resolving them. |

Series 2 CSS reconciliation, independent/composed port gates, source-authority and Node-floor decisions remain outside this review and outside ADR-0007's approval.

## Verification and limits

- Read the complete six-file implementation diff from `9111063fdd58ad96ad27f9bd1967dbe5a8de2a13` to `028012127b8686ac0215fe30a4f3d3c3bb2af742`, the connected pane, toolbar, sync and workspace API code, both issues, both review records, ADR-0002, ADR-0007 and the architect/coordinator protocols.
- Searched helper exports, imports and consumers; confirmed the helper has exactly the approved declarations and no imports. No maintained `ARCHITECTURE.md` exists; `factory.config.json` has architecture mode `off`.
- `git diff --check 9111063fdd58ad96ad27f9bd1967dbe5a8de2a13..028012127b8686ac0215fe30a4f3d3c3bb2af742`: passed.
- `GATE_TASK='T17-18-ADR-CONF' GATE_WORKER='t17-18-adr-conf' GATE_ROLE='Architect' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-sol' node node_modules/typescript/bin/tsc --noEmit --incremental false -p apps/web-ui/tsconfig.json`: passed, exit 0.
- No full gate, browser run, logic-edge-case hunt, security/load audit, graph generation, code change or ADR change. Read-only scope took precedence over generating graph artifacts. No behavioral tests were added for this documentation-only review.
- Assumption: review the pinned implementation in isolation, as dispatched; authorization is assessed against ADR-0007 read separately. A pre-existing working-tree `package-lock.json` rewrite was left untouched and excluded from the report commit.

Files changed by this review: `docs/reviews/T17-18-ADR-architecture-conformance.md` only.
