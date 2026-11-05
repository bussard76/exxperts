# ADR-0002: Room-scoped workspace file access

Status: accepted
Date: 2026-11-05
Decided by: Sascha (2026-11-05), option A
Architecture impact: level 3 — web UI workspace browsing and editing modules, room routes, and the browser → room → granted workspace read/write data flow

## Context

Issue [#5](https://github.com/bussard76/exxperts/issues/5) requests review and integration of `feat/workspace-files` at `6ff69dae03fd6b2fdc3c5a79094b366b731c76c6`: a room workspace tree, a Markdown editor, and images in Markdown.

The architecture spec review at `origin/agents/t5-specreview:docs/reviews/T5-architecture-spec.md` (revision `e8da4b78366f20a69e3432c2778d0f736cded03c`) raises the task from level 2 to level 3 because it introduces modules and a browser-to-workspace data flow. It also identifies a tree-listing policy gap: listing does not enforce the stored grant fingerprint or protected path segments as the existing guarded resolver does.

The proposal in `~/controller-exxperts/t5-adr-proposal.md` offers room-scoped access with the existing workspace boundaries (A), or retaining file access exclusively in existing tools (B). Sascha's answer is recorded in `~/controller-exxperts/inbox-done.md` on 2026-11-05. External image sources were pending in that proposal; Sascha subsequently decided them separately on the same date, as recorded in the same decision log.

## Options

### A. Room-scoped access with existing workspace boundaries (recommended)

- Allow the room UI to list its granted workspace as a tree, read and save Markdown, and load local workspace images.
- Apply the existing workspace grant, protected-path, symlink and tool-permission rules to every access path, including paired-device access.
- Retain the requested UI while correcting the tree policy gap before integration; define concrete contracts and prove enforcement through public routes and a browser/server flow.

### B. Existing tools only

- Keep workspace file access exclusively in existing tools and omit the tree, editor and image UI flow from this integration.
- Avoid the new UI data flow, but leave issue #5's requested experience undelivered.

## Decision

Option A. Decided by Sascha on 2026-11-05: "Ja, mit denselben Schutzgrenzen".

The accepted scope is the room-scoped workspace tree, Markdown read/write, and local workspace images, subject to the same existing workspace protections. The room's existing workspace grant and policy remain authoritative throughout the browser → room routes → workspace flow; this decision grants no broader filesystem access. Tree listing must close the reported policy gap before integration.

Separately decided by Sascha on 2026-11-05 for external image sources: "Nein, weiter blockiert". External images remain blocked; the link stays in the file, the alt text is displayed, and opening the file sends no network request. This behavior must be proved in the web UI.

## Consequences

- The web UI consumes room-scoped file access through the server's room routes. Server workspace modules enforce the existing grant fingerprint, protected paths, symlink rules, and read/write tool permissions for tree listing, Markdown and local images, including paired-device access. Workspace grants remain configured at the computer under the existing policy in [Workspace and Bash](../workspace-and-bash.md).
- The implementation spec must define request/response and error contracts, missing or changed grants, read-only access, edit/save conflicts and unsaved edits. This ADR does not approve exact route contracts, dependencies, or unresolved editor behavior.
- Public-route tests must demonstrate the existing workspace protections; a real browser/server flow must demonstrate the accepted local file experience using invented files. A web UI test must also prove the separately decided external-image behavior, using a mock endpoint to verify that opening the file sends no network request. No real user files or external services are needed.
- The linked-image preservation limitation and supported Markdown subset require precise acceptance criteria in the implementation spec. This record does not resolve them or waive issue #5's preservation requirement.
- Product code is unchanged by this ADR. Independent functional review and level-3 architecture conformance remain required before integration under ADR-0001.

## Slicing

1. Record the level-3 decision and the separate external-image decision in the accepted ADR; check both dates and exact quotes, and option A, against the decision record.
2. Refine issue #5's implementation spec within the accepted level-3 boundary: define contracts and acceptance criteria, name dependencies for the required review, and include the separately decided external-image behavior. Check the spec against this ADR and the architecture findings before implementation.
3. Implement the accepted tree, Markdown and local-image flow with the existing workspace protections, closing the tree policy gap, and enforce the separate external-image decision. Check through public routes and an end-to-end browser/server flow with invented files, including the external-image web UI test, followed by the independent review gates. If split into parallel work, define shared contracts and dependencies first.
