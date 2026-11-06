# T4 ADR review, round 1

Verdict: pass
Reviewed commit: e8e871d8caa0764a1bebd3ad951472c8ce5c14f7
Gates: `git diff --check` and targeted ADR document checks passed; full and browser gates not run for this documentation-only review, as directed.
Ponytail: full task diff reviewed; no findings.

What this change does: ADR-0003 records Sascha's choice to open approved preview files through the local server. It sets boundaries for the later specification and implementation; it changes no product behavior.

## Spec checklist

| Requirement | Evidence | Check | Status |
| --- | --- | --- | --- |
| Record option A and the dated decision | ADR-0003, Decision; issue #4 comment of 2026-11-06 quotes “Über den exxperts-Server” | Compared with issue and accepted ADR template | Pass |
| Work in local browser and Electron; hide on paired devices; exclude Markdown; report the approved failure sentence | ADR-0003, Context, Decision and Consequences; issue #4 design and decision comments | Compared with issue comments | Pass |
| Restrict to preview types, workspace guards, local route and fake opener tests | ADR-0003, Decision; issue #4 decision comment | Compared each explicit limit | Pass |
| Preserve ADR-0002 workspace boundaries and protect local authorization | ADR-0003, Decision and Consequences; ADR-0002; workspace resolver and remote route policy | Compared current grant, denied paths, symlink and paired-device requirements | Pass |
| Record the level-3 data flow without approving extra dependencies, public exports or unapproved product behavior | ADR-0003, Architecture impact, Decision and Consequences | Inspected full task diff and compared issue #4 | Pass |
| Preserve privacy, invented fixtures and no real opener in tests | ADR-0003, Consequences; issue #4 ready check and constraints | Compared document requirements | Pass |
| Record the #4-only Figma exception and leave unresolved decisions open | ADR-0003, Context and Consequences; issue #4 comments | Compared dates and quotes | Pass |

The reviewed head and current `origin/main` have two merge bases. Both were examined: the reviewed commit itself adds only ADR-0003; a clean `git merge-tree --write-tree origin/main HEAD` produces a tree whose only difference from current main is ADR-0003. `git diff --check` passed on each merge-base comparison, on the direct main comparison and on that merged tree. The targeted document check verified the decision, key boundaries, template sections and local references. No product tests were added or run for this record.

## Findings

None. Looks good. Ship.

## Debt candidates

None identified in this documentation change. The ADR explicitly leaves the implementation specification, local authorization details, extension allowlist, replacement race, and label choice for subsequent review; this review does not approve those unresolved details.
