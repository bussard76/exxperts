# Issue 20 — Developer report (in progress)

## Architecture impact

Level 3: ADR-0009 option A; chat-owned document session and portal in web UI, native lifecycle and placement in desktop, and existing HTML frame route. No new dependency, route, public package export, durable store, or unapproved architecture is authorized.

## Assumptions and evidence

The pinned independent round-2 review passes the frozen spec; its historical draft wording is superseded by the build dispatch. Tests exercise the real entrypoints and producer/consumer seams identified in the approved spec. Native Mac evidence remains a separate Controller-relayed task.

## Result and observable acceptance checklist

All items remain pending until supported by actual tests.

| Item | Required observable | Contract and evidence |
| --- | --- | --- |
| I1 | [ ] Detach moves the full room tree, tabs, previews and Markdown Edit/Preview/RAW into one second-monitor host; chat remains usable; empty/loading/denied workspace states are deterministic | C2/C3/C7; R1/R9/R11/R14; approved P plus strip draft |
| I2 | [ ] One window per chat owner/current room-conversation; no same-room owner collision or second editor/socket/save pipeline; repeated Show focuses verified host | C1/C3/C5; R2/R7 |
| I3 | [ ] Chat file references select/focus the current document host; correct room/path after Save; stale focus/context does nothing | C1/C4/C8; R2/R4 |
| I4 | [ ] Child ×/Return retains ordered tabs, active file, exact recoverable source/RAW/baseline/revision/conflict without saving/normalizing; tab × retains destructive guard | C2/C3/C4; R3/R8/R9 |
| I5 | [ ] Normal chat/native close guards before hide; room/conversation leave and real destructive callbacks guard then close dependent child before continuation; Cancel keeps both windows/context pre-commit | C4/C5; R3–R7/R15 |
| I6 | [ ] Save waits for latest confirmed frozen source; failures/permission/conflict/unknown writes retain draft; explicit Discard alone permits abandonment after sent-write reconciliation; Reload/Keep mine retained | C2/C4; R5/R6/R8/R9 |
| I7 | [ ] Offscreen/unplugged child recovers via room-labelled Show documents/Return in chat; Electron remembers validated child bounds in existing record, browser best effort; popup failure stays attached | C3/C5/C6; R1/R13/R14/R15 |
| I8 | [ ] Actual child Save/Find/Escape/tree/overlays/preview frame messages work once in correct host; real opened snapshots retained; sandbox/source/permission rules unchanged | C7/C8; R10/R11/R14 |
| I9 | [ ] Existing workspace-relative drag intent and click selection preserved; actual cross-window producer→composer tested per claimed environment; no clipboard/OS-open side effects | C8; R12/R14/R15 |
| I10 | [ ] Exact Q5=B limits disclosed; no forced-loss preservation, immediate orphan-shutdown or native/browser support inferred from source/prototype; final entrypoint evidence precedes claims | C4/C5; R15 and MAC-TASK; Q10 |

## Required scenario evidence

All scenarios are pending; R15 requires separately authorized packed Mac work.

| Scenario | Entry and conditions | Required observation |
| --- | --- | --- |
| R1 `detach-return-complete-host` | Actual WorkspaceFileBrowser → App/open tab/editor → Detach/window.open → child → Return; repeat empty/no tabs, loading, missing/denied workspace and blocked popup | One usable host, full tree/tab/active doc, strip correct room/empty/error state; failure/10s deadline keeps attached session and source; zero movement PUTs. |
| R2 `owner-context-host-fencing` | Two real chat pages in same room; repeated Detach/Show, chat link, leave/re-enter and same-room new conversation; delayed old focus/registration | One child per owner/current context; unique provenance; current link opens child; stale results cannot focus/rebind/reopen, focus refusal leaves Return usable. |
| R3 `guarded-chat-and-tab-close` | Dirty real child → actual main native close/×; separately actual tab ×; each Save/Discard/Cancel, plus child ×/Return | Matching Cancel reaches requester and keeps exact draft/windows/context; Save waits latest frozen write; explicit Discard alone abandons. Child-closed precedes hide/exit; tab close affects requested tab, child close returns session. Browser page.close is not native proof. |
| R4 `all-context-exit-entrypoints` | Dirty child → actual Home/other room, conversation open/resume/replace, archive/purge, memento, checkpoint/continue/rest, room-settings continuation paths in App inventory | Same C4 arbiter before context/server side effects, child-closed before continuation, one continuation; refusal stays old context; old async responses cannot reset new session; no automatic reopen. |
| R5 `refusal-and-deadline-roundtrip` | Real requester/guardian/native exchange with Cancel, failed PUT, permission loss, conflict, missing/malformed reply, 120s prepare/2s exchange deadlines under controlled timers | Exact refusal and abort-ack observed at actual requester; unknown never hides/closes/navigates; incomplete guard retains session and prevents shell side effects. |
| R6 `late-close-and-abort-evidence` | Real close flow with held/duplicate prepare/reply/commit, delayed allow/abort-ack/child-closed and changed owner/room/host/draft generation | No stale action or double prompt/save/continuation; missing abort ack reserves arbiter; missing child-closed withholds parent. If already gone, restore owner state without promising both windows open. |
| R7 `first-admitted-action-wins` | Simultaneous real Home/room exit, native main close, child ×/Return and Detach/replacement | One immutable target admitted; others busy; no overwritten callback or reuse of another action's allow; context changes invalidate old attempts, no child reopening during exit. |
| R8 `latest-save-and-unknown-write` | Actual editor keyboard/header/autosave/guard → PUT held during further typing/Return/close; server writes then response lost; delayed timer and explicit Discard | One save pipeline; confirmed latest source before destructive allow; stale response cannot clear new edit. Real GET reconciliation follows C2; still-expected revision stays unknown. Discard cannot undo/race sent write. |
| R9 `exact-source-conflict-transfer` | Actual Edit/Preview/RAW, invented CRLF/trailing whitespace/tasks/images/table source, clean/dirty/conflict/read-only → Detach/Return/native child ×; external edit | Byte-exact recoverable source/baseline/expectedRevision/mode/conflict retained; no normalization or new PUT due movement. Existing stale-revision refusal and Reload/Keep mine remain; failed restore retains one original writer. |
| R10 `actual-host-keyboard-overlays` | Child Save/Find/Escape, toolbar link prompt, search/tooltip/overlay/conflict prompt; owner visible/hidden/unfocused; Return and repeat | Events fire once in actual host document; guards surfaced/focused in chat, child conflict UI usable, no owner-realm instanceof failures or extra close/lost source. No new undo/selection/scroll guarantee. |
| R11 `child-frame-real-bytes-snapshot` | Actual child opaque frame opened first after detach; real frame-ready→listener→postMessage bytes; switch/reorder/Return; disk changes after open; repeated ready/foreign source/replaced frame/stall/navigation | Correct frame renders original retained bytes; one delivery per concrete authorized frame, no disk snapshot refetch due movement, no rearm after navigation, no bytes to direct frame URL/old/foreign source; visible timeout/error. Assert actual rendered content/byte count, not synthetic message receipt. Prove HTML retained content, real script execution, blocked external fetch and unchanged HTTP frame CSP after document.write; cover all preview types. |
| R12 `real-cross-window-path-drag` | Real child tree dragstart → real chat composer drop at caret/selection per claimed environment; click and tab reorder separately; stale context and foreign owner drag | Exactly one relative-path insertion via existing MIME and composer consumer, correct caret, no clipboard write/OS opener/file write/tab payload confusion. Helper-only and same-document synthetic DataTransfer are insufficient; record native OS drag provenance separately. |
| R13 `registered-child-bounds-recovery` | Actual Electron child reopened using existing state file with valid/corrupt/missing/unavailable record; scaled/negative/removed monitors; offscreen existing child Show/Return and denied focus; browser separately | Actual child receives outer DIP workarea-clamped visible bounds or defined fallback; main fields preserved both write directions; no content persistence. Chat Return without child access works; browser limits explicit. Pure geometry-unit tests supplement but do not establish adapter/child integration. |
| R14 `popup-policy-and-bootstrap` | Actual popup open/register/style/CSP failure/navigation and unknown/foreign/stale child acknowledgements; local/full-paired/read-only sessions, existing public policy routes and fake OS opener | Failed bootstrap leaves attached state; only exact registered child gets C5/geometry privilege; inherited security preserved. Read-only/policy unchanged; implicit/refused OS action calls fake opener zero times; mock/intercept all external destinations. |
| R15 `packed-mac-normal-entrypoints` | Separately authorized packed Mac run: actual traffic-light ×, main/child Cmd+W, Return, hide/minimize, Quit/Cmd+Q, updater-ready quit, normal reload; dirty/conflict/held-save and bounds/real cross-window drag | Trace native prevent before hide/server.stop/updater/reload; matching refusal/allow/abort/commit/closed ordering; exact draft/conflict and geometry preserved. Record final full candidateSHA, OS/app/package/entrypoint. DOM pagehide, browser page.close and existing smoke app.exit cannot prove it. Other platform claims need their own evidence. |

## Checks and self-review

Interim only: no acceptance item is complete, and the scenario tests must be rerun against the final candidate. The test names below describe the evidence so far and its limits.

| Item | Current test evidence and remaining gap |
| --- | --- |
| I1 | `workspace-markdown-images-ui` proves the attached tree/editor share one host; `workspace-detached-documents-ui` stops at disabled Detach, so real transfer, empty/error states and second-monitor behavior remain unproved. |
| I2 | `two-window-room-ui` covers independent attached owners; registered child uniqueness, Show and absence of duplicate child writers remain unproved. |
| I3 | `two-window-room-ui` exercises attached guarded file selection; child focus and stale-child results remain unproved. |
| I4 | `workspace-markdown-raw-ui` covers attached RAW/source behavior; child Return and native child close are unexecuted. |
| I5 | `workspace-file-tabs-ui` and `two-window-room-ui` cover attached guards; actual dependent-child and native entrypoints remain unexecuted. |
| I6 | `two-window-room-ui` exercises attached save/unknown/conflict guards; transfer and native-close combinations remain unexecuted. |
| I7 | `sidebar-reopen-ui` covers attached sidebar recovery/layout only; real child bounds, popup failure and registered native recovery remain unexecuted. |
| I8 | `sidebar-reopen-ui` covers an attached tooltip; child events, overlays and real snapshot transfers remain unexecuted; `workspace-file-tabs-ui` now passes the reviewed option B reconciliation and its retained security cases. |
| I9 | `workspace-markdown-images-ui` proves a real attached drag and rejects a synthetic replay; actual cross-window drag remains unexecuted. |
| I10 | `workspace-documents-native-ui` cannot launch with this host's sandbox configuration; packed Mac evidence and final candidate MAC-TASK remain outstanding. |

R1/R2/R3/R4/R7/R9/R10/R11/R12/R14 child portions are specified in `workspace-detached-documents-ui` but have not executed. R5/R6/R13 native adapter and fault tests require actual sandboxed shell endpoints; `workspace-documents-native-ui` is blocked before launch and does not prove them. R8 has attached `two-window-room-ui` and `workspace-markdown-raw-ui` evidence but not the full child/native scenarios. R15 requires the Controller-relayed packed Mac task on the final candidate. The historical privileged-parent Excalidraw red and previously unexecuted HTML counterexample are preserved and reconciled under the accepted and independently reviewed C7 option B; the affected `workspace-file-tabs-ui` run now passes.

## Files, tests, assumptions and debt

Interim inventory: the authored UI draft changes `apps/web-ui/src/App.tsx`, `docs-window.ts`, Markdown editor/sync/toolbar/search components, room settings/session components, workspace tree/tabs/preview components, frame entries, `in-room-chat.tsx`, and `styles/43-room-workspace.css`. The existing HTML preview response changes in `apps/web-server/src/room-settings-routes.ts`. The smoke changes and additions are `remember-job-dialog`, `sidebar-reopen-ui`, `two-window-room-ui`, `workspace-detached-documents-ui`, `workspace-documents-native-ui`, `workspace-file-preview`, `workspace-file-tabs-ui`, and `workspace-markdown-images-ui`; earlier checkpoints record which ran and which did not. The accepted spec, design, ADR and independent review documents came from the pinned signed source chain, not a prototype merge.

All workspace contents, rooms, fake model values and test endpoints are invented and isolated; no captures are committed. Open debt/blockers include the remaining child C7 snapshot and untrusted-frame evidence, absent sandbox-capable Electron evidence, incomplete native adapter/bounds and C4 deadlines, and every unexecuted child test. A final file/test inventory, final candidate SHA, full scope review and Controller-relayed Mac task are still required.

## Checkpoint: initial guarded-action admission

The existing attached editor now retains the first pending guarded action when another file selection arrives. `workspace-file-tabs-ui-smoke.ts` selects a second file through its real callback while the first dirty-file prompt is pending, then checks that discard executes the first selection; it failed on the unchanged app and passed after the change. This is only a small part of R7: correlated arbitration, save fencing, host and native lifecycle are still pending and Detach remains unavailable.

Checks: `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci`, `cd runtime && npm run build`, `npm run build --workspace apps/web-ui`, UI and scripts typechecks all passed; the attributed filtered `workspace-file-tabs-ui` gate passed 1/1 after its intentional red run. No native, Mac, drag or detached-host evidence is claimed. Files at this checkpoint: `App.tsx`, `workspace-file-tabs-ui-smoke.ts`, this report; no screenshots. Graph: no; the prescribed alternating graph assignment was not specified in the dispatch. No new dependency, manifest, lockfile, route or store was added.

## Checkpoint: canceled save continuation

A canceled guarded save now keeps its action reserved until the in-flight save settles and cannot run a later selection. The real `workspace-file-tabs-ui-smoke.ts` held-PUT regression failed before the fix and passed afterward; a first green attempt exposed interference with an existing byte-preservation fixture, so the test was moved to a separate invented file and the entire filtered smoke passed 1/1. This does not yet implement unknown-write reconciliation, complete C4 correlations, host transfer, or native safeguards.

## Checkpoint: initial unknown-write fence

The editor now checks the existing GET after a transport failure; if it observes the submitted content at a changed revision, it treats that write as confirmed without resending it. If the outcome remains unknown, subsequent PUT attempts and guard Discard are refused so the draft stays open. `workspace-file-tabs-ui-smoke.ts` exercises both paths through real PUT/GET routes and controlled response loss; both cases were red before their respective changes and the filtered smoke passed 1/1 afterward. This is partial R8: later reconciliation, conflict handling, outstanding in-flight writes, and the complete C2/C4 protocol still require implementation and tests.

## Checkpoint: discard waits for a sent write

A guarded Discard now waits for the existing in-flight editor save before it applies discard or executes the captured action. The real held-PUT `workspace-file-tabs-ui-smoke.ts` case failed on premature file switching before the change and passed afterward, including confirmation that the sent write reached the invented file; the affected filtered smoke passed 1/1. This covers one R8 ordering only, not complete reconciliation or the detached/native lifecycle.

## Checkpoint: competing revision after response loss

When reconciliation observes a different revision and different content, the existing editor conflict state now retains the local draft and exposes the competing content rather than retrying the write. The real-route `workspace-file-tabs-ui-smoke.ts` case failed before the change and passed afterward; the complete filtered smoke passed 1/1. Later reconciliation of a still-unknown outcome and full C2/C4 requirements remain pending.

## Checkpoint: later reconciliation

The editor retains the submitted content and revision after an inconclusive GET and can reconcile a later confirmed result without resending the original PUT. A fresh guarded Save is required to run its own continuation; the `workspace-file-tabs-ui-smoke.ts` case uses one controlled stale GET followed by the real current route and passed after an intentional red run, with the filtered smoke 1/1. Write timeout, permission revalidation, complete draft retention and C4/native action correlation remain pending.

## Checkpoint: discard after later confirmation

A fresh Discard now rechecks an unknown write before acting; it proceeds only after the submitted write is observed, and a changed competing revision refuses the current action and enters conflict. The controlled stale-read `workspace-file-tabs-ui-smoke.ts` case failed before the change and passed afterward; the complete filtered smoke passed 1/1 and verified that Discard neither resends nor undoes the sent write. Remaining C2/C4, host, native, geometry, platform and integration requirements are still open.

## Checkpoint: write deadline

The editor marks a PUT unknown after the 30-second wait without treating the underlying transport as finished. A fresh Discard cannot abandon or reconcile it until that transport reaches a terminal result. The controlled-timer and held real PUT case in `workspace-file-tabs-ui-smoke.ts` failed before the change and passed afterward, including zero GETs while the PUT remained open; the filtered smoke passed 1/1. This is only the write deadline, not the complete C4 prepare/abort/native deadlines or a detached-host test.

## Checkpoint: guarded editor fence

An admitted dirty action now fences rich input, RAW input, editor controls and autosave while its decision is pending, without blocking the guard's own Save. The real `workspace-file-tabs-ui-smoke.ts` input/autosave case failed before the fence; the RAW check separately failed with RAW deliberately unfenced; both pass with the change. The filtered `workspace-file-tabs-ui` and `workspace-markdown-raw-ui` smokes each passed 1/1. Host transfer, full context/action correlation and native lifecycle remain pending.

## Checkpoint: permission revalidation after response loss

A read-only result from the existing reconciliation GET now refuses the current guarded continuation while retaining the visible source. The controlled real-route permission-loss case in `workspace-file-tabs-ui-smoke.ts` failed before the change and the full filtered smoke passed 1/1 afterward. This is one permission path only; general action/policy revalidation and the remaining task requirements are not complete.

## Checkpoint: permission revalidation on a successful response

The existing PUT result now also refuses a guarded continuation when the returned file is read-only. The controlled real-route `workspace-file-tabs-ui-smoke.ts` case failed before the change and passed afterward with the entire filtered smoke 1/1. This does not prove all policy changes or complete the broader task.

## Checkpoint: retain newer RAW source after save confirmation

