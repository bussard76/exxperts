# Issue 20 — Developer report (in progress)

## Architecture impact

Level 3: ADR-0009 option A; chat-owned document session and portal in web UI, native lifecycle and placement in desktop, and existing HTML frame route. No new dependency, route, public package export, durable store, or unapproved architecture is authorized.

## Assumptions and evidence

The pinned independent round-2 review passes the frozen spec; its historical draft wording is superseded by the build dispatch. Tests exercise the real entrypoints and producer/consumer seams identified in the approved spec. Native Mac evidence remains a separate Controller-relayed task.

## Result and observable acceptance checklist

All items remain pending until supported by actual tests.

| Item | Required observable | Contract and evidence |
| --- | --- | --- |
| Item | Required result and observable | Frozen contract / future proving tests |
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
| ID / scenario name | Actual entry, producer → consumer, controlled conditions | Observable required before pass |

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

Pending implementation.

## Files, tests, assumptions and debt

Pending implementation.

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
