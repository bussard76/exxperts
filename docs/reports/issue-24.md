# Issue #24: Suggestions decision and specification report

Date: 2026-11-25
Scope: documentation only; implementation remains blocked.

## Architecture impact

Level 3: server-owned automatic post-answer model generation and correlated delivery to the web composer. [ADR-0009](../adr/0009-server-owned-prompt-suggestions.md) records Sascha's option A decision and limits; [T24 spec](../specs/T24-suggestions.md) separates accepted behavior from unresolved contracts.

## Checklist

- [x] Read issue #24, `AGENTS.md`, developer/coordinator docs, ADR template and the architecture review at `c1dcdc21ba4c54b35760c28059d9426a796e48e9`.
- [x] Preserve “Ja, Option A mit diesen Vorgaben” with accepted status, date 2026-11-25 and `Decided by: Sascha (2026-11-25), option A`.
- [x] Record server ownership/no tools; last three text exchanges/about 4,000 characters; no tool results, attachments or files; fixed named small model per provider/no switch/unavailable fallback; silent errors/10-second timeout; no persistence/stale-result discard; issue keyboard/ghost-text behavior.
- [x] Map every review gap to accepted evidence or an explicit `NEEDS-SASCHA` question in the spec.
- [x] State that the previous review found no T24 outside-in exports, interface definition or logic diagram; no artifacts or sign-off fabricated.
- [ ] Resolve Q01–Q14, supply outside-in evidence and obtain required architecture spec review before implementation.

## Unresolved decisions — NEEDS-SASCHA

All questions block implementation; full wording and recommendations are in the spec.

| ID | Decision question |
|---|---|
| Q01 | Which successful endings trigger generation, and how do duplicates, retries, stopped/failed, queued, background and disconnected turns behave? |
| Q02 | What exact provider/model-ID table, configuration/eligibility rules and provider snapshot apply, including custom providers and gateways? |
| Q03 | What are the exchange definition, roles/text blocks, request serialization, exact character cap/counting and truncation rules? |
| Q04 | What redaction, application logging/diagnostics and provider-retention disclosure apply? |
| Q05 | What usage/cost accounting and numeric output/rate/spend budgets apply? |
| Q06 | When does the 10-second deadline start, what cancels calls, and what concurrency/queue policy applies? |
| Q07 | What exact transport fields, identities, authorization, ordering and duplicate/stale checks connect producer and consumer? |
| Q08 | What ephemeral lifetime, switch/return, reconnect/restart and multi-window behavior applies? |
| Q09 | What response schema, parsing, length limits and malformed/partial-output validation apply? |
| Q10 | When are old suggestions cleared, hidden, consumed or restored around answers, errors and composer edits? |
| Q11 | What is the complete suggestion/hint precedence, including mentions and disabled/read-only states? |
| Q12 | What zero/one-item, key/modifier, focus escape, IME and accessibility behavior applies? |
| Q13 | Where are the signed-off design exports, clickable fake, interfaces and logic/diagram, or an explicitly approved artifact exception? |
| Q14 | What build slices/dependencies and real producer-to-consumer integration evidence are approved? |

## Files and verification

- `docs/adr/0009-server-owned-prompt-suggestions.md`: accepted option A, source quote, limits, consequences and blocked follow-on slices.
- `docs/specs/T24-suggestions.md`: accepted behavior/checks, organized contracts, 14 binding questions and review coverage map.
- `docs/reports/issue-24.md`: this checklist, decision list and change summary.

Assumption: the dispatch is the source of the quoted 2026-11-25 approval and enumerated constraints; issue #24 supplies only its stated product behavior. Recommendations are unapproved. No product code, tests, dependencies or design artifacts changed. The authorized root `npm run build` succeeded. The original signed-off commit exists at `bd9f153d1fc710699de476f49d870e1d6a9d8289`; its creation confirms the mandatory pre-commit hook completed successfully. The exact complete hook output was not retained, so no detailed typecheck/lint output is asserted. No separate test, lint, typecheck or gate command was run. Text inspection checked quote/metadata, accepted limits, question coverage and the three-file diff. A pre-existing unrelated `package-lock.json` modification is excluded from the commit. Graph: no; documentation-only source reconciliation, with no code-graph work needed for this task.
