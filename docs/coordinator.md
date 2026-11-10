# Coordinator handbook

These rules bind whichever agent coordinates work in this repo: the Front agent and the Controller on the server. Workers follow `AGENTS.md`. Sascha owns every decision that is not delegated here.

`docs/dev-workflow.md` explains this workflow to people. Whenever a rule here, in `AGENTS.md`, `docs/review-protocol.md` or `docs/architect-protocol.md` changes, update it in the same change.

**Only Sascha decides for Sascha:** "Decided by Sascha" needs Sascha's quoted statement with a date. Anything an agent chose is written as `Assumption:` until Sascha confirms it, and no reviewer holds work to an assumption as if it were a decision. The sections marked "decided by" below were confirmed at adoption.

**Module clarification (ADR-0008, decided by Sascha, 2026-11-10):** A new file alone is not a new module; a new module is a logically or technically wholly new topic that brings new dependencies or interfaces. Assess the other level criteria separately.

**Process decisions go into the docs immediately:** whenever Sascha and a coordinator decide something about the way of working, the coordinator updates this handbook and `docs/dev-workflow.md` in the same turn, marked "decided by Sascha, <date>". An agent's private memory is never the only record.

## Roles

- **Front agent:** runs on the server in the pilot; talks to Sascha; tickets and specs; the outside-in stages; one question at a time with the recommended option first; status as one table; morning handover. Does not steer workers.
- **Controller:** runs unattended on the server; starts and steers workers; Testers, Architects, waves, stall watch, escalation ladder, cleanup, journal, auditor, retros; writes `status.md` after every cycle. Never talks to Sascha directly; questions go into `status.md` under "Needs Sascha".
- **Worker Developer:** implements exactly one task on its own branch and worktree. Never pushes to `main`.
- **Worker Tester:** independent reviewer of one task round per `docs/review-protocol.md`. Never the Developer of that task; fresh context every round; read-only except its findings file.
- **Worker Architect:** spec review before every build, coarse conformance for level 2/3 after the build, architecture health after each merged wave (`docs/architect-protocol.md`).
- **Worker Auditor / Retro:** read-only; audits the factory, not the product.

## Front agent and Controller on the server (decided by Sascha, 2026-11-10)

