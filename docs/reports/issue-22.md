# Issue 22: Series 2 final candidate

## Architecture impact
Level 1: reviewed Markdown editor and targeted tests plus approved lock metadata; no new public interface, dependency, route, store or data flow.

## Acceptance checklist

- [x] Compose the reviewed RAW/Tasks product and targeted tests onto the Series 2 lock candidate, preserving exact approved code and CSS. `git diff 4323d9a` over the six approved product/test paths is empty; product/lock test candidate is `1962d656a057a223d751f3ead11a9e44c7210c00`.
- [x] List every changed lock path and reason; preserve unrelated upstream lock fields. See the lock path audit below.
- [x] At Node 20.6.0 and 22.23.4, compare pinned upstream and final candidate: normal npm ci, same-Node runtime build, UI prerequisites and both typechecks, with process provenance.
- [x] Run common smokes separately on both refs and both Nodes; compare complete diagnostics under Sascha's same-smoke rule.
- [x] Run Series 2 and RAW-only smokes on the final candidate at both Nodes, including real Chromium.
- [x] Compare npm ls problem identities and missing metadata paths against baseline; verify registry integrity for changed paths.
- [x] Record licences, NOTICE and distributed-artifact evidence, including buffers impact.
- [x] Self-review each acceptance item with named tests; record files, assumptions, debt and exact tested product/lock SHA; push branch. Final comparison confirms the six reviewed product/test files match `4323d9a` and the lock matches `267968c`; `git diff --check cdc3d5c HEAD` passes.

Graph: no; exact reviewed port, no graph assignment.

## Lock path audit

`apps/web-ui` adds the ten approved Tiptap manifest dependencies. The following 63 new paths are the resolved editor dependency graph (direct or transitive); no existing path besides `apps/web-ui` changes and no path is removed. Registry metadata and tarball integrity for each exact path/version were checked in `~/controller-exxperts/evidence/t22-series2-lock-2026-11-10/integrity.jsonl`; that evidence matches this candidate, including URL and SRI. All 63 declare MIT in that evidence. The 160 pre-existing metadata-deficient paths are unchanged.

- `node_modules/@floating-ui/core` 1.8.0
- `node_modules/@floating-ui/dom` 1.8.0
- `node_modules/@floating-ui/utils` 0.2.12
- `node_modules/@tiptap/core` 3.32.2
- `node_modules/@tiptap/extension-blockquote` 3.32.2
- `node_modules/@tiptap/extension-bold` 3.32.2
- `node_modules/@tiptap/extension-bubble-menu` 3.32.2
- `node_modules/@tiptap/extension-bullet-list` 3.32.2
- `node_modules/@tiptap/extension-code` 3.32.2
- `node_modules/@tiptap/extension-code-block` 3.32.2
- `node_modules/@tiptap/extension-document` 3.32.2
- `node_modules/@tiptap/extension-dropcursor` 3.32.2
- `node_modules/@tiptap/extension-floating-menu` 3.32.2
- `node_modules/@tiptap/extension-gapcursor` 3.32.2
- `node_modules/@tiptap/extension-hard-break` 3.32.2
- `node_modules/@tiptap/extension-heading` 3.32.2
- `node_modules/@tiptap/extension-horizontal-rule` 3.32.2
- `node_modules/@tiptap/extension-image` 3.32.2
- `node_modules/@tiptap/extension-italic` 3.32.2
- `node_modules/@tiptap/extension-link` 3.32.2
- `node_modules/@tiptap/extension-list` 3.32.2
- `node_modules/@tiptap/extension-list-item` 3.32.2
- `node_modules/@tiptap/extension-list-keymap` 3.32.2
- `node_modules/@tiptap/extension-ordered-list` 3.32.2
- `node_modules/@tiptap/extension-paragraph` 3.32.2
- `node_modules/@tiptap/extension-strike` 3.32.2
- `node_modules/@tiptap/extension-table` 3.32.2
- `node_modules/@tiptap/extension-text` 3.32.2
- `node_modules/@tiptap/extension-underline` 3.32.2
- `node_modules/@tiptap/extensions` 3.32.2
- `node_modules/@tiptap/markdown` 3.32.2
- `node_modules/@tiptap/markdown/node_modules/marked` 17.0.6
- `node_modules/@tiptap/pm` 3.32.2
- `node_modules/@tiptap/react` 3.32.2
- `node_modules/@tiptap/starter-kit` 3.32.2
- `node_modules/@types/prop-types` 15.7.15
- `node_modules/@types/react` 18.3.31
- `node_modules/@types/react-dom` 18.3.7
- `node_modules/@types/use-sync-external-store` 0.0.6
- `node_modules/csstype` 3.2.3
- `node_modules/fast-equals` 5.4.5
- `node_modules/linkifyjs` 4.4.0
- `node_modules/loose-envify` 1.4.0
- `node_modules/orderedmap` 2.1.1
- `node_modules/prosemirror-changeset` 2.4.6
- `node_modules/prosemirror-commands` 1.7.2
- `node_modules/prosemirror-dropcursor` 1.8.4
- `node_modules/prosemirror-gapcursor` 1.4.1
- `node_modules/prosemirror-history` 1.5.1
- `node_modules/prosemirror-inputrules` 1.5.1
- `node_modules/prosemirror-keymap` 1.2.3
- `node_modules/prosemirror-model` 1.25.12
- `node_modules/prosemirror-schema-list` 1.6.0
- `node_modules/prosemirror-state` 1.4.4
- `node_modules/prosemirror-tables` 1.8.5
- `node_modules/prosemirror-transform` 1.12.4
- `node_modules/prosemirror-view` 1.42.9
- `node_modules/react` 18.3.1
- `node_modules/react-dom` 18.3.1
- `node_modules/rope-sequence` 1.3.4
- `node_modules/scheduler` 0.23.2
- `node_modules/use-sync-external-store` 1.7.0
- `node_modules/w3c-keyname` 2.2.8

