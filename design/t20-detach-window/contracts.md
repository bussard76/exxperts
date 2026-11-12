# T20 — frozen internal contract register

Status: author freeze v1, 2026-11-11, for a fresh different Architect's review; **not** a spec-pass verdict or implemented API. Governing architecture: [accepted ADR-0009](../../docs/adr/0009-detached-document-window.md), option A. Product choices are [Q1–Q10](front-options.md). [T20-HARDEN](../../docs/specs/T20-HARDEN.md) pins sources, implementation order and real-entry tests. Changing these technical details requires reconciled spec/conformance review; it does not require asking Sascha to choose every private field.

## 1. Owners and producer/consumer files

All names below are **future internal types/functions**; they do not exist on current main unless the source inventory says so. No package public export, preload/Node integration, server route, dependency or durable draft store is added. Relative imports inside apps/web-ui and apps/desktop may expose these private implementation types to their consumers; no package/barrel export is approved. Do not create a second App or socket.

| Contract | Producer → consumer | Sole semantic owner |
| --- | --- | --- |
| C1 identity/context | `App.tsx` → private `docs-window.ts`, editor and desktop adapter | App allocates owner/context/request identity before use; existing `persistentChat.agentId` and `.conversationId` are the room/thread authority. |
| C2 volatile editor/session | `MarkdownEditorPane.tsx`, `useMarkdownEditorSync.ts` → App-owned session → same editor surface | App lifetime retains data; editor remains the sole source-edit/save engine. This is volatile session state, not another store or writer. |
| C3 guarded host transfer | App controls/child lifecycle → `docs-window.ts` → actual attached/child DOM, editor and preview consumers | `docs-window.ts` owns the stable portal container and one registered child; App owns arbitration. |
| C4 prepare/abort/commit | App navigation/tab callbacks or native adapter → App arbiter/editor → requester | App holds one immutable pending action; no overwritten callback ref. |
| C5 native close and registration | `apps/desktop/src/main.ts` ↔ owner `App.tsx`/`docs-window.ts` endpoint | Desktop owns native prevention, permits, child binding and authoritative `closed`; owner supplies guard/transfer decisions. No renderer-selected native ID. |
| C6 bounds | registered child in desktop `main.ts` ↔ existing `window-state.ts` → actual BrowserWindow | Desktop is geometry authority; renderer supplies no desktop bounds. |
| C7 host/events/preview | `docs-window.ts` host binding → document components/overlays → actual frame window | Owning component binds the actual document/window; session owns snapshots; sandbox stays opaque. |
| C8 path routing/drag | chat references or `WorkspaceFileBrowser.tsx` → App selection / `in-room-chat.tsx` | Current session gates selection; existing composer insertion semantics and drag MIME stay. |

`docs-window.ts` is a private new file within the existing web UI module, selectively adapted from the prototype; its existence is not a separate module under ADR-0008. Native adapter code remains private to `main.ts`; `window-state.ts` retains geometry responsibility. No App-wide rewrite or generic message bus is needed.

## 2. C1: identities, allocation and validation

**Controller compatibility clarification, 2026-11-11:** The owner realm uses `crypto.randomUUID()` when callable; only if unavailable, it uses that realm's `crypto.getRandomValues` on 16 bytes, with UUIDv4 version and variant masks and canonical formatting. A missing or throwing primitive fails closed without another fallback or authority. Shell-originated C5 request and permit producers remain unchanged. The independent [C1 compatibility review](../../docs/reviews/T20-C1-COMPAT-architecture-spec.md) records this narrow correction; it is not a new Sascha decision or ADR change.

```ts
type Generation = number; // positive safe integer, increments; never wrap/reuse
type OwnerId = string;    // fresh owner-realm UUIDv4 per App mount; never persisted
type RequestId = string;  // fresh owner-realm UUIDv4 per admitted owner action
type Context = {
  ownerId: OwnerId;
  ownerGeneration: Generation;
  roomId: string;         // exactly persistentChat.agentId
  conversationId: string; // exactly persistentChat.conversationId
  roomGeneration: Generation; // context incarnation, includes conversation changes
};
type Stamp = Context & { hostGeneration: Generation; draftGeneration: Generation };
type Correlation = { requestId: RequestId; stamp: Stamp; action: Action };
```

Owner generation starts at 1 and increments on disposal/rebinding before rejecting old work; a remount gets a new ownerId as well. `roomGeneration` starts at 1 for the first selected context and increments **after successful child shutdown and immediately before** each room/conversation replacement, including leave/re-enter of the same IDs. Null selected chat means no document context, not empty strings. Every async continuation captures Context and validates it against current refs before touching tabs, focus, editor or HTTP results. Server responses use existing agentId/conversationId/path fields; local generation fencing wraps consumption without changing server contracts.

`hostGeneration` starts at 1 attached; increments once at transfer commit or confirmed unexpected-host loss, not on focus or failed open. `draftGeneration` starts at 1 per context, increments synchronously for any source/baseline/revision/mode/dirty/conflict/permission/write-status change, including autosave completion. It does not increment for focus, viewport or polling. Fields are required; no coercion of missing/NaN/negative/string generations. Unknown identity or mismatched stamp yields `invalidated`, never allow. Multiple App owners on the same room remain independent; server revision checking remains their shared safety net.

