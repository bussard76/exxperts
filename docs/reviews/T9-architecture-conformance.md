# T9 architecture conformance

Verdict: pass
Reviewed commit: cad8daef22e2de6eb68b8c4084dd0cfc2b685cb1
Branch reviewed: origin/agents/t9-hardening
Diff base: 981719c9f54042965f4a5802d5aa897b4f497007 (merge-base with fetched origin/main)

## Architecture impact

Level 3: room workspace preview/Open routes, web UI preview modules, isolated renderer documents, parent-to-frame file delivery and the local OS-open contract. Accepted ADR-0004 records Sascha's decision, including the two renderer dependencies, explicit Open extensions, read limits, single-delivery lifecycle and accepted self-navigation risk. ADR-0002 and ADR-0003 retain workspace and local-action authorization.

The historical `origin/agents/t9-specreview:docs/reviews/T9-architecture-spec.md` says `Verdict: level-3`, not pass. The coordinator explicitly confirmed that ADR-0004 at this reviewed SHA resolves that decision and instructed this conformance review to use it without another spec round. No maintained `ARCHITECTURE.md` exists; no additional import baseline was assumed.

## Boundary checklist

| Area | Evidence | Result |
| --- | --- | --- |
| Dependencies and renderer isolation | `apps/web-ui/package.json` and the committed lockfile pin only the two added direct dependencies: `@aiden0z/pptx-renderer` 1.4.0 and `@excalidraw/excalidraw` 0.18.1. Only their frame entries import them. `WorkspaceFramedPreview.tsx:4` imports entries with `?worker&url`; `vite.config.ts:16` inlines dynamic imports within each emitted renderer bundle. | Matches ADR-0004; renderer implementation stays outside the app document. |
| Ports, exports and imports | Root and web-server manifests, including package export surfaces, are unchanged. HTTP route declarations and remote route policy are unchanged. New source exports are `WorkspaceFramedPreview`, `WorkspaceTextPreview`, the frame-local `CanvasPage`/`ShowPage`/`mountCanvas`, and the UI-local `useHoverTooltip`; their callers remain within the web UI. The server adds the already-exported `WEB_UI_DIST` to its existing server-app import. | No unapproved public package export, route or forbidden import. Internal UI seams implement the accepted preview experience. |
| File reads and storage | `room-settings-routes.ts:283` authorizes the room, conversation, current read policy and guarded file before either frame document or file response. Lines 344–380 read text/framed bytes through a descriptor, check identity/content metadata before and after bounded reads, then revalidate policy and target. Hard ceilings are 16,777,216 text bytes and 26,214,400 framed bytes. | Approved workspace-to-browser flow; no new durable store or persistence flow. Metadata-only chmod does not broaden the separately guarded Open action. |
| Frame contract | `WorkspaceFramedPreview.tsx:19` fetches one requested file with cancellation; lines 36–55 check message source, mark delivery before transferring the ArrayBuffer, handle status and timeout, and use `sandbox="allow-scripts"`. Both entries accept bytes only from their parent and return ready/rendered/failed messages. App preview instances are keyed by file path. | Matches the approved single-delivery contract and per-tab ownership. Direct frame responses contain renderer code, not workspace file bytes. |
| Containment and outward effects | `room-settings-routes.ts:342` supplies CSP sandbox without same-origin, blocks connections/forms and external resources, and permits only inline scripts/styles and data/blob media. No third-party renderer is imported into app execution. | No additional external-system path found. Self-navigation, including a URL carrying the one opened file's content, is the explicit residual risk Sascha accepted in ADR-0004. This is not a claim of complete network isolation. |
| Local OS Open | `room-settings-routes.ts:218` retains affirmative loopback/origin/action authorization, paired/shared-server refusal, current workspace guards, immediate target revalidation and the existing opener seam. Its extension list at line 261 exactly matches ADR-0004; `.xls` is excluded and `.drawio`/`.dio` are Open-only. `remote-route-policy.ts:175` remains `local`. | No broader host command or host-access contract; the approved extension expansion is accounted for. |
| Adjacent changes | Word CSS and metadata comparison changes remain in the existing parser/preview path. Text formatting, tooltips, tab headers, picture alignment and dividers stay within web UI presentation. Renderer notices and documentation introduce no runtime interface. | No additional module responsibility or data-flow change requiring a decision. |

## Findings

None within the coarse conformance scope. No unrecorded export, contract, durable store, data flow or forbidden import was found.

## Focused checks

- Reviewed the complete changed-file inventory against the base above, the source diff and connected route/parent/frame code, manifest/lock dependency inventory, issue #9 including its later decisions, the historical spec review, ADR-0002/0003/0004, and the architecture/coordinator protocols.
- `git diff --check 981719c..HEAD` passed.
- A read-only Node assertion check passed for the two direct dependency additions and locked versions, renderer-only imports, worker URL imports, actual iframe sandbox attribute, source/single-transfer controls, unchanged package manifests and HTTP route inventory/classification, and exact ADR Open allowlist. Its first invocation incorrectly matched `allow-same-origin` in an explanatory comment; checking the actual iframe attribute corrected the check, with no product change.
- No full suites, browser runs, model calls, real user-data access or OS opener were run. This is architectural conformance, not a replacement for the independent Tester pass.

## Debt candidates and acceptance limits

No additional edge-case investigation was undertaken. Existing `docs/reports/issue-9.md` records security advisories and licence-source verification, plus supported-platform pruned payload counts and packaged Electron rendering still to verify; those remain independent hardening/acceptance work rather than architecture findings. The accepted frame self-navigation risk remains in force.

## Review provenance

The active worktree acquired an unrelated lockfile modification before checkout. Per the coordinator's instruction, it was left untouched; review and the report-only commit used a clean temporary worktree created directly at the full reviewed SHA, with no merges. Only this report is changed by the Architect.
