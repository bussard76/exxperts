# T5-R2 architecture conformance

Reviewed commit: 05ff64792f690ca4c32f9a41c9667cc644e01232
Verdict: pass

## Findings

No blocking architecture finding. The previous review's unapproved resolver export is now expressly approved by the Controller in `docs/specs/T5-workspace-files.md`, limited to the existing guarded room-to-workspace flow. `resolvePersistentRoomWorkspaceExistingFile` uses the read guard and checks regular files and symlink ancestors; Markdown replacement separately invokes the write-purpose guard.

## Boundary checks

- The three GET routes and one PUT route match the approved contracts; remote route policy classifies the GETs as reads and PUT as a write. The ten direct UI dependencies match the approved list.
- ADR-0002 accepts the browser → room routes → granted workspace flow and requires existing protections. The tree and file modules resolve through the workspace policy and guards, including the root fingerprint; Markdown and image reads use the approved existing-file resolver. External image schemes and protocol-relative sources are rejected by the UI resolver.
- The change adds no separate durable store or unapproved data flow. The reviewed production imports revealed no forbidden import; there is no maintained `ARCHITECTURE.md` import baseline.
- Focused check: `git diff --check origin/main...HEAD` passed. No full suites were run. The independent Tester result remains required and was reported as pending by the coordinator.

## Debt candidates

- Edge-case, low: HTML image attributes remain unverified, as noted in the approved spec; cover them during hardening if that Markdown subset is needed.
