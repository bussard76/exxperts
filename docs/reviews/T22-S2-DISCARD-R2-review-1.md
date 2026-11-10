# T22-S2-DISCARD-R2 review, round 1

Verdict: pass
Reviewed commit: e0f8985d9ee0e174a607edcdfd9c71356942991d
Gates: focused Node 22 and Node 20.6 checks passed; full gate and merge with fork main intentionally deferred by dispatch.
Ponytail: Looks good for the bounded R2 change. Expected load is one person using a local room. The two-line fix shares the busy guard with the button and updates the Escape listener when that state changes.

What this change does: It prevents Escape from cancelling a Markdown navigation choice while Save or Discard is in progress. When idle, Escape still cancels navigation and leaves the draft to autosave.

## Scope and architecture

This is a focused independent review of the delta from `a7d519f0bbf479584c97fec72c27ef416226d90d`, not a fresh certification of all Series 2 or issue #22. The merge-base with `origin/main` is `461e6485bf932f5cba85ac3dde8e0104e47d5dec`; its 42-path diff is mixed. The inherited path list is unchanged, and the R2 delta contains only `apps/web-ui/src/App.tsx` and `apps/web-server/scripts/workspace-markdown-raw-ui-smoke.ts`. No main merge was made as explicitly instructed. The change is level 1 within the existing App module: no new export, dependency, route, data flow or protocol.

## Spec checklist

| Requirement | Evidence | Result |
| --- | --- | --- |
| Busy Discard and Escape with PUT held before forwarding or response held after write | Real Chromium, local server and disk: Cancel disabled, dialog remains, requested tab opens after release, original bytes survive reopen and autosave interval | Pass |
| Busy Save and Escape at both timings | Same browser smoke: requested tab opens and saved draft survives reopen and autosave interval | Pass |
| Idle Escape cancels navigation, keeps exact draft and resumes autosave | Same browser smoke checks selected tab, exact input and disk | Pass |
| Checkbox, image and conflict coverage retained; draft and external bytes preserved | Complete RAW browser smoke on both Node versions and image UI smoke on Node 20.6; RAW checks checkbox discard, conflicting restore, Reload, Keep mine and later in-flight edits | Pass |
| Listener sees current busy state; tests prove regression | App effect depends on `markdownEditorPromptBusy`; shared Cancel handler checks it. Developer red logs show original Discard failure and stale-listener Save failure; browser tests use public UI, local routes and disk | Pass |
| Invented data and no external effects | Test uses a throwaway HOME, synthetic files and local server; changed code introduces no untrusted content rendering, secrets or external calls | Pass |
| Issue #22 lock, broader Node-floor and licence requirements | Outside the bounded R2 delta; developer report and final combined wave retain the broader evidence and release checks | Not re-certified |

## Findings

No functional findings in the bounded change. The prior review's busy Escape defect is fixed in the exercised scenarios.

## Debt candidates

None identified in this focused delta.

## Checks and limitations

Normal-lifecycle `npm ci` passed with `EXXETA_SKIP_BROWSER_INSTALL=1` and `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, followed by runtime and UI prerequisite builds. Node 22.23.4 passed UI and script typechecks and the complete RAW browser smoke (1/1); its direct rerun also passed with individual browser assertion output. Node 20.6.0 passed both typechecks and the RAW and image browser smokes (2/2). No targeted failures, retries or skips occurred. All commands used the requested gate attribution and explicit controller configuration; detailed logs and independent path check are in `~/controller-exxperts/evidence/t22-s2-discard-r2-independent-2026-11-10/`.

The previous independent review reported a full-gate failure at `a7d519f0bbf479584c97fec72c27ef416226d90d`: `room-topbar-ui-smoke.ts` and `consult-mention-smoke.ts` also failed in isolation and matched the pinned baseline; `key-refused-setup-smoke.ts` passed in isolation and its cause remained unresolved. Those results are not a full gate for this commit and are not erased by this focused pass. Native Windows is waived, macOS remains pending, and the final combined wave owns full build/smokes and release.
