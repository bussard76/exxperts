# Issue 22: Series 2 final candidate

## Architecture impact
Level 1: reviewed Markdown editor and targeted tests plus approved lock metadata; no new public interface, dependency, route, store or data flow.

## Acceptance checklist

- [x] Compose the reviewed RAW/Tasks product and targeted tests onto the Series 2 lock candidate, preserving exact approved code and CSS. `git diff 4323d9a` over the six approved product/test paths is empty; product/lock test candidate is `1962d656a057a223d751f3ead11a9e44c7210c00`.
- [x] List every changed lock path and reason; preserve unrelated upstream lock fields. See the lock path audit below.
- [ ] At Node 20.6.0 and 22.23.4, compare pinned upstream and final candidate: normal npm ci, same-Node runtime build, UI prerequisites and both typechecks, with process provenance.
- [ ] Run common smokes separately on both refs and both Nodes; compare complete diagnostics under Sascha's same-smoke rule.
- [ ] Run Series 2 and RAW-only smokes on the final candidate at both Nodes, including real Chromium.
- [ ] Compare npm ls problem identities and missing metadata paths against baseline; verify registry integrity for changed paths.
- [ ] Record licences, NOTICE and distributed-artifact evidence, including buffers impact.
- [ ] Self-review each acceptance item with named tests; record files, assumptions, debt and exact candidate SHA; push branch.

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
