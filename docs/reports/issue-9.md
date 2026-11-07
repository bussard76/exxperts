# Issue 9 developer report

## Architecture impact

Level 3: workspace preview routes, renderer frames, parent-to-frame bytes and local OS-open contract; ADR-0004 records Sascha's decision. Base feature commit cf043a686a38f028708d88cf796cf5aa84d983f3 is an ancestor; architecture spec evidence is merged.

## Result and observable acceptance checklist

- [ ] Word multi-page layout, footer and horizontal scrolling.
- [ ] Metadata-only chmod accepted; content changes rejected.
- [ ] PPTX valid deck, damaged input and 26,214,400-byte ceiling.
- [ ] Excalidraw empty, one and multiple frames, deleted elements, invalid input.
- [ ] Frame viewer zoom, pointer anchoring and limits, drag, double-click, controls, tabs, resize and themes.
- [ ] Text and JSON success, invalid JSON, UTF-8 replacement, 16,777,216-byte ceiling and text-only rendering.
- [ ] Concurrent framed tabs, switching, reordering, hidden tab and close while loading.
- [ ] Opaque origin, direct frame load, blocked network resources and forms, hostile inputs and isolation of renderer code.
- [ ] Real route: bounded stable descriptor, replacement, growth, content change, denied path, revocation and failure.
- [ ] Frame single delivery: repeated ready, replacement navigation and no repeated fetch/resend; failure and timeout.
- [ ] Local authorized OS open and approved extension list, denied paths and paired devices.
- [ ] Renderer assets in package, payload limits, notices, audit and Electron CSP/build evidence.
- [ ] Changed `.txt` smoke expectation and success case per Sascha's decision; KaTeX scope evidence without modifying its smoke.
- [ ] Developer targeted checks and item-by-item self-review; merge current main and rerun affected suites.
- [ ] Independent Tester, architecture conformance and wave integration (owned by subsequent stages).

Draw.io and all its feature/test points are excluded. The Mac at cf043a6 passed 375/377 smokes; `answer-content-smoke.ts` and the obsolete `.txt` expectation in `workspace-file-preview-smoke.ts` failed for branch-caused reasons. Mac real-file counts: Word 53/54, PDF 10/11, Excel 8/8, PPTX 5/5; one damaged Word and one too-complex PDF showed the plain error sentence. Rendered appearance was not checked.

## Files changed, tests, assumptions and debt

Pending implementation. Screenshots, if any, stay untracked under `.build/screenshots/`.

The public-route replacement regression failed before the fix for `race-json.txt` and passes after descriptor checks for early and late replacement of text and PPTX files and growth beyond the text limit (`workspace-file-preview-smoke.ts --html-race-child`). The smoke now checks successful `.txt` and uses `.csv` for the unsupported-type assertion, following Sascha's decision. The KaTeX smoke's startup assertion reads `index.html`, but its one-copy assertion scans every JavaScript file in `dist/assets`, including frame bundles (`answer-content-smoke.ts:345-356`); its stated purpose is answer and Mermaid maths, and the test and dependency remain unchanged pending Sascha's decision.
