# T20-MAC-6 detached diagnostic markers review, round 1

Verdict: pass
Reviewed commit: 64ec87fa4bd20808735bbb314b774c372dae99b2
Gates: no test, build, lint, typecheck or full gate was run by this reviewer, as directed. The Developer reports that the mandatory pre-commit hook automatically ran static checks including typechecking; this was not a separately requested check.
Ponytail: reviewed the full marker diff and its connected wait and route. No functional finding in the marker change. This verdict covers only the diagnostic markers, not the broader T20 behavioral audit or native acceptance.

## Scope and assertion audit

The full diff from baseline `0050c9a1014cf4ee968ce6523bd6a49e3a3b562d` to reviewed commit changes only `apps/web-server/scripts/workspace-detached-documents-ui-smoke.ts`: 106 additions, zero deletions. Each added line is a `console.log` phase marker; no existing line changes. Thus every assertion and its exact bytes, order, conditions, and expected values are unchanged, and none was removed or weakened. The corresponding file at `a51e5b98e2cbb443bbe9adf11b6861c7a9bca453` and at the baseline has the identical Git blob `4f289452aae774aacd245125d922a8fd219c1814`, so that comparison gives the same 106 additions and zero deletions.

The markers label the major phases and the manually resolved `loadStarted`, `previewStarted`, `writeStarted`, and `keepStarted` waits, along with registration and awaiting of popup and close events, and registration of response waits. They observe progress without changing the script's control flow or bounding the waits. Output itself can affect timing, as with any logging. The script is a single smoke process; no new dependency, export, route or module boundary is introduced. Architecture impact: level 1 within the existing smoke script.

## One-run evidence and conclusion

The Developer's single authorized isolated non-native run at the reviewed commit failed after the runner's 300-second timeout. The existing log `/tmp/exxperts-smoke-failures/workspace-detached-documents-ui-smoke.863485.failed.log` ends with `[phase] moving a loading preview`, `[phase] await previewStarted`, and the timeout message; there is no subsequent marker. The Developer reported no `T20_NATIVE_*` variables and no additional run. The previous review at `origin/agents/t20-mac-6-review-1:docs/reviews/T20-MAC-6-review-1.md` likewise left the broader detached flow unresolved.

In the reviewed script at lines 232–245, `previewStarted` is a promise resolved only when the page's `**/workspace-preview?*` route handler receives a request whose `path` is `loading.html` and whose `frame` is not `1`. The handler increments `loadingReads`, resolves `startPreview`, then waits for `previewReleased`; the script registers the handler, clicks the `loading.html` file and prints the marker immediately before awaiting the promise. The release is in a later `finally`, after the await and the attempted detach.

The log proves the click completed and the marker was printed before the process was killed. It does not establish whether the matching request was never sent, was sent but not intercepted by this page route, was excluded by the route predicate, or whether some other timing or execution condition prevented the handler's resolution. It cannot distinguish product behavior from test routing or sequencing, and it does not establish a product defect or completion of the later detached-preview assertions.

## Findings

No blocker or major finding in the marker change. The smoke timeout remains unresolved and warrants separate diagnosis under an appropriate authorization; no broader functional pass is inferred.