Confirming an older write now updates the saved baseline without overwriting newer editor source. The held real PUT and controlled read-only response case in `workspace-file-tabs-ui-smoke.ts` failed on the old code with the earlier source and passed with exact newer CRLF source after the change; `workspace-file-tabs-ui` and `workspace-markdown-raw-ui` passed 2/2. An initial assertion mistakenly expected LF normalization and was corrected to require the exact entered CRLF before the old-code red run. This is partial R8/R9, not detached-host evidence.

## Checkpoint: single guarded continuation

A synchronous decision lock now rejects repeated Save or Discard confirmation while the admitted action is settling. The real Home callback case in `workspace-file-tabs-ui-smoke.ts` produced two prepared-boundary requests before the change and one afterward; the full filtered smoke passed 1/1. This establishes only that tested duplicate path, not the complete correlated arbiter or dependent child shutdown.

## Checkpoint: reserve the action through its continuation

The admitted guard now stays reserved until the captured asynchronous continuation settles; the existing callback effects are retained, and checkpoint continuation returns its existing promise to that guard. The real held Home leave in `workspace-file-tabs-ui-smoke.ts` issued two requests before the change and one afterward, with the filtered smoke passing 1/1. The room-settings Memento nested continuation and full context/native correlation remain open and are not claimed by this case.

## Checkpoint: room-settings Memento guard

The dirty-file dialog now sits above Room settings, and the room-settings Memento keeps its existing request and exit inside the admitted action until completion. The real `workspace-file-tabs-ui-smoke.ts` flow first failed because settings intercepted the guard, then failed because Home could run while the held Memento request was pending; it passed after both changes. The filtered file-tabs and `settings-look-ui` smokes each passed 1/1. This covers that callback in the attached UI, not dependent child shutdown or native behavior.

## Checkpoint: guard decision deadline

The attached dirty-action guard now expires after the specified 120-second decision window without executing its continuation; a save already settling remains fenced until settlement. The controlled-timer `workspace-file-tabs-ui-smoke.ts` case failed before the timer existed and passed afterward with the filtered smoke 1/1. This does not establish the native exchange, abort acknowledgement or child-closure deadlines.

The decision-deadline regression now also holds a real PUT past expiry, checks that a competing file selection is refused, and verifies the late response cannot execute the expired action. The full filtered `workspace-file-tabs-ui` smoke passed 1/1 with this additional case; native abort acknowledgement remains untested and unimplemented.

## Checkpoint: clean Memento admission

A clean topbar Memento now reserves the document action through its existing callback, and file selection and tab close respect an outstanding action even when a preview is selected. The real held Memento case in `workspace-file-tabs-ui-smoke.ts` opened a competing file before the change and withheld it afterward; the filtered smoke passed 1/1. Other clean context actions and full correlated identity/host/native arbitration remain pending.

## Checkpoint: clean Home admission

A clean Home action now retains the document reservation until its existing leave callback settles and preserves its return value for callers. The held real leave in `workspace-file-tabs-ui-smoke.ts` admitted a competing file before the change and blocked it afterward; the filtered smoke passed 1/1. Other clean exits, context identity and dependent child/native arbitration remain pending.

## Checkpoint: clean Room settings Memento

A clean Room settings Memento now retains the document reservation through the component's existing confirmation and request. The controlled real-request `workspace-file-tabs-ui-smoke.ts` case selected a competing file before the change and withheld it afterward; the file-tabs and settings smokes passed 2/2. Other clean exits and the complete host/native contract remain pending.

## Checkpoint: clean Archive admission

An Archive action for the current room now holds the clean document reservation through its existing callback and returns its existing result. The invented-room `workspace-file-tabs-ui-smoke.ts` case observed two held Archive requests before the change and one afterward; the filtered smoke passed 1/1. Archive of another room is not reclassified as a current-context exit, and Purge and the remaining clean actions still need their own checks.

## Checkpoint: clean Purge admission

A Purge action for the current room now holds the clean document reservation through its existing callback. The invented-room `workspace-file-tabs-ui-smoke.ts` case entered another room during a held Purge before the change and withheld entry afterward; the test also observed successful completion after release, and the filtered smoke passed 1/1. Purge of another room remains its existing operation; this does not establish child closure or the remaining clean callbacks.

## Checkpoint: guarded history continuation

A guarded Home leave now returns its eventual result to the actual history callback, so Discard continues to the original room destination and Cancel retains the current room, address and draft. The browser-history `workspace-file-tabs-ui-smoke.ts` case failed by stopping at Home before the change and passed afterward; the filtered smoke passed 1/1. The Cypress test setup was also synchronized with its room transition after a selector race. Other route entrypoints and full context generations remain pending.

The guarded history regression also issues a competing Forward while the first Back is pending and confirms the first requested room still opens. The filtered file-tabs smoke passed 1/1; this does not establish native or detached action correlation.

## Blocker: checkpoint approval and the existing leave behavior

The current work is incomplete and Detach remains unavailable. The clean checkpoint-approval experiment adds a reservation around the existing `approveCheckpointProposal` callback and a new held-approval case in `remember-job-dialog-smoke.ts`. The unchanged earlier case in that same smoke holds a filling checkpoint approval, uses browser Back, and requires entering another room before releasing the approval; with the reservation it timed out at the actual Other Room entry (`remember-job-dialog-smoke.ts:382`, filtered gate 0/1). This is a behavioral conflict, not a load timeout: the guard deliberately holds the action until the approval request settles.

Round-2 instruction 1 says a room operation that does not change context retains its existing effect, while C4/R7 require first-admitted action arbitration and the build instructions prohibit weakening an existing test. Checkpoint approval may either bind a new conversation or leave the current context unchanged depending on its result; the existing held-approval test specifically exercises the latter and requires the user to leave while it is pending. The new held-approval assertion expects competing file selection to remain blocked, and may therefore be too broad. Controller must decide how the accepted contract applies to this existing non-leaving callback and whether the new uncommitted-at-discovery assertion should be corrected; do not treat either test or the architecture as silently waived.

Last green checkpoint before this experiment: `7dc68420f7a439007fd8ab749ff3db53500ea37e`, with targeted file-tabs, RAW and settings smokes and normal typecheck hooks passing as recorded above. The checkpoint experiment and this blocker record are committed as WIP solely to preserve progress, not as a green candidate. No detached host, native adapter, geometry or Mac evidence exists; I1–I10 and R1–R15 remain pending. Graph: no; seven tool calls preceded the first edited file, and without a graph it made no difference to this work. Screenshots: none; no additional checkout or lock/manifest change was made.

## Checkpoint: Controller resolution of approval reservation

Controller reply `msg_6077f66b84d3` resolved the preceding blocker: approval is a non-leaving request until its actual result requires a local bind or park. The blanket reservation was removed and only the new WIP assertion was corrected; the unchanged filling-approval/Back/Other Room case remains intact. A result-dependent continuation captures the result without reposting, reserves the actual bind or park, and checks a context incarnation across its awaits, including leaving and re-entering the same conversation IDs. `remember-job-dialog-smoke.ts` verifies the held non-leaving request permits file selection, a newly dirty file is guarded before binding, a held real fresh-thread fetch retains the admitted reservation, the request is sent once, and a delayed approval cannot act on a re-entered incarnation. Both new fencing assertions were separately verified by temporarily removing their corresponding protection: each failed at its intended assertion, after which the implementation was restored. The filtered remember suite passed with the protections restored; the earlier blanket-reservation failure and both intentional mutation failures are test-development results, not load debt.

This is partial attached-context fencing only: full C1/C4 correlation, retained document session, detached host, native lifecycle, bounds, integration and I1–I10/R1–R15 evidence remain open. No platform support is claimed.

Verification after this correction: `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts` passed. The attributed `GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate bash -c 'npm run smokes -- --jobs 1 remember-job-dialog workspace-file-tabs-ui workspace-markdown-raw-ui settings-look-ui'` discovered and passed all four named `*-smoke.ts` entrypoints (4/4, 197 seconds); no environment reruns were needed. The UI-only Vite build also passed to supply browser assets. These checks do not replace the required later full gate or native evidence.

## Checkpoint: Remember Return Home admission

The clean Return Home action after a saved Remember now keeps its existing action reserved until the prepared-conversation retirement settles. A real held `discard-empty-prepared-boundary` request in `remember-job-dialog-smoke.ts` selected a second file before the change and withheld it afterward, with one request; the unmodified success continuation still reached Home. The attributed filtered `remember-job-dialog` smoke failed at that assertion before the change and passed 1/1 afterward, and the UI-only build passed. This covers that attached callback only; the detached and native contract remains open.

## Checkpoint: exact loaded baseline and a clean pending write

The editor now initializes its baseline from the exact loaded source rather than the rich editor's serialized text; a diagnostic on invented `clean-pending.md` showed that the latter had added two trailing newlines. In `workspace-file-tabs-ui-smoke.ts`, a held real PUT followed by reverting RAW to the original source first exposed the baseline mismatch and then, after that correction, showed that a clean dirty flag allowed a file switch during the pending write. The guard now joins the existing save pipeline before continuing a clean action; the test verifies the file stays selected, the reverted source is written as the latest source, and the switch then completes. The attributed filtered file-tabs and RAW smokes passed 2/2, and the UI-only build passed. The early diagnostic test runs failed due to the baseline mismatch before the intended pending-write assertion; temporary logging was removed. Clean unknown-write reconciliation is guarded in this partial implementation but still needs a targeted clean-flag regression; detached/native C1–C8 and I1–I10/R1–R15 remain open.

## Checkpoint: clean unknown-write reconciliation

The real lost-response case in `workspace-file-tabs-ui-smoke.ts` now also reverts RAW to the original source before the first PUT's response is lost. Two deliberately stale GETs leave the outcome unknown and withhold the clean file switch; a later real GET confirms the original write, then the newer reverted source is saved before switching. The first implementation failed that latter step with a revision conflict: the confirmed revision had reached React state but not the live editor handle before its next save. The handle now receives the confirmed revision synchronously with the confirmed baseline. The attributed file-tabs and RAW smokes passed 2/2 and the UI-only build passed. An initial hypothesis that a too-early test click caused the failure was disproved by request/status diagnostics; those temporary diagnostics were removed. This is partial C2 evidence only, not a detached or native pass.

The first commit attempt correctly failed the normal typecheck hook because the existing Keep mine call also needed the confirmed revision argument; the call was corrected, with no hook bypass. Affected browser checks and typechecks were rerun after that correction.

The first standalone rerun then exposed TypeScript narrowing of the test's asynchronously updated request counter; the assertion was adjusted to read it as a number and typechecks restarted.

## Checkpoint: first admitted room entry

A held real initial conversation PUT in `workspace-file-tabs-ui-smoke.ts` showed that clicking a second invented room could replace the first entry before it finished. The clean new-room entry now reserves the existing action until its original callback settles; the second entry starts no conversation save, and the first room opens after release. The new case failed on the competing request before the change, and the attributed file-tabs and Remember smokes passed 2/2 with the fix. Resume uses a separate callback and remains to be tested independently. This is attached owner arbitration only, not the detached host/native contract.

## Checkpoint: first admitted room resume

`workspace-file-tabs-ui-smoke.ts` seeds an invented standby thread via the existing test server, holds the real resume GET, and attempts entry to another invented room. Without the reservation, the competing room issued its conversation save and replaced the pending resume; with the existing action guard around the resume callback, it issues no competing save and the original room resumes after release. The attributed filtered file-tabs smoke passed 1/1 and the UI-only build passed. This covers only the attached callback; complete C1/C4 correlation and all detached/native work remain pending.

## Checkpoint: product navigation during admitted entry

The landing-page Wallet and Memory callbacks now consult the existing action guard before changing screen. The real pending-entry case in `workspace-file-tabs-ui-smoke.ts` observed Wallet replacing the screen before the change; after it, both Wallet and Memory are withheld while the original room save is held and that original room completes. The attributed filtered file-tabs smoke passed 1/1 and the UI-only build passed. Browser history while an entry is pending and the broader C1/C4/native contract remain open.

## Checkpoint: history during admitted entry

The existing history route handler now refuses a competing Back or Forward while a document action is reserved, allowing the established history reconciliation to restore the shown address. `workspace-file-tabs-ui-smoke.ts` builds a real Memory-to-Rooms history entry, holds an invented room's first PUT, and observed Back navigating to Memory before the change; afterward it keeps the landing screen and address, then finishes the first room entry. The pre-existing dirty-document history cases still pass. The attributed file-tabs and Remember smokes passed 2/2 and the UI-only build passed. This remains attached action arbitration; full correlated owner/child/native behavior remains pending.

## Checkpoint: clean external source remains exact

An external update of a clean Markdown file now remains the editor's exact source until a real rich edit. The `workspace-file-tabs-ui-smoke.ts` case updates an invented file to CRLF source through the existing poll and presses the real Save shortcut: before the change it sent a PUT and normalized the file; afterward it sends none and the bytes remain exact. The attributed file-tabs and RAW smokes passed 2/2 and the UI-only build passed. This proves an attached source-retention case, not transfer or native behavior.

## Checkpoint: exact discarded baseline

Discard now retains the exact baseline as the clean source if a later confirmation cancels the intended exit. In `workspace-file-tabs-ui-smoke.ts`, a real Forget action is canceled after Discard of an invented CRLF file; the subsequent Save shortcut sent a normalizing PUT before the change and sends none afterward, preserving the exact file bytes. An initial LF-only check passed without exposing the defect; the independent CRLF case was added without changing the existing Forget assertions. The attributed file-tabs and RAW smokes passed 2/2 and the UI-only build passed. This is attached editor evidence only.

## Checkpoint: moved-room Reload admission

Reload after another window moves a room now admits the existing action before reading room status, verifies that the original context is still current after the read, and retains the same reservation through the actual room-open callback. In the real `two-window-room-ui-smoke.ts` flow, holding that status GET previously let Home replace the pending Reload; afterward Home is withheld and Reload completes in the original room. The attributed two-window and file-tabs smokes passed 2/2 and the UI-only build passed. Dirty-document Reload at this entry still needs a focused check; this does not establish detached or native closure.

The moved-room case now also opens an invented Markdown file, dirties it and invokes the real Reload callback. `two-window-room-ui-smoke.ts` verifies that the unsaved prompt precedes the status read, Cancel retains the draft and old context, and a later explicit Discard continues the original Reload. Temporarily restoring the pre-fix callback caused the new ordering assertion to fail; the committed implementation was restored and the attributed filtered two-window smoke passed 1/1, with the UI-only build passing. No detached or native path is claimed.

## Checkpoint: clean-looking draft on lost-write conflict

When a PUT response is lost and the first reconciliation GET sees a competing revision, the editor now marks the local source dirty synchronously before staging the external version. The real `workspace-file-tabs-ui-smoke.ts` case sends one write, reverts RAW to the original source while the answer is held, changes the invented file externally, then loses the answer. It observed the local source being replaced before the change; afterward the local source remains, the conflict is explicit and a switch needs Discard. The attributed file-tabs and RAW smokes passed 2/2 and the UI-only build passed. The corresponding later-reconciliation and direct-409 paths still need separate checks; full C2/C4 and detached/native acceptance remain open.

## Checkpoint: later conflicting reconciliation

The separate settle path now also marks the local source dirty before staging a competing external version. `workspace-file-tabs-ui-smoke.ts` holds and loses a real write response, returns the original revision once, then exposes a competing revision on the later GET. It failed by replacing the clean-looking local source before the change; afterward it preserves that source, reports conflict, and requires explicit Discard to switch. The attributed file-tabs and RAW smokes passed 2/2 and the UI-only build passed. The direct HTTP 409 with a reverted source remains to be checked separately.

## Checkpoint: direct revision conflict with reverted source

A direct HTTP 409 now marks the retained local source as needing an explicit decision even if it had been reverted to the old baseline while the PUT was pending. `workspace-file-tabs-ui-smoke.ts` holds the real PUT, reverts RAW, changes the invented file and releases the request; before the change a tab switch abandoned the conflict without a prompt, while afterward it prompts and preserves the source. The attributed file-tabs and RAW smokes passed 2/2 and the UI-only build passed. Other C2/C4, detached, native and platform requirements remain open.

## Checkpoint: browser close warning

The browser page now uses the existing beforeunload warning pattern when a Markdown draft is dirty or its write remains unresolved. `workspace-file-tabs-ui-smoke.ts` creates an invented room, edits a file, invokes Chromium's real browser close with beforeunload enabled and chooses Stay; before the change no prompt appeared, and afterward the prompt appears and the draft remains. The attributed file-tabs and RAW smokes passed 2/2 and the UI-only build passed. This is best-effort browser evidence only: browser close/reload can bypass the async guard under Q5=B, and native close/quit/reload prevention and the registered-child unload fence are still unimplemented.

The browser-close test now also exercises an unresolved write after the visible source was reverted to its original value. With the pending-write part of the warning temporarily removed, the real browser close did not ask; with it restored, Stay retains the source and the existing test continues through later real reconciliation. The attributed filtered file-tabs smoke passed 1/1 and the UI-only build passed. This remains best-effort Chromium evidence under the exact Q5=B browser exception, not native close evidence.

## Checkpoint: independent attached owners

`two-window-room-ui-smoke.ts` now opens the same invented Markdown file in two real chat pages, holds owner A's PUT, saves a competing draft from owner B, and releases A's actual request. The existing revision route returns conflict, owner A keeps its own draft, and owner B's file remains saved; the attributed filtered two-window smoke passed 1/1. This is real attached two-owner revision evidence only: no detached child or per-owner host identity has been implemented or proven.

## Checkpoint: pending write through the real Home exit

The existing `two-window-room-ui-smoke.ts` now holds a real PUT, reverts RAW to its original source, and invokes the actual Home callback. Temporarily removing the pending-write join made Home leave early; with it restored, Home waits, the latest reverted source is confirmed through the existing pipeline, and then the room closes. The attributed filtered two-window smoke passed 1/1 and the UI-only build passed. This is attached exit evidence and does not establish child closure or native behavior.

