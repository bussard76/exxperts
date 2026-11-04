# ADR-0001: Adopt the agentic-factory way of working

Status: accepted
Date: 2026-11-04
Decided by: Sascha (2026-11-04), option A
Architecture impact: level 3 — introduces the review gate, protected files, the Controller/Front-agent split and the outside-in process

## Context

exxperts is built with coordinated AI agents. Without a shared, enforced way of working, agents accept their own work, push unreviewed code, skip tests under time pressure and make architecture decisions nobody recorded.

## Options

### A. Adopt agentic-factory (recommended)
- One Front agent talks to Sascha; a Controller steers workers; independent Testers review every change; Git enforces review coverage on `main`.
- Outside-in for new features; functional-only reviews with a hardening phase; measured, calibrated capacity; journal, audit and retro.
- Everything project-specific in `factory.config.json`; `agentic-factory update` brings improvements in.

### B. Ad-hoc agent use
- Each agent session works directly on the repo. Fast at first, unreviewed and unrepeatable later.

## Decision

Option A. The rules live in `AGENTS.md`, `docs/coordinator.md`, `docs/review-protocol.md` and `docs/architect-protocol.md`; the process for people in `docs/dev-workflow.md`. Protected files (`AGENTS.md`, `ARCHITECTURE.md`, `docs/adr/**`, `.githooks/**`, `tools/factory-guardrails.mjs`) change only when the commit message references an accepted ADR that carries a `Decided by:` line. New dependencies are a level-2 change decided in the Architect's spec review, not hook-protected.

## Consequences

- Hooks: Enforced by the factory hooks in `.githooks/` (`tools/factory-guardrails.mjs`). With the hooks armed (`core.hooksPath=.githooks`), `pre-push` checks every update of `main`.
- The first commit that adds the factory files references this ADR (`ADR-0001`). A new or proposed ADR is committed by citing this ADR in the message; once it is accepted, later changes cite it directly.
- Every later process decision is recorded in `docs/coordinator.md` and `docs/dev-workflow.md` the moment it is made.
- Capacity, model tiers and review rounds start from the configured values and are calibrated from measurements.
