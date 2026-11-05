# T5 architecture spec

Verdict: level-3
Spec: GitHub issue bussard76/exxperts#5, read 2026-11-05; branch `origin/feat/workspace-files` at `6ff69dae03fd6b2fdc3c5a79094b366b731c76c6`
Level: 3, raised from 2. The contribution introduces workspace browsing and editing modules and a new browser → room routes → user workspace read/write data flow, not just routes and dependencies.
Decision: Sascha's issue statement sends the contribution through the factory; it is not an accepted architecture ADR. An accepted ADR with `Decided by: Sascha` is needed before integration under `AGENTS.md`. The Controller must also decide the level-2 route and dependency details.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Tree and drag | `WorkspaceFileBrowser`, `workspace-files-api`, `room-settings-routes`, `persistent-room-workspace-files` | Browser lists a room's granted folder and inserts a relative path into the composer | Issue gives route names but no query/response contract, limits or error states. Define them and the workspace policy enforcement in the spec. |
| Open and save Markdown | `MarkdownEditorPane`, `workspace-markdown-api`, routes, `persistent-room-workspace-markdown-files` | Browser reads and replaces a workspace file | Define query, body, response, revision conflict and read-only behavior, size/encoding limits, unsaved edits, missing workspace and file errors. Existing code uses `conversationId` and `path`, `{content, revision}`, and returns `path`, `content`, `encoding`, `bytes`, `revision`, `readOnly` plus room identifiers. |
| Images | `workspace-image-src`, editor image extension, image route and workspace file resolver | Relative source → room image route → workspace bytes; absolute URL → browser request | Define allowed sources, root/parent traversal, types, size, failure behavior and external network/privacy policy. Current `workspaceImageUrl` passes scheme and protocol-relative URLs through; opening a file can contact an external host. The issue does not authorize or describe that effect. |
| Ownership and privacy | Workspace policy and existing guarded resolver | User-granted workspace and remote-device read/write access | Specify that tree, Markdown and images enforce the same grant fingerprint, protected paths, symlink rules and tool permissions; specify paired-device access. Current tree listing resolves the root independently and does not check the stored fingerprint or deny segments in the requested path, unlike the guarded resolver. A direct request can list a denied directory; a retargeted grant can expose another folder. |
| Evidence | Issue #5, `design/README.md`, `workspace-markdown-images-ui-smoke.ts` | Surface → real browser consumer → real server producer | No `design/<feature>/` export or logic diagram exists; the issue records a human image check and two prose actions but not a complete logic diagram or states. The UI smoke exercises tree, image, save and drag end-to-end with invented files; it conditionally skips without Chromium. Require evidence for error, policy and privacy decisions as well. |
| Dependencies | `apps/web-ui/package.json` | UI editor packages | The spec says `@tiptap/*` but the branch adds ten distinct packages: core, extension-image, extension-link, extension-list, extension-paragraph, extension-table, markdown, pm, react, starter-kit (all `^3.31.3`). Name each in the task for the Controller and Tester. |
| Parallel work | Issue #5 | Shared server/UI route seams | The issue says it depends on nothing and does not identify parallel tasks. If split, fix the full request, response, error and authorization contracts first; identify task dependencies and retain an end-to-end test through the actual producer and consumer. |

## Prefactoring

No broad prefactoring is needed. Reuse the existing guarded workspace resolution and policy rules for the tree seam, or make the smallest shared extraction needed to provide equivalent checks; do not maintain a second weaker fence.

## Findings

1. **Architecture decision required.** Options: A) accept the room-scoped tree/editor/image flow and its new modules, with existing workspace policy enforced throughout (recommended); B) keep workspace file access exclusively in existing tools and omit this UI flow. Record the chosen data flow, ownership, remote access and constraints in an accepted ADR before integration. The requested review is restricted to this file; the Controller should arrange the proposed ADR separately.
2. **Privacy decision required.** Decide whether Markdown may load external images automatically. Recommend local workspace images only by default, with remote sources blocked unless explicitly authorized by a product decision. The current pass-through can disclose that a document was opened to the image host.
3. **Spec needs concrete contracts and states.** Resolve the checklist gaps, including exact route fields/statuses, tree root and policy behavior, empty/no folder, missing or denied files, failed image loads, edit/save conflicts and unsaved navigation. The current implementation is useful evidence, not an approved contract. The unchanged-image requirement also needs a defined supported Markdown subset: the issue itself notes linked images mixed with text lose their link; this conflicts with an unrestricted preservation promise. Specify the intended behavior or explicitly narrow the promise and track the defect.
4. **Security acceptance needed.** Add public-route coverage for denied path segments, root retargeting, symlinks, read/write permissions and paired-device policy, alongside a real browser/server test of the agreed image source policy. The current tree module's direct path and root checks do not satisfy the documented workspace fence (`docs/workspace-and-bash.md`).

No tests were run for this read-only review. The human preview statement is useful surface evidence but does not substitute for the missing design export and logic/states evidence.