An admitted action records its initial stamp. Once its inputs are fenced and current write work settles, the owner creates **one final prepared stamp** with the same context/host and latest draftGeneration. Replies/abort/commit/completion echo that exact final Correlation; the requester replaces its initial stamp only on the matching `prepared` result. Unexpected subsequent draft changes invalidate allow and abort that action. RequestId stays constant. A refusal before prepared echoes the original admitted correlation even if settling a write advanced local draftGeneration; after prepared it echoes that published final correlation. Abort accepts exactly the requester-known original or published final correlation for this same active request/action; it never accepts an unrelated stamp or target. This makes Cancel/refusal observable without mistaking expected save-state updates for a foreign reply. The prepared stamp is never reused for another target.

## 3. C2: retained volatile session and write authority

```ts
type EditorMode = "edit" | "preview" | "raw";
type FileState = {
  path: string; source: string; baseline: string; expectedRevision: string;
  rawSource: string | null; trailingNewlines: string;
  userEdited: boolean; dirty: boolean; canEdit: boolean;
  phase: "ready" | "saving" | "conflict" | "error";
  error: string | null;
  conflictRevision: string | null;
  externalContent: string | null;
  lastSavedContent: string | null;
  mode: EditorMode;
};
type WriteState =
  | { kind: "idle" }
  | { kind: "pending" | "unknown"; writeId: string; path: string;
      source: string; expectedRevision: string; submittedDraftGeneration: Generation };
type DocumentSession = {
  context: Context; paths: string[]; activePath: string | null;
  editor: FileState | null;
  loadView: { path: string; phase: "loading" | "error"; error: string | null } | null;
  write: WriteState;
  draftGeneration: Generation;
};
```

`paths` are unique ordered workspace-relative paths, activePath belongs to them or is null. Current main has one active Markdown editor, not simultaneous dirty writers per tab; preserve that rule and existing switch guard. `editor:null` means no loaded Markdown (including non-Markdown selection); loading/error-before-load is retained in loadView, never an invented empty draft. editor and loadView cannot both be non-null; both null means no Markdown selection. Once loaded, FileState is required in full. `source` is the exact current logical Markdown source; RAW text is exact, including CRLF/trailing newlines. `rawSource:null` means rich editing is now authoritative, distinct from empty RAW text. `baseline` is the last confirmed save/discard baseline; expectedRevision remains the existing opaque server revision string. `externalContent:null` means no staged external content; empty string is valid content. `conflictRevision:null` is an unresolved/unknown server revision, not permission to overwrite. These fields account for `baselineRef`, `rawRef`, `trailingNewlinesRef`, `userEditedRef` and sync pending/last-saved state on current main.

The session is retained in the chat React owner, outside the child DOM lifetime. Every editor mutation updates its authoritative volatile fields synchronously before yielding. Rich-editor transactions may serialize after a real edit as today; open, search, mode display and host transfer never create a save/normalization. Preserve current autosave behavior (approximately one-second dirty timer, not a last-keystroke guarantee); pause scheduling while transfer/close fences are held, without changing its product policy. Preview/RAW/file-load effects must not reset the retained editor because a host changed.

The single save Promise/controller lives with this owner-retained editor engine. Prefer preserving the same editor instance/stable portal node through ordinary host movement; if an engine must be reconstructed after confirmed destruction, restore this full state **before** binding any writable surface. Restore result is `restored` or `refused("invalidated"|"busy"|"snapshot-unavailable")`, not a partial best-effort restore. No second engine while old input/save callbacks can mutate. No new guarantee of undo, selection or scroll history is introduced.

### Pending, failed and unknown writes

One HTTP PUT at a time through current `putWorkspaceMarkdownFile`; writeId is local only. Header save, keyboard save, autosave and guard Save join the **same** save Promise. While ordinary saving permits further typing, completion marks only the submitted source saved, compares the latest source and sends any later edit sequentially using the returned revision as existing code does. A late response never clears newer source or another context's draft. For destructive prepare, freeze input and new scheduling first, then join the latest-save drain. A clean dirty-bit with a pending/unknown write is not ready.

Explicit HTTP success confirms its returned content/revision; 409/conflict keeps source and Reload/Keep mine. Definite permission/error replies refuse guard Save and retain the draft. Lost response, aborted transport or 30-second write wait becomes `unknown`, not a failed/no-op write. Do not resend, Discard into teardown, run Keep mine concurrently or infer failure from an AbortController. Use the existing GET after the original transport is terminal:

- If current content is exactly the submitted source with a revision different from submitted expectedRevision, its effect is observed; adopt that baseline/revision, retain any newer edits, and drain only after revalidation.
- If current revision differs from submitted expectedRevision and current content differs from submitted source, retain the local source and record conflict/externalContent. Current server compare/recheck-and-rename is synchronous, so a still-late old request with the old revision cannot overwrite that different revision. Conflict stays explicit; no automatic Keep mine.
- If GET still returns submitted expectedRevision, or fails, outcome stays unknown. An old PUT may still arrive; no retry, destructive continuation or discard can declare it resolved. Keep owner/session recoverable and refuse that close attempt. A timeout alone does not settle it. Successful later reconciliation may clear unknown, but never revive an expired action.

