# T22 desktop notices review, round 1

Verdict: pass
Reviewed commit: f550292c93437ef32d5bb29098126e4be979560d
Gates: targeted scripts pass after runtime build; full build and smokes deferred by Controller override. Native desktop acceptance pending on Mac; Windows native acceptance waived by Sascha on 2026-11-10.
Ponytail: reviewed the full diff and connected packaging flow; no functional, safety, load, test or lean finding at the expected load of one release packaging process.

## Spec checklist

| Requirement | Code / evidence | Test / check | Status |
| --- | --- | --- | --- |
| Level 1; retain existing paths, no new interface or dependency | `apps/desktop/scripts/prune-payload.mjs:20`; full diff against merge base `289bb6976862e7a6252d05826c9f16dd7fde77fb` | Inspected whole diff, imports and desktop package staging | Pass |
| Preserve NOTICE and both runtime references byte-for-byte; reject missing inputs | `apps/desktop/scripts/prune-payload.mjs:23`, `apps/desktop/scripts/prune-payload.test.mjs:98` | Public pruner test passes; running new test against main's old pruner fails on missing NOTICE | Pass |
| Preserve existing keeps, notices, security/asset checks and file ceilings | Existing `checkServerFiles`, keep and closure checks; `DESKTOP_MAX_FILES` 2,500; release ceiling 15,000 | Script suite 55/55 after runtime build; composed release 13,747 files; independently pruned app 2,232 files, 63 packages; server and vendored Node licence bytes match the preserved stage | Pass |
| Real producer to consumer evidence with Series 2 and only this fix | Series 2 base `a9d1b8b9e28c09bab08fb89ac80426fedc941e29` plus evidence `composition.patch` (three additions only); product head above | Linux x64 release SHA-256 `5ab8363e6309f5b778b173d9a5783a14ac3d8dbda7242de3e4446f03c3f9c2d1`; independently extracted and ran the composed public pruner; LICENSE, NOTICE and both runtime files match source before and after; server and Node notices match preserved stage. No composed commit SHA was recorded: the evidence is the stated base plus patch. | Pass for release-to-prune; final desktop package pending |
| Existing notice material and direct package notice policy | Source NOTICE and exact release/stage comparison; server licence output, UI assets and Node licence retained | Inspected evidence and script tests; no legal compliance conclusion | Pass for this bounded desktop fix |
| Invented data, no secrets or outward effects; escaping | Changes add fixed local paths and test fixtures only; no untrusted text rendered and no external calls added | Diff and caller inspection | Pass |
| Lock unchanged and independent contributions | No lock path in diff; evidence before/after lock hashes match | Pre-existing local lock modification preserved; no cross-merge | Pass |

## Findings

None under the Controller's functional-only verdict rule.

## Debt candidates

None identified in the bounded diff.

## Validation and limits

The diff is mixed, with two product files and two Markdown files. The Controller explicitly replaced the full gate and main-merge requirement for this independent contribution; origin/main is already the merge base, so no merge was needed. No browser flow applies to this packaging change.

The first attributed `npm run test:scripts` gate at the reviewed commit failed 2/55: the bundled runtime configuration and OAuth logo tests require runtime build output absent from this fresh checkout. The exact desktop notice tests passed. After attributed `cd runtime && npm run build` succeeded, the same attributed suite passed 55/55 on the same commit. The original gate failure remains recorded here; it was a missing local prerequisite, not a demonstrated product defect. No full smoke gate was run under the explicit override.

The independent reproduction initially used the review branch's older `bundle-server.mjs` with the Series 2 archive and correctly failed its asset and dependency checks; repeating with the evidence's exact Series 2 base plus the three-line patch passed. The retained Linux release and staged tree are not a final desktop installer. macOS arm64 native build and acceptance remain with Front; Windows native acceptance is explicitly waived. No native final package was inspected, and no claim of legal sufficiency is made. No external service was contacted by tests; no Docker or paid API was used.
