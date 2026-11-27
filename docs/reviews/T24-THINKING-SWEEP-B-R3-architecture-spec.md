# T24-THINKING-SWEEP-B-R3 architecture spec

Verdict: pass
Spec: `docs/specs/T24-thinking-sweep-lab.md` at `ff36dc176e9a7b7d27f0ce21b83d2c1e044b78d3`
Level: 2 confirmed for the stated private startup guard and lab launch changes in existing modules. A new production contract, client identity mechanism or data flow requires reclassification.
Decision: Sascha selected lab-only Option B. The Controller must approve the level-2 scope before implementation; no further design decision is required for the stated cooperative lab boundary.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Lab-only suppression | Server startup and `room-socket.ts` at the `generateSuggestions` call | Validated process-local guard skips the worker; normal servers retain the existing lifecycle and generation | The actual producer at `room-socket.ts:1664` is invoked at `:2390`. The spec requires a valid suggestion profile and both lab and ordinary producer coverage. |
| Activation and ownership | Existing sweep smoke launch and server startup | Parent creates private scratch state, token, marker and child, checks fake provider and owns cleanup | The smoke already creates the fake profile, server and proxy. The amended launch replaces its fixed smoke token with a fresh one; it must retain its own child handle. A marker validates configuration, not independent parent identity. |
| Isolation | Controlled lab launch and existing HTTP/WebSocket authentication | Cooperative isolated test host/session, with no other clients and invented data | This matches Option B as a lab-only switch under the stated operational condition. A same-user authenticated client is not excluded or detected; this is disclosed, not proven away by loopback or the marker. |
| Sweep contract and regression evidence | `runSweep` and its smoke, recorder and fake provider | Existing attachment and result contracts remain; the controlled launch passes child connection details through the existing interface | Original fifteen-row, retry, timeout, tool, budget and unwritable-log assertions remain. Compare unfiltered provider receipts with recorder requests for exercised transports. The 500 retries have no usage evidence; retained assertions do not show they cost nothing. |
| Recorder, privacy and accounting | Existing recorder and sweep reader | Selected hosts and fetch/WebSocket payloads, model/time matching and observed socket totals | No completeness, final-departure barrier, guaranteed bill or general log sanitization is claimed. Raw errors and arbitrary nested thinking fields require invented data and synthetic errors. |
| Outside-in and dependencies | Lab smoke, existing server and fake provider | No UI change; end-to-end launch exercises actual producer and sweep | `design/` contains no lab export; ADR-0009 records the relevant UI export exception. There is no parallel implementation split. If split, agree the private startup/launch inputs first and retain the real producer-to-sweep test. |

## Prefactoring

None required. Keep the guard at the existing producer invocation and extend the existing lab smoke launch; do not add a general launcher, public setting or recorder contract.

## Findings

No remaining design blocker within the specified cooperative boundary. The prior review's launcher ambiguity is resolved by retaining `runSweep` and `--run` while placing child ownership in the controlled launch. Its cost-completeness and typed-record requirements are explicitly withdrawn from this switch scope, with their limitations disclosed; neither is delivered by this amendment. The report at `fc1049a` identifies suggestion contamination of the sweep, and `76e4c02` documents a separate Wallet fixture adjustment with actual nonzero suggestion usage; that Wallet evidence neither supplies missing sweep cost evidence nor authorizes weakening the sweep assertions.

Binding implementation precision: validate that the marker is within the fresh home and that the specified recorder preload is actually configured, not merely that an unrelated `NODE_OPTIONS` value exists. Treat partial or malformed activation as startup failure before traffic, avoid logging marker or token, and prove cleanup on success and failure. Preserve the existing proxy's delayed-frame and status-failure coverage while verifying that it forwards to the child the launch owns. The test must show the normal producer really generates suggestions with the selected fake profile, so absence in lab mode is meaningful. Preserve all existing assertions and use fake receipts as evidence only for transports actually exercised.

The smallest open scope decision, **only if stronger isolation is required**, is whether to require an enforceable client identity or exclusivity mechanism that detects an unexpected authenticated client before and during a rung and prevents its provider departure. The current shared token and marker cannot meet that requirement. That would need a separately specified mechanism, classification and any required decision before implementation; no attack reproduction or mechanism is proposed here. The decision to accept a cooperative isolated session is an operational premise of this pass, not proof that Sascha expressly resolved the stronger adversarial-client question.

No gates, test suites, real providers or product changes were used in this review.