Non-destructive Return/detach may move a retained live pipeline with a pending/unknown save, because it does not replace it or abandon the write. Input/transfer is briefly fenced while retaining the same engine; if a rebuild would be required while write outcome is unknown, refuse transfer and retain the original session. Explicit Discard cannot undo an already-sent write: settle/reconcile first. Save/Discard/Cancel and Reload/Keep mine remain the existing user decisions, with no hidden automatic choice.

## 4. C3: open, transfer and recovery

```ts
type HostBinding = { generation: Generation; document: Document; window: Window;
  container: HTMLElement; kind: "attached" | "child" };
type TransferRequest = { requestId: RequestId; stamp: Stamp;
  direction: "detach" | "return" };
type TransferResult =
  | { kind: "moved"; requestId: RequestId; stamp: Stamp; host: "attached" | "child" }
  | { kind: "refused"; requestId: RequestId;
      reason: "busy" | "invalidated" | "snapshot-unavailable" }
  | { kind: "failed"; requestId: RequestId;
      reason: "popup-blocked" | "bootstrap" | "styles" | "timeout" }
  | { kind: "unknown"; requestId: RequestId };
```

Transfer and destructive actions share one App arbiter. First admitted action owns it; subsequent actions get busy (no queued callback or overwritten destination). A duplicate requestId returns its recorded current/terminal result without another window/prompt/PUT. One final terminal result is cached until the next context incarnation; old IDs are rejected by generation thereafter. Unknown teardown keeps the arbiter occupied until confirmed fenced/closed or matching abort acknowledgement, rather than allowing a replacement attempt.

Detach is available for a selected room even with no tabs: the child shows the tree and existing empty/denied/loading state. It is unavailable with no room. A user gesture synchronously calls `window.open("about:blank", uniqueFrameName, popupFeatures)`; it never loads a second static app entry. Browser name includes ownerId, roomGeneration and requestId; native name is a one-use permit from C5. A second Detach/Show only focuses the verified current child; never adopt a same-name foreign popup. Browser registration requires the exact returned WindowProxy, about:blank opener inheritance, `child.opener === ownerWindow`, same-origin document access and the captured Context. Native registration additionally needs C5 acknowledgement before moving DOM.

Bootstrap creates a minimal child document/title, copies current theme/root attributes and the owner's existing stylesheet/style nodes with absolute asset URLs, and waits for stylesheet load/error plus a nonzero styled host measurement. Preserve source CSP policy (including a copied meta policy if present), sandbox/permissions and existing asset origin; no new scripts, inline handlers, credentials or weaker policy. Before ready, show no editor in child and keep attached host authoritative. Popup null, closed/navigation/source mismatch, stylesheet/CSP failure or 10-second bootstrap timeout closes the empty registered popup and leaves attached state intact. Never move first and hope styling/bootstrap works later. No new error dialog UX: use existing inline document error presentation.

On ready: fence input/new save scheduling, retain state C2, capture host bindings/preview snapshots C7, ensure destination context current, detach old listeners, adopt the one portal container and bind new host listeners/overlays. Commit hostGeneration once, resume the same engine, select/focus the current host, then release the arbiter. Draft bytes and PUT count must be unchanged by movement. Any pre-commit failure restores attached binding; failure after adoption retains/fences the session and enters recovering. Return moves to attached **before** closing the now-empty child; retain the child registration until closure evidence arrives. Return is allowed with conflict and does not prompt Save/Discard. Tab × is separate.

Native child × is synchronously intercepted and mapped to Return. Browser child beforeunload calls the owner-local synchronous fence/retain/adopt-to-attached step before the child unloads; it schedules no async save and opens no prompt. pagehide alone is never native destruction evidence. Polling `WindowProxy.closed === true` is browser destruction evidence; inaccessibility/navigation alone is unknown. If close notification is missed, synchronous owner-retained state still supports recovery after confirmed closed or owner-confirmed inertness.

Show documents checks the actual registered child; native uses C6 to reveal accessible bounds, browser `focus()` is best effort. Refused focus leaves Return reachable from chat. Recovery fences **all** input/callbacks in the owner engine, disconnects the old view and adopts its container to chat; same-origin owner authority can establish inertness even if focus is denied. A security/navigation access failure plus no proof of old-view fencing leaves recovering, retained/frozen, with no replacement writer. On confirmed unexpected child loss increment hostGeneration, restore retained session and bind attached once. Timing never grants replacement authority. A stale focus/room result cannot focus/reopen a different context. Re-entry after room leave requires explicit Detach.

## 5. C4: guarded actions and dependent close

