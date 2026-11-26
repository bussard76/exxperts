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
- [x] Mention, IME, overlay, approval, selection, caret, and existing send handling retain precedence: `consult-mention-smoke.ts` checks picker navigation and dismissal, IME, overlay, approval, selection, caret, accepted and refused sends.
- [x] Room switching clears browsing state and isolates each room's history and draft: `consult-mention-smoke.ts` switches while browsing and checks the second room's empty draft and history.
- [x] Restored room transcript supplies recall after reload without new persistence: `consult-mention-smoke.ts` reopens the first room and recalls after reload.
- [x] Consecutive exact duplicate user prompts collapse across other items; non-consecutive repeats remain; empty attachment-only prompts and wire-only text are excluded: `consult-mention-smoke.ts` sends duplicates and separated repeats, whitespace, an attachment-only message and a prompt carrying a transferred consult handoff.
- [x] Accepted sends become recallable; reset and accepted send clear browsing; failed send preserves draft: `consult-mention-smoke.ts` exercises sends, switching, and accepted and refused composer callbacks.
- [x] Accepted composer @ consults sent to another room are excluded: `consult-mention-smoke.ts` sends a consult and checks the preceding room prompt is recalled.
- [x] Document the user-visible behavior and self-review every item with named tests: `docs/developer.md` and the checklist above.
- [x] Run targeted typechecks and covering browser spec through gate; merge origin/main and rerun affected checks. The composer smoke contains the affected component and browser cases; the fixed `test:scripts` list contains packaging tests, none affected by this change.
- [ ] Establish the dispatch's failing-first evidence for the additional acceptance cases: their checks were written after the checkpoint's implementation and were not observed failing before it. Coordinator disposition is needed for that historical sequencing requirement.

Assumption: the existing textarea and browser-level room interactions are the public test seam. Graph: no; no graph was requested for this task.

Caret regression: `consult-mention-smoke.ts` first failed when an identical recalled prompt was escaped and edited; a pending programmatic caret move survived because the draft value did not change. The fix restores the caret immediately for identical text; the browser smoke passed. The initial navigation test also needed to wait until queued messages actually reached the transcript; a run before that wait failed at `ArrowUp recalls gamma`, and the corrected test passed.

## Developer handoff (incomplete)

Implementation commits `1be1d4f` and `c3adc23` implement room transcript recall and the identical-draft caret fix. Sascha's 2026-11-26 outside-in sign-off is recorded in the amended spec. `consult-mention-smoke.ts` failed first at `ArrowUp recalls gamma` before the implementation; the identical-draft caret assertion also failed first before its fix. Browser tests subsequently passed for navigation, draft restoration, caret, IME, multiline, empty history, repeated prompts and no send on recall. An attempted room-switch/reload extension passed the switch to an empty room but failed before reload because its test attempted to click the original room's card after browser Back had already returned directly to that room: `locator.click: Timeout 30000ms exceeded`, waiting for `.persistent-agent-card` containing `Desk 1280 light` at `consult-mention-smoke.ts:595`. The navigation was corrected while preserving the assertions, but remains unverified: the coordinator instructed no further run or retry.

Checks so far: `npx tsc --noEmit -p apps/web-ui/tsconfig.json` passed; commit hooks ran `npm run typecheck:scripts` successfully. The attributed browser gate passed before the pending room-switch/reload extension; its most recent run failed as described. The first browser attempt lacked generated runtime assets; `npm run build` in `runtime/` supplied them. A `gate --help` discovery attempt was mistakenly made without attribution; it failed with ENOENT and ran no gate workload. No foreign-load failures were observed. Full build and smokes were intentionally not run per dispatch. The affected suites, corrected browser run, final typechecks, merge of current origin/main, post-merge rerun, self-review and unchecked checklist items remain outstanding. No screenshots were captured. No debt candidates have been assessed yet.

Files changed: `docs/specs/T23-uparrow-history.md`, this report, `apps/web-ui/src/components/in-room-chat.tsx`, and `apps/web-server/scripts/consult-mention-smoke.ts`. The existing unrelated `package-lock.json` modification was left unstaged and untouched. Graph: no; six tool calls preceded the first edited file, and the graph made no difference because it was not used.

## Rework 1

The corrected `consult-mention-smoke.ts` room-switch and reload test passed through the attributed browser gate. Its first rework run failed waiting for the composer after Back from the second room: Back returns to Home, and the started first room has a Resume button. The test now explicitly reopens that room with Enter or Resume before reload; all existing assertions remain unchanged. The accepted scope excludes composer @ consults to other rooms, and Sascha's outside-in sign-off for the existing composer is recorded in the spec.

Further `consult-mention-smoke.ts` checks cover picker arrows and Escape, overlay and approval precedence, refused and accepted sends, attachment-only and whitespace-only messages, accepted consult exclusion and the visible prompt after a transferred handoff. These are additional verification of behavior implemented at the earlier checkpoint; they were added after that implementation, not observed failing before it. The prior checkpoint recorded failing-first tests for initial recall and the identical-draft caret fix. No additional product fix was needed in this rework. Foreign-host network-failure reruns: 0.

After fetching current `origin/main`, `git merge --no-edit origin/main` reported already up to date. On that tree, `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed, as did `GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate npx tsx apps/web-server/scripts/consult-mention-smoke.ts` with the required T23 Developer attribution. The smoke passed its component checks and all four browser viewport/theme cases. Full build and smokes were not run, as directed. The unrelated existing `package-lock.json` modification remains untouched.