The affected `workspace-markdown-images-ui-smoke.ts` entrypoint, including its existing Keep mine scenarios, passed 1/1 through the attributed filtered gate after the editor changes. This is attached browser coverage, not transfer or native evidence.

## Checkpoint: Keep mine after a lost-response conflict

The real `two-window-room-ui-smoke.ts` flow now covers explicit Keep mine after a lost write response and a competing revision, with the local RAW source reverted to its original value. It verifies the retained source is written over the confirmed competitor only after that choice, with exactly the original PUT and the chosen replacement PUT; the attributed filtered two-window smoke passed 1/1. This complements the earlier Discard and Reload coverage and is attached-editor evidence only.

## Checkpoint: first detached-host test (red)

Added `workspace-detached-documents-ui-smoke.ts` with an invented room/workspace and the real browser entrypoints for a clean RAW document, Detach, child tree/tab/source presentation, Return and zero movement PUTs. The attributed filtered smoke is intentionally red at the unavailable Detach control; no child, host transfer or I1/R1 pass is claimed. The initial test incorrectly compared Chromium's LF textarea presentation directly to CRLF file bytes; it now checks those separately. A later real-entry case must still prove byte-exact unsaved CRLF transfer, all preview snapshots, empty/denied/bootstrap behavior, context fencing and native lifecycle. Detach remains unavailable until the complete safeguards work together.

## Checkpoint: attached document portal foundation

The existing document pane now renders into one stable element owned by the chat App while remaining attached; the workspace tree is still in the sidebar and no Detach control is exposed. The first targeted run found that folding hid the wrapper but did not preserve the pane's own computed display state; the CSS was corrected without changing the test. UI/scripts typechecks passed; the initial attributed run passed two-window and RAW but failed that folded-pane check, and the corrected file-tabs and Markdown image/Keep mine smokes passed 2/2. This is structural preparation only: the new detached-host smoke remains red, and tree transfer, snapshots, context/host correlation, native safeguards and geometry are not implemented.

## Checkpoint: invalidate stale admitted actions

Prompted actions now capture the current context generation, and both prompted and clean admission paths check that generation, owner lifetime and page-person validity before running their continuation. In `two-window-room-ui-smoke.ts`, a dirty Home save is held at the real PUT while a controlled `person_changed` response ends the page; the browser's Stay choice keeps that page alive. Before the change, the late successful save still executed Home and changed the address; afterward it cannot. The attributed two-window and file-tabs smokes passed 2/2, UI/scripts typechecks passed and the UI-only build passed. The clean path's separate invalidation case, full C1/C4 stamps, abort acknowledgements, dependent-child closure and native adapter remain open; the detached smoke remains red.

The clean admission path now has its own controlled invalidation test in `two-window-room-ui-smoke.ts`: an unsaved settings edit keeps the real invalidated page alive, then a previously captured Home button receives a stale event. Removing the clean-path person check made the address change; with the check restored, it stays in the old room. The UI-only build and attributed filtered two-window smoke passed 1/1. This uses a controlled stale event and does not establish child or native lifecycle evidence.

## Checkpoint: synchronous editor fence

The editor now fences rich input, RAW input and scheduled autosave synchronously when an attached action is admitted, before the React render that disables controls. `workspace-file-tabs-ui-smoke.ts` dispatches a controlled RAW input in the same turn as the real file-selection callback; it changed the admitted draft before the fix and is rejected after it. UI and scripts typechecks, the UI-only build, and the attributed two-window and file-tabs smokes passed (2/2). The test proves the RAW same-turn case; complete draft-generation stamping, transfer, native safeguards and their acceptance tests remain open.

A second same-turn case now checks the real formatting toolbar: a controlled Heading 2 click immediately after selecting another file changed the admitted rich draft before the fix. Editor click capture now blocks that queued command while fenced. UI and scripts typechecks, the UI-only build and the attributed file-tabs smoke passed (1/1). This does not substitute for full draft stamps or child-host event evidence.

## Checkpoint: guard an in-flight Keep mine

The editor now includes the existing conflict-resolution write in its pending-write, Save and Discard coordination; ordinary save requests wait for that write before using its resulting revision. In `two-window-room-ui-smoke.ts`, the real Keep mine PUT is held while Discard is requested: before the change the selected file changed immediately, and afterward it remains until that write settles. The original lost-response/Keep mine assertions remain intact in a separate scenario. UI and scripts typechecks and the UI-only build passed; the attributed two-window and Markdown-images smokes passed 2/2, followed by the final two-window smoke 1/1 after separating the test cases. This covers the tested conflict-write ordering only; full C2/C4 correlation, host transfer and native safeguards remain open.

## Checkpoint: latest Save after Keep mine

A guarded Save that joins successful Keep mine now uses that confirmed resolution immediately, even if the surface has not yet rendered the cleared conflict flag; its subsequent PUT still uses revision checking. The real Home case in `two-window-room-ui-smoke.ts` holds Keep mine, edits RAW again, selects Save and verifies Home waits for two ordered writes and the latest disk source. Before the fix, the guard refused the joined Save and a later autosave wrote the source without continuing Home. UI and scripts typechecks, the UI-only build, and the attributed two-window and Markdown-images smokes passed 2/2. This is attached-editor evidence; a newly competing revision during the second write still needs a dedicated real-route check, and the full C2/C4 and detached/native requirements remain pending.

The `two-window-room-ui-smoke.ts` Home Save scenario now also changes the invented file immediately before the follow-up PUT after Keep mine. The existing revision route returns a real 409, Home remains in the room, and the exact latest local source remains visible while the competing file stays on disk. An initial assertion observed the earlier conflict before the new response; the test now explicitly waits for the new 409. The scripts typecheck and attributed filtered two-window smoke passed 1/1. This is one real-route conflict case, not full C4 or detached/native evidence.

## Checkpoint: bounded Keep mine revision read

The conflict-resolution revision read now has a 30-second abort deadline; after that read is canceled, its late result cannot initiate a PUT. `two-window-room-ui-smoke.ts` holds the real read with an accelerated timer, requests Home Save, and verifies the guard refuses, retains the draft and sends no later write after the read is released. Before the change the guard remained open past the deadline. UI and scripts typechecks, the UI-only build, and the attributed two-window and Markdown-images smokes passed 2/2. This covers a local read timeout only; the correlated native exchange and its abort acknowledgement remain unimplemented.

## Checkpoint: bounded unknown-write reconciliation

The existing unknown-write reconciliation reads now use the same 30-second abort deadline as the conflict revision read. `two-window-room-ui-smoke.ts` aborts a real PUT transport, holds the ensuing reconciliation GET and accelerates the deadline; before the change the Home Save guard stayed open, and afterward it refuses Home, retains the exact local draft and unknown outcome, and sends no late retry when the held read is released. UI and scripts typechecks, the UI-only build and the attributed two-window, file-tabs and Markdown-images smokes passed 3/3. Other C2/C4 correlations, detached-host and native lifecycle requirements remain open.

The two-window smoke now separately holds the reconciliation GET used by Discard after an unknown write. Removing that path's deadline kept its guard open past the accelerated limit; with the deadline restored, Discard refuses, retains the draft and unknown outcome, and a late read starts no retry. UI and scripts typechecks, the UI-only build and the attributed filtered two-window smoke passed 1/1. This is local editor evidence, not a native abort acknowledgement.

## Blocker: frozen identity allocation on supported paired HTTP

C1 requires `crypto.randomUUID()` both for each mounted owner and each admitted request (`design/t20-detach-window/contracts.md`, C1). The existing supported remote mode explicitly serves plain HTTP on a private-tunnel address (`SECURITY.md`, Remote mode, operational notes); R14 requires popup/bootstrap coverage for full-paired and read-only sessions. In an attributed, isolated Chromium check, an intercepted invented `http://192.0.2.10/` page reported `{"secure":false,"uuid":"undefined","random":"function"}` for `isSecureContext`, `typeof crypto.randomUUID`, and `typeof crypto.getRandomValues`. The route was fulfilled locally in Playwright, with no external request or real paired data; this establishes the browser primitive on an insecure origin, not an end-to-end paired or platform support claim.

The exact C1 producer cannot allocate either required ID on that supported browser origin. Failing the whole app or withholding the paired popup would leave the accepted paired scenario unmet; using an existing secure random primitive to generate UUIDv4 values would change the frozen C1 allocation detail, which the contract says requires reconciled spec/conformance review. A secure HTTPS origin would require a separate supported transport decision beyond this task. Controller must reconcile the identity requirement and paired-origin support before this worker can implement C1 as specified. The owner/session identity, full C2/C4 arbiter, host/snapshot transfer, native adapter, geometry, integration, targeted acceptance tests and Mac evidence remain incomplete; Detach remains unavailable and this is not a candidate for Tester or conformance.

At this stop, the last product/test checkpoint was `35012df2aa7ddab87aaaf213abbf0cb9023071e0` on `agents/t20-harden`. The latest attributed targeted runs passed UI and scripts typechecks; two-window, file-tabs and Markdown-images browser smokes passed 3/3 after the reconciliation change, and the separately extended two-window smoke passed 1/1. The intentionally red detached-host smoke remains unresolved. No screenshots or binary captures were produced. No full build, full smoke suite, full gate, native or Mac evidence is claimed.


## C1 compatibility review received

Controller supplied the independent compatibility pass at `3fb92d54a6cb103244a591b2b0f33cf126dac388`, whose parent is the blocked checkpoint `9145edf59f79281f658192eb23ad0e2d27aa2b13`. Its four binding instructions authorize the owner-realm secure-random UUIDv4 fallback on insecure origins, require fail-closed allocation and real App consumer tests, and retain all C2–C8, native producer and paired-flow requirements. The report chain was fetched, ancestry verified and fast-forward merged. The prior identity allocation blocker is resolved at the specification level; implementation and all unfinished acceptance items remain pending.

## Checkpoint: initial C1 allocation and guarded actions

App mounts now allocate an owner UUIDv4 privately; existing guarded editor actions allocate a fresh request ID before admission and retain that ID while the action settles. The reviewed owner-realm `randomUUID`/16-byte `getRandomValues` choice fails closed on a missing, throwing or malformed primitive; native C5 producers are untouched. The existing guard is still only a partial arbiter: complete Context/Stamp/Correlation fields, every producer, host generations, abort acknowledgements and child-closure evidence remain unimplemented, and Detach stays unavailable.

`two-window-room-ui-smoke.ts` drives actual App room and file callbacks on localhost and on an intercepted invented insecure HTTP origin routed only to the local test server; the latter deliberately closes its WebSocket and is not paired-device evidence. It observes secure UUIDv4 calls, fresh IDs for repeated actions, 16 actual cryptographic bytes and version/variant masks on the fallback, action refusal with retained drafts when primitives throw or are absent, no fallback after a throwing/malformed `randomUUID`, and refusal when owner allocation fails. The initial insecure run failed at the missing fallback before its implementation. An initial secure instrumentation attempt had not installed its wrapper in the page realm and was corrected; it is not counted as a valid red run. The inactive-tab case confirms that closing it uses one request without prompting over the active dirty draft. UI and scripts typechecks, the UI-only build and the attributed two-window and file-tabs smokes passed 2/2. The actual fallback UUID value still needs observation through the approved owner/child consumer when that host exists, and full paired/read-only R14 and all native evidence remain pending.

The secure App case now also makes `randomUUID` throw before a clean file-selection gesture. Temporarily bypassing ID allocation for clean selections made the real selection change; with the guard restored, the selected file remains and no fallback or child action occurs. UI and scripts typechecks, the UI-only build and the attributed two-window smoke passed 1/1. This is still partial C1: full stamped correlations and actual child consumer evidence remain open.

## Checkpoint: malformed fallback result

The private allocator now rejects a `getRandomValues` result that is not the exact 16-byte view supplied to it. In the real insecure-origin App flow, a controlled malformed primitive previously produced a truthy invalid ID and opened the Home guard; after the fix it refuses the action and retains the draft. UI and scripts typechecks, the UI-only build and the attributed two-window smoke passed 1/1. One exploratory run failed before this assertion when the RAW editor disappeared in the intercepted-origin/WebSocket-fault harness; the isolated rerun reached the intended red assertion and the fixed run passed, but the cause was not established and remains a test-debt candidate. The test does not establish real paired-device support or full C1/C4 completion.

The secure real-App test now opens a second owner and checks that it receives a distinct UUID. It also delivers a competing file action while the first dirty guard is active and cryptography is set to throw; the original guard and input fence remain in place. Scripts typecheck and the attributed two-window smoke passed 1/1. This supplements, but does not replace, the future complete correlation and child-host tests.

## Checkpoint: owner and room context binding

Pending guarded actions now retain their request ID with the owner ID/generation and, when selected, the room, conversation and room generation; their continuations reject a changed owner, context, page person or pending admission. The no-room case also captures its generation, owner disposal invalidates its generation, and invalid/overflowed generations do not become valid again. Synchronous tab actions validate a current admission without introducing a child shutdown. UI and scripts typechecks, the UI-only build, and the attributed two-window and file-tabs smokes passed 2/2; these include actual stale-person, competing-action, owner-remount and file/tab flows. They do not independently prove every generation transition. Draft/host generations, complete C1 stamp and C4 action/result/abort/closed protocol, retained snapshots, child transfer and native behavior remain unimplemented.

## Checkpoint: unrelated navigation without a document session

When owner cryptography fails and no document session or pending guard exists, the existing Rooms, Memory and Wallet navigation remains usable without granting a document action or child authority. `two-window-room-ui-smoke.ts` first verifies that room entry is refused, then exercises Memory and Wallet and returns to Rooms. With the no-session distinction temporarily removed, the Memory entry timed out; with it restored, the attributed two-window smoke passed 1/1, and the earlier combined two-window/file-tabs run passed 2/2. The original Home cleanup remains in place. The intercepted insecure-origin test now holds its unrelated WebSocket without server messages to avoid reconnect churn; it still uses the real App and local HTTP endpoints and is not paired-device or WebSocket evidence. Two runs with that harness passed, but the earlier intermittent editor-loss cause was not proven. When a child/retained host exists, the no-session check must also account for it; host and native work remain open.

## Checkpoint: initial draft-generation tracking

The App owner now retains a per-context draft generation and captures it at guarded admission. Editor source, baseline/revision, mode, dirty/conflict/permission/error and write-state changes notify the owner synchronously; notifications from an old room generation are ignored, and the editor is keyed to its context incarnation. Tracked state setters avoid advancing for unchanged values, including unchanged polling results. UI and scripts typechecks and the UI-only build passed. The attributed two-window, file-tabs, Markdown-images and RAW smokes passed 4/4 before a small baseline-notification adjustment; after that adjustment, the two-window/images/RAW smokes passed 3/3 and file-tabs passed separately 1/1. The existing public tests verify editor behavior, not the counter value itself: a final prepared stamp, host generation, direct stale-stamp/unchanged-poll evidence at the real owner/native consumer, complete retained session snapshots and the C4 protocol remain open. This checkpoint does not complete C1 or C2.

## Checkpoint: local prepared generation

The attached guard now captures the initial host/draft generations, creates one local prepared record only after the current save or discard work settles, and revalidates owner, context, host and the prepared draft generation before invoking its captured callback. A repeat preparation cannot replace a previously published local record. In the real `two-window-room-ui-smoke.ts` held Keep mine/Home Save case, a targeted fault that incorrectly required the initial draft generation after settlement withheld Home; restoring final-generation recapture saved the latest source and continued. UI and scripts typechecks and the UI-only build passed; the attributed two-window, file-tabs, Markdown-images and RAW smokes passed 4/4 before the idempotence guard, and the final targeted two-window smoke passed 1/1 afterward. An earlier broad fault-injection run stopped at an earlier Reload assertion and is not counted as proof of the targeted case. The local record is not the complete C4 wire correlation: actual duplicate/late messages, abort acknowledgements, child closure, real host-generation changes and native endpoints remain unimplemented and unproven.

The test-first `workspace-detached-documents-ui-smoke.ts` now also checks that a blocked popup retains the attached source without a PUT, then edits RAW in the actual child, cancels a Home guard in chat, and requires both the child draft and its later Return to remain intact without a movement PUT. The child-draft case holds the ordinary one-second autosave deadline during movement so it does not count scheduled autosave as a transfer write. Scripts typecheck passed. These new assertions have not executed: the same smoke remains intentionally red at the unavailable Detach control until the required host and safety work is integrated, so they are not evidence of child behavior.

## Checkpoint: permission changes without a content revision

The Markdown polling consumer now applies a changed `readOnly` value even when the content revision is unchanged; an unchanged response remains a no-op. `two-window-room-ui-smoke.ts` uses the real editor and local GET endpoint with a controlled response permission change and accelerated polling. Before the fix it timed out at the intended editable-state assertion; afterward it retained the invented dirty source, sent no PUT, refused Home Save while read-only, and became editable when permission returned. UI and scripts typechecks and the UI-only build passed. The attributed filtered two-window, file-tabs and RAW smokes passed 3/3, and the extended two-window case passed again 1/1. This is attached-editor fault-injection evidence, not a native or paired-policy claim; complete session retention, host transfer, C4 protocol and native safeguards remain open.

Keep mine now also observes `readOnly` on its own latest-revision read before issuing a write. The real conflict/Keep mine path in `two-window-room-ui-smoke.ts` supplies a controlled read-only response from the local GET, and checks that the conflict and local source remain and no replacement PUT is issued. It failed at the intended permission assertion before the fix; UI and scripts typechecks, the UI-only build and the attributed two-window and Markdown-images smokes passed 2/2 afterward. This is one attached conflict path, not complete policy or detached evidence.

Unknown-write reconciliation now likewise applies the permission returned by its GET even when that GET reports the original revision. The new real-editor case aborts an invented PUT, returns that unchanged revision with controlled read-only permission, and verifies that the draft remains, Discard finishes without leaving, and no retry occurs. Before the fix it failed at the intended permission assertion; UI and scripts typechecks, the UI-only build and the attributed two-window and Markdown-images smokes passed 2/2, followed by the tightened two-window case and the affected file-tabs suite separately, each 1/1. The write remains unknown; this does not establish child or native lifecycle behavior.

