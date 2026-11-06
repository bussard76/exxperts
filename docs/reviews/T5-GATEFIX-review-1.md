# T5-GATEFIX review, round 1

Verdict: pass
Reviewed commit: 32755584e1c9e6fa8f8e2755559102fdc2b0968a
Gates: `gate bash -c 'npm run build && npm run smokes'` passed: 369/369, 620 seconds wall time; one smoke had skipped parts and four had parts for another platform. `persistent-room-localfiles-secret-floor-smoke.ts` had skipped parts; platform-only parts were reported for `artifact-export-smoke.ts`, `full-access-skills-folder-smoke.ts`, `persistent-room-localfiles-secret-floor-smoke.ts`, and `room-files-routes-smoke.ts`. No retries were needed. The previously reported `room-failure-status-smoke.ts` passed; its earlier timeout remains unexplained.
Ponytail: Full diff and connected viewer code reviewed; no functional findings. Expected load is a local single-user app; no separate load test was run.

What this change does: It makes the composer's browser smoke use grayscale text rasterisation and replaces three viewer glyphs with inline vectors. It preserves the existing control behavior and the smoke's comparison.

## Spec checklist

| # | Requirement | Code | Test | Status |
| --- | --- | --- | --- | --- |
| 1 | Grayscale only in the relevant composer Chromium launch; retain scrollbar option, geometry, thresholds, assertions and one-pixel control | `apps/web-server/scripts/consult-mention-smoke.ts:523`, `:731` | Full suite and direct-node copy of the unchanged assertions passed at 1280 and 390, light and dark. Aligned differences were zero; the shifted control detected at least 1,801 pixels. | Pass |
| 2 | Existing case-sensitive redaction behavior | `apps/web-server/scripts/consult-mention-smoke.ts:643` | `/token[=]/.test(line)` and `line.includes("token=")` match precisely the same literal substring for every string. | Pass |
| 3 | Inline open-tab, maximize and restore vectors; preserve labels, titles, disabled condition, actions, pressed state and targets | `apps/web-ui/src/components/ArtifactViewer.tsx:216`; `apps/web-ui/src/styles/34-desktop-app.css:216` | Existing topbar smoke passed 74 checks. A separate direct-node rendered check clicked maximize and restore at 100% and 125%, verified names, titles, `aria-pressed`, panel class, vectors and restore ink within 0.5 window points. Existing open handler and disabled condition are unchanged. | Pass |
| 4 | Unchanged topbar coverage at 100% and 125%, sidebar open/hidden, deck and long names | Existing `apps/web-server/scripts/room-topbar-ui-smoke.ts` | Unchanged assertions passed in the full suite and a direct-node harness, 74 checks. | Pass |
| 5 | Level 1 and no new exports, dependencies, routes, stores, contracts or data flows | Full diff | Diff and callers reviewed. Tests use public rendered UI and real local server with synthetic gateway and throwaway home. | Pass |
| 6 | Invented data, no secrets or effects on real external systems; untrusted rendered content escaped | Full diff and connected viewer | Changed SVG paths are static; React escapes rendered text. No real identifiers, secrets or new external effects in the diff. Threat model: remote untrusted content without local file write access. | Pass |
| 7 | Full integration and host evidence | This report | Clean worktree build outputs after install; current `origin/main` merged cleanly into a temporary branch at the reviewed head. Linux x86_64, Node 22.23.4 and installed Chromium only; macOS, Windows and Electron not checked. The mac look was simulated in Chromium. | Pass with host limits |

Issue #5's workspace tree, Markdown editor, image preservation and drag-to-composer Results and Observables are context only per the binding architecture review; this bounded review does not claim that feature is implemented or independently verify its preview flows.

The two principal existing browser tests are outside-in: removing the grayscale flag restores the diagnosed composer comparison failure, and the unchanged topbar smoke detects the diagnosed glyph alignment failure. Their assertions and one-pixel control did not change. The separate action check was temporary and removed. Direct-node checks used free ports, synthetic rooms and a mock gateway. No browser download or Docker was used. `npm install` unexpectedly modified `package-lock.json`; it was preserved uncommitted and is not part of the reviewed commit.

## Findings

None.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/room-topbar-ui-smoke.ts` | Add a lasting rendered maximize/restore accessibility and action check when expanding the test scope. |
| tests | minor | `apps/web-server/scripts/consult-mention-smoke.ts`; viewer controls | Verify the rasterisation and vector alignment on supported macOS, Windows and Electron hosts. |
