# T13 architecture conformance

Reviewed commit: 7dac80fa79f321b2ea734c43e616af3cfcd04618
Verdict: pass

## Architecture impact

Level 2: the existing Word renderer sends a bounded private diagnostic over its existing stderr pipe to the existing server process. The Controller accepted the level and the T13-R3 private diagnostic contract on 2026-11-09 (controller-exxperts journal, decision `T13-level2`). ADR-0004 keeps the existing Word parser limits and lifecycle.

## Boundary review

- Compared the complete task diff against `origin/main` at merge base `2bf175596af63816bb95b2ffd9bfde8cf7caa66b`, the issue and its update, and `T13-R3-architecture-spec.md`. The renderer changes stay in the existing child; no production route, export, dependency, durable store, IPC result field, or forbidden import was added. The added `vmlDocx` export is confined to the invented test-fixture module.
- `shelf-parse-worker.mjs` emits only the approved fixed ASCII names and messages for unexpected Word renderer errors. `persistent-room-shelf-reading.ts` bounds and validates complete stderr lines, suppresses duplicate valid diagnostics, and logs only a validated line; the existing bounded OOM tail remains. This is the approved use of the existing pipe, not a document-content channel.
- The diff leaves the worker launch, IPC response shape, Word CSP, network denial, parser ceilings, and cancellation lifecycle in place. The sanitizer changes and page layout adjustments are the changes identified in the approved spec. No new external-system path was found.

## Findings and limits

No architecture conformance finding. This is a focused diff and connected-code review; no suites or gate commands were run. Logic edge cases, security and load were not independently audited. The issue records Sascha's acceptance of the first-page height and left-aligned page number as existing visual limits; his Mac acceptance of the real file remains outstanding.
