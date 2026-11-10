# T22-S2-DISCARD targeted review, round 1

Verdict: fail
Reviewed commit: 373bd35b5e4ebd29b350897f71fd199c089ad66b

Scope: Front's targeted functional investigation overrides the full-gate and merge-main instructions. No main merge, full smoke gate, broad diff review or complete ponytail-review was performed; this is not a full Series 2 approval. The actual merge-base with origin/main is 461e6485bf932f5cba85ac3dde8e0104e47d5dec; the 42-path diff is mixed. Issue #22 currently concerns dependency lock deltas and Node floor; the original workspace editor contract is `docs/specs/T5-workspace-files.md:51` in the factory tree. Series 2's contribution omits factory reports and ADRs. Native Windows was not checked; Mac is pending. The unowned original lockfile modification was preserved.

## Findings

### [blocker] Discard leaves an abandoned draft saved when the guard stays open
- Where: `apps/web-ui/src/components/MarkdownEditorPane.tsx:223`, `:261`, `:348`; `apps/web-ui/src/App.tsx:546`, `:576`.
- Problem: A dirty edit opens the navigation dialog but its one-second autosave remains active. A completed save advances the discard baseline while the dialog continues offering Discard; choosing it leaves the abandoned draft on disk and reopening shows it. This reproduces with RAW text and an Edit checkbox using the real browser and local server.
- Violates: The workspace spec requires Save, Discard and Cancel choices before leaving a dirty editor. Autosave after an idle second is intended; a still-offered Discard must not silently retain the draft it offers to discard.
- Fix: Preserve meaningful discard semantics while the prompt is open, including an already in-flight save, without overwriting unrelated external changes.
- Proving test: Drive real browser and routes with a demo Markdown file; edit, open guard before debounce, wait beyond it, choose Discard, reopen and verify original disk bytes. Repeat for checkbox and for an in-flight save, plus external revision changes and Save/Cancel.

## Browser observations

Chromium, actual Series 2 server on independently allocated loopback ports, temporary isolated HOME and invented Markdown; no real model or external service used. Timestamps below are elapsed milliseconds from opening the initial file. PUT responses and file bytes were recorded in `~/controller-exxperts/evidence/t22-s2-discard-2026-11-10/`.

| Scenario | Observation |
| --- | --- |
| RAW, guard held | Original disk and Unsaved at 64 ms; guard open at 115 ms. PUT at 1064 ms used original SHA-256 revision and returned 200 at 1090 ms with a new revision. At 1719 ms status was Saved but Discard remained offered; Discard then reopening retained the draft. |
| Edit checkbox, guard held | At 115 ms checkbox edit was Unsaved and disk unchanged. PUT at 1114 ms saved `[x]`; at 1667 ms guard remained open and status was Saved. Discard and reopen left checkbox checked on disk. The save also normalized trailing newlines. |
| Quick Discard | Guard at 91 ms, Discard at 186 ms, original bytes remained after 1.5 seconds and reopen. |
| Cancel | Guard at 86 ms; Cancel at 181 ms preserved Unsaved draft and editor. Autosave at 1051 ms returned 200; disk and label became Saved. |
| Save and continue | Guard at 81 ms; Save caused a PUT at 180 ms, 200 at 190 ms; reopening showed the draft. |
| Navigate after debounce | PUT at 1056 ms returned 200; navigation at 1523 ms had no guard and reopening showed the saved draft. This is expected autosave behavior. |
| In flight, before and after server write | Held a real request before forwarding in one run and held the real response after the server write in another. Discard while Saving caused the first PUT to complete, followed by a second PUT of the original bytes using the new revision; both returned 200 and reopening showed the original. This transiently wrote the abandoned draft and then restored it; only these controlled timings were checked. |

No revision conflict occurred in these runs; they do not establish that autosave can never race an independent external write or cause a conflict. Existing browser coverage (`apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts`) exercises Discard while PUTs are artificially failed, so it does not establish the guard-held-past-debounce behavior. Checkbox autosave itself is explicitly tested in `workspace-markdown-raw-ui-smoke.ts` and is intended.

## Debt candidates

| Category | Severity | Where | Proposal |
| --- | --- | --- | --- |
| tests | minor | `apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts` | Add real-persistence browser coverage for a guard held past the timer and in-flight responses, including revision conflict handling. |

Build needed to launch the isolated candidate passed after copying existing local dependencies. The first preparation build lacked nested runtime dependencies and failed on missing type declarations; after copying those existing local dependencies, the build passed. No broad gates or unrelated tests were run. The targeted functional blocker was sent immediately to the coordinator.