```ts
type Action =
  | { kind: "select-file" | "close-tab"; path: string }
  | { kind: "leave-room"; target:
      { kind: "home" | "settings" | "dashboard" | "memory" }
      | { kind: "room"; roomId: string; conversationId: string } }
  | { kind: "replace-conversation"; roomId: string; conversationId: string }
  | { kind: "room-operation"; operation: "archive" | "purge" | "memento" | "checkpoint";
      roomId: string; conversationId: string }
  | { kind: "chat-close"; disposition: "hide" | "quit" | "update" | "reload" };
type Refusal = "cancel" | "save-error" | "permission" | "conflict" | "busy" | "invalidated" | "unknown-write";
type GuardResult =
  | { kind: "prepared"; correlation: Correlation; decision: "allow" }
  | { kind: "refused"; correlation: Correlation; reason: Refusal }
  | { kind: "unknown"; correlation: Correlation };
type CloseMessage =
  | { correlation: Correlation;
      kind: "prepare" | "abort" | "abort-ack" | "commit" | "committed" | "completed" }
  | { correlation: Correlation; kind: "child-closed";
      child: { permitId: string } | null };
```

An action's destination and original existing continuation are captured once; continuation is local, never serialized as executable text. For room-operation it is the exact already-authorized operation/confirmation callback; no archive/purge/memento/checkpoint side effect starts until documents allow and dependent closure completes. `select-file` and `close-tab` use existing file switch/tab destructive semantics; they do **not** close the document window. A room-operation that does not actually leave/replace the context must not be reclassified silently: use its existing context effect, and test the real callback paths named in the spec. The arbiter replaces the current single uncorrelated pending-action ref without changing unrelated room logic.

1. Admit `prepare` only for current complete stamp and legal action. Fence editing/new navigation/autosave scheduling and capture immutable target. Requester remains prevented. Present existing Save/Discard/Cancel in the chat document, bring chat forward for native attempts, and focus it. Browser inability to focus leaves the action pending/refused, not auto-allowed.
2. Clean with no writes may prepare immediately. Save joins/drains latest frozen write, then revalidates source/revision/policy/context. Explicit Discard waits for any sent write outcome first, applies existing deliberate discard semantics, then revalidates. Cancel/refusal keeps old context and both windows on the pre-commit normal path.
3. Allow means only ready under the final prepared stamp. It is not permission for a different action and is not evidence of child closure. Owner retains state/fence until commit or acknowledged abort. Any edit/policy/context change after preparation invalidates it; no stale allow survives.
4. On refusal/unknown/deadline requester sends matching abort. Owner cancels that prompt/continuation, invalidates its allow, retains all unresolved source/write state and returns abort-ack. Repeated abort is idempotent; late allow is ignored. If abort acknowledgement is missing, requester remains prevented, session retained/frozen and arbiter reserved; do not begin a competing attempt. A late matching abort-ack can release the same attempt, not execute its continuation.
5. On current allow requester sends commit. Owner checks final stamp again. For room/conversation/chat exit it fences/disconnects child surfaces and closes the registered child, then awaits authoritative child-closed. No-child result uses the same `child-closed` message with `child:null` (C5); it is explicit, not a timeout. For select-file/close-tab, no dependent shutdown occurs; perform only the selected file action, once.
6. Child-closed matching the registered native child or exact browser WindowProxy releases the parent continuation; owner sends completed. The parent hide/quit/reload or context replacement happens once **after** that evidence. In ordinary native return, committed/child-closed are paired with attached-host-ready instead of parent exit. Duplicate commit/completed cannot repeat a continuation.
7. Missing teardown after commit withholds parent continuation. Child might already be gone; keep chat and retained session, reconcile C3 and do not claim both windows remain open. If destruction arrives late for the still-current committed action, finish exactly that action; if the user/owner has invalidated it through acknowledged abort, only recover, never navigate. This is ordered, not atomic two-window closure.

Deadlines (monotonic local timers): bootstrap 10 seconds; one native exchange 2 seconds; prepare total 120 seconds including the user's decision; join/write wait 30 seconds within that prepare; abort-ack/child-close/transfer settlement 5 seconds. A timed-out prepare becomes unknown then abort, never default Discard. Timeout excludes support claims for that path. Late messages are accepted only to settle the matching abort/destruction, not to revive expired preparation. No automatic retry; a new user action after terminal acknowledged abort gets a fresh requestId/current stamp. Local calls still use these semantics without pretending they are wire messages.

## 6. C5: native transport, trusted registration and entry-point ordering

Current main has a sandboxed renderer with no preload IPC. Select the existing shell-to-page `webContents.executeJavaScript` mechanism (already used by `pushUpdateStateToPage`) for a **private bounded pull exchange**, not a new URL/deep link/server channel. It carries identities/control results only, never source, paths, secrets or geometry supplied by renderer. Renderer-only browser use has no native adapter.

Owner installs a private non-enumerable `window.__exxpertsDocuments` with synchronous `step(input): output` at App initialization. Shell calls only the known main top-frame WebContents at exact current SERVER_ORIGIN after did-finish-load, with JSON-encoded data and a fixed expression (no source interpolation as executable code). No native method is exposed to pages. The shell pumps every 100 ms, at most one evaluation outstanding; response must be validated before commands apply. This is an internal polling adapter, not another document renderer or data store. Missing/blocked endpoint times out fail-closed; never continue hide/quit based on missing application state.

