# Issue 22: Series 2 final candidate

## Architecture impact
Level 1: reviewed Markdown editor and targeted tests plus approved lock metadata; no new public interface, dependency, route, store or data flow.

## Acceptance checklist

- [x] Compose the reviewed RAW/Tasks product and targeted tests onto the Series 2 lock candidate, preserving exact approved code and CSS. `git diff 4323d9a` over the six approved product/test paths is empty; product/lock test candidate is `1962d656a057a223d751f3ead11a9e44c7210c00`.
- [ ] List every changed lock path and reason; preserve unrelated upstream lock fields.
- [ ] At Node 20.6.0 and 22.23.4, compare pinned upstream and final candidate: normal npm ci, same-Node runtime build, UI prerequisites and both typechecks, with process provenance.
- [ ] Run common smokes separately on both refs and both Nodes; compare complete diagnostics under Sascha's same-smoke rule.
- [ ] Run Series 2 and RAW-only smokes on the final candidate at both Nodes, including real Chromium.
- [ ] Compare npm ls problem identities and missing metadata paths against baseline; verify registry integrity for changed paths.
- [ ] Record licences, NOTICE and distributed-artifact evidence, including buffers impact.
- [ ] Self-review each acceptance item with named tests; record files, assumptions, debt and exact candidate SHA; push branch.

Graph: no; exact reviewed port, no graph assignment.
