# T5-FINAL architecture conformance

Reviewed commit: c0f62d9c3b1ebe882181c5c79aaec05eb0a7958e
Verdict: pass

## Scope and evidence

Coarse level-3 conformance against issue #5, `docs/specs/T5-workspace-files.md`, accepted ADR-0002, and the passing `T5-SPEC-R2-architecture-spec.md` review. The diff is against merge base `397034345dd38e57cb90e2f5666d8b35dff10b1f` with `origin/main`. There is no maintained `ARCHITECTURE.md` baseline in this project.

- The room routes in `apps/web-server/src/room-settings-routes.ts` and classifications in `remote-route-policy.ts` are the four approved method/route pairs. The ten added direct UI dependencies match the Controller's recorded approval; no other package manifest changed.
- The browser file tree, editor, and image modules use the room routes. The server resolves the effective room/thread policy and uses the existing workspace guard for paths and the approved internal `resolvePersistentRoomWorkspaceExistingFile` export for existing files. Markdown replacement separately checks write-purpose policy. The new exports in the new modules are internal application seams; no package entry point or package export was added.
- The change writes the requested existing Markdown file using a temporary sibling and rename; no new durable store was identified. The image URL resolver rejects external schemes and protocol-relative sources and routes local images through the room image route. No unapproved outward data flow was identified in the reviewed paths.
- Imports in the changed workspace modules stay within the web UI, web server, Node built-ins, and approved dependencies. No forbidden import was identified; the diff does not change runtime or pi-package modules.

## Findings and checks

No blocking architecture finding. `git diff --check origin/main...HEAD` passed; route, dependency, export, storage, import, and data-flow checks were by focused diff and connected-code inspection. No full suites or logic edge-case investigation were run, as required for this conformance review; the independent Tester pass remains a separate gate. The spec identifies HTML image attributes as a possible edge-case debt candidate if not needed for issue #5.
