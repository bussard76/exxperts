# ADR-0004: Evidence for isolated smoke gate decisions

Status: proposed
Date: 2026-11-06
Decided by: pending Sascha's decision
Architecture impact: level 3 — new completion and process-status protocol between the smoke runner, its npm lifecycle supervisor and the Controller, consumed as integration evidence.

## Context

Sascha's 2026-11-06 gate rule permits at most two parallel smoke failures when each passes alone on the same commit; missing evidence and other failures remain red. The existing runner emits arbitrary smoke output after its summary without a completion marker, so the existing Controller parser cannot establish a complete exact failed set and the wave correctly remains red. Independent review `origin/agents/gate-evidence-review:docs/reviews/GATE-EVIDENCE-architecture-spec.md` at `077004f` classifies authoritative cross-process completion evidence as level 3 and identifies npm lifecycle and transient-source issues. This ADR is a proposal; the gate disposition decision alone does not authorize its implementation.

## Options

### A. Cooperative private IPC and exclusive checkout (recommended)

Keep actual `npm run build` and `npm run smokes`, including npm lifecycle and environment. A Controller-owned supervisor observes the build, npm, the actual runner's exit and a versioned completion record separately, through a fresh private local IPC endpoint and a narrowly scoped npm-script wrapper. The runner derives its record from final results; smoke stdout/stderr has no authority. Preserve host lock, inventory, commit checks, evidence and hooks as specified in `docs/specs/gate-isolated-evidence.md`.

Require cooperative exclusive ownership of the execution checkout throughout build, full and isolated smokes, browser gate and push; tests must not intentionally alter tracked source. Endpoint checks establish observed identity only, not continuous immutable executed bytes. Same-user malicious access to process state, endpoint or filesystem, deliberate interference and a modified runner are outside this trust model. Run IDs correlate; they do not authenticate against such actors. This bounded option preserves the existing working environment at the cost of those explicit residual limits. If stronger guarantees are needed, choose C.

### B. Continue failing closed without new evidence

Keep current diagnostic reruns, preserve both outputs and leave failed parallel waves red. This avoids a new protocol and trust assumption but cannot automatically apply Sascha's isolated-pass allowance to a failed parallel run.

### C. Enforced immutable source and stronger process isolation

Run build, full suite, isolated runs and browser checks from an enforced immutable view of the verified commit, separate writable outputs, and isolate the evidence channel from same-user interference. This aims at stronger continuous source and origin guarantees but needs a separate concrete design, platform and build-output compatibility review; cost and behavior changes are not yet established. Do not treat endpoint checks as equivalent to this option.

## Decision

Pending. Sascha must choose and date the decision; no implementation follows from this proposed ADR.

## Consequences

Under A, the runner and Controller share an authoritative, versioned internal protocol and are reviewed together; normal output and smoke behavior remain intact. Implementation must pass fresh independent spec and conformance review and preserve all gates and hooks. Documentation reflects the already-decided disposition separately. The private channel does not secure against hostile same-user code or prove uninterrupted source immutability; these are explicit limitations, not established safeguards. B requires no protocol build. C requires a new reviewed design before implementation. No dependency, product API, route or product behavior is approved here.

## Slicing

1. Sascha decides the option; record acceptance and date. For A, obtain independent review of the revised concrete protocol and test plan before build.
2. Implement the runner, lifecycle wrapper and Controller in test-first slices; independently review the full change, including the controller-only diff.
3. Run targeted checks and independent full gates; only reviewed changes may be used for a real wave. Do not perform a live wave during development.
