# T16-R4 architecture spec

Verdict: change-spec
Spec: `docs/reviews/T16-revised-spec.md`, `docs/adr/0006-macos-workspace-tab-close.md` and `design/t16-close-shortcut/logic.md` at `f5f216595a149e11b76305dee65cc64838e6051e`; issue #16 read 2026-11-09. Prior review: `origin/agents/t16-r3-specreview:docs/reviews/T16-R3-architecture-spec.md` at `bbfe50d`.
Level: 3, confirmed: the transient decision contract and data flow cross the desktop main and sandboxed renderer seam.
Decision: ADR-0006 records Sascha's acceptance of option A, the flow and the task-specific no-clickable-fake exception. The finding below is a technical gap in that decision; it does not establish a need to ask Sascha to choose again.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Input and fallback | Desktop `main.ts` menu and BrowserWindow | Cmd+W selects focused window; explicit unhandled uses its existing close action | `buildAppMenu` installs a Window menu and `createMainWindow` hides on ordinary close. Preserve other menu roles, auxiliary close and other platforms; define no focused window as no action. Test the real menu callback, including the hide-to-tray fallback. |
| Active tab and dirty guard | Web UI `App.tsx` current right pane and `requestCloseWorkspaceTab` | Renderer close decision calls the same path as the tab button | Hidden retained tabs alone are unhandled. The existing guard replaces its pending action, so consume repeats and an already open close, switch or navigate prompt before calling it. Save, Discard, Cancel and failed save are handled. |
| Contract, identity and failure | Main process and sandboxed app document | One bounded request per main window; arm, then act; no path, content or credentials | A single 1,000 ms deadline covers both phases; missing entry point, exceptions, malformed results, destroyed/replaced window, navigation, expiry and stale results are unavailable and never fall back. Bind tokens to the intended document and window, invalidate at navigation start, and recheck identity, focus and deadline before fallback. The act-side focus invalidation is not established: see finding 1. |
| Privacy and ownership | One developer owns producer and consumer | Fixed typed transient values only, with no user file data | Preserve sandbox and navigation policy. Diagnostics must be bounded and exclude document data and credentials. A single owner makes cross-worker interface dependencies unnecessary. |
| Outside-in evidence | Issue, accepted ADR, spec and logic diagram | Approved visible flow and decision states | The diagram captures the visible handled/unhandled/unavailable flow and accepted waiver. Update it alongside the corrected technical protocol so the arm/act invalidation and its failure paths are traceable; no new visible-flow approval is implied. |
| Evidence | Actual desktop menu producer through the real renderer consumer | Invented tab data, existing close guard and real window fallback | The spec requires integrated producer/consumer coverage, UI guard tests and Sascha's packed Mac check. Include delayed arm and act, focus loss and return, navigation, window replacement/destruction, missing focus, timeout, delayed result and invalid values; assert no tab action, prompt or fallback for invalidated requests. Tests must exercise the actual invalidation mechanism and adverse ordering, not only a mocked stale result. |

## Prefactoring

None established. Reuse the existing tab-close action and guard; avoid a second close flow.

## Findings

1. **Design-relevant: the proposed act phase still lacks an established focus invalidation guarantee.** Main checks its focus generation before queuing act, but that generation is not consulted by the renderer at the side effect. If focus leaves and returns after act is queued, `document.hasFocus()` can again be true. The renderer epoch only helps if the blur handler has already run before the queued act; the spec explicitly leaves that ordering to be established, and gives no Electron guarantee or mechanism that makes it true. If act runs first, it can close the background tab or open the dirty prompt; rejecting the eventual result in main cannot undo that action. The same concern applies if the main process has not yet observed a native focus loss when it performs its pre-act check. This is an unresolved real race, not a stale-result-only issue or a precision instruction.

   Revise the spec to identify a buildable synchronization or invalidation mechanism that makes the main-owned focus lifetime authoritative at the instant of the renderer action, including blur/refocus, and state the ordering guarantees on which it relies with evidence applicable to the supported Electron/macOS runtime. A renderer notification queued behind act, a focus snapshot alone, or a main-only check after act does not establish that guarantee. Specify how navigation and window destruction/replacement invalidate the same authority and how unavailable is reached without side effects. If the proposed mechanism needs a new contract or security scope beyond ADR-0006, return it for the appropriate decision; otherwise no new product signoff is required. Require a real shell-to-renderer test with controlled adverse ordering as well as both blur/refocus and permanent-loss cases; a passing timing-dependent test alone does not prove an undocumented ordering guarantee.

No code or tests were changed, and no test suites were run.
