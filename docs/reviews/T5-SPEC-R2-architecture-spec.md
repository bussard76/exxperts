# T5-SPEC-R2 architecture spec

Verdict: pass
Spec: `docs/specs/T5-workspace-files.md` at `cab69363200ccc740c56e200b4ac9392326df19a`
Level: 3, confirmed: new browser and server modules and browser → room → granted workspace read/write flow.
Decision: ADR-0002 records Sascha's acceptance of the room-scoped flow with existing protections and his separate decision to block external images. The revised spec records the Controller's approval of the four method/route pairs and ten named dependencies and fixes the tool-selection matrix. No further design decision is identified on the reviewed scope.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Tree and drag | `WorkspaceFileBrowser`, `workspace-files-api`, room settings routes, `persistent-room-workspace-files` | Browser → effective room policy → granted directory; file path → composer | Root, entries, ordering, empty states and `ls` selection are specified. The feature branch's independent root resolution and direct directory requests lack the required fingerprint and policy checks; the spec requires closing them. |
| Markdown read and save | `MarkdownEditorPane`, `workspace-markdown-api`, room routes, `persistent-room-workspace-markdown-files` | Room read policy and write policy guard existing files; revision protects replacement | Request and response fields, limits, errors, conflict and editor states are specified. The existing replacement uses the read-purpose resolver; apply write-purpose restrictions too. |
| Images and privacy | `workspace-image-src`, `WorkspaceImageExtension`, image route and workspace guard | Relative source → guarded room route → bytes; external source → alt text without network | ADR-0002 and spec agree. The branch currently passes external URLs to the browser; the spec explicitly requires blocking them, preserving source and a real browser test. |
| Grant and paired devices | Effective workspace policy, workspace tools, `remote-route-policy` | Each room/thread request is bounded by the grant and path guards; paired-device permissions add restrictions | The spec fixes local and paired authorization for each tool selection, read/write mode, root fingerprint, protected paths and symlinks, with route-level tests. |
| Interfaces and parallel work | Room HTTP routes and UI consumers | Four method/route pairs, query/body fields, response and errors | Shared contracts are specified. If work is split, the integrated real browser/server producer-consumer test depends on both server and UI; do not substitute helper-only tests. |
| Outside-in evidence | Issue #5 and `origin/agents/t5-design:design/workspace-files/` at `b702c9d269f4daa69076c089325172daa59be72d` | Signed-off surface, route references and Mermaid flow | Issue comment and design README record Sascha's stage 1–3 sign-off. The screens and diagram match the tree, editor, image and drag flow; the spec supplies additional error, conflict and failed-save behavior absent from the concise diagram. |

## Prefactoring

No broad prefactoring is needed. Reuse or minimally extract the existing guarded workspace resolution for tree access and existing write-purpose policy checks for replacement, retaining the room HTTP seams and avoiding a second weaker policy implementation.

## Findings

No design-relevant finding remains. The first review's authorization and outside-in evidence gaps are resolved by the explicit matrix and signed-off design evidence. The Controller's approval is recorded in the revised spec; ADR-0002 does not itself approve the exact routes or dependencies. The signed-off diagram's abbreviated save transition must be implemented together with the spec's explicit failed-save and dirty-navigation behavior.

## Binding implementation and verification details

- Apply the matrix to every actual local and paired route, including read mode for tree access, and require `read` as well as a permitted writing tool for PUT. `readOnly` describes the mode/tool capability; path-specific write restrictions still apply at PUT and must never be bypassed by that flag.
- Check both requested and resolved paths, including ancestors, against applicable read and write restrictions; reject changed root fingerprints and symlink traversal without exposing absolute workspace paths to remote clients. A denied tree returns the specified empty-root shape, not another directory.
- Preserve image source bytes for the examples specified, including mixed text/image links and literal and encoded spaces; test external and protocol-relative images in both editor modes for alt text and zero requests. Untested HTML image attributes remain a debt candidate unless needed for issue #5's image requirement.
- Verify draft retention after failed saves and conflicts, including navigation save failure, Reload and Keep mine. The integrated browser/server test must run with invented data; a skipped browser flow is not passing evidence.
- Independent level-3 conformance and Tester review remain required. This is a read-only spec review; no tests or suites were run.
