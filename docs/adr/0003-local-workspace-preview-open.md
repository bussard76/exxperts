# ADR-0003: Open workspace preview files through the local server

Status: accepted
Date: 2026-11-06
Decided by: Sascha (2026-11-06), option A
Architecture impact: level 3 — preview UI, room routes, workspace authorization, remote route policy, and the browser or Electron → local exxperts server → host operating-system application data flow

## Context

Issue [#4](https://github.com/bussard76/exxperts/issues/4) adds read-only workspace file previews after [#5](https://github.com/bussard76/exxperts/issues/5). [ADR-0002](0002-room-workspace-access.md) establishes the room-scoped workspace boundary; #5 must be integrated before #4 is built.

At the [2026-11-05 design sign-off](https://github.com/bussard76/exxperts/issues/4#issuecomment-6664073271), Sascha added a button in each preview header to open that file in the program assigned by the operating system on the computer running exxperts. It is hidden on paired devices and excluded from the Markdown editor in this ticket. Opening failure displays: "This file could not be opened in another program."

The independent assessment `~/controller-exxperts/analysis/T4-open-impact-review.md` (2026-11-05, code revision `397034345dd38e57cb90e2f5666d8b35dff10b1f`) identifies a new host action and browser-to-OS responsibility. Existing HTTP link handling in Electron is not a workspace file-opening contract. Classifying an action `local` blocks paired devices, but does not itself prove local authorization: the remote-route hook returns early when no paired-device identity is attached.

The signed-off design text is `design/workspace-file-previews/` on `agents/t4-design`, revision `bc3b7485734aea7473dae2a5be4a607469e7f285`. It supplies UI and flow evidence, not an OS execution mechanism. The [2026-11-06 ticket exception](https://github.com/bussard76/exxperts/issues/4#issuecomment-6679384623) makes that Figma export complete stage-1 evidence without a clickable fake: "Entwurf reicht, direkt bauen". This exception applies only to #4. Earlier analyses that still list the fake and architectural choice as unresolved predate these decisions.

## Options

### A. A narrowly limited local server action (recommended)

- The preview UI requests opening by room, conversation and workspace-relative path; the server authorizes the local action, checks the current workspace and dispatches the guarded file to the OS-assigned application.
- Works in Electron and an ordinary browser on the computer running the server, without a desktop-only bridge.
- Introduces an intentional host-side effect. Requires explicit local authorization, guarded target selection, non-shell process invocation, useful failure handling and a fake opener for verification.

### B. A desktop-owned action

- A desktop bridge performs equivalent authorization and opens the file.
- Introduces another contract and target handoff; a desktop-only implementation does not satisfy ordinary browser use on the server computer.

### C. Defer opening in another program

- Deliver previews without the host action.
- Avoids this new flow, but leaves the explicit signed-off button undelivered; deferral requires a product decision.

## Decision

Option A. [Decided by Sascha on 2026-11-06](https://github.com/bussard76/exxperts/issues/4#issuecomment-6679377902), answering "Wie soll der Button in den Vorschauen die Datei im Programm öffnen?": "Über den exxperts-Server".

The recorded option is a narrowly limited, locally authorized server action with the workspace check. It must work in Electron and a browser on the same computer. Sascha explicitly retains these limits: preview file types only, workspace guards, route class `local` in `remote-route-policy.ts`, and fake opener only in tests.

The accepted boundary has the following consequences for the implementation specification:

- Opening is a separate, explicit user action, never a side effect of preview loading, tree selection or an agent tool. It opens the original guarded workspace file in the OS-assigned application; it does not accept a client-supplied application, command, URL or absolute target.
- The side-effecting route is classified `local`, independently of the preview GET's `read` classification. Full-capability and read-only paired devices are both refused by the server. UI hiding is additional presentation, never authorization. An unpaired request is not automatically local: the action also requires affirmative host-local request authorization. The precise origin, address, session and shared-server checks belong in the reviewed spec; absence of a proven local context must not enable the action.
- Resolve the current room/conversation workspace policy and read permission for each action, including the current grant and denied paths. Use `resolvePersistentRoomWorkspaceExistingFile` from #5 to require an existing regular file and reject leaf and ancestor symlinks and workspace escapes. Opening does not grant access beyond ADR-0002 and does not inherit authorization from an earlier successful preview.
- Only the agreed preview types are eligible. Markdown, executables, arbitrary URLs and other files gain no opening capability under this decision. The exact spreadsheet/image extension allowlist must be reconciled in the spec; an extension is not approved merely because a parser or OS can open it.
- Keep the OS opener narrowly scoped behind a replaceable internal seam. Use a fixed platform mechanism and argument arrays with no shell; never concatenate a path into shell text. Spaces, metacharacters, leading option characters and URL-like names must remain file arguments. Platform-specific argument protection must be demonstrated with a fake process runner before enabling a platform. No new package dependency or public package export is approved here.
- Authorization or path/type refusal must never call the opener; dispatch failures must be surfaced rather than reported as success. The UI uses the approved opening-failure sentence without exposing host paths or process output. Dispatch success can establish only that the opener accepted the request, not that an application displayed or rendered the file. Missing association, unavailable opener, unsupported/headless environment and process errors require explicit handling in the spec.

## Consequences

- This is an intentional user-authorized transition from a read-only preview to an external application. That application may edit the original file or have its own external effects. The preview remains read-only; exxperts cannot promise that the separate application is read-only or sandbox it through this route. The approval is limited to dispatching the guarded file, not granting arbitrary host commands or authorizing worker access to real data or applications.
- Local deployment and paired-device trust remain distinct. The supported local browser and Electron use must be proved independently from hiding the button on paired devices. Shared-server, reverse-proxy and headless-host treatment require explicit spec review rather than inference from the `local` policy label or the folder chooser precedent.
- Pathname validation cannot atomically bind what an external application later consumes. Revalidate policy and target immediately before dispatch; do not cache an absolute path from preview loading. The concrete mitigation and remaining replacement race must be recorded for Controller/Architect review; this ADR does not claim the race is eliminated or that Sascha accepted a specific residual risk.
- Fixed button labels versus discovering the actual assigned program remain open. The sign-off lists `Open in Word`, `Open in Excel`, `Open PDF` and `Open in default app`, but explicitly asks which labeling approach to use. Automatic refresh after external edits remains an assumption, not a decision. Neither point is settled by accepting option A.
- ExcelJS without an extra conversion program was [separately decided](https://github.com/bussard76/exxperts/issues/4#issuecomment-6663624241) for preview conversion. It does not prohibit this later explicit opening action. Word/PDF parsing, render isolation, number formatting, supported extensions and resource limits still need the reviewed preview spec; this ADR approves no new parser dependency or sandbox relaxation.
- Tests use invented files, a fake opener at the production seam and a fake process runner. Public-route checks must prove one authorized request dispatches the guarded target once and all refused requests dispatch zero times, including both paired capabilities, nonlocal/unproven contexts, revoked grants, denied/traversal paths, symlinks, missing/nonregular files and unsupported types. UI checks cover local browser use, paired hiding, Markdown exclusion and the exact error sentence. Platform checks prove argument handling and failures without starting a real OS opener.
- Product code is unchanged by this ADR. Independent spec review, functional review and level-3 conformance remain mandatory under [ADR-0001](0001-adopt-agentic-factory.md) and `docs/architect-protocol.md`; no integration before #5.

## Slicing

1. Record option A and the #4-only Figma exception in this accepted ADR. Verify dated quotes and constraints against the issue comments and `~/controller-exxperts/inbox-done.md`; commit only this text record.
2. Prepare the draft implementation spec at `~/controller-exxperts/analysis/T4-ADR-spec.md`: exact proposed request/response and opener seams, authorization order, dependency inventory, tests mapped to every Result and Observable acceptance item, and unresolved decisions. Obtain a fresh independent Architect spec review before building.
3. After #5 integration and resolution of build-affecting decisions, implement previews and the separately authorized local opening flow test-first through public entry points within this level-3 boundary. Run the Developer's targeted checks with fake integrations; Testers and the wave own full gates. Record functional review and conformance before integration; Sascha accepts real-file and Electron behavior on the preview on his own computer.

## HTML addendum

Decided by: Sascha (2026-11-07): “Skripte an, Risiko akzeptiert”. Scripts stay enabled in sandboxed HTML previews. Data fetching is blocked, including connections, network images and forms; frame self-navigation remains possible and is accepted. A remote navigation URL can carry file contents. CSP does not prevent that navigation.

The local-only OS-open scope above explicitly includes `.html` and `.htm` files, subject to the same authorization and workspace guards. The external application operates outside the preview sandbox. This addendum preserves option A for issue #4.
