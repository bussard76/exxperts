# Issue 4 developer report

## Architecture impact

Level 3: workspace preview and local opening within ADR-0002 and ADR-0003.

## Acceptance checklist

The following checklist covers every Result and Observable acceptance item in [issue #4](https://github.com/bussard76/exxperts/issues/4). Boxes remain unchecked until implementation evidence exists. “Specified” means mapped in this draft, not implemented or independently accepted.

- [ ] R1 — PDF, image, Word and Excel each open in their own right-pane tab beside an open Markdown tab. Proof: B1 and P1–P4 below.
- [ ] R2 — Clicking again activates one existing tab; the tree marks the active file. Proof: B1, including contextual tab identity and stale-response checks.
- [ ] R3 — Any tab closes; active close selects a neighbour; last close closes the pane. Proof: B2, including background close, right neighbour then left, and dirty guards.
- [ ] R4 — Every Excel sheet reachable, sheet switching and two-axis scrolling, calculated results and basic fills/fonts/borders/column widths/number formats. Proof: P2 and B3; no successful partial workbook.
- [ ] R5 — Word text, tables and images retain their basic look. Proof: P3 and B4 through the real child, route and sandboxed browser consumer.
- [ ] R6 — Preview has no edit/save/download control and changes no file. Proof: P1–P4/B5; print and formula-bar controls are also absent. The separately approved explicit external-open action is permitted.
- [ ] A1 — Full build/smokes green, including `workspace-file-preview-smoke` and `workspace-file-tabs-ui-smoke`. Independent Tester/wave own this check after implementation; Developer runs targeted checks only.
- [ ] A2 — Invented workbook with two sheets, fill, bold, set width, number format and cached formula; invented Word heading, coloured run, table and image visibly prove the look. Proof: P2/P3 and B3/B4, generated fixtures, no committed binary.
- [ ] A3 — Formula cells display results, not formulas. Proof: P2/B3 with formatted numeric, string, boolean, error, stale and absent caches.
- [ ] A4 — Sascha tries his real Excel/Word files locally, switches sheets and reactivates tabs on the preview. Human gate only; workers never obtain those files. Electron acceptance also belongs to Sascha.
- [ ] Added signed-off result — A separate header click opens the original file in the OS-assigned application on the server computer; works from local browser and Electron, hidden on paired devices, omitted in Markdown, approved error sentence on failure. Proof: O1–O4/B6, fake opener only; local OS/Electron observation remains human acceptance.

## Developer progress and blocker

- The accepted ADR-0003 is present on fetched `origin/main`; the R4 architecture review was merged onto `agents/t4` and this checklist was committed before implementation.
- Installed the existing lock with `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` (passed; no browser download). No product changes or tests have been added.
- The approved Word renderer requires jsdom 29.1.1, which is installed at that exact version. On the advertised minimum Node 20.6.0, `npm exec --yes --package=node@20.6.0 -- node -e 'require("jsdom")'` fails: `html-encoding-sniffer` 6.0.0 uses `require()` on the ES module `@exodus/bytes/encoding-lite.js`, which that Node version rejects. This is a direct package-load reproduction, not an installed preview or end-to-end test.
- The package review requires escalation of a real supported-Node incompatibility without silently changing the Node policy or approved packages. Controller decision is needed on that compatibility conflict before this implementation can meet the binding package condition.
- All acceptance boxes remain open. Targeted typechecks, affected suites, browser checks, full gates, human acceptance and independent review have not run. No screenshots were captured; no debt candidates have been assessed.

## In-progress implementation

- Route classifications: `workspace-markdown-images-smoke.ts` proves the planned preview GET is `read` and open POST is `local`; it failed before these entries and passes after. The routes and independent local authorization remain to be implemented, so these entries alone do not complete any acceptance item.
- Browser tab test is in progress; the first run could not start the server because the fresh checkout had no runtime build. Runtime packages and the web UI were built for this targeted browser test, whose rerun is queued through `gate` behind the current host gate.
- Preview route first slice: `workspace-file-preview-smoke.ts` exercises a real authenticated HTTP request, proving invalid query handling and inert error headers. The test failed with 404 before the route existed and passes now. Valid requests currently return `renderer_unavailable`; document parsing, workspace guards, conversation validation and all success paths remain unfinished.
- `workspace-file-preview-smoke.ts` also checks that a nonexistent conversation returns `conversation_not_found` instead of falling back to room policy; this assertion failed before the conversation check and passes after it.
- `workspace-file-preview-smoke.ts` now creates an invented conversation and checks that disabling workspace read causes a safe 403; the assertion failed first and passes with the effective-policy check. Guarded file resolution and the post-render policy recheck remain open.
- `workspace-file-preview-smoke.ts` exercises traversal, absolute, drive-relative, hidden and empty-segment paths through HTTP; these failed before path validation and now return `invalid_path`. Existing-file, symlink and grant checks remain open.
- Controller selected jsdom 26.1.0 with Node >=20.6 and docx-preview 0.4.1; Word implementation awaits consolidated spec review. No dependency has been changed on this branch.
- `workspace-file-preview-smoke.ts` proves a missing file returns `file_not_found` through the existing-file resolver; this failed before the resolver was called and passes after. Symlink error mapping, remaining refusal cases, rendering and post-render rechecks are still open.
- The real-route smoke distinguishes a symlink refusal (403) from a directory (400); the symlink assertion failed with the resolver's generic `not_file` code and now passes using its existing guarded path result. Ancestor symlink and replacement coverage remains to be added.
- `workspace-file-preview-smoke.ts` checks the approved old `.doc` and unsupported-type 415 responses after file guards; these failed first and now pass. The `.doc` UI error tab and all rendered formats remain open.
- The first `workspace-file-tabs-ui-smoke.ts` browser slice failed because the image did not open; after the image/Markdown tab implementation it passed through `gate` (1/1, 5.1s). It checks an invented PNG, tab reuse, active tree and active/last close. Other image formats, background/right-neighbour close, context changes, dirty guards, all other formats and opening remain unproved. The test uses the existing workspace-image endpoint and retains fetched image bytes in an object URL while its tab exists.
- Integrated and pushed the passing R5 architecture review. It supersedes the earlier jsdom 29.1.1 approval with exact 26.1.0 and retains all other obligations; no Word package or implementation is present yet.
