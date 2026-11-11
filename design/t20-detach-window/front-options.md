# T20 — Front decisions and later contribution

Status: revised author draft, 2026-11-11; awaiting a fresh different Architect's specification review.

Sascha accepted architecture A and approved the clickable UI basis on 2026-11-11, as recorded in the Controller evidence `~/controller-exxperts/evidence/t20-front-order-2026-11-11.md`, section “Front: T20 / #20 unblocked”. [ADR-0009](../../docs/adr/0009-detached-document-window.md) records that decision. The approved UI basis is `origin/bussard76/t20-design-lane` at `5533f71d4813f0b683ff49003e35ebe259b8bdab`. The [room-labelled recovery strip](recovery-strip.md) is a new **draft**, with no additional human sign-off claimed. Anything beyond that bounded draft goes through Controller to Front.

The following decision tables and accepted recommendation strings are carried over precisely from `origin/agents/t20-detach-design` at `3e3d1a7c6de526558565cfb8684e4a98d707923a`. Only their surrounding historical approval status is superseded. They establish product intent; none supplies native, browser or drag proof.

## Recorded Q1–Q3 decisions

Decided by: Sascha (2026-11-10), relayed in the latest coordinator dispatch:

| Question | Decision | Supersession |
| --- | --- | --- |
| Q1=A | A room-labelled strip with Show documents/Return stays in chat. | Replaces the earlier undecided strip/tab-strip alternatives. |
| Q2=A | One document window per chat session/room. | Replaces the earlier undecided window cardinality. |
| Q3=B | Remember the last position in Electron with visible-bounds validation/fallback; browser placement is best effort. | Supersedes earlier Q3=A (near-chat/manual placement). |

## Recorded Q4–Q10 decisions and remaining proof

Decided by: Sascha (2026-11-10), latest Front/Controller dispatch. Q5=B is selected: Save/Discard/Cancel protects normal chat close and leaving room; forced process loss, OS kill, and browser close/reload that bypasses async guard are explicit documented exceptions; child never independent. Cancel keeps both windows open on protected paths. This supersedes the earlier absolute requirement for those exception paths; C/D are not chosen and no durable recovery architecture is approved.

Sascha accepted exactly the following existing recommendations, reproduced verbatim from this file before this update. Acceptance is a product decision, not evidence that the behavior works:

| Question | Accepted recommendation, 2026-11-10 | Evidence limitation |
| --- | --- | --- |
| Q4 | Guard and close the current child, with explicit Detach to reopen in the new context; avoids stale draft/context routing. Leaving the room itself is already decided to close it. | Conversation identity and child-close ordering still need proof. |
| Q6 | Preserve the exact unsaved draft/conflict through in-memory transfer, contingent on proof; movement does not save. | Exact draft/conflict transfer is still contingent on proof. |
| Q7 | Return the document session, retaining tabs and any recoverable draft; explicit tab × uses its existing guard. | Actual child native × and tab × need separate tests. |
| Q8 | Tree, tabs, previews, Markdown Edit/Preview/RAW, save/conflict/dirty guards and active document. Keep preview snapshot semantics. | Core document behavior and snapshot semantics need browser evidence. |
| Q9 | Preserve workspace-relative path insertion where the existing browser drag path works; provide click/selection without implying clipboard side effects. | Cross-window drag intent only; still untested. |
| Q10 | Establish platform/entry-point evidence before promising desktop or browser support; preserve read-only/paired permissions. Native chat × must guard and close the child even if chat then hides to tray. | Mac/native entry-point proof is still required; no platform support is inferred. |

## Current implementation handoff

[Logic](logic.md), the [frozen internal contract register](contracts.md), and [T20-HARDEN](../../docs/specs/T20-HARDEN.md) resolve technical precision inside accepted A. The historical proposal and review refs remain unchanged. The older proposal's architecture-pending and UI-unapproved wording describes 2026-11-10 only; it is superseded by the dated 2026-11-11 decision, not by an agent's verdict.

No new decision is requested about A or the approved prototype. A genuinely new route, durable store, dependency, public package export, independent writer/lifetime or broader UX requires a concrete cause/options escalation to Controller after checking ADR-0002/0003/0004/0008/0009 and Q1–Q10. Q3=B uses existing desktop persistence; prototype localStorage is not an approved new store. Q5=B exceptions are **only forced process loss, OS kill, and browser close/reload bypassing the async guard**; normal Electron close, quit, updater quit and reload must be intercepted. No durable draft recovery is authorized.

## Later product-only Series 3

Sascha's separate contribution order is recorded in [issue #20](https://github.com/bussard76/exxperts/issues/20#issuecomment-6763689112). Series 3 depends on Series 1 (tree/tabs/previews) **and** Series 2 (Markdown editor/guards), after a reconciled independently buildable common base. The separate Series 1/2 squash and editor decisions in current `docs/coordinator.md` remain binding; this task changes neither their sources nor review/contribution branches. Old candidate tips in the proposal are historical evidence, not today's Series 3 base.

Future slices: retain one chat-owned volatile session; add the guarded host and real-host preview/event bindings; add correlated lifecycle/native close and placement; verify integration before exposing Detach. Keep each slice buildable, with failing public-entry tests first and the feature unavailable until its safeguards work. No #19/#16 work is included. A Series 3 port must preserve the intended editor/RAW behavior, notices and attribution and exclude fork-only design/spec/ADR/review/factory files. No upstream branch is cut or pushed here; EXXETA is read-only and Sascha submits any later PR.

## MAC-TASK draft for Front, via Controller

Pending a separately authorized Mac run on the final product candidate: record full candidate SHA, macOS version, app version and package/build identity, entry point and test profile before any support claim. Use invented files and fake model/opener only. Exercise packed Electron chat traffic-light × and Cmd+W, child × and Return, normal Quit/Cmd+Q, updater-ready quit and app reload; distinguish Hide/minimize from close. Trace synchronous native prevention → prepare → Save/Discard/Cancel/refuse/allow → commit → authoritative child-closed → hide/quit/reload. Cancel/error/conflict/timeout must prevent the parent continuation and preserve the exact draft; held/latest and lost-response writes must not be abandoned.

Also exercise remembered bounds on multiple/scaled/negative-coordinate displays and removed-monitor recovery from the chat strip, child return with dirty/RAW/conflict state, and **real child-tree → chat-composer cross-window drag** at a caret/selection. A helper test or synthetic DataTransfer/pagehide is insufficient. Capture per-entry results and ordering, not just screenshots; captures remain untracked in `.build/screenshots/`. Browser evidence does not establish native support, and `app.exit` in the existing desktop smoke does not establish ordinary quit behavior. This is a request draft, not a sent Mac task or evidence of support. Controller relays it; this worker does not contact Front.
