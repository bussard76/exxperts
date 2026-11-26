# TFACTORY-UPDATE-SPEC-R2 architecture spec

Verdict: pass
Spec: `docs/specs/TFACTORY-UPDATE.md` at `2aae69765a5e503b17afe1bb6201d995ee2a7987`
Level: 3, confirmed: Front's temporary product-code responsibility and changed test ordering cross existing role and workflow interfaces.
Decision: recorded in accepted ADR-0011, decided by Sascha on 2026-11-25, at `1688a50d3012c1009559e2bb34a53e45892afc96`. The implementation base must first contain this exact accepted decision through the reviewed route specified by the task.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Scope and ownership | Existing rules, guardrails, manifest, review and workflow documents; focused hook tests and report | Task branch to independent review; no product module or external installation | Spec names allowed paths and prepared source; preserve target history rather than replacing its tree. |
| Lane and outside-in | Front and Sascha; existing outside-in and architecture approval process | Dated opening of one surface and branch; agreement on open interfaces and logic; isolated demo shaping | ADR-0011 and requirements 1–2 preserve approvals, invented data, assertion integrity and per-round evidence. This rules task has no product screen; new `design/<feature>/`, product interface fields or logic diagram are not applicable. Existing diagrams must describe both normal and exceptional paths consistently. |
| Handoff and hardening | Front → Controller → Architect → Developer → independent Tester → Architect → existing wave | Exact branch and full SHA, dated opening and closing, surface, signed-off design location, shortcuts and decisions | Requirements 3–4 supply the handoff, empty-list meaning, dependencies, deferred-test order and independent checks. Ambiguous or open lane and failed checks block the relevant stage. |
| Topology and history | `docs/coordinator.md`, `docs/dev-workflow.md` | One server Front; Controller steers workers; Mac worker assigned per case and returns via Orca | Requirement 5 addresses both conflict regions, preserves TFRONT-SERVER reviews, pilot history and later series, lockfile, upstream and gate decisions. No Mac host, pairing, watcher or automatic startup/tree creation is implied. |
| Git guardrails | `tools/factory-guardrails.mjs`, existing hooks and review records | Staged Git index, pre-push four-field records, local objects and review files in pushed tree | Requirement 6 fixes the empty, missing-object, prior-config and deletion outcomes and preserves ancestor coverage. Step 2 tests actual hooks and the review producer/consumer in disposable repositories. See binding instruction below. |
| Review and integration | Existing review protocol and Controller wave | Signed-off screens → functional flow comparison; passing independent review and conformance → existing gate | Existing severities, rounds, debt, smoke-outlier handling and gate/lock rules remain. The described wave is a prerequisite and workflow, not permission for this Architect or Developer to integrate or write an external repository. |
| Privacy and authorization | Repository safety rules, Front demo and worker/test boundaries | Invented data and disposable repositories only; no real model calls or external effects | Spec explicitly excludes real data, accounts, services and production, external factory installation and broader policy. Abort on unsettled decisions or expanded interfaces. |

## Prefactoring

None. The existing guardrail and workflow seams suffice. The test file named in the spec is new on the target, but does not introduce a new module or shared production interface.

## Findings

No design blocker. The previous review's missing decision is resolved by ADR-0011; the spec makes its bounded rule alignment, both workflow conflicts, present topology and preserved history actionable. No parallel implementation split or new shared product interface is specified. The manual hardening handoff has the required fields and explicit dependency; the existing Git review-file producer and hook consumer are covered by the required public-hook test.

**Binding Developer instructions:**

1. The prepared implementation uses `before ?? "main"` for the previous `mainBranch`; that only handles null or absent values and does not handle other unusable values such as an empty string or non-string. Implement the spec's fallback for an unusable previous branch name, and include invalid-value cases as well as malformed/absent configuration in the hook-level tests. Preserve valid previous and local main selection; do not blindly copy the prepared implementation.
2. Treat the wave description as the normal subsequent process, not an authorization to integrate this task or write to EXXETA. The Developer pushes only its task branch; Controller retains integration and must have the separately required reviews and gates. The base prerequisite is not satisfied merely by referencing ADR-0011 on another branch.
3. Compare the target's actual current conflict regions and later history, including `docs/reports/issue-22.md` and its related reviews, against the final tree. The prepared resolved source predates target history and its direct diff deletes those records; do not import those deletions. Record the mapping and evidence requested by the spec.

## Verification and limits

Compared the pinned spec, target main, accepted ADR, previous architecture review and prepared implementation source, including guardrail code, manifest and the two workflow documents. The spec itself is not a pre-build review of the already authored prepared source and this verdict does not certify its implementation or conformance. No tests, builds, gates, real data or external services were run or accessed; no code or ADR was changed. The pre-existing `package-lock.json` modification is unrelated and excluded. Independent Tester review, level-3 conformance and the normal integration procedure remain subsequent work.
