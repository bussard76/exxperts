# Issue 12: right pane hardening

## Architecture impact

Level 2: the existing App and sidebar icon export, pane renderers and room CSS retain their boundaries; no new exports, dependencies, routes, stores, contracts or data flows.

## Acceptance checklist

- [x] No toggle with no visible right pane; first file shows it — `workspace-file-tabs-ui-smoke.ts`.
- [x] Fold into one grid column, hide pane, retain tabs in DOM, expose collapsed label and aria state — `workspace-file-tabs-ui-smoke.ts`.
- [ ] Unfold preserving tabs, active tab, picture zoom and scroll. Zoom and image position are covered by `workspace-file-tabs-ui-smoke.ts`; scroll remains to verify.
- [x] Opening another file while folded adds its tab and unfolds — `workspace-file-tabs-ui-smoke.ts` (two images).
- [x] Closing last tab while folded clears toggle and collapsed class; reopening works — `workspace-file-tabs-ui-smoke.ts` (dispatches the mounted tab close control).
- [ ] Toggle works for Markdown, workspace preview, attachments, artifact and task run; maximized artifact hides toggle.
- [x] At 1000px, 1600px and phone width with independently clean pane-width storage, controls remain reachable without overlap — `workspace-file-tabs-ui-smoke.ts`.
- [x] Tab, Enter and Space operate toggle; pane Escape behavior remains unchanged — `workspace-file-tabs-ui-smoke.ts` and `attachments-panel-ui-smoke.ts`.
- [x] Unsaved Markdown draft survives folding and unfolding — `workspace-file-tabs-ui-smoke.ts`.
- [ ] While folded, different same-kind workspace file, artifact path, artifact task ID and task-run ID unfold and render selected content; metadata updates and selecting the same occupant do not falsely open.
- [x] Selected asset-row close preserves back-to-attachments behavior — `attachments-panel-ui-smoke.ts` opens and closes the selected folded gallery file.
- [x] Cancelled or failed guarded switch preserves draft and occupant; successful save or discard proceeds; folding does not trigger the guard — `workspace-file-tabs-ui-smoke.ts`.
- [ ] Fold/unfold introduces no reads, authorization, server behavior or content path changes.
- [ ] Record item-by-item test evidence, checks, changed files, assumptions and debt; merge origin/main, rerun affected suites and push.

## Measurement

Graph: no. Seven tool calls preceded the first edited file; no graph was used, so it made no difference.

The gallery remains visible when its viewer is folded; `attachments-panel-ui-smoke.ts` covers switching to another gallery file and returning to Attachments.