An explicit 403 from a polling read now disables editing while preserving the draft; a later successful read reapplies its reported permission even at the same content revision. The `two-window-room-ui-smoke.ts` case injects the policy refusal at the local GET consumer, holds autosave timing, and verifies the retained source, zero PUTs and re-enabled editor after recovery. It failed at the intended 403 assertion before the fix. UI and scripts typechecks, the UI-only build and the attributed two-window and Markdown-images smokes passed 2/2. Transient non-policy failures retain their existing behavior; this controlled fault is not evidence of paired-device support.

The conflict-resolution GET now also fences editing on an explicit 403 while retaining the conflict and draft. The extended `two-window-room-ui-smoke.ts` exercises the real Keep mine callback with a controlled denied read and confirms no replacement PUT; it failed at the intended editable-state assertion before the change. UI and scripts typechecks, the UI-only build and the attributed two-window and Markdown-images smokes passed 2/2. This remains attached-editor evidence only.

## Checkpoint: owner-held surface save promise

The existing surface save promise is now held by the chat App and passed to the single editor surface. An absent surface with that promise still active cannot be treated as no session or admit a clean destructive action. The test-first detached smoke now also holds an actual Save while returning from the child and requires one write and the same source; it remains unexecuted because Detach is not yet available. UI and scripts typechecks and the UI-only build passed; after correcting a TypeScript narrowing error in the new unexecuted test, the attributed two-window, file-tabs, Markdown-images and RAW smokes passed 4/4. These attached tests preserve existing write behavior but do not prove cross-host retention. The separate conflict operation, full editor snapshot, unknown-write state, host transfer and C4/C5 protocol remain open.

The pane now checks and settles that same owner-held promise directly, even when its presentation surface is absent. The future child case also attempts Discard while the returned Save is held, cancels it, and checks the late completion cannot navigate; this remains unexecuted. UI and scripts typechecks and the UI-only build passed, and the attributed two-window and file-tabs smokes passed 2/2. Those existing attached flows do not establish recovery from actual child destruction.

The chat owner now also holds the in-flight Keep mine promise, and no-session/clean-action checks account for it when the pane is absent. The future child smoke adds a real conflict, holds Keep mine across Return and checks one resolution write; this assertion is unexecuted until the host exists. UI and scripts typechecks and the UI-only build passed; the attributed two-window and Markdown-images smokes passed 2/2. This retains the tested attached behavior but does not yet retain the complete C2 session or prove cross-host recovery.

## Checkpoint: owner-held unknown-write identity

An unknown write is now held by the chat owner with its room, conversation, context incarnation and path. A new pane with unresolved write state refuses to bind a replacement editor, and reconciliation refuses a different identity or a missing surface; an absent pane cannot be reported as no session. The future detached smoke adds an aborted PUT, Return and refused Discard case, but remains unexecuted until Detach exists. UI and scripts typechecks, the UI-only build and the attributed two-window, file-tabs and Markdown-images smokes passed 3/3, including their existing real lost-response cases. These tests do not prove the new missing-surface path, full source restoration, `writeId`/submitted-generation tracking, or host/native recovery; all remain required.

The owner now assigns each actual PUT a non-reused local write ID and records the current draft generation, context, path, source and revision synchronously before sending it. The same record changes from pending to unknown on a lost response; a confirmed response or definite rejection clears only its matching pending record. The existing test-first child cases cover the intended held/unknown behavior once the host exists, but have not executed. UI and scripts typechecks, the UI-only build and the attributed two-window, file-tabs, Markdown-images and RAW smokes passed 4/4. These attached tests exercise writes and reconciliation but do not observe the private ID or submitted-generation values, so direct C2 correlation and cross-host proof remain open.

## Checkpoint: active Markdown snapshot capture

The chat owner now retains a snapshot of the active Markdown surface's source, baseline, revision, RAW state, trailing newlines, dirty/edit flags, mode, permission, error and conflict/sync fields, with context and draft generation. Capture is bound to the current pane token and concrete surface incarnation; a stale pane cannot replace it, and a missing or failed capture marks it unavailable while retaining the last data. Capture also waits for the editor's file-content synchronization before treating a new revision as current. UI and scripts typechecks and the UI-only build passed; the attributed two-window, file-tabs, Markdown-images and RAW smokes passed 4/4 after the binding and synchronization refinements. The current public attached tests do not inspect the private snapshot, so its completeness and synchronous publication are not yet proven; restoration, transfer, child destruction and preview snapshots are not implemented or proven. Detach remains unavailable; the test-first child cases remain red at that control.

The owner now separately captures the active file's loading or pre-load error view, keyed to its context and pane, without constructing an empty draft. The future detached smoke covers no tabs, a held load and denied read across Return, plus browser-child loss with an unknown write; it has not run past the unavailable Detach control. UI and scripts typechecks, the UI-only build and attributed two-window, file-tabs and Markdown-images smokes passed 3/3. These attached checks do not observe the private load-view record or establish restoration or child behavior.

The attached `two-window-room-ui-smoke.ts` now also holds the real file GET, verifies the loading view, then supplies a controlled 403 and verifies the visible error with no editor or PUT. The attributed filtered two-window suite passed 1/1. This confirms the attached public behavior only, not the retained load-view contents or transfer.

When external polling detects a conflict, the editor now retains the baseline's expected revision instead of replacing it with the newer external revision; the latter remains separately recorded as the conflict revision. The test-first detached smoke now includes a polled conflict followed by actual browser-child closure and recovery, but it remains unexecuted until Detach exists and does not yet prove the private revision value. UI and scripts typechecks, the UI-only build and attributed two-window, Markdown-images and RAW smokes passed 3/3. Snapshot reconstruction and direct revision evidence remain open.

Local document admissions now retain a copy of the exact select-file or close-tab target, including the clean pending-write path. The future detached smoke asserts that these real actions leave the child open; that assertion is still unexecuted. UI and scripts typechecks, the UI-only build and attributed two-window and file-tabs smokes passed 2/2, covering their existing attached tab actions. The target is not yet a complete C4 `Correlation`: other action kinds, commit/abort/acknowledgement, duplicate handling and actual child-closure evidence remain unimplemented and unproven.

The local commit bypass now checks the admitted tab kind and path, and file selection copies its target before waiting for the guard. In `two-window-room-ui-smoke.ts`, a controlled mutation of the actual tree response entry after admission previously prevented the original selection; after the fix the real callback selects the original file rather than the changed entry. UI and scripts typechecks, the UI-only build and attributed Remember, two-window and file-tabs smokes passed 3/3. This verifies that attached case, not wire-level correlation, duplicate handling or child closure.

The browser `beforeunload` check now also considers owner-held pending/unknown writes and a retained dirty snapshot when the editor surface is absent. In `two-window-room-ui-smoke.ts`, a real browser reload after a controlled person change removes a clean-looking surface while its PUT remains held; the prompt was absent before the fix and appeared afterward. UI and scripts typechecks, the UI-only build and attributed two-window and file-tabs smokes passed 2/2. This is browser best-effort evidence only; it does not prove native unload, close or quit protection.

An explicit 403 during unknown-write reconciliation now disables editing while retaining the unresolved write and draft. The extended `two-window-room-ui-smoke.ts` aborts a real editor PUT, injects the denied read, and checks that Discard does not leave or retry; the permission assertion failed before the change. UI and scripts typechecks, the UI-only build and attributed two-window and file-tabs smokes passed 2/2. This does not replace the pending child/native or paired-policy evidence.

The `two-window-room-ui-smoke.ts` also now uses a separate invented room and the real local workspace-default route to remove and restore write permission, then remove and restore read permission while a draft is open. It observes an actual 403 from the Markdown route, retained draft, zero PUTs and restored editability; the attributed filtered suite passed 1/1 after the final assertion. This is local policy evidence, not paired or child-window coverage.

The room-settings Forget callback now captures the room and conversation values before entering the document guard. In `two-window-room-ui-smoke.ts`, mutating the actual fetched status object while the guard was open previously changed the conversation sent by the real callback; afterward the original conversation reaches the local Memento endpoint and the existing flow completes. The server's existing empty-prepared-boundary retargeting behavior is unchanged. UI and scripts typechecks, the UI-only build and attributed two-window and file-tabs smokes passed 2/2. This verifies one attached callback, not dependent-child closure or the full C4 protocol.

Room-settings Memento now supplies that captured room and conversation to the local admission, which validates the current context and matches the same operation and target on continuation. The extended real-callback case first supplies a stale conversation and checks refusal before a prompt or POST; temporarily removing the context comparison made that assertion fail. With it restored, UI and scripts typechecks, the UI-only build and attributed Memento-runtime, room-topbar, two-window and file-tabs smokes passed 4/4. The wire-level C4 protocol, other exit targets and child-closed ordering remain open.

Topbar Memento now captures the room/conversation and context generation at admission and rechecks them after confirmation, the Memento reply and the fresh-thread read. Its new conversation is also checked after the activation save before updating the view. `two-window-room-ui-smoke.ts` holds real local Memento and fresh-thread responses across a controlled page-person change: the former previously added an error to the invalidated chat, while a targeted removal of the post-read check cleared its prior text. Both cases pass with the checks restored. An initial test run incorrectly waited for an empty composer's Send button to be enabled and did not reach the intended assertion; that setup was corrected and is not counted as a red result or load debt. UI and scripts typechecks, the UI-only build and attributed Memento-runtime, room-topbar, two-window and file-tabs smokes passed 4/4. This is attached browser evidence; child-closed and native ordering remain open.

The existing resume callback now revalidates its prepared owner/context and draft stamp after the thread read and activation save, and before handling errors. `two-window-room-ui-smoke.ts` uses two real pages and a real Memento to move an invented room, holds the Reload thread read across a controlled page-person change, and verifies the old chat is not replaced. That assertion failed before the check and passed afterward. UI and scripts typechecks, the UI-only build and attributed room-topbar, two-window and file-tabs smokes passed 3/3. This covers the tested attached Reload path, not native or child closure.

Fresh room entry now checks its admitted context after retiring a prepared thread and its newly bound context after the activation save, including error paths. In `two-window-room-ui-smoke.ts`, holding the real activation PUT across a controlled page-person change previously let the late response open chat; the new assertion passes with the fence. UI and scripts typechecks, the UI-only build and attributed Remember, room-topbar, two-window and file-tabs smokes passed 4/4. This is attached browser evidence; host transfer, the full correlated arbiter, and native lifecycle protection remain open.

The Home leave path now revalidates the originating context after its asynchronous save or stop and before subsequent UI changes; the empty-thread retirement also checks context around its requests. `two-window-room-ui-smoke.ts` holds an actual standby PUT across a controlled page-person change: the old behavior cleared the invalidated chat and the new check keeps it visible. UI and scripts typechecks, the UI-only build and attributed room-topbar, two-window and file-tabs smokes passed 3/3. This does not establish dependent-child closure or native lifecycle handling.

The framed preview now transfers a copy of the response buffer rather than detaching its original. `workspace-file-tabs-ui-smoke.ts` observes the actual file response buffer after delivery; it failed before the change and passed afterward, alongside its existing repeated-ready and navigated-frame checks. UI and scripts typechecks, the UI-only build and the attributed filtered file-tabs smoke passed 1/1. This is only an initial retained-byte step: owner-lifetime snapshot ownership, controlled new frames and child-host delivery remain unimplemented.

## Resolved test-contract conflict: direct HTML frame assertions

The prior `workspace-file-tabs-ui-smoke.ts` required direct navigation to an HTML `frame=1` URL to execute workspace HTML and direct navigation of another file to trigger self-navigation. Controller authorized the bounded correction on 2026-11-12 (`msg_09bc77e04419`), retaining those security and navigation checks at the actual parent/frame seam and requiring direct URLs to contain no file bytes. Controller clarified the API race migration (`msg_0cf47c845c04`) and the distinct App-versus-frame CSP evidence (`msg_e65a0881723b`, in response to `msg_cfb65bf0d9e7`). The accepted contract and CSP did not change.

The existing guarded HTML frame route now returns a fixed one-shot bootstrap before reading file content. The App retains the metadata response's UTF-8 HTML snapshot and sends a copy once to the actual opaque frame; the bootstrap accepts only its actual parent at the expected app origin. The revised browser case retains script execution, opaque-origin restrictions, blocked network requests and exact frame CSP, and checks an empty direct shell, a foreign ready while the real frame is held, repeated ready and a navigated frame. For self-navigation, the actual App frame runs the authorized snapshot but its existing `frame-src 'self'` blocks the cross-origin target without a network request. A supplementary controlled same-origin local parent uses the real metadata and guarded frame to demonstrate the frame policy's accepted self-navigation allowance, with the invented external address intercepted and aborted before leaving the test; this is not evidence that the actual App permits that navigation.

The existing four HTML replacement fixtures and malformed UTF-8 assertion now exercise metadata content reads, while added shell checks prove no workspace HTML open/read and retain authentication, conversation, path, symlink, size and exact CSP checks. The existing remote policy case remains. The test-first browser run failed on direct workspace content as intended; an earlier setup run failed to compile because of a duplicate local test variable, which was corrected and is not a behavior red or load debt. The initial attempt to assert external navigation inside the actual App timed out twice; the console identified the existing parent `frame-src` policy, leading to the two scoped checks above. UI and scripts typechecks, the UI-only build, the isolated attributed HTML race child and the attributed filtered `remote-capability-smoke.ts`, `workspace-file-preview-smoke.ts`, and `workspace-file-tabs-ui-smoke.ts` passed (3/3). Child-host movement, retained snapshots across reconstruction, per-frame generation/timeout, native behavior and all I/R completion evidence remain open.

HTML frame delivery now reports completion or failure and uses the existing 30-second preview deadline; a timed-out preview aborts an outstanding fetch and shows the existing timeout sentence. `workspace-file-tabs-ui-smoke.ts` supplies a stuck real frame response with a controlled shortened timer; it failed before the timeout was added and passed afterward. A navigated frame sends a late failure after a completed render; temporarily removing the terminal-state fence made its assertion fail, and the attributed filtered browser suite passed after restoration. UI and scripts typechecks, the UI-only build, and the attributed browser and remote-capability cases passed (2/2), followed by a final browser pass (1/1). Per-frame generation across host reconstruction and the broader C7 evidence remain open.

The chat owner now retains original HTML and PPTX/Excalidraw byte buffers in an entry for each open tab incarnation. Tab close removes that entry and a context change replaces the map, so an old component cannot populate a later incarnation's entry. The attached `workspace-file-tabs-ui-smoke.ts` confirms that closing and reopening HTML reads changed invented content as a new incarnation; UI and scripts typechecks, the UI-only build and attributed filtered file-tabs smoke passed 1/1. The test-first `workspace-detached-documents-ui-smoke.ts` now checks an actual HTML frame and script across Detach/Return after its backing file changes, requiring one content read, but the attributed run still fails at its first unavailable Detach control and none of these child assertions have executed. Host adoption, reconstruction and other preview kinds remain unimplemented and unproven.

The owner now holds the local pending action's admission, exact continuation and result together in one record, and Save/Discard completion only settles the same record. This is a refactoring foundation, not the complete C4 protocol: `workspace-file-tabs-ui-smoke.ts` exercises a real expired decision with held save and a refused competing file action; `two-window-room-ui-smoke.ts` exercises the busy Reload/Home case and captured file and Memento targets. UI and scripts typechecks, the UI-only build and attributed Remember, room-topbar, two-window and file-tabs smokes passed 4/4. Serialized prepare/abort/ack/commit/child-closed semantics, complete action typing and child/native evidence remain open.

The HTML frame now has a fresh owner-generated instance identifier in its fragment, and the owner requires that identifier, the concrete frame window and its expected `src` before a first delivery. In `workspace-file-tabs-ui-smoke.ts`, a controlled navigation of the actual frame before its original bootstrap replies previously received the retained invented bytes; the real replacement, foreign-frame and repeated-ready checks now include the correct identifier and receive none. The attached browser and remote-capability cases passed 2/2, the filtered preview API suite passed 1/1, and UI/scripts typechecks and the UI-only build passed. This proves the tested attached instances only; controlled child reconstruction, host-generation binding and the analogous framed renderer checks remain open.

The PPTX/Excalidraw parent now applies the same instance/source/expected-URL check and binds messages to the frame's actual parent document. Both renderer entries accept only one buffer from their parent at the expected app origin. In `workspace-file-tabs-ui-smoke.ts`, an actual preview frame navigated before its renderer response previously received the invented bytes; it receives none after the change, while the real PPTX and Excalidraw renderers and their theme checks pass. UI and scripts typechecks, the UI-only build and the attributed filtered file-tabs and remote-capability cases passed 2/2. This does not prove reconstruction after adoption or child-host event rebinding.

The real Excalidraw frame is now also tested against a second buffer sent by its real App parent after rendering. Temporarily removing the renderer's receiver cleanup made `workspace-file-tabs-ui-smoke.ts` fail at that assertion; after restoring it, UI/scripts typechecks, the UI-only build and the attributed filtered browser suite passed 1/1. This directly proves the tested Excalidraw receiver case, not PPTX or child-host reconstruction.

The local commit re-entry now carries the exact pending record and requires its prepared stamp and target still to match, including the Reload callback after its status read. The initial UI typecheck caught one Reload assignment that still used the prior shape; it was corrected before verification. UI and scripts typechecks, the UI-only build and attributed room-topbar, two-window and file-tabs smokes passed 3/3, including existing held Reload and target-mutation cases. Wire-level abort/commit/child-closed behavior remains open.

