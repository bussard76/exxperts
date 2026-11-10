# ADR-0008: Clarify new modules in the change levels

Status: proposed
Date: 2026-11-10
Decided by: Sascha (2026-11-10), module distinction; acceptance of this proposal pending
Architecture impact: level 3 — proposed wording for the protected change-level table; no product modules, contracts or data flows change

## Context

The level table in `AGENTS.md` lists a new module as level 3. Classification of the Markdown editor helper for #17/#18 exposed ambiguity between a new file and a new module. Sascha clarified on 2026-11-10: "neue Dateien sind nicht automatisch neue Module ... sie müssen logisch oder technisch völlig neue Themen und Abhängigkeiten aufbauen."

## Options

### A. Clarify the table (recommended)

Add to the level 3 examples: "A new file alone is not a new module; a new module is a logically or technically wholly new topic that brings new dependencies." Continue to assess every other level criterion separately.

### B. Leave the table unchanged

Keep the clarification only in the Architect protocol; readers of the table alone may still classify a file as a module.

## Decision

Sascha decided the module distinction quoted above. His acceptance of option A and the proposed change to `AGENTS.md` is pending.

## Consequences

If accepted, the protected table will reflect the distinction. Other triggers for levels 2 and 3 remain unchanged; no product change or reclassification of a specific task is part of this proposal.

## Slicing

After Sascha accepts this ADR, update the level 3 table wording in `AGENTS.md` and check it against the accepted decision and the Architect protocol.
