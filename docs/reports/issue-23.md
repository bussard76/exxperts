# Issue 23 spec revision report

## Architecture impact

Level 1: existing web UI transcript and composer, with no public interface, data-flow, persistence, dependency or module-boundary change. No prefactoring or new design artifact is required.

## Result and evidence

Authored `docs/specs/T23-uparrow-history.md` from issue #23, the prior Architect's `change-spec` review, and the current source at base `1f4b79b01ebd784b6c1116a0b78c42389eae1c24`. The spec identifies the transcript and composer path, source-derived send and duplicate rules, reload path, existing keyboard precedence, and observable checks for the requested behavior. Sascha decided: “Nein, nur Prompts dieses Raums.” The spec explicitly limits recall to stored user prompts in the current room transcript, excludes @-consults to other rooms, and adds no storage; existing transcript persistence determines what is available after reload.

Files authored: this report and `docs/specs/T23-uparrow-history.md`. No product code or tests were changed or added. No tests, builds, lint, browser tests or gates were run, as directed.

The spec and report were committed and pushed to `agents/t23-uparrow-spec` at `7b67da465040d3cf284571e122f54b32b57e5a8c`. That documentation-only commit passed the mandatory pre-commit hook; its static-check step skipped typecheck and lint. No tests, builds, lint or browser checks were run. The pre-existing `package-lock.json` modification is unrelated and remains untouched. This follow-up records only the accepted room-only rule and corrects the status; the independent Architect spec review is still pending and must pass before implementation.

## Implementation checklist

- [x] Up and Down navigate sent room prompts in order, stop at bounds, and restore the exact original draft after the newest: `consult-mention-smoke.ts`, browser composer path. The test failed first on `ArrowUp recalls gamma`, then passed.
- [x] Escape restores the original draft, including after editing a recalled entry; recall is editable, puts the caret at the end, and does not send: `consult-mention-smoke.ts` browser composer.
- [x] Up starts only on the first line or an empty field; empty history leaves native behavior intact: `consult-mention-smoke.ts` covers empty history and line two.
- [ ] Mention, IME, overlay, approval, selection, caret, and existing send handling retain precedence. `consult-mention-smoke.ts` covers IME; remaining precedence checks are pending.
- [ ] Room switching clears browsing state and isolates each room's history and draft.
- [ ] Restored room transcript supplies recall after reload without new persistence.
- [ ] Consecutive exact duplicate user prompts collapse across other items; non-consecutive repeats remain; empty attachment-only prompts and wire-only text are excluded. `consult-mention-smoke.ts` covers repeated and separated prompts; attachment coverage remains.
- [ ] Accepted sends become recallable; reset and accepted send clear browsing; failed send preserves draft.
- [ ] Accepted composer @ consults sent to another room are excluded.
- [ ] Document the user-visible behavior and self-review every item with named tests.
- [ ] Run targeted typechecks, affected suites, and covering browser specs through gate; merge origin/main and rerun affected suites.

Assumption: the existing textarea and browser-level room interactions are the public test seam. Graph: no; no graph was requested for this task.

Caret regression: `consult-mention-smoke.ts` first failed when an identical recalled prompt was escaped and edited; a pending programmatic caret move survived because the draft value did not change. The fix restores the caret immediately for identical text; the browser smoke passed. The initial navigation test also needed to wait until queued messages actually reached the transcript; a run before that wait failed at `ArrowUp recalls gamma`, and the corrected test passed.