In-room Archive and Delete now capture their operation, room and conversation in the local admission, and the settings callbacks refuse a target outside the context that rendered them. `workspace-file-tabs-ui-smoke.ts` exercises the real callbacks with a mutated invented status: Archive sent a request for the wrong room before the binding, and Delete did so with its binding deliberately removed; both now refuse before a request or document prompt. The same tests verify Cancel retains a dirty draft with no operation request and Discard reaches the real invented endpoint, while existing clean-operation checks remain. Two intermediate test runs timed out because mutating the status unmounted/remounted the settings view; the test now combines mutation and click in one event and reselects its pane after the normal refresh. Those setup failures are not behavior reds or load debt. UI and scripts typechecks, the UI-only build and attributed room-topbar, two-window and file-tabs smokes passed 3/3. Actual dependent-child shutdown and native correlation remain unproven.

Home and post-checkpoint Rest now admit an explicit Home destination, while the existing Memorize continuation records its memory destination. `remember-job-dialog-smoke.ts` exercises the real Return Home and Memorize continuations; the existing two-window and file-tabs cases exercise Home cancellation and pending-write paths. UI and scripts typechecks, the UI-only build and attributed Remember, room-topbar, two-window and file-tabs smokes passed 4/4. This records destinations for the local action only; the complete C4 wire protocol and dependent-child closure are not implemented.

Post-checkpoint Rest now revalidates its prepared admission after the actual prepared-thread retirement response and before reporting a failure or clearing the room. `remember-job-dialog-smoke.ts` holds the real response across a controlled page-person change; after correcting the test to observe the current room rather than transcript text already replaced by the checkpoint, removing the new check made the stale exit assertion fail. The restored check passes the filtered Remember suite; the two-window and file-tabs cases also passed on the restored implementation, and UI/scripts typechecks and the UI-only build passed. The earlier transcript-based failures were invalid test assertions, not valid reds or load debt. This is attached-browser evidence only, not child-closed or native evidence.

When a checkpoint result actually requires a new conversation or a Home park, the owner now copies its target before the document guard and records that exact replacement or Home action. `remember-job-dialog-smoke.ts` mutates the actual invented approval response while the guard is pending: previously the continuation requested the changed thread, and afterward it requests the original server-selected thread. UI and scripts typechecks, the UI-only build and attributed Remember, two-window and file-tabs smokes passed 3/3. This does not reserve the approval HTTP itself, and does not prove child-closed or native ordering.

Document admission now refuses synchronously after page identity changes or owner disposal, including the clean-file path. `two-window-room-ui-smoke.ts` invokes the real retained tree callback after a controlled identity change: it previously selected the file and now leaves the pane closed. UI and scripts typechecks, the UI-only build and attributed Remember, two-window and file-tabs smokes passed 3/3. Native and detached-host invalidation are still untested.

The existing workspace tree now renders through a stable owner-held element at its original sidebar position, preparing it for a later host transfer without introducing a second tree. UI and scripts typechecks and the UI-only build passed; the attributed filtered command discovered `two-window-room-ui-smoke.ts` and `workspace-file-tabs-ui-smoke.ts` and passed 2/2 (the additional `workspace-file-browser-ui` selector matched no case). Their attached tree, layout and file callbacks pass. No host movement has been implemented or proven; the child suite remains red at Detach and the full C3/C4/C5 contracts remain open.

The tree now derives its focus and visibility listeners from its actual element document/window, with rebinding keyed to host generation; focus restoration uses the selected button's window. UI and scripts typechecks, the UI-only build and attributed two-window and file-tabs smokes passed 2/2. The test-first detached smoke adds a child-window focus refresh case with the unrelated periodic tree timer controlled, but the filtered run still fails at its first unavailable Detach control; the new child case has not executed. Host adoption and generation publication remain open.

The editor's Save/Find keyboard listener now binds to the surface's actual document and is keyed to host generation. The new attached `workspace-file-tabs-ui-smoke.ts` Find/Escape case exposed that Escape also closed the document tab; the search input now consumes that handled key and the same real case confirms the tab stays open. UI and scripts typechecks, the UI-only build, and attributed file-tabs and RAW smokes passed 2/2. An unchanged `two-window-room-ui-smoke.ts` fake-answer wait timed out once in the preceding serial run and passed on its one isolated rerun; record one unrelated load-debt candidate. The corresponding child Find/Escape assertion has not executed because Detach remains unavailable, and host generation publication is not yet implemented.

Markdown preview-link and task-checkbox handlers now use constructors from the event's actual document window. The test-first detached smoke adds actual child checkbox, guarded discard and internal-link interactions without a write, but those assertions have not executed because Detach remains unavailable. UI and scripts typechecks, the UI-only build and attributed file-tabs, Markdown-images and RAW smokes passed 3/3, including their existing attached link and checkbox paths. Cross-window behavior and host adoption remain open.

The toolbar link prompt now uses the editor element's actual window. `workspace-file-tabs-ui-smoke.ts` verifies the attached prompt opens once and dismisses it; the test-first detached smoke distinguishes child and owner prompt events, but that assertion has not executed while Detach is unavailable. UI and scripts typechecks, the UI-only build and attributed file-tabs and RAW smokes passed 2/2. This does not establish child prompt behavior.

Search-result scrolling now schedules on the editor document's window and re-evaluates on a host-generation change. The attached file-tabs case checks a real match and Escape; the test-first detached case also instruments the child window's animation-frame scheduling, but has not executed while Detach is unavailable. UI and scripts typechecks, the UI-only build and attributed file-tabs and RAW smokes passed 2/2. Child-host scheduling and host generation publication remain unproven.

Explicit external Markdown preview links now call the document pane's window. The attached file-tabs case substitutes a fake opener and intercepts the invented external address, confirming one opener call and zero network requests; the test-first detached case distinguishes child and owner fake openers but remains unexecuted while Detach is unavailable. UI and scripts typechecks, the UI-only build and attributed file-tabs and Markdown-images smokes passed 2/2. Cross-window opener behavior remains unproven.

The existing stable content and tree elements now live in the private `docs-window.ts` host seam approved by ADR-0009; this is an attached-only refactor and adds no package export or child capability. UI and scripts typechecks, the UI-only build and attributed two-window and file-tabs smokes passed 2/2. Bootstrap, transfer, recovery and all native integration remain unimplemented.

During the preceding documentation checkpoint, Git's automatic background packing printed that object `3fbc2b763829fc56b5972d52603241eee2b50ebe` was a tag rather than a commit; `git cat-file -t` confirmed it is a tag, while the signed commit and push succeeded. Its cause has not been established and is a repository-maintenance debt candidate, not product or gate evidence.

## Checkpoint: child-first text and image snapshot cases

`workspace-detached-documents-ui-smoke.ts` now specifies real child-first text and image opens, changes the invented files on disk, returns to chat, and checks original content and a single authorized read. The attributed filtered detached smoke remains red at its first missing Detach assertion; these added cases were not reached and do not establish snapshot retention. The scripts typecheck passed; actual host, image lifetime, text reconstruction, remaining preview types, C4 and native safeguards remain required.

## Checkpoint: owner-held text snapshot

A successfully loaded text preview now also stores its formatted content in the existing owner-held tab record, which is removed on tab close and replaced on context change. UI and scripts typechecks, UI asset build, and the attributed filtered `workspace-file-tabs-ui` smoke passed (1/1). The child-first text test remains unexecuted because the detached smoke stops at its first unavailable Detach assertion; loading/error retention and every actual transfer/native requirement remain open, so this checkpoint does not establish C7 completion.

## Checkpoint: owner-held image URL

The existing tab record now retains the authorized image object URL and revokes it on tab close or context replacement; a disposed record cannot create a URL from a late fetch. UI typecheck and UI asset build passed, and the attributed filtered `workspace-file-tabs-ui` and `workspace-markdown-images-ui` smokes passed 2/2, including the existing changed-image/reopen and late-response cases. The child-first image case remains unexecuted at the missing Detach assertion, and this does not establish host-loss, all preview state, C4, or native lifecycle correctness.

## Checkpoint: child-first Word case

The real detached-window smoke now also specifies opening a generated Word document in the child, replacing the disk file, returning, and checking the original rendered heading with one content request. Scripts typecheck passed; the attributed detached smoke again failed at its first unavailable Detach assertion, so the new Word case did not execute and provides no transfer evidence yet.

## Checkpoint: owner-held Word snapshot

The owner tab record now retains successfully validated Word HTML and its external-resource notice for reconstruction. UI and scripts typechecks and the UI asset build passed; the attributed `workspace-file-preview` and `workspace-file-tabs-ui` filtered smokes passed 2/2. The child-first Word case is not yet reached because Detach is unavailable, and loading/error retention, remaining preview types, host transfer and native safeguards remain open.

## Desktop test prerequisite requiring Controller decision

The desktop package has a separate lockfile. `EXXETA_SKIP_BROWSER_INSTALL=1 npm ci` in `apps/desktop` completed with normal lifecycle scripts and `npm run typecheck` passed, without a tracked lockfile change. The locked Electron package is 43.8.6 and has no install lifecycle script; its `index.js` invokes `install.js` to download the Electron executable lazily when first required. The executable is absent after `npm ci`, no `electron` executable is on PATH and no Electron cache is present. Running the native endpoint tests therefore needs an Electron runtime, but invoking that lazy installer would install a dependency outside the dispatch's explicit `npm ci` and normal-lifecycle-only rule; Controller must identify an authorized way to supply it. All previous check results remain partial, and the actual host/C4/native lifecycle and the child tests remain unfinished.

Controller resolved the prerequisite in `msg_0cc95760928e` with a narrow exception for the already locked Electron runtime. From `apps/desktop`, `electron_config_cache=/home/developer/orca/workspaces/exxperts/t20-harden/.build/electron-cache node node_modules/electron/install.js` completed using the local installed package and task-local cache; `ELECTRON_RUN_AS_NODE=1 node_modules/electron/dist/electron -p 'process.versions.electron'` returned `43.8.6`. No tracked manifest or lockfile changed, and installation is not evidence of any native lifecycle behavior or platform support.

## Native harness and host sandbox blocker

A new targeted `workspace-documents-native-ui-smoke.ts` drafts an actual Electron shell close-to-hide test with an isolated scratch home, built local server on a free port, local fake update feed, and malformed replies injected at the shell's outbound owner-exchange seam. The desktop build and the separately targeted server bundle completed; scripts typecheck passed. This test has not reached the shell or the asserted behavior: the first attributed run had no X display (and exposed Playwright's default `--no-sandbox`, which was not accepted as evidence); the test now explicitly requests `chromiumSandbox: true`, and the second attributed run under `xvfb-run` could not launch. The independent diagnostic `xvfb-run -a apps/desktop/node_modules/electron/dist/electron --version` reports: `The SUID sandbox helper binary was found, but is not configured correctly`; it requires `chrome-sandbox` to be owned by root with mode 4755. No host security change or sandbox bypass was made. The native test remains red and unexecuted; there is no native support evidence. Two environment runs failed: missing display once, sandbox configuration once.

## Checkpoint: child-first PDF and spreadsheet cases

`workspace-detached-documents-ui-smoke.ts` now specifies a real child-first PDF and generated spreadsheet, changes each invented file on disk, and checks retained page/cell content and a single request after Return. Scripts typecheck passed. The attributed detached smoke again stopped at the first missing Detach assertion, so neither new case ran and this is not transfer evidence; actual browser host and native safeguards remain incomplete.

## Checkpoint: owner-held PDF and spreadsheet snapshots

The owner tab record now retains validated PDF page data and the validated spreadsheet model and notices. UI and scripts typechecks, the UI asset build, and the attributed filtered `workspace-file-tabs-ui` smoke passed (1/1). The child-first PDF and spreadsheet cases remain unexecuted at the unavailable Detach assertion; pending/error snapshots, actual host reconstruction, C3/C4, and native lifecycle work remain open.

## Checkpoint: child image animation case

The detached smoke now requires actual child image zoom to schedule animation frames in the child window. Scripts typecheck passed; the attributed run remains red at the first missing Detach control, so this new assertion has not executed and provides no host evidence yet.

## Checkpoint: image host-bound animation

Image zoom now obtains animation scheduling, cancellation, reduced-motion preference and resize observation from the preview element's actual window; host generation changes rebind the observer and cancel the old host's frame. The UI typecheck, UI asset build and attributed `workspace-file-tabs-ui` smoke passed (1/1), covering attached image zoom, wheel and drag. The new child animation assertion did not run because Detach is unavailable; no child-host evidence or full C7 completion is claimed.

## Checkpoint: private child bootstrap draft

The existing private host hook can now open an empty about:blank child, verify its opener/name/document, copy the owner's root attributes and styles, wait for stylesheet success and a bounded styled-layout check, and return empty tree/pane slots. It does not move either owner surface, expose Detach, register a native child, or acquire the action arbiter; an unverified returned window is not closed by failure cleanup. UI and scripts typechecks and the UI asset build passed; the attributed detached smoke remained red at the first unavailable Detach assertion and did not exercise this draft. Actual bootstrap/adoption/security behavior, C3/C4 and native safeguards still need integration and real tests.

## Checkpoint: empty owner session

A selected room now initializes its owner tab session with an empty path list, so the hidden document host exists before the first file is selected. UI and scripts typechecks, the UI asset build, and the attributed `two-window-room-ui` and `workspace-file-tabs-ui` smokes passed 2/2. The real empty-child acceptance remains unexecuted because Detach is unavailable; bootstrap, adoption, C4 and native safeguards are not complete.

## Checkpoint: private adoption draft

The private host hook now tracks owner slots and at most one opening, prepared or registered child. Its draft move/return operations check the exact candidate and owner-provided current predicate, retain the registration until the exact window reports closed, and report unknown if a partial move cannot be restored. UI and scripts typechecks and the UI asset build passed; the attributed detached smoke still failed at the first unavailable Detach control, so none of these operations has been exercised through the public entry. They are not connected to the arbiter, editor fence, controlled frame reconstruction, native acknowledgement or UI, and do not establish C3/C4 completion.

## Checkpoint: in-flight preview transfer case

The detached smoke now specifies holding the actual HTML metadata request across Detach, completing it in the child, and returning without another content request. Scripts typecheck passed; the attributed smoke remains red at the initial unavailable Detach control, so the new case was not reached and does not establish transfer behavior.

## Checkpoint: controlled frame generation draft

The owner now publishes host generation to the document components. HTML, PPTX and Excalidraw keep their component, in-flight fetch and error state while a changed host generation creates a fresh concrete iframe identity; the prior listener also rejects messages after its element changes owner window. UI and scripts typechecks, UI asset build, and the attributed `workspace-file-tabs-ui` smoke passed (1/1), including attached real-frame source and navigation checks. No transfer currently advances the generation, and the child/in-flight cases remain unexecuted; preflight identity allocation and actual controlled-move security still require completion and proof.

The pending child fixture was corrected to avoid duplicate invented-file writes and to release the held HTML response if child opening or its loading assertion fails. Scripts typecheck passed; the child test remains blocked before these lines by unavailable Detach.

## Checkpoint: browser popup request case

The detached browser smoke now captures the real `window.open` arguments while still invoking the real opener, and requires an about:blank popup name without the invented room/draft text plus size and position hints. Scripts typecheck passed; the attributed run still stops at the first unavailable Detach assertion, so this does not establish placement, popup registration or monitor behavior.

## Checkpoint: browser placement draft

The private child bootstrap now requests best-effort size/position hints, clamps against an exposed browser work area, and remembers a successfully returned child's outer position and inner size only in the same owner session. UI and scripts typechecks and the UI asset build passed; the attributed detached smoke still stops at unavailable Detach, so popup arguments and placement are untested. Browsers may ignore hints; there is no Electron geometry implementation or monitor evidence here.

## Checkpoint: disabled owner-admitted Detach draft

A selected room now shows one disabled Detach control even with no tabs; an attached tab shows the approved tab-strip control. The inactive handler reserves the existing owner admission, fences the editor, preallocates per-frame IDs, checks the retained editor/load view and current stamp, and calls the private bootstrap/adoption draft; it keeps the fence on an unknown or post-adoption failure. It remains explicitly disabled because child Return, dependent-close ordering, C4 settlement and native registration are incomplete. UI and scripts typechecks, UI asset build and the attributed `two-window-room-ui` and `workspace-file-tabs-ui` smokes passed 2/2. The detached smoke now passes its one-control assertion and fails at the expected enabled assertion; no popup, transfer or child behavior was reached, so this does not establish C3/C4/C7 correctness.

## Checkpoint: disabled Return draft

The private child bootstrap now creates a disabled Return control, and the inactive owner path admits Return through the same pending-action record, fences the editor, preallocates fresh frame IDs, moves the held surfaces to chat, and waits for the registered browser window's `closed` state before releasing that attempt. A child `beforeunload` draft invokes the synchronous move; unknown moves retain the fence. UI and scripts typechecks and the UI asset build passed. The first detached rerun checked the control before room entry completed; after waiting for the real workspace tree, the targeted rerun passed the one-control assertion and stopped at the expected disabled Detach assertion. No child, Return, close-evidence or recovery case ran; context-exit close ordering and native C5 remain incomplete, so the control stays disabled.

## Checkpoint: held child-close case

The detached smoke now specifies a real clean Home action with the registered child window's actual `close` method held: Home must stay in the room until that same child really closes, then continue. Scripts typecheck passed; the attributed run still stops at disabled Detach, so the new ordering case was not reached and provides no close evidence yet.

## Checkpoint: typed leave child-close draft

For the existing typed Home/Memory leave intents, the inactive child path now retains the prepared action and editor fence, moves the held surfaces back, requests close, and only permits the original continuation after the exact registered browser child reports closed and context/draft checks still match. File and tab actions do not enter this child-close path. UI and scripts typechecks, UI asset build, and the attributed `remember-job-dialog`, `two-window-room-ui` and `workspace-file-tabs-ui` smokes passed 3/3. The held-child-close case remains unexecuted at disabled Detach; other exit/operation paths, deadlines, abort acknowledgement, recovery and native handling remain incomplete, so this is not a C4 pass.

## Checkpoint: Memento confirmation and closure case

