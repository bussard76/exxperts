# ADR-0005: A slim lane for level-1 bug fixes

Status: accepted
Date: 2026-11-09
Decided by: Sascha (2026-11-09), option A
Architecture impact: level 3 — changes the way of working that `AGENTS.md` protects: who reviews a spec before the build. No product module changes.

## Context

A one-line bug fix (#13, a missing function in the Word preview worker) went through a spec review by an Architect, a Developer, a Tester with its own full smoke run of about 12 minutes, and an integration wave with a second full run of about 12 minutes. Sascha, 2026-11-09: "Das finde ich irgendwie nicht effizient, wenn so eine Korrektur am Ende eine Stunde dauert". Asked how small fixes should go faster, he chose: "Schlanke Spur festhalten".

The full run in the Tester's stage duplicates the one in the wave. Sascha already decided on 2026-11-07 that a green integration run suffices for the push. The spec review is the other stage: it also confirms the claimed level, which a ticket's author cannot do for itself.

## Options

### A. A slim lane with a checked level (recommended, chosen)

A ticket may take the slim lane when all of this holds, and the Controller checks it, not the ticket's author:

- it is a bug fix, and the ticket states the diagnosis and the exact change;
- the Controller's own check finds level 1: no new or changed public export, route, dependency, contract, data flow or protocol, and no protected file;
- the change touches at most one module.

In the slim lane: no separate Architect spec review before the build; the Developer still writes the failing test first; the independent Tester runs the targeted tests and `ponytail-review` on the full diff and no full smoke run; the integration wave runs the one full gate under `docs/coordinator.md`. If any check fails, or the Developer finds that the change is larger than the ticket says, the task leaves the slim lane and takes the normal path, including the spec review.

### B. Keep every stage for every task

Simplest, costs about an hour for a small fix.

### C. No review of level-1 fixes

Fastest, and the independent review the review gate requires would be gone. Not acceptable under `AGENTS.md`.

## Decision

Option A, as Sascha chose it: "Schlanke Spur festhalten".

## Consequences

- `AGENTS.md` and `docs/architect-protocol.md` name the slim lane as the one exception to the spec review; `docs/coordinator.md` carries the rules.
- Unchanged: the independent review, `ponytail-review`, the full gate before `main`, conformance for levels 2 and 3, the protected files, and the rule that a wrong level claim sends the task back to the normal path.
- Risk, accepted: a change that looks level 1 and is not could be built without a spec review. The checks above and the Tester's review are the guard. The Controller records each slim-lane task in `status.md` with the three checks, so a reviewer can see why it qualified.
- Debt: none. Out of scope: levels 2 and 3, features, and non-bug tasks.

## Slicing

One change: the text in the three files named above. No code.
