# T20 native close feasibility — 2026-11-10

Verdict: **inconclusive and insufficient for implementation**. The existing app has no detached document window or correlated close protocol, and the tested browser platform can leave a child alive after its parent closes. The no-loss requirement and ADR pending status remain unchanged. Front must take alternatives B/C/D back to Sascha; no alternative is selected here.

Environment: Linux x86_64, kernel 6.8.0-146-generic, Node v22.23.4, npm 10.9.9, Playwright 1.60.0, headless Chromium 148.0.7778.96. No DISPLAY or WAYLAND_DISPLAY. Base e6cad628da4213913a7cf1ee88932e2899d383f6, origin/main 3fe7bc75ad43199f9becde9ef85d99e876051b55. Tests use invented data and loopback ephemeral ports. No real model call, real account, shared exxperts-web launcher or screenshot.

| Entry point / obligation | Observation and limit |
| --- | --- |
| Actual app attached Markdown Save/Discard/Cancel | `app-smoke-rerun.log`: existing browser smoke passed: cancel retained the draft, failed save retained it, explicit discard switched, successful save persisted before switch; it exercised later edits and in-flight saves. Failure responses and controlled delay were injected; the editor, app, local server and filesystem were real. This is not a detached-window proof. |
| Actual Electron chat native close / forced quit | Not executed: no Electron installation in this worktree and no native desktop session. Source only: `apps/desktop/src/main.ts` close listener prevents close and immediately hides unless quitting; `before-quit` stops the server and calls `app.exit`. This does not prove child acknowledgement, interception or draft survival. Xvfb exists but is not a native user desktop. |
| Child refusal and explicit acknowledgement | `child-refusal.log` demonstrates a synthetic same-origin child's native beforeunload refusal preserving its textarea, followed by an accepted close observed as a Playwright close event and `window.child.closed`. These are browser observations, not the proposed correlated explicit allow/refuse or its timing; no actual app producer or consumer exists to measure. |
| Browser close / reload | `browser-harness.log`: dismissing synthetic parent beforeunload close and reload preserved the parent, child and child's textarea; reload wait timed out because navigation was canceled. Accepting parent close destroyed parent but left child and draft alive after 500 ms. Harness uses Playwright close, not a physical title-bar gesture; headless behavior is not every browser/platform. |
| Forced quit, disconnect and orphan shutdown | Not executed against the actual feature: none exists. After accepted synthetic parent close, the child remained alive at 500 ms, so immediate dependent shutdown is not established. Browser/process kill, power loss and disconnect draft persistence were not established; no claim of survival. |
| True producer/consumer timing | Existing `App.tsx` uses a single pending continuation and waits for editor `save()` before running it; `MarkdownEditorPane.tsx` holds the draft and serializes in-flight saves, scheduling autosave after 1000 ms. The real smoke exercises those attached paths, not a cross-window producer/consumer. No child acknowledgement exists to time. |

Commands, from the worktree (the two harness scripts and logs are in this evidence directory):

```sh
npm run build --workspace @exxeta/pi-web-ui
(cd runtime && npm run build)
GATE_TASK='T20-FEASIBILITY' GATE_WORKER='t20-feasibility' GATE_ROLE='Developer' GATE_AGENT='codex' GATE_MODEL='gpt-6.1-terra' gate npx tsx apps/web-server/scripts/workspace-markdown-images-ui-smoke.ts
node /home/developer/controller-exxperts/evidence/t20-feasibility-2026-11-10/browser-harness.cjs
node /home/developer/controller-exxperts/evidence/t20-feasibility-2026-11-10/child-refusal.cjs
```

The first app smoke (`app-smoke.log`) failed at server startup because runtime dist was absent; after the prerequisite runtime build, one rerun passed. The first commit attempt was blocked by the same missing runtime declarations; the normal hook passed after the build. The browser harness's canceled reload timed out intentionally after two seconds; the following retained-state observation succeeded. Initial harness debugging was inconclusive (popup obtained before event and then a canceled reload without a short timeout); the final scripts and logs are the reproducible runs. UI build output is `ui-build.log`. No full build or smoke suite was run.

Self-review: option A dated and recorded in both proposed documents; all open questions retained; no accepted ADR, feature implementation, project test change, new dependency/store/route or guarantee change. Evidence separates synthetic platform probes, source observations and actual attached-app smoke; untested native, forced and disconnected paths remain explicitly inconclusive. No screenshot was taken. Pre-existing `package-lock.json` modification was left untouched and uncommitted. Next decision: Front presents B/C/D and these limits to Sascha, keeping implementation blocked.
