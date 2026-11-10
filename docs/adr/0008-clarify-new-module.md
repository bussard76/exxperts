# ADR-0008: Clarify new modules in the change levels

Status: accepted
Date: 2026-11-10
Decided by: Sascha (2026-11-10), option A with the extension "or interfaces"
Architecture impact: level 3 — clarifies wording for the protected change-level table; no product modules, contracts or data flows change

## Context

The level table in `AGENTS.md` lists a new module as level 3. Classification of the Markdown editor helper for #17/#18 exposed ambiguity between a new file and a new module. Sascha clarified on 2026-11-10: "neue Dateien sind nicht automatisch neue Module ... sie müssen logisch oder technisch völlig neue Themen und Abhängigkeiten aufbauen."

## Options

### A. Clarify the table (recommended)

Add to the level 3 examples: "A new file alone is not a new module; a new module is a logically or technically wholly new topic that brings new dependencies." Continue to assess every other level criterion separately.

### B. Leave the table unchanged

Keep the clarification only in the Architect protocol; readers of the table alone may still classify a file as a module.

## Decision

Option A with the extension "or interfaces", accepted by Sascha on 2026-11-10: "Du kannst A auch mit deiner vorgeschlagenen Ergänzung annehmen".

A new file alone is not a new module; a new module is a logically or technically wholly new topic that brings new dependencies or interfaces.

## Consequences

The protected table and the Architect, coordinator and developer workflow documents will use the accepted wording:

A new file alone is not a new module; a new module is a logically or technically wholly new topic that brings new dependencies or interfaces.

Other triggers for levels 2 and 3 remain unchanged; no product change or reclassification of a specific task is part of this decision.

## Slicing

1. Record this accepted ADR and preserve the options text.
2. Add the accepted wording to the level 3 table in `AGENTS.md`, citing ADR-0008 in the commit.
3. Apply the same accepted wording in `docs/architect-protocol.md`, `docs/coordinator.md` and `docs/dev-workflow.md`, marked decided by Sascha, 2026-11-10.

Validate the exact wording, preserved options, commit ordering and DCO sign-offs; independent review and integration follow.
