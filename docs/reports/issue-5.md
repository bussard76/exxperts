# Issue 5 implementation report

## Architecture impact

Level 3: existing approved room workspace routes and UI modules; ADR-0002 and the T5 specification define the boundaries. No additional exports, routes, dependencies, stores or data flows are authorized.

## Issue results

- [ ] Sidebar shows the room workspace folder as a tree.
- [ ] Clicking a Markdown file opens it in the right editor.
- [ ] Markdown images resolve against the file and saving preserves image Markdown, including linked images and spaces.
- [ ] Dragging a file to the composer inserts its relative path.

## Observable acceptance

- [ ] Independent Tester runs build and smokes, including the five issue suites (outside Developer stage).
- [ ] Preview opens a Markdown file in a room with a folder and shows its image.
- [ ] An edit and save leaves the image line unchanged; a diff shows only that edit.

## Binding spec checks

- [ ] Tree response, sorting, empty states, invalid and denied paths, root fingerprint and symlink guards.
- [ ] Markdown GET/PUT fields, validation, revision conflicts, size/encoding boundaries and write restrictions.
- [ ] Image types, headers, limits, path restrictions and root fingerprint.
- [ ] Local and paired device tool/mode matrix on all routes, including protected paths.
- [ ] Browser tree, image, edit, save, byte preservation, drag and UI states against real room routes.
- [ ] Failed save, conflict, Reload, Keep mine and dirty-navigation draft retention.
- [ ] External and protocol-relative images show alt text, make zero requests and preserve sources in Edit and Preview; blocked local images remain safe.
- [ ] Developer targeted typechecks, affected suites and browser specs pass; merge origin/main and rerun affected suites.
- [ ] Independent Tester and architecture conformance review remain pending.

## Assumptions and debt candidates

- The original worktree's pre-existing package-lock.json change must remain untouched; a temporary checkout is used because switching branches would overwrite it.
- HTML image attributes are an edge-case debt candidate per the spec.

## Files, tests and screenshots

Pending implementation.

## Image test decision

The coordinator confirmed that ADR-0002 supersedes the old HTTPS and protocol-relative pass-through expectations; these assertions were updated to require blocking while retaining other coverage. `workspace-markdown-images-ui-smoke.ts` exercises both editor modes with intercepted mock URLs, preserved source and zero external requests.

## Progress and open decision

Branch progress includes external image blocking, guarded tree paths and grant fingerprints, protected Markdown writes, tool selection enforcement, mixed image links, terminal newline retention, and browser tests for local and paired devices and draft/conflict choices. `workspace-markdown-images-smoke.ts`, `persistent-room-workspace-files-smoke.ts`, and the gated `workspace-markdown-images-ui-smoke.ts` passed; the last exercises the real server via `node bin/exxperts-web.cjs --port <free-port> --no-open` and invented data. Screenshots: none.

The spec explicitly requires a disabled write mode to deny PUT even with `read` and a writing tool selected. `normalizePersistentRoomCapabilityPolicy` in `persistent-room-workspace-policy.ts` deliberately ignores the stored write flag and derives it from selected tools for every consumer; changing that shared policy or adding a separate raw-policy access would affect an existing contract or data flow beyond the approved scope. Coordinator direction is needed on reconciling this requirement with the existing policy before completion; acceptance items and self-review remain incomplete.

The Developer-stage instruction prohibited the full build. In preparing the fresh checkout I mistakenly started a chain building all runtime workspaces and stopped it before its UI step; I subsequently built the UI workspace separately for the browser test, thereby performing the equivalent component builds despite that instruction. No full smoke suite was run.
