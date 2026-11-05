# T5 architecture conformance

Reviewed commit: e9eec6233952033e11410c5322a7337a3fd6126e
Verdict: fail

## Finding

- **Unapproved new export:** `apps/web-server/src/persistent-room-workspace-tools.ts:434` exports `resolvePersistentRoomWorkspaceExistingFile`, which is imported by the new Markdown workspace module at `apps/web-server/src/persistent-room-workspace-markdown-files.ts:8`. This adds a callable interface to the existing workspace-tools module. The approved `docs/specs/T5-workspace-files.md` Architecture impact section explicitly authorizes no additional public export, while the passing spec review permits minimal guard extraction without approving this particular export. Obtain the required level-2 approval for this interface or remove the unapproved interface, then review the resulting commit.

## Boundary checks

- The four route/method pairs and ten direct UI dependencies match the Controller-approved list in the spec. The route policy classifies reads and the Markdown write separately.
- ADR-0002 approves the browser → room routes → granted workspace flow; the implementation routes file access through the effective workspace policy and guards. The image resolver rejects schemes and protocol-relative sources before forming a room image URL, consistent with the separate external-image decision.
- The diff shows no new durable store or forbidden production import. There is no maintained `ARCHITECTURE.md` import baseline; the check used the task, spec, ADR and connected imports.
- Focused check: `git diff --check origin/main...HEAD` passed. No full suites were run; the independent Tester pass remains required.

## Debt candidates

- Edge-case, low: HTML image attributes remain unverified as identified in the approved spec; cover them during hardening if that Markdown subset is required.
