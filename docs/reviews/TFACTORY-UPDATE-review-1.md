# TFACTORY-UPDATE review, round 1

Verdict: pass
Reviewed commit: 1f5f6bdc389b94ee06f31dda3a7e619100bd2470
Gates: build and smokes passed, with the partial and platform skips below.
Ponytail: full diff and connected guard code reviewed; no functional defect found. Load assumed: a small number of local agents using Git hooks, not a public service.

## Scope and evidence

The requested head is exactly the SHA above; `origin/agents/factory-update-0.1.10` had advanced to `6d41f63d0da8e0ea8a33723fd392ed804b7d46fe` when fetched. Its merge base with current `origin/main` was `3fe7bc75ad43199f9becde9ef85d99e876051b55`. A temporary merge of current main conflicted in `docs/dev-workflow.md`; it was aborted and the review and gate ran on the requested head. The diff is mixed: `.factory/manifest.json`, `AGENTS.md`, `docs/dev-workflow.md`, `docs/review-protocol.md`, and `tools/factory-guardrails.mjs`.

No TFACTORY-UPDATE task spec or builder report was present in the reviewed tree. Issue #20 describes an unrelated detached document pane. The checklist therefore uses the explicit review assignment and the commit message as the available requirements; a claimed architecture level and any separate Result/Observable acceptance items could not be checked. The guard changes existing hook behavior, without new dependencies, exports, routes, or modules. The missing level/spec is a process limitation, not a demonstrated functional defect under the requested verdict rule.

The protected-file commit cites ADR-0001, which is accepted and records Sascha's decision. English UI/demo data remains required in `AGENTS.md`; the OpenAI-only worker rule remains in `docs/coordinator.md` and `docs/dev-workflow.md`. The server-Front text describes a project-tested alternative that existing tooling does not support; it does not change the coordinator's existing Front placement. The project-owned coordinator, debt and architecture protocol files are unchanged. The manifest's upstream baseline hashes cannot independently establish the contents of the ignored local factory installation; no factory repository or live configuration was altered.

## Spec checklist

| Requirement | Evidence | Result |
| --- | --- | --- |
| Update manifest to 0.1.10 while retaining project decisions | `.factory/manifest.json`, `AGENTS.md`, `docs/dev-workflow.md`; diff and retained rules inspected | Pass, subject to baseline limitation above |
| Protect `AGENTS.factory.md` as a reviewed, ADR-protected file | `tools/factory-guardrails.mjs:31,104`; isolated CLI demo with and without an accepted ADR | Pass |
| Reject staged links into the local factory standard | `tools/factory-guardrails.mjs:59`; isolated CLI demo rejects a normal standard link and accepts an ordinary link | Pass for normal paths; tab-name edge case below |
| Gate both old and configured main branches | `tools/factory-guardrails.mjs:120`; isolated old-main demo rejects unreviewed commits after a config change; covered main passes | Pass |
| Handle unknown remote commits | `tools/factory-guardrails.mjs:132`; isolated unknown topic tip rejected, known topic tip accepted | Pass; a force update of any ordinary branch requires fetching its old tip first, including legitimate fork integrations |
| Review signed-off screen controls and retain existing decisions | `docs/review-protocol.md:17`; document inspection | Pass |
| Invented data, no secrets or outward product effects | Full diff and isolated demos inspected; demo repos used invented values and no pushes | Pass |
| Public-entry tests and mutation sensitivity | No new automated guard tests in the diff; isolated demos call the guard CLI. Existing smoke suite does not prove these new guard branches | Debt below |
| Untrusted rendering | No new rendering or HTML interpolation in the diff | Not applicable |

## Gate and flow checks

In a clean temporary checkout at the reviewed SHA, `npm ci` with normal lifecycle scripts completed and `node_modules/.bin/tsgo` was verified. The attributed, normally locked `~/controller-exxperts/full-gate.sh bash -c 'npm run build && npm run smokes'` passed: build succeeded, 381/381 smokes passed in 654 seconds wall time, six at a time. There were no failed smokes to rerun. An earlier setup attempt before installing dependencies failed at build because `tsgo` was missing; it did not reach smokes and is an environment/setup failure, not a product verdict.

`persistent-room-localfiles-secret-floor-smoke.ts` passed with the `find` cases skipped because `fd` is absent and a case-rename case skipped on the case-sensitive disk. Windows-only 8.3, trailing-dot/space and stream-key cases were not applicable on Linux in `full-access-skills-folder-smoke.ts` and `persistent-room-localfiles-secret-floor-smoke.ts`; Finder detail cases were not applicable in `room-files-routes-smoke.ts` and `artifact-export-smoke.ts` on Linux.

After the gate, the public guard CLI was exercised in disposable Git repositories using invented data. Unreviewed main was rejected, a covered main update accepted, the former main stayed gated after a branch-name change, a known ordinary branch passed, an unknown ordinary remote tip was rejected with fetch guidance, a standard symlink was rejected, an ordinary symlink accepted, and an ADR-protected file was rejected without and accepted with an accepted ADR. No real remote push was made in these demos.

## Findings

No functional findings under the specified functional-only verdict rule.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| edge-case | minor | `tools/factory-guardrails.mjs:60` | Parse the index record at its first tab rather than splitting every tab: a staged factory symlink named `link<TAB>name` was accepted in a disposable demo. This requires repository write access. |
| tests | minor | `tools/factory-guardrails.mjs:59,120` | Add public CLI tests for standard and ordinary symlinks, old/new gated branches, known and missing remote tips, and protected `AGENTS.factory.md`; verify they fail when each corresponding guard is removed. |
