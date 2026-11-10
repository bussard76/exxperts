# ADR-0010: The Front agent runs on the server, beside its Controller

Status: accepted
Date: 2026-11-10
Decided by: Sascha (2026-11-10), option A
Architecture impact: level 3 — changes the responsibilities and the data flow between the Front agent and the Controller, and where the Front agent runs. No product module changes.

## Context

The Front agent ran on Sascha's Mac and the Controller on the server, each in its own Orca. They exchanged work through files: the Front agent appended orders to `inbox.md`, a heartbeat script nudged the Controller's terminal, and the Front agent polled `status.md` and the branch list. Sascha noticed they were sometimes out of step: the Controller finished and the Front agent did not report. Measured on 2026-11-09 and 2026-11-10:

- An order (Sascha's approval for #16) was swallowed by the inbox archival and overlooked (Controller note, 2026-11-10 15:11).
- The heartbeat log shows 686 "busy, not woken" against 854 "woke": an order can wait until the Controller's turn ends and has no queue of its own.
- Nothing wakes the Front agent. It checked every two to three minutes; its own watcher could expire unnoticed.
- Orca's own messaging is event driven (a message is queued and wakes its recipient at the end of the turn; measured 18 s from Mac to Controller), but only inside one Orca. From the server, a Mac terminal is `terminal_not_found`; from the Mac, reading a server mailbox is `consumer_fenced`, and creating a Run needs a terminal on that server (`stable_pane_required`).

Sascha also wants one readable structure in the Orca client: Front agent on top, the Controller beneath it, the workers beneath the Controller, collapsible.

## Options

### A. The Front agent runs on the server, beside the Controller (recommended, chosen)

Same Orca, so `orchestration send`, the wake, `ask`/`reply` and `worker_done` work both ways. Sascha reaches the Front agent through the Orca client of his Mac (the server is a saved environment there). What only works on a Mac moves to a Mac worker. Started as a pilot next to the Mac Front agent; Sascha switched to it the same day.

### B. Keep the Front agent on the Mac, improve the files

An append-only event log (`front-events.log`) and a waiting command on the Mac make the Controller-to-Front direction fast (seconds). Built as the interim measure and kept as a log. The Mac and the server stay two Orcas, so there is still no native wake.

### C. Pair the Mac's Orca to the server

The server could then address Mac terminals and start workers on the Mac. It gives the server control over Sascha's company machine and needs his IT. Not chosen.

## Decision

Option A, as Sascha chose it: "Ja bauen wir einen Piloten, das heißt einen zweiten Front-Facing-Agenten, der auf dem Server läuft, und gegebenenfalls, wenn mir das gefällt, würden wir den hier abschalten" and, once the pilot was up: "Ich würde jetzt mit einem anderen auf den Piloten wechseln und nur noch über ihn kommunizieren". On the structure: "Von der Struktur her sollte auf dem Server alles im Baum sein. Das heißt also: Ein Front-Facing-Agent ist der Oberste, dann kommt der Controller […] andere Worker wiederum sind Kinder von dem Controller".

1. **Where:** the Front agent runs in an Orca terminal on the build server, worktree `front-pilot`, handover file `~/front-exxperts/FRONT.md`.
2. **Structure in Orca:** Front agent (root) → Controller → Integration and all workers. Workers the Front agent starts hang under it. Factory work is not started with `--no-parent`.
3. **Communication, both ways native:** `orca orchestration send` from either side; the Controller sends its events to the Front agent's terminal. The append-only `~/controller-exxperts/front-events.log` (`<date> FRONT-EVENT <KIND>: <sentence>`; kinds DONE, PUSHED, GATE-GREEN, GATE-RED, REVIEW, NEEDS-SASCHA, BLOCKED, IDLE, ANSWER) stays as the record; it is never archived, rotated or truncated. `inbox.md` is the fallback only.
4. **Mac-only work** (the Mac app and its packaging, the preview on the Mac, native Mac checks, the design tools, files that only exist on the Mac) goes to a Mac worker: the Front agent appends `MAC-TASK <date> <what>` to `~/front-exxperts/mac-tasks.log`; the Mac session executes it and answers with `orca orchestration send` to the Front agent's terminal (Mac to server works). No pairing from the server to the Mac.
5. **Unchanged:** the Front agent's rules (never anything to EXXETA without Sascha, tickets and specs, no features unless Sascha says so for a named ticket, no orders to the Controller without Sascha's word during the pilot and his instructions afterwards), the Controller's rules, the review gate, the levels and the protected files.

## Consequences

- `docs/coordinator.md` and `docs/dev-workflow.md` carry the new setup in the same change.
- Risk, accepted: the Mac worker works only while the Mac is on; Mac tasks wait otherwise. The Front agent loses direct access to files that only exist on the Mac and to the Mac's design tools (Figma, Pencil); those stages of the outside-in flow go through the Mac worker or Sascha.
- The Front agent's context is not carried over: the new one starts from `FRONT.md`, the repository rules and the files in `~/controller-exxperts`. The handover file is part of the record.
- Unverified when this ADR was written: whether the old Mac session can be switched off without losing something it did locally; it stays as the Mac worker until Sascha says otherwise.
- The interim event log and the Mac waiting command (option B) stay in use for the Mac worker's direction.

## Slicing

One change: the text in `docs/coordinator.md` and `docs/dev-workflow.md`. No code. The Orca structure and the handover file already exist.
