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