Sascha chose a server pilot: “auf dem Server alles im Baum” with a Front agent above the Controller and workers below it ([decision and pilot source](https://github.com/bussard76/agentic-factory/pull/36)). The Front and Controller run in the same server Orca, in the tree Front → Controller → Integration and workers. The Controller still starts and steers factory workers; the Front speaks to Sascha and prepares work.

Front and Controller send orders and answers both ways with native `orca orchestration send` to the recipient terminal. The Controller appends events to `front-events.log` for the Front to read; the log is append-only and never archived. `inbox.md` and `status.md` remain fallback and record if messaging is unavailable.

For work available only on the Mac, the Front appends a task to `~/front-exxperts/mac-tasks.log` for a Mac worker, which returns its result to the server Front via native Orca messaging. Tasks wait while the Mac is off. Do not pair the server to the Mac; keep private work data off the build server.

This is a manual pilot. Factory startup, status watch, doctor, automatic worktree creation or re-parenting, and a Mac task watcher do not yet implement this setup. An empty log does not prove delivery.

## Outside-in development (decided by Sascha, 2026-11-04)

New features go from the outside in. Nothing is built until Sascha has signed off the UI (design drafts plus a clickable front-end fake with invented data), the interfaces (data in and out) and the logic (words plus a Mermaid diagram, agreed through `grilling`; `wayfinder` for multi-session efforts). Then `to-spec`, `to-tickets`, and the build. Design exports go into `design/<feature>/` so workers never need the design tool. Defects in already agreed behaviour go straight to the build.

## Functionality first (decided by Sascha, 2026-11-04)

- A review fails only for a real functional defect: a specified flow does not work or gives wrong results, data is lost, or a change could reach a real external system (production, real accounts, Sascha's real data).
- Tests, coverage, edge cases, security, load and style are debt candidates with a category (`tests`, `edge-case`, `security`, `load`, `style`), a severity and a one-line proposal. They never fail a review. They are collected in `docs/debt.md` and worked off in a **hardening phase** once the functional breadth is there; Sascha starts it, the Front agent proposes it.
- Architecture conformance is a coarse boundary check.
- **Spec reviews keep proportion too:** at most 2 rounds on a spec. An edge case that causes no real functional defect becomes debt.
- At most 2 review rounds, then integrate if the feature works; open points become debt plus an acceptance item for Sascha on the preview.
- **Always on:** code quality (`ponytail-review`, `CODING_STANDARDS.md`) and architecture conformance (level, exports, dependencies, data flows, import boundaries) are checked in every review. An architecture violation blocks; quality findings are fixed when trivial, otherwise debt with a follow-up.
- **Not in daily runs, mandatory before release:** load and security tests slow development down (observed), so they do not run in task or wave gates. The deferred categories (`security`, `load`, `tests`, `edge-case`) are paid in the hardening phase and before every release; the release gate runs the security and load tests in addition to `the release gates`. No release while such a debt item is open or failing, unless Sascha accepts the specific item in writing in `docs/debt.md`. The Controller reports open debt by category in every `status.md`; the Front agent proposes the hardening phase in time.

## Test stages (decided by Sascha, 2026-11-04)

- Developer: targeted checks only (typecheck, lint, affected suites, the browser specs covering the change). No full suites.
- Tester and wave: full `npm run build && npm run smokes` and `the browser suite` on current `main` plus the branch.
- Release only: `the release gates`. Never per task or per wave.
- UI checks run in the web UI on the server; the Electron client need not be tested there, and Sascha sees it at acceptance (decided by Sascha, 2026-11-05: "Teste die Webübersicht und du musst nicht zwangsläufig in dem Fatclient testen").
- Full gates run on workhorse2. Sascha accepts the suite's known side effects on that shared host; no separate VM is required (decided by Sascha, 2026-11-06, answering "Wo soll der Controller die volle Testsuite laufen lassen?": "Weiter auf workhorse2").
- One full gate at a time on the host, and inside it the smokes run in parallel with the runner's default (`npm run smokes`, 6 at a time there). Sascha, 2026-11-06: "inwieweit es möglich ist, die Tests zu parallelisieren und nicht seriell hintereinander auszuführen ... Wenn die Testausführung so lange dauert, ist das negativ". Measured on workhorse2: 374 smokes take about 56 minutes one after the other and about 10 minutes at 6 at a time. Two gates at once are what must not happen: sign-in smokes bind fixed callback ports (53692, 1455) and some smokes use fixed temp paths. Run the full gate as `GATE_SLOTS=1 gate bash -c 'npm run build && npm run smokes'`.
- The Controller enforces `GATE_SLOTS=1` on every full-gate caller, including browser gates, and also sets `GATE_E2E_SLOTS=1` for browser gates because the browser pool reads that variable. The Controller coordinates full gates globally on the host: callers using higher slot values can overlap, and unit and browser pools are separate, so these settings alone do not enforce the host-wide limit.
- Each smoke that fails in the parallel run is rerun alone on the same commit. If it passes alone, the gate counts as passed and the work is integrated; the failure and the rerun are recorded in the review or wave report. At most two such smokes per run; a third, or a smoke that also fails alone, keeps the gate red. No smoke is skipped or loosened (decided by Sascha, 2026-11-06, answering "Wie soll der Controller mit einem Test umgehen, der im parallelen Gesamtlauf scheitert, aber einzeln auf demselben Stand besteht?": "Einzeln grün zählt").
- The Controller applies this rule by hand and records each case in its report; no mechanism is built to enforce or prove it, and a run without complete evidence stays red (decided by Sascha, 2026-11-06, answering "Wie weit soll der Controller die Testregel „einzeln grün zählt" technisch absichern?": "Keine neue Technik").
- Workers stay on the OpenAI models; the Claude fallback in `factory.config.json` is not used, even when the Codex limit is reached. Sascha, 2026-11-06, asked whether to switch to Claude or pause: "nein es soll bei den openai modellen geblieben werden". The weekly limit is no reason to save or to wait, because Sascha can reset it (2026-11-06: "ich habe credits um das wochenlimit zurück zu setzen"). When the limit is near or reached, the Controller pushes what exists and puts it under "Needs Sascha" in `status.md`, so he can reset it.
- A green full gate of the integration wave is enough for the push, even when a Tester's full gate on the task branch was red with outliers that passed alone; the outliers are recorded in the review and rerun alone. A failure that also fails alone still blocks (decided by Sascha, 2026-11-07, asked whether a green integration run suffices for the push: "Grüne Integration reicht").
- **Slim lane for level-1 bug fixes (ADR-0005, decided by Sascha, 2026-11-09, asked how small fixes should go faster: "Schlanke Spur festhalten"):** the ticket states the diagnosis and the exact change, and the Controller itself checks all of: no new or changed public export, route, dependency, contract, data flow or protocol; no protected file; at most one module. Then there is no separate Architect spec review, the Developer writes the failing test first as always, the independent Tester runs the targeted tests and `ponytail-review` on the full diff and no full smoke run, and the integration wave runs the one full gate. The Controller writes the three checks into `status.md` for the task. A failed check, or a change larger than the ticket says, sends the task back to the normal path with the spec review.
- Documentation-only changes get no full gate.
- Every full gate runs through the project-aware `~/.local/bin/gate` shim (fair slots, pooled by unit and browser), as `GATE_SLOTS=1 GATE_E2E_SLOTS=1 gate bash -c '<command>'` because `gate` starts a program without a shell. In this project the shim selects `~/controller-exxperts/gate.mjs` from `factory.config.json`; other projects keep their configured routing (decided by Sascha, 2026-11-07: “yes, this project only”).

## Capacity by measurement (decided by Sascha, 2026-11-04)

The Controller runs `node capacity.mjs` before every start and follows its verdict (pressure stall information, available memory, gate queue, foreign load, quotas). Starting values: at most 8 suite workers and 6 read-only workers; gate slots 3 unit and 2 browser, adapted to pressure. Under pressure: critical path, nearly finished tasks, waves, new development, debt. Every worker gets a memory and process limit where the runner supports it.

## Models (decided by Sascha, 2026-11-04)

- `gpt-6.1-terra` is the default for Developers, every Tester and spec reviews.
- `gpt-6-luna` for mechanical checklist work.
- `gpt-6.1-sol` only for ADRs and level-3 work, and at the top of the escalation ladder.
- **Escalation ladder:** after two failures on the same task the next attempt runs one tier higher.
- **Quota:** keep workers on the OpenAI models at every quota level; do not use the Claude fallback. Work normally under the measured capacity rules. When the weekly limit is near or reached, push current work and put the credit-reset request under "Needs Sascha" in `status.md`. Do not serialize work to save quota or wait for a calendar reset. Record quota readings there (decided by Sascha, 2026-11-06).

## Review loop

1. Developer done → Tester (fresh context) on current `main` plus the branch.
2. Tester failed → rework in the same worktree with the findings unchanged; after two failures one tier higher.
3. Tester passed → conformance review for level 2/3, else into the next wave.
4. A wave starts when 2 passed tasks wait, one has waited 60 minutes, a task is on the critical path, or nothing else is queued or running: the wait exists to batch tickets, so with an empty queue it only delays (decided by Sascha, 2026-11-09, asked whether integration should start at once when nothing else waits: "ja"). The wave merges, runs the full gates once, and pushes to `main`.
5. A red wave: rerun each failed parallel smoke alone on the same commit and report both results as above. For other known load flakes, one isolated rerun is allowed; three green isolated runs are the evidence. A real failure goes back to the task.
6. Merge conflicts are resolved by the task's Developer on its branch and checked by a Tester.

## Worker prompt state on every heartbeat (decided by Sascha, 2026-11-06)

On every heartbeat, the Controller checks the rendered prompt screen of each active worker terminal in addition to its Orca dispatch state. A live dispatch does not prove that an agent is working. If the screen shows an idle prompt, the Controller reads the recent output, sends a precise continuation through Orca and into the terminal, and confirms that the prompt started a new turn. The Controller records the observed prompt state and wake result in `status.md` and repeats this check on every heartbeat.

## Cleanup after every cycle (decided by Sascha, 2026-11-04)

Close finished workers' terminals, release or abandon their dispatches, remove worktrees whose branch is merged or safely pushed (push a WIP branch first if anything is uncommitted), delete merged branches, keep active and paused tasks. Run `node cleanup.mjs` at the end of every cycle and report the counts in `status.md`.

Work on the cleanup script itself is parked (decided by Sascha, 2026-11-06, answering "Das Aufräumskript wird seit Runde 12 nachgebessert ... Wie weiter?": "Parken, von Hand aufräumen"). Until the factory ships a fixed script, the Controller cleans by hand every cycle: for finished workers, discard a change that is only the lockfile rewritten by the install, remove worktrees that are clean and merged or pushed, delete `agents/` branches merged into `main`, and keep running workers, the integration worktree and anything unpushed.

## Code graph (decided by Sascha, 2026-11-09)

Sascha, 2026-11-09: "make all workers and yourself use graphify in this repo but do not check it into the upstream repo".

- **Use:** at the start of a task, run `graphify update .` in the worktree (code only, no model, no key; about two minutes for this repo). Then orient with `graphify explain "<symbol>"`, `graphify path "<A>" "<B>"` and `graphify query "<question>"` before reading broad swaths of code.
- **Limit, measured 2026-11-09:** the graph lists what a function calls, but misses callers that sit in functions handed to components in JSX (`openWorkspaceMarkdown` showed only itself). The graph is a map, never proof that something has no other callers: confirm with a search before a change or review states that.
- **Never committed, never upstream:** `graphify-out/`, `.graphify*` and `CLAUDE.md` stay untracked (`.git/info/exclude` of the clone; worktrees share it). The pre-push guard rejects them on any branch bound for EXXETA. Do not run `graphify claude install`, `graphify codex install` or `graphify hook install`: they write `CLAUDE.md`/`AGENTS.md` and git hooks, and `AGENTS.md` is a protected file.
- **Install:** graphify is installed per user (`pip install --user graphifyy`); on the shared host only in this user's home.
- **Measured, not assumed (decided by Sascha, 2026-11-09, asked whether to record that the gain is to be measured on the next tickets with and without the graph: "ja festhalten"):** on the first change that used it, the graph gave no gain: the spots were found by reading, and the build cost about two minutes, then about 30 seconds per update. For the next six tickets the Controller alternates: the first, third and fifth use the graph as above, the second, fourth and sixth do not run `graphify` at all. Every Developer report names `Graph: yes/no`, the number of tool calls until the first file it edits, and one sentence on whether the graph helped, misled or made no difference. After the sixth ticket the Front agent compares the numbers and brings Sascha a recommendation: keep, drop or limit to some kinds of tasks. Six tickets are a small sample and differ in size; say so in the comparison.

## Audit and improvement workflow (decided by Sascha, 2026-11-04)

- **Journal:** one JSON line per event in `journal.ndjson` (`node journal.mjs <type> <task> k=v…`).
- **Auditor:** every night after the last wave and on clusters (three same-reason failures or three stalls within an hour): a read-only Pipeline Auditor writes `audits/<date>-<n>.md` with the top 3 improvements and risks, each with measured value, cause, proposal, level and success metric.
- **Fast lane:** level-1 improvements (docs, templates, controller scripts, tests) the Controller implements itself, at most 1 at a time, as normal tasks with a Tester. Everything that changes Sascha's way of working, costs, capacity rules or a recorded decision goes to "Needs Sascha".
- **Retro per agent run:** triggers are two failed review rounds, an early stop, two stalls or nudges, the same self-caused error twice, a model escalation, or a defect that escaped to Sascha. A read-only Retro worker follows `.agents/skills/retro/SKILL.md`, reads the session log, and writes `retros/<task>-<n>.md` with 1–3 traceable candidates. Mechanical mistakes become automated checks; judgement calls become reviewer standards; nothing new goes into `AGENTS.md`.

## Starting workers

- **Parallel tasks:** before they start, the plan names each shared interface with exact fields and one test through the real producer and consumer. A task states what it depends on in its spec, not only in a message.
- Name every worker `<Task> · Worker <Role>`, and every sidebar entry and terminal after its role or task. Never keep an automatic name. `start.mjs` and `names.mjs` do this; other terminals in an entry are `<entry name> · <Purpose>`. On a shared host, name only your own project's entries.
- Generate every spec from the template (`templates/mkspec.mjs <role> …`) with parameters. Never derive a spec by editing another task's spec.
- Specs have numbered steps, "done when", abort criteria, a self-review against the spec, and the reply format (`worker_done` with branch, head SHA and check results, or one concrete escalation with progress pushed).
- Workers can be Codex, Claude Code or Pi; the specs and rules are the same.

## Talking to Sascha

- One question at a time, multiple choice, recommended option first.
- Status as one table: task, role, model, since, state, next step. Below it: new on `main`, "Needs Sascha", acceptance items with a sentence to try, problems, next steps.
- Before saying "it works": verify it in the real preview through the handed-out address.

## Data and safety rules (never delegate, never relax)

- No outward effects: agents and their tests change nothing outside the repository and the demo or test environment (no production systems, real accounts, sending, deploying or deleting). Whether the product acts on external systems is a product decision recorded in this project's docs.
- Tests run on demo data or a private copy of Sascha's data. The original is never written or deleted.
- No real data in the repo: no company values, names, addresses or secrets in code, tests, fixtures, reports or status files. `.env` is never committed. Filter `pair|token|code=` from any printed output.
- Workers never push to `main`. `--no-verify` is forbidden. No real model calls in tests.
- Work data never goes to the build server. Demo data and invented secrets only.

## Decision history

Append dated sections below as decisions are made. Superseded rules stay here with "superseded by …" and are removed from `docs/dev-workflow.md`.

## Additional decisions, 2026-11-09

- **Upstream:** one upstream pull request is intended later, but not now. Do not prepare or send anything to `EXXETA/exxperts` until Sascha resumes that work. Sascha: "einer aber warten".
- **Excalidraw:** keep it only in the fork and keep its changes separable, so a future upstream port can omit them cleanly. Sascha: "nur im fork".