```ts
type NativeBinding = { nativeSessionId: string; ownerId: OwnerId; ownerGeneration: Generation };
type PopupPermit = { frameName: string; permitId: string }; // shell random, one use, 10s lifetime
// Envelope, both directions; sequences start at 1 per nativeSessionId.
type NativeEnvelope<T> = { version: 1; nativeSessionId: string; sequence: number; ack: number; items: T[] };
type NativeStatus = { binding: NativeBinding; stamp: Stamp | null;
  child: { permitId: string; hostGeneration: Generation } | null };
type NativeOutput = NativeEnvelope<OwnerItem> & { status: NativeStatus };
type NativeInput = NativeEnvelope<ShellItem>;
```

Bootstrap: shell allocates nativeSessionId per main WebContents load and sends hello; owner replies `{kind:"hello",ownerId,ownerGeneration}`. Subsequent items carry that binding and applicable full Correlation/TransferRequest. Owner stages `{kind:"arm-popup",request:TransferRequest}` when Detach becomes available; shell issues `{kind:"popup-permit",request,permit:PopupPermit}` for that exact context. On context/host change the owner disarms it; an armed transfer captures the latest draftGeneration again at the user gesture before admission, so ordinary editing cannot make the button permanently unavailable. The shell checks unchanged owner/context/host for the permit and the owner validates the current full stamp at admission; expired permit is renewed while idle. The user gesture opens with the current permit, so a popup does not wait on async permission and lose browser activation. A permit prepares bootstrap only; transfer requestId is allocated at arming and reused only for that one Detach attempt. Stale/missing permit leaves Detach unavailable until ready, without moving documents.

Every item has `kind` and the established NativeBinding (hello is the sole pre-binding item). Its remaining fields are exactly those below; unknown fields cannot grant a capability. Output always includes NativeStatus, including when items is empty, so the shell captures an observed stamp before a native event. `OwnerItem` and `ShellItem` are the discriminated unions of their rows. No field is optional unless shown as null.

| Direction / kind | Fields beyond kind/binding | Meaning |
| --- | --- | --- |
| shell → owner `hello` | none (nativeSessionId is in envelope) | Bind only this main-page load; owner replies once. |
| owner → shell `hello` | `ownerId, ownerGeneration` (instead of binding) | Establish NativeBinding. |
| owner → shell `arm-popup` | `request:TransferRequest` | Reserve a permit only; does not admit transfer or acquire arbiter before user gesture. |
| owner → shell `disarm-popup` | `permitId:string` | Revoke unused permit. |
| shell → owner `popup-permit` | `request:TransferRequest, permit:PopupPermit` | One native bootstrap grant for this context. |
| shell → owner `child-registered` | `request:TransferRequest, permitId:string` | Exact concrete native child bound, before host adoption. |
| owner → shell `host-ready` | `request:TransferRequest, permitId:string, stamp:Stamp, host:"attached"|"child"` | Publish the committed new host generation; attached means Return completed its rehost phase. |
| shell → owner `native-prepare` | `nativeRequestId:RequestId, observedStamp:Stamp|null, disposition:"hide"|"quit"|"update"|"reload"` | Owner admits C4 chat-close with requestId=nativeRequestId only if observed/current context agrees. Null is legal only for no selected/retained session. |
| owner → shell `guard-result` | `nativeRequestId:RequestId, result:GuardResult` | Carries final correlation/stamp or matching refusal. |
| owner → shell `no-session` | `nativeRequestId:RequestId, disposition:"hide"|"quit"|"update"|"reload"` | Live endpoint explicitly confirms no context, retained editor or registered child; shell may continue exactly this prevented action once. |
| shell → owner `native-return` | `request:TransferRequest, permitId:string` | Intercepted child ×/reload; direction must be return; actual registered identity/context/host must match. |
| shell → owner `native-abort`, `native-commit`, `native-completed` | `correlation:Correlation` | C4 abort/commit and final shell continuation receipt. |
| owner → shell `abort-ack`, `committed`, `completed` | `correlation:Correlation` | C4 acknowledgements; completed follows the owner consuming authoritative child-closed, before shell parent continuation. |
| owner → shell `close-child`, `show-child` | `context:Context, hostGeneration:Generation, requestId:RequestId, permitId:string` | Exact registered child only; close-child requires active matching C4 commit or ready Return. Show never authorizes closure. |
| shell → owner `child-closed` | `correlation:Correlation|null, transfer:TransferRequest|null, child:{permitId:string}|null, context:Context, hostGeneration:Generation` | Exactly one correlation/transfer non-null for solicited closure; both null for unsolicited destruction. No-child solicited completion has child:null. Native handler supplies actual closed evidence; owner cannot manufacture it. |

A host-ready/attached result advances current hostGeneration while retaining the exact old child registration as closing for this transfer; close-child and its acknowledgement carry that committed hostGeneration and the original TransferRequest. No other child can be substituted.

For native-return, the shell uses the latest NativeStatus to allocate a fresh TransferRequest, with direction return; host-ready/attached must precede close-child. A stale observed stamp or registration returns refused/invalidated as a transfer result in `{kind:"transfer-result",request:TransferRequest,result:TransferResult}` owner item; every successful or failed native-return emits this same terminal result. The requestId in close-child is this transfer's ID. For native-prepare with observedStamp:null but a current/retained session, owner returns invalidated against its actual current stamp, never no-session; malformed/no valid correlation remains unknown locally. Native parent continuation requires completed plus actual child-closed (or explicit no-session), not receipt acknowledgements alone.

