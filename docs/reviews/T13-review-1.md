# T13 review, round 1

Verdict: pass
Reviewed commit: 7dac80fa79f321b2ea734c43e616af3cfcd04618
Gates: build and smokes pass (378/378); public-route and browser preview smokes pass.
Ponytail: full diff and connected worker, parent, sanitizer, fixtures and callers reviewed; no functional finding. Expected load is a local user's preview requests, bounded by the existing worker limits.

The clean temporary checkout merged current `origin/main` (2bf175596af63816bb95b2ffd9bfde8cf7caa66b) without conflicts; it was already an ancestor of the reviewed commit. The diff is mixed, not documentation-only. The attributed full gate ran on the recorded commit. No smoke failed, so no isolated failure reruns were needed. One unrelated smoke skipped `fd` and case-insensitive-disk cases; four reported cases for other operating systems. Sascha's Mac check of his own file remains his acceptance item.

## Spec checklist

Paths below are under `apps/web-server/`; the tests use invented files and the public route or browser unless stated otherwise.

| Requirement | Code | Test | Status |
| --- | --- | --- | --- |
| Body, header, footer and text-box VML return HTML; no deferred animation callback | `src/shelf-parse-worker.mjs:664` | `scripts/workspace-file-preview-smoke.ts:478` and `scripts/workspace-file-tabs-ui-smoke.ts:838` | Pass; text inside rejected foreignObject is intentionally omitted |
| Distinct anchor offsets and page-relative offset less left margin | `src/shelf-parse-worker.mjs:515`, `:727` | `scripts/workspace-file-preview-smoke.ts:488` | Pass |
| VML line is a double rule, no SVG; rotation survives, URL styles rejected | `src/shelf-parse-worker.mjs:517`, `:597` | `scripts/workspace-file-preview-smoke.ts:490`, `scripts/workspace-file-tabs-ui-smoke.ts:843` | Pass |
| Saved breaks form sections; absence stays a long page | `src/shelf-parse-worker.mjs:731` | `scripts/workspace-file-preview-smoke.ts:484`, `:496` | Pass |
| Header/footer survive with placement margins and minimum height | `src/shelf-parse-worker.mjs:608` | `scripts/workspace-file-preview-smoke.ts:487`, `scripts/workspace-file-tabs-ui-smoke.ts:841` | Pass; footer uses the clarified bottom margin |
| Containment, existing limits, lifecycle, refusal states and CSP | `src/shelf-parse-worker.mjs:512`, `:517`, `:577`; `src/persistent-room-shelf-reading.ts:202` | `scripts/workspace-file-preview-smoke.ts`, `scripts/workspace-file-tabs-ui-smoke.ts` | Pass; no real service, real data or secrets found in diff |
| Non-previewCode error stays damaged_file, fixed bounded diagnostic only | `src/shelf-parse-worker.mjs:734`, `src/persistent-room-shelf-reading.ts:214` | `scripts/workspace-file-preview-smoke.ts:55`, `:500` | Pass; real producer and parent exercised, including marker, known message, unknown name and split, malformed and duplicate stderr |
| OOM tail and ordinary crash classification | `src/persistent-room-shelf-reading.ts:212`, `:278` | `scripts/word-diagnostic-oom-smoke.ts` | Pass; this test calls the exported shelf parser and uses a fake child |
| Level 2 contract, no new public route, export, dependency or IPC field | Existing worker and parent seam | Full diff and `docs/reviews/T13-R3-architecture-spec.md` | Pass; independent Architect conformance remains required |
| Accepted visual limits | `docs/reports/issue-13.md` | Spec and issue comment | First-page height and left-aligned page number accepted as-is |

The VML route test would fail without the no-op animation functions (the renderer returns `damaged_file`), while the diagnostic producer/parent test would fail without the fixed diagnostic and relay. The layout assertions also fail when their corresponding properties or page-break option are removed; this is a reasoning spot-check, not a pre-change rerun. User text and attributes pass through the existing escaping and allowlist; external URLs, scripts and active SVG are rejected in the public-flow tests. No changed code or tests reach a real external system. The threat model is untrusted document content without access to the local user account.

## Findings

None under the functional-only verdict rule.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| edge-case | minor | `apps/web-server/src/shelf-parse-worker.mjs:597` | Restrict double-rule conversion to VML lines: a width-bearing non-line SVG, such as a rectangle, currently becomes a horizontal rule; add an invented shape rendering check. |
| tests | minor | `apps/web-server/scripts/workspace-file-preview-smoke.ts:478` | Assert recognizable shape markup separately for body, header and footer; the combined fixture currently checks overall success and header/footer presence. |
| edge-case | minor | `apps/web-server/src/shelf-parse-worker.mjs:727` | Use the applicable section's page margin for page-relative anchors; the first `pgMar` is currently applied to all parts and sections. |