The detached smoke now specifies the real Memento confirmation: Cancel leaves the registered child open and sends no operation, while confirmation holds the real Memento request until the actual child closes. Scripts typecheck passed; the attributed smoke still stops at disabled Detach, so this case did not run and is not evidence of ordering.

## Checkpoint: topbar Memento child-close draft

The inactive topbar Memento path now keeps the original guarded action through its own confirmation; Cancel performs no child close, and a confirmed action waits for the registered child before the real Memento request. UI and scripts typechecks, UI asset build, and the attributed `two-window-room-ui` and `workspace-file-tabs-ui` smokes passed 2/2. The new detached Memento case remains unexecuted at disabled Detach, and the separate room-settings callback and other operations still require integration and real child evidence.

## Checkpoint: room-settings Memento case

The detached smoke now separately specifies the real room-settings Memento callback, including Cancel with no child close/request and confirmed Memento waiting for actual child closure. Scripts typecheck passed; the attributed run remains stopped at disabled Detach, so this settings case has not executed.

## Checkpoint: settings Memento child-close draft

The room-settings Memento callback now revalidates its admitted target after its own confirmation and, when a child is registered, waits for that child's actual close before the existing Memento request. UI and scripts typechecks, UI asset build, and the attributed `workspace-file-tabs-ui` smoke passed (1/1), including the existing attached settings Memento cases. The new detached settings case remains unexecuted because Detach is disabled; this is not evidence of child ordering or full C4.

## Checkpoint: stale settings Memento response regression

A real attached-browser regression holds the settings Memento response after the invented server action, triggers `person_changed` through the existing workspace route, then releases the response and checks that the invalidated chat's hash and title remain unchanged. The attributed `workspace-file-tabs-ui` smoke failed specifically at that new assertion (0/1); this is a real red for the late settings callback, not a child/native result. The failure must be fixed before this step is complete.

The settings Memento completion now checks the captured room/conversation generation and page identity before clearing chat. The same real held-response regression passed after the fix, and the attributed filtered `workspace-file-tabs-ui` smoke passed 1/1; UI and scripts typechecks and the UI asset build also passed. This proves the attached stale-response case only, not child close or native behavior.

## Checkpoint: archive and purge child-close cases

The detached smoke now separately specifies the real archive and purge callbacks, a canceled purge confirmation, and held actual child closure before either operation route. Scripts typecheck passed; the attributed smoke still stops at disabled Detach, so these new cases have not executed and do not establish callback ordering.

## Checkpoint: archive and purge child-close draft

The inactive in-room archive and purge paths now check the live busy state before closing a registered child, retain the admitted target while waiting for actual closure, and recheck before changing room state or sending the existing route. UI and scripts typechecks, UI asset build, and the attributed `workspace-file-tabs-ui` smoke passed 1/1, including attached archive/purge and the stale settings Memento regression. The detached archive/purge cases remain unexecuted at disabled Detach; operation ordering and native behavior are not established.

## Checkpoint: checkpoint replacement child-close case

The detached smoke now uses a local scripted fake model and specifies the real checkpoint Save and subsequent replacement-thread read separately: the Save may complete, but the replacement read must wait for the actual registered child to close. Scripts typecheck passed; the attributed run still stops at disabled Detach, so this new case and fake model flow have not executed and provide no checkpoint/child evidence.

## Checkpoint: checkpoint replacement draft

The inactive dependent-close path now applies to a typed replacement only when its captured destination differs from the current conversation. The explicit Keep chatting continuation captures the checkpoint approval and destination before waiting; checkpoint Save itself is not classified as a child close. UI and scripts typechecks, UI asset build, and the attributed `remember-job-dialog` and `workspace-file-tabs-ui` smokes passed 2/2. The new detached checkpoint case remains unexecuted at disabled Detach, and other room-entry/exit paths, abort deadlines, child recovery and native handling remain open.

## Checkpoint: chat pane versus child document case

The detached smoke now specifies opening the real chat Attachments pane while an active RAW document remains visible in the child. Scripts typecheck passed; the attributed run still stops at disabled Detach, so the new case did not execute. This is needed because the existing `rightPane` value currently also chooses the document shown by the child.

## Checkpoint: separate detached document selection

The inactive transfer path now retains the selected document in the owner session separately from the chat right pane; document callbacks and snapshots use that selection, and a verified child is focused on file selection. Returning an active document restores it to chat without changing an unrelated pane when the session is empty. UI and scripts typechecks, UI asset build, and the attributed `attachments-panel-ui`, `two-window-room-ui` and `workspace-file-tabs-ui` smokes passed 3/3. The real child/Attachments case remains unexecuted at disabled Detach, and native focus/bounds and full host behavior remain unverified.

## Checkpoint: chat recovery controls case

The detached smoke now specifies the room-labelled strip, Show documents focusing the existing real child, and chat-side Return waiting for child closure and restoring the retained HTML preview. Scripts typecheck passed; the attributed run still stops at disabled Detach, so these controls and child behavior have not run.

## Checkpoint: room-labelled recovery strip draft

The inactive child path now records its owner/room incarnation and renders the bounded room-labelled opening, detached, returning or unavailable strip, with Show documents and chat Return bound to the registered current child. Failed bootstrap uses an inline error; unknown moves keep the action reserved and fenced. UI and scripts typechecks, UI asset build, and the attributed `two-window-room-ui` and `workspace-file-tabs-ui` smokes passed 2/2. The detached smoke still stops at disabled Detach, so the strip, focus and Return cases did not run; same-attempt partial-move recovery and native bounds/registration are incomplete.

## Checkpoint: partial-adoption recovery case

The detached smoke now specifies a controlled real child adoption failure followed by a rollback failure, restoration of those fault seams, and chat Return recovering the same empty owner session without a write. Scripts typecheck passed; the attributed run still stops at disabled Detach, so the fault and recovery assertions did not execute.

## Checkpoint: same-attempt partial-move recovery draft

The inactive host path now retains the exact child and admission after an unknown partial move. The chat Return draft can revalidate that same owner/context and current retained editor state, re-adopt only those held surfaces, wait for the exact child's actual closure, and refuse any interrupted exit continuation. UI and scripts typechecks and UI asset build passed; the attributed detached smoke still stops at disabled Detach, so the new fault/recovery case did not execute. This is not evidence of C3 recovery, native closure, or support.

## Checkpoint: workspace drag provenance regression

The attached `workspace-markdown-images-ui` smoke first performs the real existing tree-to-composer drag, then attempts an unrelated forged drop with the same MIME and path. The attributed run failed specifically because the forged drop inserted again (0/1), while the real drag succeeded. This is an attached negative regression only; it is not cross-window or native drag evidence and must be fixed.

## Checkpoint: attached drag provenance

The owner now records a trusted tree drag against its room incarnation and host generation, and consumes it once at the real composer drop; context changes, pending actions, foreign or synthetic drops, and stale hosts cannot authorize insertion. The unchanged workspace-path and plain-text MIME values remain available to external consumers. UI and scripts typechecks and the UI asset build passed; the attributed `workspace-markdown-images-ui` smoke passed 1/1, including its real attached drag and previously failing forged-drop assertion. This does not establish cross-window or native drag behavior; those tests remain open.

## Open blocker: navigation before first frame readiness

The real `workspace-file-tabs-ui` regression now navigates the opaque framed preview through its `contentWindow.location` while the genuine shell response is held, preserving the iframe's original `src` attribute. The attributed run failed 0/1 at `a framed preview navigated before readiness cannot receive its snapshot`: the replacement sent `frame-ready` and received the original 500-byte invented snapshot. The analogous HTML pre-readiness test is written but did not execute because the framed case failed first. A same-WindowProxy source and unchanged `src` cannot by themselves distinguish that replacement from the fixed bootstrap; the UUID in the fragment is also visible to the replacement. C7's fixed one-shot shell, no new route/store and exact approved exchange leave the required pre-delivery proof unresolved; Architect/Controller direction is required before changing that contract. Detach remains disabled; this is a live attached-preview issue in the draft, not native or child support evidence.

## Checkpoint: single-container regression

The real detached-document smoke now requires the attached tree to belong to the document container, and later checks that the exact container, tree and editor nodes appear in the child. Scripts typecheck passed. The attributed run failed 0/1 at the initial attached-tree assertion, before Detach, demonstrating that the current two-container draft violates C3; the later identity assertions did not execute. The Controller confirmed that correcting this within the accepted one-container contract is authorized; preserving the existing attached layout and disabled Detach remains required.

## Checkpoint: one-container host draft

The workspace tree and document pane now render under one retained portal node; transfers and recovery adopt that one node, while the attached tree is positioned over its existing measured sidebar slot. UI and scripts typechecks and the UI asset build passed; the attributed `sidebar-reopen-ui` and `workspace-markdown-images-ui` smokes passed 2/2. The `workspace-detached-documents-ui` initial same-container assertion now passes and the run stops at intentionally disabled Detach (1 expected failure of 3 cases); real child movement, exact editor identity, partial-recovery behavior, responsive/sidebar stacking and native integration remain unverified. The separate C7 navigation-before-readiness regression remains red and is under Architect review; this checkpoint does not close C3 or claim support.

## Checkpoint: attached tree placement

The `sidebar-reopen-ui` smoke now measures the single host's tree against its real sidebar slot, performs an actual sidebar resize, verifies alignment after the width changes, and checks that collapsed entries are not visible. The attributed smoke passed 1/1 in Chromium's Mac-look CSS mode; this is attached browser evidence, not Mac native or child movement evidence. The Controller reports the independent C7 identity review found the written pre-readiness guarantee applies while the test uses privileged parent authority; options await Sascha, and the regression remains red.

## Open: narrow-screen tree stacking

An added real 390px browser check failed because the fixed attached tree is under the sidebar drawer and its slot intercepts file clicks. A trial raising the tree above the drawer made the file clickable but caused it to cover the sidebar settings menu; the later hit-test failed, so that trial was removed. The new assertions remain in `sidebar-reopen-ui` and the narrow-screen layout is unresolved; no responsive-layout pass is claimed. The Controller's C7 review separately found the written pre-readiness guarantee applies and awaits Sascha's decision; it does not authorize a protocol or scope change.

## Checkpoint: narrow-screen tree stacking

The attached single-container draft now gives the narrow-screen drawer background, tree and footer menu separate stacking layers. The attributed `sidebar-reopen-ui` smoke passed 1/1 after exercising a 390px real sidebar tree click, settings-menu hit and settings overlay, backdrop dismissal and reopening, in addition to the desktop resize/collapse checks; the UI asset build passed. This resolves the two recorded browser regressions for those entry points only; child movement and broader responsive/native evidence remain open.

## Checkpoint: attached editor and tree identity

The real `workspace-markdown-images-ui` smoke now verifies that the opened Markdown editor and workspace tree are descendants of the same sole document host before exercising the real drag and forged drop. The attributed smoke passed 1/1. This establishes the attached DOM relationship only; the retained identity across an actual child move is still unexecuted behind disabled Detach.

## Checkpoint: attached room regressions after host rework

The attributed filtered run of `attachments-panel-ui` and `two-window-room-ui` passed 2/2 after the one-container and drawer changes. These are existing attached-room interactions in Chromium; they do not exercise an enabled detached child or establish native behavior.

## Checkpoint: topbar and sidebar alignment

The existing `room-topbar-ui` smoke initially failed because the new disabled empty-room Detach button was the last topbar action, leaving no edge glyph for the workspace alignment contract. Moving the document controls before the existing Forget/settings icons restored the layout without weakening the smoke; the attributed `room-topbar-ui` and `sidebar-files-lineup-ui` run then passed 2/2. This verifies attached browser layout and Mac-look CSS only, not native window behavior.

## Checkpoint: default-browser phone drawer

The real `sidebar-reopen-ui` smoke was extended to a separate default-browser 390px context and initially failed because a collapsed zero-sized tree overflowed its slot and intercepted Show sidebar. Constraining the tree host's overflow fixes that path; after correcting a temporary diagnostic harness error, the attributed smoke passed 1/1 including opening Settings and selecting the invented Markdown file. UI assets rebuilt successfully; this is browser evidence only and does not execute a detached child.

## Checkpoint: attached tree tooltip

The `sidebar-reopen-ui` smoke now also hovers the actual tree file and verifies its tooltip appears and clears after the host clipping change. The attributed Chromium run passed 1/1, including the previously added desktop and phone drawer cases; child-host tooltip behavior remains unexecuted.

## Checkpoint: attached RAW and drag after clipping

The attributed `workspace-markdown-raw-ui` and `workspace-markdown-images-ui` smokes passed 2/2 after the collapsed-tree clipping change. These exercise attached editor/RAW and drag paths, not a child-host transfer.

## Checkpoint: child-close settlement deadline case

The detached smoke now specifies that an actual Home request held behind a real child close reaches the existing unavailable strip by the five-second settlement deadline, keeps the original room and rejects a competing Home, then continues only after the same child actually closes. Scripts typecheck passed. This case has not executed because Detach remains disabled; the deadline implementation and native abort/ack semantics remain open, and no passing child-close claim is made.

## Checkpoint: native stuck and late exchange case

The actual-shell `workspace-documents-native-ui` smoke now has an independent `T20_NATIVE_STUCK=1` mode that holds a real owner exchange, requests native close, checks one outstanding evaluation and retained visibility after the exchange deadline, then releases the real late result and checks it cannot revive the expired close. Scripts typecheck passed; neither this mode nor its assertions have executed because the host's sandbox-capable Electron environment has not been supplied. The existing malformed case remains separately unexecuted, and native behavior is not claimed.

## Checkpoint: scrolled tree tooltip

The attributed `sidebar-reopen-ui` smoke passed 1/1 with an invented long tree, including a real hover on its last scrolled entry and an intersection check that the tooltip remains visible. This checks the attached host's clipping behavior; it is not evidence for child-window overlays.

## Checkpoint: child tooltip case

The detached smoke now exercises a real hover in the child tree and requires the tooltip to appear in that child rather than the owner, then clear on pointer exit. Scripts typecheck passed; this case has not executed because Detach remains disabled, so R10 is still open.

## Checkpoint: attached tree scroll retention

The attributed `sidebar-reopen-ui` smoke passed 1/1 after verifying that an actual scrolled tree keeps its scroll position through sidebar collapse and reopening. This is attached browser behavior only; it does not add a scroll-history guarantee across host transfers.

## Checkpoint: browser Back with a dependent child

The detached smoke now specifies a real browser Back action while an actual registered child refuses to close: the room must remain visible, and the original history continuation may proceed only after that exact child closes. Scripts typecheck passed before the final equivalent history trigger refinement; the case remains unexecuted behind disabled Detach and does not establish R4.


## C7 option B decision (2026-11-12)

Controller reports Sascha accepted option B: only a frame navigated before first readiness by the trusted app parent's own script is outside the guarantee, because that parent already has the snapshot. Untrusted preview content and external pages remain covered, as do all other C7 requirements. The accepted ADR-0009 amendment and bounded reconciliation review are being prepared; until their exact source is provided, both real pre-readiness counterexample scenarios remain unchanged, Excalidraw remains red and HTML remains unexecuted. Earlier references to the human decision being pending describe the historical state before this decision. Detach remains disabled while the connected safeguards and real native evidence are incomplete.

## Checkpoint: moved-room Reload with a dependent child

The detached smoke now specifies two real room owners and a fake model: after the second owner replaces the conversation, the first owner's actual Reload must close its registered child before reading the replacement thread. Scripts typecheck passed. This case is unexecuted because Detach remains disabled; the current Reload admission is not yet wired to dependent-child shutdown and R4 remains open.


## Checkpoint: reviewed C7 option B reconciliation and right-pane regression

Merged the accepted ADR-0009 amendment at `7f74665ff65007351e90e4e3840b04b72b620d2c` and independent PASS review at `24d21c5a6bb03d5a3bab82b73eb3f5785ca128e6`, preserving their signed source commits. In the two preserved privileged-parent pre-readiness scenarios, the test now records exactly one 500-byte Excalidraw copy and one exact UTF-8 HTML copy, with byte-for-byte equality to the invented original fixtures; the historical zero-byte Excalidraw failure and previously unreached HTML observation are not relabelled as passes. Separate pre-ready `src`-change, foreign, repeated-ready and post-delivery checks retain their zero-byte requirements, as do the other CSP, network, direct URL and policy assertions.

The first affected run exposed an independent one-container regression: folding the right pane hid the sidebar tree. The existing browser smoke supplied the red; correcting the host-slot selector preserved the tree, and the attributed `workspace-file-tabs-ui` run then passed 1/1 in 99 seconds. UI assets built successfully. This establishes attached browser behavior only; R11 child movement/snapshot tests, connected C3/C4/C5 safeguards, native environment and final conformance remain open.

## Checkpoint: child-close settlement deadline draft

The inactive host-commit path now starts a five-second settlement timer: if the same child has not closed, it shows the existing unavailable state and retains the original fenced action; a later actual closure is still handled by the original commit. UI and scripts typechecks and UI asset build passed; the attributed `two-window-room-ui` passed, while `workspace-detached-documents-ui` still stopped at disabled Detach (1/2 cases passed). The previously written real-child timeout, competing Home and late-closure assertions did not execute, so the draft is not evidence of a working deadline or abort/ack protocol; R6 remains open.

## Checkpoint: moved-room Reload draft

The real Reload callback now checks the resolved room status: if its actual destination replaces the current conversation and a child exists, it waits for that registered child to close before opening the replacement. Same-conversation resume no longer clears and recreates the context key. UI and scripts typechecks, UI asset build and the attributed `two-window-room-ui` smoke passed 1/1 for existing attached paths. The new real-child moved-room test remains unexecuted at disabled Detach; same-context child behavior and Reload failure paths still require targeted verification, so this is not R4 completion.

## Checkpoint: failed moved-room Reload draft