Queues hold the active transaction and one popup permit only; retransmit unacknowledged sequence idempotently, no unbounded action queue. `ack` acknowledges receipt, never semantic allow/closed. Reject wrong version/session, missing binding, sequence gaps or malformed kind/fields as unknown/invalidated, keep native prevention and retain queues. Replayed sequence returns cached output without repeating effects. Queue inputs can advance control state synchronously; user prompt/save work proceeds in owner callbacks, never by blocking `step`. At exchange timeout stop issuing evaluations until the outstanding one settles; invalidate the timed-out action's allow and queue abort. Revalidate session/sequence before accepting a late output. A stuck renderer is not a safe-to-close renderer. Normal reload completion creates a new nativeSessionId only after old child closure and owner disposal.

`setWindowOpenHandler` permits a document about:blank popup **only** from the bound main top-frame opener, with the exact live one-use frameName/permit. In `did-create-window`, bind its actual BrowserWindow/WebContents to that permit and owner/context, explicitly retaining sandbox=true, nodeIntegration=false, contextIsolation=true, existing session/navigation/context menu policy. Ack child-registered only for that concrete child. Opener inheritance is needed for the same-origin portal; no generalized about:blank allowance or privilege relaxation. Unsolicited blank/foreign opener/stale permit is denied; existing legitimate same-origin artifact popups retain existing behavior but gain no document registration, native guardian or geometry privilege. Reject child navigation away from its registered bootstrap; do not convert it into arbitrary shell.openExternal. No token/path/draft goes into URL/frameName or logs. Exact native origin uses parsed URL equality, never a prefix or CSS desktop class as authority.

| Entry | Synchronous prevention and mapping | Continuation after matching allow + child-closed |
| --- | --- | --- |
| Main native × / Cmd+W closing main | `close.preventDefault()` before today's hide; enqueue chat-close/hide | Close dependent child, then `mainWindow.hide()`; no recursive close or child left running. |
| Child native × / Cmd+W closing child | child `close.preventDefault()` before destruction; enqueue Return to owner | Attached host ready, close now-empty exact child once. Child closing must not become tab ×. |
| App menu/tray/Dock/Cmd+Q normal quit | `before-quit.preventDefault()` before quitting flag/timer/server stop | Close child, then existing shutdown/server.stop and final app.exit disposition. `app.exit` itself is not guard evidence. |
| Updater ready-to-install | Guard chat-close/update **before** panel enters irreversible installing, updaterQuitting=true, server.stop or quitAndInstallNow | After child-closed perform existing updater sequence; failed/refused guard keeps app/server usable and update available. Updater before-quit recognizes only that committed permit. |
| Menu reload / Cmd+R / reloadIgnoringCache of owner | Replace direct View role reload with guarded same-action callback; intercept before renderer teardown, including supported accelerator paths | Close child, then reload current owner; old callbacks invalidated. Child reload is Return before destroying its presentation document. |
| Hide/minimize without close | No destructive continuation; no pretend close result | Keep same owner/session and child; Show/Return from chat/tray remains possible. |
| Room/conversation/Home/settings/archive/purge/memento/checkpoint | Actual App callbacks enter C4 before context state or server side effects | Child-closed before captured continuation and context generation increment. |
| Browser close/reload bypassing async guard | Existing beforeunload Leave/Stay best effort; pagehide cleanup only | Q5=B exception, never a successful async Save/Discard/Cancel claim. In-app navigation/Return remains protected. |
| Forced process loss / OS kill | Cannot guarantee prevention/volatile recovery | Exact Q5=B exception; no independent child behavior is authorized and no immediate orphan-shutdown claim follows. |

Shell suppression is a one-use permit keyed to nativeSessionId/requestId/disposition/exact child, consumed immediately before the intended native close/quit/reload. It cannot set a global bypass for other attempts. Re-entry caused by that committed child close/updater quit does not create a second prepare; unrelated native events receive busy. No owner/context (e.g. clean startup/home) yields an explicit no-session result only after a live endpoint confirms no retained editor/child. Missing endpoint is unknown. Shutdown after startup failure with no owner ever created keeps its existing separate failure path; it cannot bypass a previously registered live session.

Also install a synchronous owner beforeunload fence for Electron: a live registered session refuses an unpermitted renderer unload, even if a shortcut/renderer navigation escaped the command wrapper. The shell's will-prevent-unload path keeps the default prevention and dispatches the matching known reload/close attempt; it must **not** call preventDefault to waive the page's refusal before that attempt commits. A committed reload uses a one-use owner unload permit tied to the same nativeSessionId/requestId, consumed only immediately before the wrapped reload. An unmapped unload remains blocked/unknown rather than becoming another Q5=B exception. This fence is normal native protection, not a synthetic unload test substitute. Browser beforeunload remains best-effort Leave/Stay under the exact already-decided browser bypass exception.

## 7. C6: child geometry, provenance and persistence

Use the **existing** `apps/desktop/src/window-state.ts` `userData/window-state.json`; extend its JSON record with optional `documents:{schemaVersion:1,bounds:{x,y,width,height},maximized:boolean,source:"electron-normal-bounds"}`. Existing root `bounds/maximized` remain main-window fields. This is one optional subrecord in the existing desktop state mechanism, no new file/store/backend, no room/path/content. Old records remain readable. All writers in window-state merge the two records on the single main-process event loop so tracking main never drops documents and vice versa. Persisting failure is best effort; live session remains usable.

