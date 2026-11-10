# T20 document window prototype

Throwaway visual question: which chat affordance, window count and placement should a detached document pane use? Q1/Q2/Q3 A are provisional preferences, awaiting visual sign-off. This standalone fake models the existing room, chat, document tree, tabs and editor with invented data; it is not product implementation.

Run from the repository root (choose a private interface reachable by the viewer):

```sh
python3 -m http.server 19220 --bind 127.0.0.1 --directory design/t20-detach-window
```

Open <http://127.0.0.1:19220/> on that machine. On the current host the preview is bound to its private interface with `python3 -m http.server 19220 --bind 100.120.0.9 --directory design/t20-detach-window` at <http://100.120.0.9:19220/>. Selection links use `?q1=A&q2=A&q3=A` (Q1 and Q3 accept A/B/C; Q2 accepts A/B). State and drafts reset on reload.

Self-review: Q1 A/B/C, Q2 A/B, and Q3 A/B/C are visible together and selectable; room and conversation switching, dirty Cancel/Save/Discard, dirty movement, chat close and child return are represented. Browser interaction check covered selection URL, detach, dirty Cancel/Discard/Save, room switch, chat close and child return; desktop and mobile captures were inspected or generated. No actual windows, persistence, OS positioning, native-close handling or forced-termination protection is implemented or proved. All behavior is local and in memory, with no network requests or real accounts. No dependency, product route or product data flow changed. Architecture impact: level 1 for this isolated fake; no product boundary changes.

Checks: JavaScript syntax and Playwright browser interaction passed; `git diff --check` passed. No unit tests or full gate were run, as requested. Screenshots are untracked under `.build/screenshots/t20-desktop.png` and `.build/screenshots/t20-mobile.png`. Remaining decision: visual sign-off and separate feasibility evidence for real window lifecycle; none is implied by this mock. Graph: no; this standalone fake did not require product-code navigation. The pre-existing lockfile modification was excluded.

The first normal commit hook failed because generated runtime declarations were absent in the fresh worktree; building the four existing runtime workspaces supplied them before retrying. No source or hook was changed for this setup.
