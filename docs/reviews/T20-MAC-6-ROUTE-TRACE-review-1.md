# T20-MAC-6 route trace review, round 1

Verdict: pass
Reviewed commit: 35e8fa28cde74b4fce1ed877d000a10835ce2d7a
Gates: not run; this review was expressly static and read-only except for this report. No tests, builds, browser, native or Mac checks were run.
Ponytail: reviewed the complete diagnostic diff and connected smoke flow; no functional defect found in this single-process smoke instrumentation.

## Scope and assertion audit

The reviewed commit's parent is `64ec87fa4bd20808735bbb314b774c372dae99b2`, also the specified trace-only baseline. The complete diff changes only `apps/web-server/scripts/workspace-detached-documents-ui-smoke.ts`. All existing assertion lines and all surrounding behavioral steps remain unchanged, in the same order and under the same conditions; no assertion was removed, weakened, or made conditional. In particular, the loading and Return read-count assertions remain at reviewed lines 280 and 287 (baseline lines 256 and 263).

The diff is not purely additive logging: the rejected route's `return route.continue()` (baseline line 237) becomes an awaited continuation, log and return (reviewed lines 250–255), preserving continuation and propagation of rejection; the accepted route's existing swallowed continuation error (baseline line 241) now logs in the same catch (reviewed line 262). The predicate, counter increment, promise resolution, release wait, click, detach, Return and cleanup are preserved (reviewed lines 247–289; baseline lines 235–265). The logging adds context request emission, completion and failure markers (lines 235–245), route entry, predicate, continuation and callback markers (lines 247–263), and click and wait markers (lines 265–269). As with logging generally, timing can change.

Architecture impact: level 1 for this diagnostic change within the existing smoke script; no new public export, dependency, import, route, or module boundary. The existing smoke uses a temporary invented workspace and local fake provider (lines 22–29, 30–49, 68–88). The broader T20 hardening spec is level 3; this verdict does not assess that wider implementation.

## Spec checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Scope limited to route diagnostics | Full parent/baseline diff; script lines 235–269 | Pass, static |
| Distinguish emission, callback/predicate, continuation, completion/failure | Script lines 235–263 | Pass, static |
| Preserve assertions and existing behavioral flow | Full diff; script lines 247–289; baseline lines 235–265 | Pass, static |
| Review sole authorized smoke result | Dispatch reports a timeout after 300 seconds at `previewStarted`, with neither request-emitted nor route-callback markers; no corresponding run artifact was found in the reviewed branch | Reported evidence only |

## Diagnostic conclusion

The sole authorized smoke run was reported to time out after 300 seconds waiting at `previewStarted`, with neither request-emitted nor route-callback markers. The underlying run log was not available in the reviewed branch, so this is the dispatch's report rather than independently verified log evidence. Absence of both markers does not establish a root cause; it does not prove whether the request was emitted or why the callback was not observed. Later assertions and the broader product behavior remain unverified.

## Findings

No functional finding in this diagnostic change.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | Authorized route-trace smoke run | Preserve the actual run log and investigate the unresolved timeout under separate authorization. |