Only the actual C5-registered child may read/apply/update documents geometry. Authoritative source is BrowserWindow.getNormalBounds when maximized/fullscreen, else getBounds; x/y/width/height are finite **outer-window device-independent pixels**, integer-rounded. Do not reuse browser outerWidth as window.open inner width. Capture move/resize/maximize/unmaximize with existing 500-ms debounce and immediate final capture **before** registered child close/Return; never overwrite last good record from an empty/failed bootstrap. `maximized` restores only after first reveal, like main; normal bounds remain usable.

Validate schema/source/positive size, then use **current Electron screen.getAllDisplays().workArea**. Saved negative coordinates/scaled displays are valid. Choose the work area containing the largest saved intersection (tie: main-window center's display), else nearest main center. Clamp width to [min(640,area.width),area.width] and height to [min(480,area.height),area.height]; clamp x/y so the whole outer rectangle, including its top/titlebar, lies within that chosen work area. Thus the top 32 DIP and a usable body remain visible, not just a one-pixel intersection. Missing/corrupt/unavailable record falls back to min(900,area.width) × min(700,area.height), centered in main's current display work area. Unavailable display geometry is a placement failure: keep attached host rather than claim accessible child. Revalidate before Show and after display-removed/metrics-changed for the registered child; Return from chat remains available even if reposition/focus fails.

Browser geometry is session-volatile best effort: keep last same-owner `screenX/screenY` position separately from `innerWidth/innerHeight` for feature dimensions; validate finite values and clamp to current `screen.avail*` where exposed, else request 900×700 near chat. No localStorage/IndexedDB/cookies/new durable record. Browser cannot prove all-display visibility and may ignore placement/focus. Do not describe browser heuristic as Electron validation. Return remains reachable without child access.

## 8. C7: actual host documents, overlays and preview snapshots


**Accepted threat-model amendment, 2026-11-12 — Decided by: Sascha (2026-11-12), C7 review option B:** The [reconciled ADR-0009 amendment](../../docs/adr/0009-detached-document-window.md#reconciled-c7-amendment--2026-11-12) excludes only a frame navigated before its first ready by the trusted app parent's own script; that parent already can read the snapshot. Untrusted preview content and external pages remain fully covered, and every other C7 rule below remains binding. The unqualified after-navigation/no-bytes wording below is read within this explicitly narrowed threat model, not as proof that `src`, a visible fragment or WindowProxy authenticates a document. Preserve the Excalidraw/HTML pre-ready counterexample tests as documented expected behaviour under this model, without deleting them or loosening other controls. Preserve prior red history and every one-use/foreign/stale/after-delivery, opaque-CSP/script/network/permission/snapshot rule. The independent identity review `9aaf284d` is historical level-3, now answered by this accepted human decision; reconciled review and final Tester/conformance inspect the exact boundary.


`HostBinding.document/window` comes from `container.ownerDocument/defaultView`, not module globals. `docs-window.ts` publishes a new binding after adoption; every host-bound listener removes the old binding **before** adding the new one. Use the relevant realm's constructors or node/tag checks for Element/HTMLInputElement/HTMLAnchorElement/HTMLLinkElement; owner-realm instanceof must not reject child nodes.

| Consumer | Binding and observations |
| --- | --- |
| MarkdownEditorPane, MarkdownEditorToolbar, MarkdownSearchBar, TipTap search/menus | Save/Find/selection/input use the editor element's actual document; timers can stay owner-owned. Toolbar link prompt uses hostWindow.prompt, clipboard only retains the existing explicit user Copy action. Search, tooltip and overlay roots use that host document. Escape acts once on the top layer there. |
| WorkspaceFileBrowser and tabs | Child focus/visibility refresh and requestAnimationFrame target actual host; owner lifetime keeps polling authority. Tree callbacks capture current Context; tabs reorder only with existing tab MIME. |
| Image/Word/PDF/HTML/spreadsheet/text/framed previews | Render in actual host; retained tab snapshot state stays owner-lived, independent of remount/host loss. MatchMedia/theme/scroll/overlay measurements use actual host. Image content is fetched once through the existing authorized image URL and retained as an owner-lived Blob/object URL; it is not refetched from changed disk content on reconstruction. Revoke it only on tab close/context disposal, not movement. |
| Dirty-navigation dialog | Stays in **chat's document**, with existing Save/Discard/Cancel; chat is surfaced/focused for native attempts. Escape Cancel binds chat once. Child editing/input is fenced while modal owns the action. Conflict Reload/Keep mine stays with document host. |
| Chat composer/room settings/unrelated right-pane occupants | Stay in owner's chat document. Approval previews, attachments, task runs and artifact viewer are outside document portal. Their keyboard/modal listeners must not accidentally consume a document host event. |

**Actual frame movement:** adopting a DOM subtree across documents can destroy/reload its nested browsing contexts even if the React portal container stays stable. Moving the node is not proof of preserved preview bytes or editor behavior. Cache each tab's already-authorized snapshot under Context/path/tab incarnation in owner memory until explicit tab close/context exit: exact Word sanitized HTML/notices, PDF page data, spreadsheet model, text/image content and framed-file original bytes. HTML's existing metadata response already includes its exact `html` string: retain that actual content, not just ready=true. **Do not use srcDoc/blob/data for script-enabled HTML**: M `request-checks.ts` static CSP has `script-src 'self'`, which inherited local-document CSP would intersect with and block the already-approved inline HTML scripts. Reuse the existing contained frame-ready/bytes/rendered/failed pattern at the **existing** HTML `workspace-preview?...&frame=1` entry: `room-settings-routes.ts` serves a fixed one-shot HTML bootstrap there under its existing `sandbox allow-scripts` and exact current HTML CSP header, rather than embedding disk HTML in that frame response. The parent supplies the retained UTF-8 HTML snapshot once, after checking that actual iframe source. The bootstrap accepts only its parent (source equality and expected app origin), removes its receiver before use, decodes the one ArrayBuffer as UTF-8, and writes the document in that same HTTP-CSP-protected opaque frame; the header policy must remain effective after document.write. Its inline bootstrap/script permission is the existing HTML frame policy, never a relaxation of app CSP. The server retains the same route, query, policy and file guard; after those guards its frame=1 branch returns the fixed shell without reading/replacing the retained workspace-content snapshot; metadata still supplies original HTML content, and host movement fetches only the guarded fixed frame shell, not another workspace-content snapshot. No new endpoint, store, generic renderer or file capability is introduced. This is the existing parent-to-contained-preview delivery pattern, reused for HTML inside C7; real tests must prove both approved HTML script execution and blocked external fetch after movement. No new route or network privilege is needed. Preserve parser/byte limits, credential rules and accepted self-navigation risk. Capture failures fail transfer while retaining old host; never silently refresh a snapshot from changed disk content.

For HTML/PPTX/Excalidraw the retained original ArrayBuffer stays in owner memory; deliver a **copy**, since a transferred buffer detaches. Each **concrete iframe instance** has `{context,path,tabGeneration,hostGeneration,frameGeneration,frameWindow,delivered,terminal}` owner-local state. A frame created for a controlled host transfer is a fresh preview-renderer instance initialized from the same retained tab snapshot, not rearming the old navigated frame. Destroy/disconnect the old frame before initializing the replacement; each concrete frame can receive only its one snapshot, once. There is no second workspace-file GET because of host movement. Retain loading/error/snapshot state even for tabs opened first in the child.

The message listener binds `frame.ownerDocument.defaultView`, where that iframe's parent messages actually arrive. Require `event.source === registeredIframe.contentWindow`, current Context/tab/host/frame generation, expected kind and nonterminal state. Opaque event.origin is not an authority; do not add allow-same-origin. On first valid frame-ready with retained bytes, set delivered synchronously, post the one copy with transfer list and `"*"` target (required for opaque origin). Repeated ready/foreign-frame/old-host/after-navigation messages receive no bytes. frame-rendered/failed is accepted only from that delivered current instance; a ready/rendered claim is not a close acknowledgement. A navigated frame never gets a second delivery; arbitrary navigation cannot register a fresh instance. Direct frame URL has no workspace bytes. A trusted host transfer may construct a new iframe only from the owner-held snapshot and approved renderer URL, with exactly one initial delivery. No broader capability than ADR-0004's one opened file is provided.

Existing 30-second renderer timeout remains per real frame instance; on stall show existing failure and abort outstanding fetch. Tab close aborts fetch and removes listener/snapshot/object URL; a host transfer detaches listener and fences old messages but retains the snapshot. Test real frame-ready and bytes in the child, including one opened there for the first time, Return, reorder, repeated ready and navigation. A synthetic owner-window message proves neither delivery nor snapshot preservation.

## 9. C8: routing, drag and permissions

Chat file click/link → existing `openWorkspaceMarkdown({relativePath,extension})` → C4 selection guard → current verified host and focus. No direct child-owned HTTP/write pipeline. The actual current room/conversation/path is captured and revalidated at selection, after Save and before focus; stale room/focus completions are ignored. Active doc, hidden previews and ordered tabs stay in the single session. No attached duplicate editor while detached.

Tree drag retains `application/x-exxperts-workspace-path` plus `text/plain`, both containing the workspace-relative path. Existing tab MIME remains distinct. For current-context safety, add same-origin owner-local drag token/context validation through the shared chat owner, without changing that existing external MIME payload: dragstart records Context and path, drop validates it is still current before the existing composer insertion at caret/selection. Drop after context switch or from an unrelated popup is ignored. No clipboard call, OS-open or file write occurs. Ordinary tree click/selection remains available if platform drag fails; do not claim cross-window support from a text-helper test.

All HTTP reads/writes and explicit OS-open actions continue through current room routes and policy. Child receives no new grant, auth token or policy override. Local, paired full and paired read-only behavior remains unchanged; no automatic opener on load/movement/recovery. Existing fake opener must observe zero calls for every refused/implicit action. ADR-0002 path/grant/symlink/read/write protections and ADR-0003/0004 preview/OS-open restrictions remain test obligations at the real public seams.
