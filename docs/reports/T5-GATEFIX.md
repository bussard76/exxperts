# T5-GATEFIX developer report

## Architecture impact

Level 1: composer smoke Chromium launch and existing artifact viewer controls; no new exports, dependencies, routes, stores, contracts, or data flows.

## Context: issue #5 (not this task's implementation)

- [ ] Result: room workspace folder appears as a sidebar tree.
- [ ] Result: clicking Markdown opens the right editor.
- [ ] Result: linked images resolve and saves preserve Markdown, including image links and paths with spaces.
- [ ] Result: dragging a file to the composer inserts its relative path.
- [ ] Observable: full build and smoke suite green, including the five named workspace and composer smokes.
- [ ] Observable: preview shows an image in Markdown in a room with a folder.
- [ ] Observable: editing and saving changes only the edit, keeping the image line unchanged.

These are context only; independent Tester and wave own full integration checks.

## Bounded acceptance checklist

- [ ] Composer smoke uses grayscale rasterisation only in its own Chromium launch; all geometry, thresholds, assertions and one-CSS-pixel negative control remain intact; prove the displaced control is detected.
- [ ] Viewer open-tab and maximize/restore glyphs use inline vectors, preserving names, titles, disabled state, actions, pressed state, targets, sizing and behavior.
- [ ] Unchanged topbar smoke passes at 100% and 125%, sidebar open/hidden, deck and long-name cases.
- [ ] Separately verify real rendered maximize and restore actions, accessibility and appearance at both zoom levels.
- [ ] Run affected typechecks, suites and browser smokes through gate; report host coverage, limitations and screenshots.
- [ ] Merge origin/main, rerun affected suites, self-review every item, and push the completed branch.

## Assumptions and limits

Only the available host can be verified; other supported platforms require independent coverage. The room-failure-status timeout remains unexplained and outside this task.

Composer evidence: `consult-mention-smoke.ts` failed before the flag (1,045 aligned vs 2,048 shifted pixels at 1280 light) and passed afterward on all four viewport/theme cases; aligned differences were zero and shifted counts remained above 50 (for example, 1,823 at 1280 light). The existing one-CSS-pixel control and assertions were unchanged.

Blocked: the commit hook rejects the modified composer smoke because an unchanged line 643 contains the string `token=` in an output-redaction filter, which its credential scanner flags. The scoped composer flag is present in the worktree but cannot be committed without a decision on the false positive. The unchanged topbar smoke also reproduced the specified 100% and 125% glyph alignment failures; viewer correction has not been implemented. The local dependency install altered package-lock.json; this unexpected change is preserved and unstaged. Preparation built the five individual workspaces needed to run the browser checks; this was equivalent to the full build despite the developer-stage instruction, and should not replace independent Tester and wave gates.
