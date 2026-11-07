# Debt register

Every known debt, with origin, risk, proposal and size. Reviews add debt candidates here by category; the hardening phase works them off by category. Roughly a fifth of capacity goes into paying debt down.

**Release condition:** the categories `security`, `load`, `tests` and `edge-case` must be `done` or carry `accepted by <human> (<date>): <reason>` in the Status column before a release is approved. Open items in these categories block the release gate.

| ID | Category | Origin | Risk | Proposal | Size | Status |
|---|---|---|---|---|---|---|
| D01 | style | T5 reviews 1–2; clean main, `room-topbar-ui-smoke.ts` | Minor: top-bar icon alignment assertion fails on this host; cause unconfirmed. | Identify the failing part and host conditions, then correct the rendering or assertion with evidence. | M | open |
| D02 | style | T5 reviews 1–2; clean main, `consult-mention-smoke.ts` | Minor: composer overlay pixel assertion fails on this host; cause unconfirmed. | Investigate the viewport and comparison, then correct the rendering or assertion with evidence. | M | open |
| D03 | edge-case | T5 review 2; `persistent-room-workspace-markdown-files.ts` | Minor: atomic replacement can change a file’s existing mode to 0600. | Preserve the existing mode and test saving a disposable file with a non-default mode. | S | open |
| D04 | edge-case | T5 review 2; `WorkspaceImageExtension.ts` | Minor: preservation of HTML image attributes is unverified and may lose markup. | Clarify supported HTML image attributes and test round-trip preservation if required. | S | open |
| D05 | edge-case | T5 review 2; `MarkdownEditorPane.tsx` | Minor: autosave timing starts with the first edit rather than the latest edit. | Reset the timer on each edit and test the intended idle interval. | S | open |

Categories: `tests`, `edge-case`, `security`, `load`, `style`, `tooling`, `flake`.

`ponytail-debt` lists every `shortcut:` comment in the code as a second source; reconcile it into this table during the hardening phase.