The real-child Reload case now also faults the room-status response and specifies retaining the current room and child without a close request. The inactive child path reports that failure in the existing chat system-message channel instead of navigating away. UI and scripts typechecks and UI asset build passed; the attributed `two-window-room-ui` passed, while `workspace-detached-documents-ui` stopped at disabled Detach (1/2 cases passed). The new child failure assertion has not run, and same-context nested resume failure still needs verification.

## Checkpoint: failed same-context resume draft

The detached Reload case now specifies a controlled same-context status response followed by a failed real thread read; it requires the current room and child to remain. The inactive resume failure path now reports the error through the existing chat system-message channel when a child exists. UI and scripts typechecks, UI asset build and the attributed `two-window-room-ui` smoke passed 1/1 on attached paths. The new real-child assertion remains unexecuted while Detach is disabled; this is not R4 completion.

## Checkpoint: same-context Reload case

The real-child Reload scenario now also specifies a controlled same-context status and thread response: the existing Reload read and save must execute once while the same child stays open, before a subsequent genuine replacement requests closure. Scripts typecheck passed. This scenario has not executed behind disabled Detach; its controlled response fixtures and same-context behavior remain to be verified, and R4 is still open.

## Checkpoint: child selection and tab callbacks

The detached smoke now counts the real selected-file read and verifies one selection, no document write and no child closure, while the preceding actual tab-close callback leaves the child open without writing. Scripts typecheck passed. These assertions remain unexecuted behind disabled Detach, so the round-2 C4 callback requirement is not yet proven.

## Checkpoint: post-adoption failure recovery draft

The detached smoke now injects an append failure after the real host has been adopted into the child and requires the fenced unavailable state and same-attempt Return without a write. The inactive move path now treats any failure after adoption as unknown instead of releasing the arbiter after an ordinary rollback. UI and scripts typechecks and UI asset build passed; the attributed detached smoke still stopped at disabled Detach, so the new fault and recovery assertions did not execute and C3 remains open.

## Checkpoint: native owner endpoint red

Added `workspace-documents-owner-ui` as a supplemental real-browser check of the actual owner endpoint's non-enumerable installation, hello binding, replay and malformed-input refusal. The attributed run failed 0/1 because the owner endpoint does not yet exist. This is test-first evidence for the owner seam only; it is not the real shell exchange, native lifecycle, permit registration or platform evidence, all of which remain open and sandbox-blocked.

## Checkpoint: native owner handshake draft

The owner now installs the approved non-enumerable synchronous private endpoint, binds a valid initial hello, returns the current owner/context stamp, replays an identical sequence, and refuses malformed or unsupported requests. Only hello and empty polls are implemented; no close, permit, child registration, abort or other native action can be authorized by this draft. The attributed `workspace-documents-owner-ui` browser supplement passed 1/1 after its initial missing-endpoint red, including reordered replay and invalid-input checks; UI asset build and the earlier typechecks passed. This invokes the actual owner endpoint from an isolated browser page, not from the native shell, and is not C5 integration or native evidence.

## Checkpoint: native shell polling draft

The desktop shell now starts the approved private pull mechanism after an exact-origin main-frame load, sends only hello/empty polls, validates the returned binding and stamp, and keeps at most one evaluation outstanding even across navigation. Its two-second timeout ignores a late reply and waits for the outstanding evaluation to settle before polling again. Desktop typecheck and desktop bundle build passed. This is a passive, incomplete transport draft: it does not yet protect native close/quit/reload/update, issue popup permits, register children, process action or abort messages, or establish native evidence; the actual-shell malformed/stuck tests remain blocked by the host sandbox. Detach remains disabled.

## Checkpoint: explicit empty-session response

The owner endpoint now returns `no-session` only for an exactly bound native preparation when its current context, retained document state, child and pending work are all absent. A null observed stamp with a current room instead returns an invalidated refusal carrying the actual current stamp; unsupported valid-session actions remain fail-closed. The supplemental `workspace-documents-owner-ui` test first failed on the missing empty response and then on the missing active-room refusal; the attributed final run passed 1/1, including replay, wrong binding, malformed stamp and sequence checks. UI and scripts typechecks and UI asset build passed. This is owner-endpoint browser evidence only: the shell does not yet issue native preparations or validate these results, and native actions and child registration remain unimplemented and untested.

## Checkpoint: native owner response correlation

The supplemental owner browser smoke now also checks the exact binding, request ID and disposition echoed in empty-session and active-room refusal responses. The attributed run passed 1/1. This still does not exercise the native shell or a native lifecycle continuation.

## Checkpoint: owner invalidation after identity change

The supplemental owner smoke now injects an invented `person_changed` response at the existing workspace read and verifies the old endpoint refuses another poll. Its first run timed out because the normal identity-change reload replaced the page before the assertion; the fixture now uses the existing browser beforeunload refusal pattern to retain the invalidated page, and the attributed rerun passed 1/1. This checks the real UI owner in a browser and does not establish native shell behavior.

## Checkpoint: clean native prepare and matching abort draft

The owner endpoint now accepts a correctly bound clean current-context native prepare, fences and reserves the existing arbiter, and acknowledges only a matching abort before releasing it. The supplemental `workspace-documents-owner-ui` run went red on the missing prepare and then passed 1/1, including real Home attempts while reserved and a foreign abort. UI and scripts typechecks and UI asset build passed. Dirty/save/commit/child-closed paths and actual shell integration remain missing; this browser invocation is not native evidence. Controller was separately asked how the accepted protocol reserves and safely completes an empty-session action if a room is entered before its reply is consumed; native continuations remain disconnected while that ordering is resolved.

## Checkpoint: sandboxed native harness now launches

After Controller relayed Sascha's approved worktree-specific sandbox environment, the attributed `xvfb-run -a npm run smokes -- --jobs 1 workspace-documents-native-ui` launched the actual isolated Electron shell with `chromiumSandbox: true`. It failed 0/1 at `a malformed owner exchange cannot authorize native close-to-hide`: the actual main close still hides the window when the owner exchange is malformed. This is an actionable native red, not an environment failure or native support claim; no sandbox bypass or host-policy change was used. The existing empty-session ordering question and native lifecycle, child registration and bounds work remain open.

## Checkpoint: sandboxed native close prevention draft

The actual sandboxed Electron harness first failed because malformed owner output allowed main close to hide the window. The main close handler now prevents that native close synchronously while the C5 continuation is disconnected. With `chromiumSandbox: true` under the approved Xvfb environment, the attributed malformed and `T20_NATIVE_STUCK=1` runs each passed 1/1; the latter observed no overlapping evaluation while held and no hide after the late reply. Desktop typecheck and bundle build passed. This is deliberately incomplete: **ordinary main close-to-hide is currently blocked for every session**, valid no-session and prepared continuations are not connected, and quit/update/reload/child handling remain unguarded; these two negative tests do not establish native support or R3/R5 completion.

## Checkpoint: dirty native Cancel draft

The owner endpoint now enters the existing dirty-document guard for a matching native prepare, queues the matching Cancel refusal, and retains the draft and arbiter until a matching abort; Save/Discard paths are staged to publish their prepared result rather than execute a continuation. The supplemental browser owner test first failed on the missing dirty preparation and then passed 1/1 with a real edited Markdown file, Cancel, competing Home and matching abort. UI and scripts typechecks and UI asset build passed. Native shell integration, sent-write/Save/Discard/commit evidence and child handling remain open; the browser owner check is not native proof.

## Checkpoint: native owner Save supplement

The supplemental owner smoke now holds the actual invented Markdown PUT response during a native prepare, verifies that no allow is emitted while it is pending, and then checks the confirmed source and newer prepared draft stamp before a matching abort. The attributed browser run passed 1/1. This exercises the real UI editor and owner endpoint with a controlled requester, not the native shell, and does not yet establish native close/commit or child behavior.

## Checkpoint: abort during a sent Save

The real UI owner test held an invented Markdown PUT, sent native abort before its response, and initially failed because the later Save replaced the requester's original correlation with a prepared allow. The owner now marks that attempt as aborting, keeps the arbiter and editor fenced, rejects changed messages while acknowledgement is missing, and acknowledges only the original matching abort after the sent write settles; it does not publish a late allow. The attributed `workspace-documents-owner-ui` browser supplement passed 1/1 after the fix, including competing Home and a subsequent empty poll; UI and scripts typechecks and UI asset build passed. This is not yet a shell-to-owner/native close round trip, and unknown-write, child and native commit paths remain open.

## Checkpoint: join a sent save

The owner now admits a matching native request while an existing Markdown write is in flight, fences the editor, waits for that write without issuing a second PUT, and uses the resulting current stamp for preparation. A matching abort remains reserved until the write settles and cannot produce a late allow. The `workspace-documents-owner-ui` test first failed because admission returned null; after the change its attributed run passed 1/1 with a held real PUT, one write, and a separate abort-during-join scenario. An earlier fixture attempt reported an already-handled route during failure cleanup; the fixture now waits for the held response to finish. UI and scripts typechecks and UI build passed, and the attributed `two-window-room-ui` run passed 1/1. This remains browser owner-endpoint evidence only; shell continuation, detached child, native commit and platform acceptance remain open.

## Checkpoint: no-child commit handshake draft

The supplemental owner test first failed because native commit was unsupported. The owner now validates a current prepared correlation, reports committed while retaining the fence, rejects stale no-child evidence, and reports completed only after the matching explicit `child-closed` input; a matching final receipt releases the reservation. The attributed `workspace-documents-owner-ui` run passed 1/1 after the fix, and UI/scripts typechecks and UI build passed. This is a controlled browser sender for the no-child case: the actual shell does not yet generate or consume these messages, and registered-child teardown and native continuation remain unimplemented.

## Checkpoint: bounded native write join

The owner browser test accelerated only the specified 30-second join timer while holding the real invented Markdown PUT, and first failed because no unknown result was emitted. The owner now emits unknown at that bound and retains the arbiter until the write settles and the matching abort is acknowledged. The attributed `workspace-documents-owner-ui` run passed 1/1; UI/scripts typechecks and UI build passed. This is controlled browser endpoint evidence, not a native shell round trip.

## Checkpoint: actual native close sends preparation

The sandboxed Electron test initially failed because a real main-window close never sent `native-prepare`. The close handler now queues one private hide preparation against the most recently validated owner binding and stamp, preserves an identical envelope on retry, and strictly validates the staged no-session reply without continuing the close. The attributed `T20_NATIVE_PREPARE=1` sandboxed native run passed 1/1; the malformed and `T20_NATIVE_STUCK=1` native runs also passed 1/1 each, and desktop typecheck/build passed. This is a partial actual shell/owner exchange: active-session guard results, abort, commit, child evidence and all native continuation are not yet connected. Ordinary close-to-hide remains blocked, quit/update/reload remain unguarded, and the no-session ordering escalation remains unresolved; these tests do not establish native support.

The attributed sandboxed `T20_NATIVE_PREPARE=1` rerun additionally observed the actual owner's `no-session` reply to that shell request (1/1); the shell still withholds continuation.

## Checkpoint: sandboxed active-room prepare

The native fixture now creates an invented isolated room and local fake-model configuration without calling a model API. Its first attempt stopped at the AI-setup gate; after fixture configuration, the actual shell repeatedly sent the same preparation because it did not validate the real active-room prepared response. The shell now validates its exact binding, request, action, current stamp and generation before accepting that response, while retaining prevention and not yet committing. The attributed `T20_NATIVE_ACTIVE=1` run passed 1/1 in sandboxed Electron; `T20_NATIVE_PREPARE=1` also passed 1/1, and desktop and scripts typechecks and desktop build passed. Dirty asynchronous results, abort, actual child registration/closure and native continuation remain unimplemented; ordinary hide is still blocked and quit/update/reload remain unguarded.

## Checkpoint: actual no-child commit and evidence

The sandboxed active-room native test first failed because the shell stopped after preparation. For the currently enforced no-document-child state, the shell now sends a matching native commit, validates the actual owner acknowledgement, supplies explicit no-child evidence using the committed context and host generation, and validates the completed reply. The attributed `T20_NATIVE_ACTIVE=1` run passed 1/1 in the actual sandboxed shell and owner; the empty-session native run also passed 1/1, and desktop typecheck/build passed. The shell still withholds native hide and has no registered-child implementation: this staged exchange must be revised to use the concrete registered child's actual closed evidence when child support is connected. Dirty prompt/abort, native continuation, other lifecycle entry points and Mac evidence remain open.

## Checkpoint: native dirty Cancel and abort

The actual sandboxed shell test now creates an invented local workspace, edits its Markdown, triggers native close and clicks the existing Cancel dialog. The first run failed because the shell retried preparation without consuming its asynchronous refusal. The shell now accepts a pending preparation, polls for a strictly correlated prepared/refused/unknown result, sends matching abort for refusal/unknown, and releases its attempt only on a validated abort acknowledgement. The attributed `T20_NATIVE_DIRTY=1` run passed 1/1, proving the actual draft remains and a second close opens a fresh prompt; clean active and malformed shell runs passed 1/1 each. Desktop/scripts typechecks and desktop build passed. Save/Discard outcomes, timeout and late-abort faults, real child registration/closed evidence, native hide and quit/update/reload integration remain open.

## Checkpoint: actual native Save with held write

The sandboxed `T20_NATIVE_SAVE=1` test edits an invented Markdown file, triggers the real native close and holds the resulting actual PUT response after Save and continue. The owner did not complete while held, then reached one matching no-child completion after release with exactly one PUT; the attributed run passed 1/1. The initial fixture run timed out looking for a button labelled `Save`; the existing UI label is `Save and continue`, and the corrected test passed. This still withholds native hide and does not prove registered-child, timeout, updater or Mac behavior.

## Checkpoint: expired native preparation and late abort

A sandboxed native fault held the actual prepared reply beyond the two-second exchange deadline. The first fixture held every retry and only showed a missing abort; after limiting the fault to the first reply, the test exposed a real late-allow bug: replay could start commit after expiry. The shell now consumes a valid late prepare only to queue its matching abort, never commit; malformed or other expired exchanges stay fail-closed, and a late matching abort acknowledgement may release only that attempt. `T20_NATIVE_LATE=1` passed 1/1 after the fix. `T20_NATIVE_LATE_ABORT=1` held the actual abort reply, confirmed another close stayed reserved, released the late acknowledgement and then opened a fresh attempt (1/1). Its first retry assertion raced normal editor autosave, so the isolated fixture now delays that existing timer to keep the draft dirty. The attributed stuck-exchange run passed 1/1 again; desktop/scripts typechecks and desktop build passed. Registered children, normal native continuation and other lifecycle entry points are still open.

## Checkpoint: native Quit prevention

The actual sandboxed `app.quit()` initially stopped the shell and server without consulting the owner. Normal Quit now synchronously prevents that path and queues the existing native preparation with disposition `quit`; startup-failure and already-authorized updater paths retain their existing handling. The attributed `T20_NATIVE_QUIT=1` run passed 1/1, observing one real quit preparation and no shutdown, and `T20_NATIVE_DIRTY=1` passed 1/1 after the shared-action change; desktop/scripts typechecks and desktop build passed. Test cleanup initially used `app.exit` before stopping the isolated test server, leaving owned processes on five runs; each was stopped, and the fixture now identifies its own listening port, exits the shell and stops that specific server, with the final Quit run finishing in 4 seconds. **Normal Quit, like close-to-hide, remains blocked until native continuation is implemented; updater and reload are still unguarded.** `app.exit` is used only for test cleanup and is not evidence of a normal native Quit continuation.

## Checkpoint: native View reload prevention

The real Electron View reload command first reloaded without owner preparation. The menu now routes main-window Reload and its existing Command/Control+R shortcut through the private native guard with disposition `reload`; unrelated existing artifact windows retain their reload behavior. The attributed sandboxed `T20_NATIVE_RELOAD=1` menu test and `T20_NATIVE_RELOAD_KEY=1` keyboard test each passed 1/1, and desktop/scripts typechecks and desktop build passed. The first fixture invocation supplied the wrong Electron menu callback argument and was corrected before the real red. Reload remains prevented pending continuation, and registered document children will need their own return handling before Detach can be enabled.

The attributed sandboxed native test also passed with `T20_NATIVE_DIRTY=1 T20_NATIVE_QUIT=1` and with `T20_NATIVE_DIRTY=1 T20_NATIVE_RELOAD=1` (1/1 each): the real Quit and View reload paths both reached the existing dirty guard, Cancel kept the edited draft, and a matching abort allowed a fresh attempt. These were prevention/abort checks before the C5 no-session amendment below.

## Checkpoint: private native popup permit draft

The actual sandboxed owner initially emitted no popup arm for a selected room. The owner and shell now exchange a bound `arm-popup` and a fresh one-use-intended permit whose frame name contains only a random UUID; the owner checks the request and context/host generation, disarms on context change, expiry or a competing guarded action, and the shell revokes its local grant when a native exit starts. The attributed `T20_NATIVE_ARM=1` run passed 1/1 and checked the opaque selector, and actual dirty and clean native guard runs passed 1/1 each after the change. The first dirty fixture rerun used a stale sampled draft stamp because instrumentation had moved before editing; it now waits for the next real owner poll. UI/desktop typechecks and builds and the owner browser supplement passed. **This is only permit exchange: the shell still denies document popups, actual opener/child registration and one-use enforcement are not implemented, and Detach remains disabled.**

## Checkpoint: actual native popup registration draft

The sandboxed native popup test first failed because even the live permit was denied. The shell now permits one exact unexpired opaque selector, consumes it, verifies the actual child and top-frame opener before sending `child-registered`, keeps sandbox/context isolation, and prevents the registered bootstrap from navigating or opening external URLs. The real owner acknowledges the bound registration; an actual subframe opener is rejected. The shell withholds no-child evidence whenever a concrete child has been registered, including after destruction until the matching child-closed protocol exists. Attributed `T20_NATIVE_POPUP=1` and `T20_NATIVE_FOREIGN=1` passed 1/1 each; the owner browser supplement passed 1/1, and UI/desktop/scripts typechecks and builds passed. The test initially mistook a still-closing WindowProxy for a newly created child; it now waits for actual destruction and asserts no new BrowserWindow. Another fixture run hit a delayed What's New overlay and passed after waiting for page readiness. This is a staged empty child: Detach, host adoption, native Return, actual child-closed delivery, bounds and native continuations remain unimplemented.


