# TFASTLANE-GATE-SETUP review, round 1

Verdict: pass
Reviewed commit: d0fa2310ee426d1f8ddd4961d386e00c7fc0e24b
Gates: verify skipped (documentation-only); e2e not applicable (no product flow changed)
Ponytail: full diff reviewed with connected setup scripts and workflow docs; no functional findings.

What this change does: It records the expected install and browser setup evidence for full gates in fresh Tester and integration checkouts. It also links the human workflow page to the coordinator's detailed setup section.

## Spec checklist

| # | Requirement | Code | Test | Status |
|---|---|---|---|---|
| 1 | Diff is only the two requested Markdown files and is level 1 | `docs/coordinator.md`, `docs/dev-workflow.md` | `git diff --name-only origin/main...d0fa2310ee426d1f8ddd4961d386e00c7fc0e24b`; merge-base equals current `origin/main` | Pass |
| 2 | Fresh checkout setup uses normal `npm ci` lifecycle and retains install evidence | `docs/coordinator.md` setup section; `docs/dev-workflow.md` gate section | Root `package.json` defines `postinstall` as `node scripts/patch-mcp-adapter.mjs && node scripts/install-chromium.mjs` | Pass |
| 3 | MCP adapter postinstall is checked | `docs/coordinator.md` setup section; `docs/dev-workflow.md` gate section | `scripts/patch-mcp-adapter.mjs` reports successful patches and exits nonzero for missing required patch anchors; root lockfile pins `pi-mcp-adapter` 2.10.0 | Pass |
| 4 | Chromium is checked only when browser checks are relevant | Both added setup paragraphs | `scripts/install-chromium.mjs` treats browser download as best-effort and exits successfully when unavailable; workflow asks to confirm the executable before browser tests | Pass |
| 5 | Gate revision and setup evidence are linked, and earlier red results remain documented | Both added setup paragraphs | T23 integrated review records the failed 379/381 full gate and failed isolated reruns; T23 audit says the full gate remained red and must remain historical evidence | Pass |
| 6 | Relative Markdown anchor resolves | `docs/dev-workflow.md` link to `coordinator.md#gate-setup-evidence` | Target heading in sibling `docs/coordinator.md` slugifies to `gate-setup-evidence` | Pass |
| 7 | No command, approval, gate, capacity, or product policy changes | Both added paragraphs | Full six-line diff inspection; existing neighboring policy text is unchanged | Pass |
| 8 | Invented data only; no secrets or changes to real external systems | Both documentation files | No data, credentials, executable code, or external-system actions added | Pass |

## Findings

None.

## Debt candidates

None.

## Review evidence

- Full reviewed SHA: `d0fa2310ee426d1f8ddd4961d386e00c7fc0e24b`.
- The reviewed diff is Markdown-only: `docs/coordinator.md` and `docs/dev-workflow.md`.
- Temporary branch from the reviewed head merged current `origin/main` successfully; merge was already up to date with no conflicts.
- No full gate, install, browser test, or product flow was run because this is a documentation-only change. No product flow changed.
- The requested `gh issue view docs/coordinator.md` invocation could not resolve an issue because `docs/coordinator.md` is not a valid issue identifier; this task has no GitHub issue. The specified local protocol and T23 evidence were reviewed.
