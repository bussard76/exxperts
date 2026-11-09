# TUPSTREAM review, round 1

Verdict: pass
Reviewed commit: 34c8a431c4fb742a95af1790e53f7c4691d80f74
Gates: **pass** on the clean normal-install rerun: build passed and 378/378 smokes passed. The original full gate failed (376/378); details below. Browser flows: topbar and sidebar reopen smokes passed.
Ponytail: full diff reviewed; no functional defect found. Assumed local single-user app load; no load test performed.

What this change does: It integrates upstream 0.15.2, keeps the floating sidebar toggle below dialog backdrops, and adds browser checks for stacking and mac-style drag regions. The fork already had the toggle after the draggable topbar in page order.

## Spec checklist

| # | Requirement | Code | Test | Status |
|---|---|---|---|---|
| 1 | Merge tag 461e6485 into fork main 82b5e8cd, review exact merge | Merge parents of 34c8a431; upstream tag is an ancestor | Git ancestry and remerge diff | Pass |
| 2 | Keep fork comment and JSX order in sole conflict | `apps/web-ui/src/main.tsx:35` | Compared both parents and remerge diff | Pass |
| 3 | Floating toggle below dialogs; sidebar opens | `apps/web-ui/src/styles/35-sidebar-remote.css:33`, `apps/web-ui/src/sidebar-collapse.tsx:136` | `room-topbar-ui-smoke.ts`, `sidebar-reopen-ui-smoke.ts` | Pass in Chromium; native macOS confirmation remains below |
| 4 | Preserve drag regions and topbar behavior | `apps/web-ui/src/styles/34-desktop-app.css:61`, `apps/web-ui/src/main.tsx:35` | `room-topbar-ui-smoke.ts` checks page order, CSS and layout at multiple zooms | Pass in simulated mac look |
| 5 | Versions and locks agree | Root and desktop package manifests and lockfiles | Diff inspection: all four say 0.15.2 | Pass |
| 6 | No unintended Word, workspace or right-pane changes | Full diff against 82b5e8cd | Diff inspection; workspace preview, tabs and Word diagnostic smokes passed | Pass |
| 7 | No real data, secrets or outward effects | Eight changed paths | Diff inspection; changed smoke uses invented room data, loopback scripted gateway and isolated home | Pass |

## Gate evidence

Current `origin/main` was 82b5e8cdcd0263de57ee17f93f666e57eb0d6e8a; merging it into a temporary branch from the reviewed head was already up to date. The diff is mixed (eight paths, including CSS, TypeScript and JSON). The clean checkout had no old build output. The required host-locked gate ran once at the reviewed SHA: build passed, but smokes failed, 376/378. The original full gate verdict remains **failed** and is retained here as evidence.

I prepared dependencies with `npm ci --offline --ignore-scripts`, inadvertently omitting the required `scripts/patch-mcp-adapter.mjs` postinstall step. Both failures were rerun individually via the required host lock on the same SHA, first in that same state, and both failed again:

- `mcp-oauth-issuer-smoke.ts`: missing issuer stamps and issuer-switch protections (18 checks failed); isolated rerun failed.
- `persistent-room-mcp-scope-smoke.ts`: granted connector absent from manifest; isolated rerun failed.

After running the repository's local MCP adapter patch, each was rerun individually again through the host lock at the same SHA; both passed (1/1 each). This identifies the checkout setup as the cause of those observed failures, not a demonstrated change defect; the original full gate remains failed.

A second clean checkout at the same SHA was installed with `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci --offline` (normal lifecycle scripts, including the MCP patch). The required host-locked full gate then passed: build and 378/378 smokes, including both MCP cases, the topbar browser smoke and sidebar reopen smoke. The suite reports some platform-specific and unavailable-fd cases skipped; native macOS was not available.

## Architecture impact

Level 1: existing sidebar styling and smoke coverage, plus release version metadata. No new exports, routes, dependencies, modules or data-flow boundaries appear in the full diff; `ARCHITECTURE.md` is absent at this head. The browser tests use public UI and local API; restoring z-index 40 would make the backdrop check fail, and putting a drag region later than the toggle would make the ordering check fail. No untrusted content rendering changed. Threat position considered: an attacker supplying web content or crafted requests without machine write access; the changed code introduces no new rendering or request path.

## Findings

No functional findings. The functional verdict is pass, supported by the successful clean-install full gate; the original failed gate is preserved above.

## Debt candidates

| Category | Severity | Where | Proposal |
|---|---|---|---|
| tests | minor | `apps/web-server/scripts/room-topbar-ui-smoke.ts:233` | Verify sidebar reopening and window dragging in native macOS Electron; Chromium checks CSS and page order but cannot prove native drag hit-testing. |
