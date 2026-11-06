# Cleanup safety review R13 — in progress

What this change does: R13 correlates supplied worktree IDs and canonical paths across evidence already needed by each cleanup route. It also retains an invocation-local host rejection after dispatch/terminal mismatches and duplicate dispatch rows, including release confirmation.

## Architecture impact

Level 1, independent read-only review. Only this report is a persistent change; no implementation, public interface, dependency, route, store, protocol or data flow is changed. The explicit controller safety-review override replaces generic issue/product work, repository fetch/merge/commit/push and product/full/browser gates.

## Review checklist

- [x] Read worker rules, coordinator worker guidance, R13 report and full diff, R12 review, prior safety findings, installed script/helper and supplied harness/adapters.
- [x] Snapshot installed/candidate and harness; verify 4,036 inherited registrations are unchanged and catalog all 4,399 current registrations.
- [ ] Independently rerun the supplied suite and reconcile completed names/multiplicities with the catalog.
- [ ] Probe additional opaque ID/path combinations on both routes, all applicable actions and initial/final observations, with actual-state assertions and absent/distinct controls.
- [ ] Probe dispatch/terminal mismatches and duplicate dispatch contradictions across observations, including release confirmation and later valid receipts.
- [ ] Recheck prior canonical path/ID/completeness/parser/completion, protected-ref/SHA-lease, ignored/unpushed data, install-noise and accounting guards.
- [ ] Self-review every binding requirement, record exact evidence and source hashes, disclose external-writer/trusted-service limits, remove temporary artifacts and report pass/fail.

Assumptions: all execution uses disposable invented Git repositories, local bare remotes, copied controller scripts and fake Orca. No live cleanup, real service/inbox body, other project, model API, helper agent, install or product gate is authorized. Live cleanup remains deferred until a fresh independent pass and coordinator acceptance.