## Matrix evidence and self-review

Baseline `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; immutable tested product/lock candidate `1962d656a057a223d751f3ead11a9e44c7210c00`. Subsequent commits change only this report. Separate clean archive checkouts used invented data. Detailed commands, timing, exit codes, full Node 20 failure output, process records and package manifest are retained under `.build/t22-matrix/logs/` in this worktree; no screenshots were captured. Node 20.6.0 used npm 9.8.1 and `/home/developer/.nvm/versions/node/v20.6.0/bin/node`; Node 22.23.4 used npm 10.9.9 and `/home/developer/.nvm/versions/node/v22.23.4/bin/node`.

- Both refs and Nodes: `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` with normal lifecycle, same-Node `npm run build --prefix runtime`, UI prerequisite build, `npx tsc --noEmit -p apps/web-ui/tsconfig.json` and `npm run typecheck:scripts` passed. `npm run test:scripts` passed 49/49 on candidate at each Node. Builds are prerequisites, not the independent full gate.
- Common `room-workspace-path-reach-smoke.ts`: Node 22 passed on both. Node 20 failed on both after the shared server startup at smoke line 236: `TypeError: e.split is not a function` in `tsx` `mapTsExtensions`, followed by `server exited before startup with code 1`. Full logs establish the same diagnostic and location. Per Sascha's 2026-11-10 decision this identical same-smoke baseline failure counts as pass for the series and **must be disclosed as pre-existing upstream behavior in the PR notes**. `persistent-room-workspace-policy-smoke.ts` passed on both refs and Nodes.
- Candidate at both Nodes: `composer-text-insertion-smoke.ts`, `persistent-room-workspace-files-smoke.ts`, `persistent-room-workspace-markdown-files-smoke.ts`, `workspace-markdown-images-smoke.ts`, `workspace-markdown-images-ui-smoke.ts`, `workspace-markdown-notices-smoke.ts`, `markdown-raw-tasks-smoke.ts` and `workspace-markdown-raw-ui-smoke.ts` passed individually through attributed gate. Chromium's Playwright executable existed and both browser smokes ran, not skipped. The RAW browser smoke proves editable and read-only RAW, exact-source round trips, task controls, checkboxes, geometry, conflict/failed and held saves, and discard; image UI smoke covers navigation and image/policy paths. The helper smoke covers nested and mixed task selections. The reviewed source commit records red-first evidence in the earlier developer report at `origin/agents/t22-s2-raw-port-r2:docs/reports/issue-22.md`.
- Separate instrumented common and RAW reruns recorded `process.execPath` and version for npm, tsx, server and observed worker threads (`*-processes.jsonl`), all at the selected Node path. These are supplementary instrumented reruns, not a claim that the original matrix runs had process instrumentation; the main runs also selected that Node on PATH. Node 20 baseline/candidate showed the same common failure and the RAW run passed; Node 22 reruns passed.
- `npm ls --all --json` on each ref at each Node failed with identical recursive problem identities: twelve occurrences of root `@types/node@20.19.40` invalid along the same dependency paths, with no new problem. Exact sets of 160 missing-resolved/integrity paths match baseline. Node 22 `npm audit signatures` passed on each ref; candidate verified 875 signatures and 162 attestations. Prior exact-lock evidence verifies registry URLs and tarball SRI for every one of the 63 changed dependency records, matched here against the final candidate.
- Exact-lock registry evidence declares all 63 added packages MIT; the older variant-C licence inventory has different versions and is not used as final-graph proof. The actual Node 22 built candidate `npm pack` artifact includes `LICENSE`, `NOTICE` and UI assets; `candidate-pack.json` records every packaged path and artifact hash. NOTICE includes Omnigent attribution and bundled editor licence texts. The pre-existing runtime notice refers to `runtime/LICENSE` and `runtime/NOTICE.md`, neither included in the package; baseline NOTICE contains the same references. This needs a separate distribution/licence assessment, outside the approved exact port. `buffers@0.1.1` does not appear in either Series 2 or upstream baseline lock graph; the separately investigated Series 1 replacement does not affect this candidate.

Files changed relative to the Series 2 base: `package-lock.json`, `apps/web-ui/src/components/MarkdownEditorPane.tsx`, `MarkdownEditorToolbar.tsx`, `apps/web-ui/src/markdown-raw-tasks.ts`, `apps/web-ui/src/styles/43-room-workspace.css`, `apps/web-server/scripts/markdown-raw-tasks-smoke.ts`, `workspace-markdown-raw-ui-smoke.ts`, and this report. The two smoke files contain the reviewed targeted tests. No new dependency beyond the reviewed lock, route, public export, store or data flow was introduced by this port. Assumptions: the Controller's pinned lock and reviewed product commits are authoritative; same-smoke exception applies only to the exact diagnostic above. Preserved the unowned starting lock change as stash `T22-LOCK2-RESUME preserve unowned lockfile change`.

Debt candidates: minor tests for nested tasks through the browser and same-mounted discard; minor UI visibility of Delete table, as the preliminary review records. Distribution/licence review of the pre-existing missing runtime notice files remains open. Independent full gate, review and Series 1+2 composition remain Controller/Tester-owned; no main merge or full gate was run. Graph: no; exact reviewed composition, no graph assignment. Six tool calls before first report edit; no graph affected the work.