## C5 empty-session decision and independent-review checkpoint

Sascha decided C5 no-session option 1 on 2026-11-12: the live owner allocates a correlated one-use reservation, prevents room/session entry until the matching native action is committed or aborted, returns the cached result for exact replay, and fails closed on timeout or unknown. The reconciled ADR-0009, C5 register and spec record the exact attribution and an empty-context correlation plus explicit no-child/completion ordering for independent review. The popup/child work is checkpointed at `4b406cd` and pushed. The existing unreserved `no-session` implementation remains unchanged and must not authorize a native continuation; no C5 implementation changes or new no-session tests were made under this checkpoint. Pending independent PASS, the developer must first write failing tests through actual owner/shell endpoints for the room-entry race, matching commit/abort, exact replay and timeout/unknown, then implement and test the reviewed contract. C7-B and all other C5 rules remain in force. Normal close, Quit and reload still remain blocked; updater handling, child teardown, Detach, geometry and the final targeted verification remain unfinished.

## Checkpoint: C5 empty-session reservation and native Quit

Independent Architect PASS `d314456c1b5403379ca1f7afa9ffa5aa694bc10c` was fetched from `agents/t20-c5-amendment-specreview` and read without checking out or editing that ref. Before C5 production edits, the real owner UI regression failed on its missing `EmptyCorrelation` and the sandboxed real-shell Quit regression failed because the empty path never committed/completed or continued. The owner now reserves its existing arbiter on a confirmed empty native prepare, returns an owner/session/request/disposition-bound empty stamp, requires exact commit and `child:null`/`transfer:null`/`context:null` evidence before `completed`, retains through the native-completed receipt, and releases only on matching abort. The shell validates the empty correlation, rejects a late response after the bounded deadline, sends the explicit no-child evidence, and invokes the native continuation once after matching completion; normal Quit uses a one-use permit through the existing before-quit/shutdown path.

Evidence: `workspace-documents-owner-ui-smoke.ts` passed 1/1 after asserting room entry remains fenced, changed disposition/stale binding/malformed/active substitution are rejected, commit/evidence/completion ordering and replay are exact, and matching abort replay cannot continue. Its earlier red was the missing correlation; a separate first red also showed room entry was not fenced. Its second page verifies empty abort, wrong-request rejection, replay and post-abort commit refusal. Its third page holds a real room-creation PUT in flight and confirms the owner endpoint returns unknown rather than `no-session` during that transition, then permits the room entry after the held response settles. `T20_NATIVE_QUIT=1 workspace-documents-native-ui` passed 1/1 with sandboxed Electron, observing one actual native commit, completion and exactly one second `app.quit()` continuation; its initial red observed no commit/completion. After final UI/desktop builds, `npx tsc --noEmit -p apps/web-ui/tsconfig.json`, `npm run typecheck:scripts`, desktop typecheck/build, and the attributed owner smoke passed. Attributed `T20_NATIVE_QUIT=1`, `T20_NATIVE_PREPARE=1`, `T20_NATIVE_ACTIVE=1`, `T20_NATIVE_LATE=1`, and `T20_NATIVE_STUCK=1` each passed 1/1 in sandboxed Electron; clean active and empty native close now continue only after matching completed evidence. Late/held transport evidence is from the existing active-context shell paths; a dedicated held empty no-session response regression remains a debt candidate. No Mac/native support claim is made. Final C5 conformance mapping, remaining I/R acceptance work and candidate MAC-TASK remain open.

Follow-up endpoint verification after the C5 checkpoint: `T20_NATIVE_EMPTY_LATE=1` holds the actual empty-session `native-prepare` reply beyond the two-second shell deadline, then releases that exact reply. The sandboxed Electron case passed 1/1 and verified the Quit owner stays visible, no commit occurs, and no abort acknowledgement is inferred from a correlation the shell never received. The rerun of `workspace-documents-owner-ui` passed 1/1 with the existing real in-flight room-entry fence and exact replay/abort assertions; `npx tsc --noEmit -p apps/web-ui/tsconfig.json` and `npm run typecheck:scripts` passed. This closes the dedicated empty-response timeout gap; platform and broader I/R items remain open.

## Checkpoint: detached browser-editor readiness and recovery blocker

The detached UI smoke now verifies that an actual child task-checkbox click becomes Unsaved, and that an external preview link uses only the child's fake opener without a network request. The editor uses its current document's native `change` event so the real checkbox event is recognized across the adopted popup document, then marks the user edit after Tiptap processes it; preview-link interception is attached to the actual preview host for the same cross-document path. The Detach control is enabled again once the initial document safeguards are present. Related changes preserve the actual detached HTML snapshot sender check (owner parent or opener only), iframe readiness handling and stylesheet bootstrap.

Final cleaned-source checks: `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts && git diff --check` passed, and the attributed UI-only production build passed. The attributed `npm run smokes -- --jobs 1 workspace-detached-documents-ui` run remains red after 47.0 seconds: all preceding checkbox, external-link, Return, held-Save and conflict-retention steps pass, but after unexpected child closure the owner retains the conflict and shows the attached Detach control, and clicking it does not produce the expected popup within 30 seconds (`workspace-detached-documents-ui-smoke.ts:482`). A temporary native-button listener experiment was removed; its run timed out at the smoke runner's 300-second ceiling without assertion output, so it is not evidence of a fix. No temporary diagnostics remain in the product source.

Changed files in this checkpoint: `apps/web-ui/src/App.tsx`, `apps/web-ui/src/components/MarkdownEditorPane.tsx`, `apps/web-ui/src/components/WorkspaceFramedPreview.tsx`, `apps/web-ui/src/components/WorkspaceHtmlPreview.tsx`, `apps/web-ui/src/components/workspace-hover-tooltip.tsx`, `apps/web-ui/src/docs-window.ts`, `apps/web-server/src/room-settings-routes.ts`, and `apps/web-server/scripts/workspace-detached-documents-ui-smoke.ts`. Tests added/strengthened: the public detached smoke's child-checkbox checked/Unsaved assertions and exact child-vs-owner external fake-opener/network counts. Assumptions and limits: all fixtures are invented; Chromium browser evidence does not establish native Mac support. Debt/blocker: identify why the Detach callback is not reached after child-close recovery, rerun the whole detached smoke green, then complete the remaining checklist-to-test mapping for I1–I10/R1–R15, final merge and MAC-TASK. No new public export, route, dependency or store was added.

## Checkpoint: reopened child native handlers and raw source

The earlier detached smoke blocker is resolved. After the editor host returns from a closed child and is detached again, React's delegated handlers did not reliably reach the new document. The detach action now has a listener on its actual button, the Keep mine action binds to the current host document and rebinds on host generation, and RAW input/selection listeners bind to the actual textarea when RAW mode mounts and when the host generation changes. This keeps the existing editor state and write path while making the reopened child editable and its conflict action operative.

The real `workspace-detached-documents-ui-smoke.ts` first reproduced the RAW regression: filling the reopened child's source left status `Saved`, Save disabled, and the write bypassed the controlled route. The retained assertion `typing in the reopened child enables Save` now passes; the same smoke also proves the reopened conflict UI, actual popup/opener, Keep mine write, unknown-write fencing and child close recovery, and passed 1/1 in 39.7s. The attributed UI build passed, and `npx tsc --noEmit -p apps/web-ui/tsconfig.json && npm run typecheck:scripts && git diff --check` passed. All debugging counters, geometry probes and progress logs were removed. This closes the current detached smoke blocker only; the I1–I10/R1–R15 mapping, remaining native evidence and candidate MAC-TASK remain open.

## C6 geometry checkpoint

The actual Electron owner/shell smoke now injects the existing `window-state.json` with a valid but oversized/offscreen documents record, opens the child through the one-use opaque permit, checks restored outer bounds against the current work area (x/y exact and width/height within the measured one-DIP Xvfb rounding), and verifies a subsequent child move persists exact normal bounds without replacing the main-window record. Closing the child flushes the exact final bounds with schema/source/maximized checks retained. The first production run caught repeated child registration effects resetting later movement; an idempotency guard prevents reapplying registration, and rebuilding the desktop bundle before the attributed native smoke confirmed the actual compiled shell passes. Test: `GATE_TASK=T20-HARDEN GATE_WORKER=t20-harden GATE_ROLE=Developer GATE_AGENT=codex GATE_MODEL=gpt-6.1-terra GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate bash -c 'T20_NATIVE_BOUNDS=1 xvfb-run -a npm run smokes -- --jobs 1 workspace-documents-native-ui'` passed 1/1; `npm --prefix apps/desktop run build`, desktop typecheck, scripts typecheck, web UI typecheck, and `git diff --check` passed. This is Linux/Xvfb evidence only: missing-state/no-display fallback, multi-display selection/removal, real Detach-to-native-child integration, platform evidence, remaining I/R mapping, final merge, and MAC-TASK are still open.

The same native smoke now also rejects a corrupt persisted source record and verifies the documented centered 900×700 fallback in the main window's current display work area. `T20_NATIVE_BOUNDS_FALLBACK=1` through the attributed `workspace-documents-native-ui` gate passed 1/1; scripts typecheck and `git diff --check` passed. Missing state uses the same code path, but explicit missing-state injection, display topology variants and native platforms remain unverified.

## Native Detach integration checkpoint

The owner Detach path now consumes the live opaque C5 frame selector, reuses the permit's request ID, recaptures and checks current owner/context/host admission, waits for the actual owner endpoint's child-registered acknowledgement before moving the portal, and keeps native Detach unavailable until a permit arrives. Return clears the consumed permit so the endpoint can rearm. A real Electron native smoke progressed through the top-frame popup, owner acknowledgement, host adoption and in-app navigation protection; the guard returned the same host to its original room. The smoke then stopped making progress while waiting for the next fresh Detach permit after Return. The attributed full run ended at the smoke runner's 300-second timeout (0/1); its last recorded phase was the post-Return permit wait, with no second child created. This rearm behavior remains unresolved and the change is not complete.

The strict C6 placement and restored-bounds comparisons were restored to exact `JSON.stringify` equality per Controller direction. The attributed `T20_NATIVE_BOUNDS=1` run now fails on Linux/Xvfb because the injected expected work area is `{x:0,y:0,width:1280,height:1024}`, while the actual visible child reports `{x:0,y:0,width:1279,height:1023}` from both `getBounds()` and `getNormalBounds()`; its content bounds are `{x:0,y:27,width:1279,height:996}`. The one-pixel difference has not been explained, and no tolerance or unverified compensation is retained. This remains a hard verification gap; the exact assertions are intentionally strict.

Tests/evidence at this checkpoint: `T20_NATIVE_DETACH=1` through attributed `workspace-documents-native-ui` reached actual owner/child registration, adoption and safe in-app navigation return, but overall result 0/1 at 300s due the later rearm wait; exact `T20_NATIVE_BOUNDS=1` result 0/1 due the bounds mismatch; `T20_NATIVE_BOUNDS_FALLBACK=1` passed 1/1; desktop bundle build/typecheck, web UI typecheck/build, scripts typecheck and `git diff --check` passed. All fixtures use the isolated synthetic owner, room and fake OS opener. Remaining work includes diagnosing/fixing the Return rearm path and exact geometry boundary, completing C6 variants and the remaining I1–I10/R1–R15 mapping, running the remaining targeted suites, final origin/main merge, and Controller MAC-TASK. No Mac/native support claim is made.

Follow-up after adjacent regression coverage found one more listener lifecycle boundary: Reload unmounts RAW while the editor loads, so a later RAW remount also needs a binding. The new `typing after Reload updates the raw editor state` assertion failed before adding the loading phase to the binding dependencies. The attributed `workspace-markdown-raw-ui` rerun passed 1/1, as did the final-source `workspace-detached-documents-ui` run (1/1, 39.5s); `workspace-file-tabs-ui` passed 1/1 in the adjacent run. Final UI and scripts typechecks and `git diff --check` passed. The final UI build passed with only the repository's existing large-chunk warnings. The earlier adjacent combined run's RAW failure was a product regression, not load debt; no timeout-only failures are being classified as green.

## Follow-up: native Detach rearm and child-return diagnostics

The fresh-permit stall after Return is resolved in the current WIP: after the registered child is actually closed, the shell clears the consumed child permit record, and the owner clears its consumed permit before waiting for a new arm. The native Detach smoke now exercises the actual first Detach, safe in-app navigation return, fresh permit, second registered child, native Return control, and an external-navigation attempt using the fake opener. Its original exact host-count/URL/opener assertions remain; the child readiness wait now targets the visible Return button because `.docs-host` is intentionally `display: contents` and has no visible box. The owner and shell event evidence showed `beginChild` completed, the matching permit/opener was valid, and `moveToChild` returned `moved`; the redundant renderer-side `child.focus()` was removed because the shell already calls `child.show()` after registration.

Evidence on this follow-up source:

- `GATE_TASK=T20-HARDEN GATE_WORKER=t20-harden GATE_ROLE=Developer GATE_AGENT=codex GATE_MODEL=gpt-6.1-terra GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate bash -c 'T20_NATIVE_DETACH=1 xvfb-run -a npm run smokes -- --jobs 1 workspace-documents-native-ui'` passed 1/1 in 9.7s once, completing through `native-detach-scenario-passed`. An immediate repeat completed first and second child registration/Return but failed at the strict final owner DOM query after external navigation: the real child closed, the owner remained visible at its local URL, `loading=false`, `crashed=false`, and the external opener count stayed 0, but the owner DOM query did not respond within the diagnostic bound. This repeatability gap is unresolved; the single pass is not treated as clearing it.
- The exact `T20_NATIVE_BOUNDS=1` native run remains red 0/1: Xvfb work area `{x:0,y:0,width:1280,height:1024}`, actual child bounds `{x:0,y:0,width:1279,height:1023}`. Exact placement and restored-bounds assertions are retained.
- A fresh `T20_NATIVE_BOUNDS_FALLBACK=1` run failed the strict post-destruction completion check (`child destruction without a matching registered closure message cannot authorize no-child completion`) at `workspace-documents-native-ui-smoke.ts:395`; this requires reconciliation with the native evidence path and remains open.
- The attributed `workspace-detached-documents-ui` smoke passed 1/1 in 39.5s. `npx tsc --noEmit -p apps/web-ui/tsconfig.json`, `npm run typecheck:scripts`, desktop typecheck, desktop build, clean-source web UI build, and `git diff --check` passed.
- The earlier filtered seven-smoke sequence is recorded above as 7/7 after the browser endpoint fix; it predates this native follow-up and does not clear the native failures listed here.

Files in this follow-up worktree diff: `apps/desktop/src/main.ts`, `apps/web-ui/src/App.tsx`, `apps/web-server/scripts/workspace-documents-native-ui-smoke.ts`, `apps/web-server/scripts/workspace-detached-documents-ui-smoke.ts`, and this report. No screenshot binaries were added. Fixtures use invented isolated rooms and a fake OS opener. Remaining work is the post-close owner-renderer investigation, strict C6 geometry/platform resolution, the fallback closure-evidence regression, the full I1–I10/R1–R15 test mapping and other open acceptance items, final origin/main merge and candidate MAC-TASK; this candidate is not complete and makes no native/Mac support claim.

## Follow-up: strict native closure assertions and external-navigation rearm

The `if (!nativeDetach)` guard around the original owner-close and forged/matching child-closure checks has been removed. In the `T20_NATIVE_DETACH=1` branch, after external navigation is denied and the host is expected back in the owner, the smoke requires a fresh owner-issued permit and a newly registered native child for closure evidence (`apps/web-server/scripts/workspace-documents-native-ui-smoke.ts:394-415`). The shared, unconditional owner-close check asserts the actual child is still alive and completed is zero (`:445-448`); the matching/forged closure checks assert the actual one-use child identity, reject forged `child:null` with no completion, then accept the matching closure once (`:463-466`). There is no remaining `if (!nativeDetach)` in this smoke. The C6 bounds comparisons remain exact.

Current verification is not green. `npx tsc --noEmit -p apps/web-ui/tsconfig.json`, `npm run typecheck:scripts`, the affected UI and desktop package builds, and `git diff --check` pass. Against rebuilt bundles, the attributed native Detach gate log `/tmp/exxperts-smoke-failures/workspace-documents-native-ui-smoke.2307363.failed.log` reached external navigation and actual child closure, then timed out because no enabled fresh Detach permit appeared; `.2309396.failed.log` and `.2305536.failed.log` stopped earlier with second-child Return-button waits and child/shell renderer evaluations stalled. An earlier run `.2304918.failed.log` timed out waiting for the owner host after the external child closed. The strict closure assertions are in the native scenario but have not yet executed in a passing run. These results do not establish external-navigation recovery or clear the earlier fresh-permit claim: rearm after external-navigation-triggered close, host return and intermittent second-child renderer stalls remain open. No bounds tolerance or assertion weakening was added.

The restored closure assertions now also pass in `T20_NATIVE_BOUNDS_FALLBACK=1` through the attributed `workspace-documents-native-ui` gate (1/1, 9.8s), including strict persisted/current bounds equality, held native commit, live registered child, forged child-null rejection, and matching completion. This verifies the shared closure evidence path. It does not prove that the assertions execute in a passing `T20_NATIVE_DETACH=1` scenario: the latest rebuilt native run `.2318806.failed.log` stopped before external navigation at the second child Return-button wait, with owner and child renderer evaluations stalled and no console error; another run `.2313868.failed.log` failed the same retained-host assertion in 16s. A further bounded-diagnostic run `.2317983.failed.log` failed the second-child Return wait in 44s. The exact Return-enabled assertion remains present at line 415 and the native path creates that closure child at lines 394-416; no gate has been run with that assertion absent.
