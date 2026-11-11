# T22 lock-path causality reconciliation

Reviewed commit: 1f4b79b01ebd784b6c1116a0b78c42389eae1c24
Verdict: pass

Issue 22 step 1 disposition: **Series 1 PASSED; Series 2 PASSED** under the Controller's clarification of Sascha's no-worse-than-upstream decision. This verdict completes the bounded evidence reconciliation; it does not close issue 22 or certify a product gate. No changed path or field remains without a supported dependency or change explanation under that standard.

The Controller clarified that step 1 calls for a reason for each changed lock path and exclusion of install-only rewrites; it does not require reconstruction of missing upstream tarball bytes or proof that npm selected the only possible hoist. This is an interpretation of the existing acceptance scope, not a new waiver or a claim that those bytes match.

## Evidence and method

Fork `origin/main` fetched at the reviewed commit. Baseline `461e6485bf932f5cba85ac3dde8e0104e47d5dec` has lock SHA-256 `c4b4553fd6a054ae042c239bffe3980b25044becc0c380ffa8bc6f79262ae488`; Series 1 `6dffcd539bdb41cec6d1895cf30ac0677d09843e` has `008cfe9e875fa04d31b11eff9cb94f2e36dfeab45de3c38235082c12fc3143ac`; Series 2 `c156379b90f540c01695d6118d26647a7b67b106` has `64db831de4dd1ad2ebf0dd4211cfabddbe0c790bec9f761a0856e59becf1c800`.

Under `/home/developer/controller-exxperts/evidence/t22-lock-closure-2026-11-11/`, the original `series1-inventory.json` and `series2-inventory.json` preserve every before/after path and field; `relocations-and-exclusions.json` preserves old/new graph and relocation details. Additional `series1-causality-final.json` and `series2-causality-final.json` map every final changed record to direct input and valid shortest graph paths, or the explicit manifest, removal or flag explanation; `causality-check.cjs` records the read-only calculation. It excludes third-party dev dependencies and optional peer edges, resolves peers at the parent/ancestor level, and verifies the recorded ranges and versions using the already-installed `semver` library. Workspace manifest dependencies and optional dependencies are install inputs. Matching range paths are evidence of the dependency reason, not a claim of uniquely optimal placement.

## Series 1

The inventory accounts for **171 added, 14 removed and 22 changed** lock records. Root and server records change for the declared ExcelJS, docx-preview, jsdom and optional koffi inputs; UI changes for the PPTX renderer. Every added record is reachable through dependency or optional-dependency edges from those inputs with satisfying recorded ranges. The 18 changed package-version records are connected to jsdom's change from 29.1.1 to 26.1.0; their version, resolved/integrity, engines, dependencies and peer metadata are package-version metadata, as detailed field by field in the original inventory. The retained `series-lock-variant-c-2026-11-10/series1-registry.json` and `t22-series1-lock-2026-11-10/summary.txt` record 189/189 new or version-changed registry integrity matches; this is historical evidence, not a new registry check.

Nine removed root records are reached in the old jsdom graph. The other five are `runtime/node_modules/{bl,buffer,fs-constants,minimist,tar-stream}`: their same-name, same-version records appear at root and the recorded dependent resolutions move to those root paths, with dependent movement recorded where applicable. The old records contain neither resolved URL nor integrity; the evidence proves name/version and observed resolution, **not byte or integrity equivalence**. The remaining changed record `node_modules/source-map-js` gains the derived dev flag after the old production jsdom → css-tree consumer disappears, while the surviving postcss consumer is dev. The old and new direct incoming edges are retained in `relocations-and-exclusions.json`.

## Series 2

The inventory accounts for **63 added and one changed** record. The changed `apps/web-ui` fields are the ten declared TipTap dependencies; each added package has a satisfying path from those inputs without following any installed third-party dev dependency or optional peer. In particular, `@tiptap/react` has required peers `@types/react`, `@types/react-dom`, `react` and `react-dom`; their dependency edges reach `@types/prop-types`, `csstype`, `loose-envify` and `scheduler`. All eight previously questioned paths and their recorded ranges, versions and peer optionality are in `series2-causality-final.json`. These are required peer edges, not optional-peer assumptions. `t22-series2-lock-2026-11-10/integrity.jsonl` and `progress.md` record matching registry URLs and integrities for all 63 records, for the byte-identical final lock.

For both series, every one of the 23 native `libc` fields and the three runtime workspace `dev`, `optional` and `peer` fields identified by `series-lock-variant-c-2026-11-10/pr0-diff.json` equals the baseline, including field presence; all 26 comparisons are in `relocations-and-exclusions.json`. The unchanged upstream missing-metadata limitations are retained.

## Limits

The Series 1 `npm ls` gap was previously closed by evidence in `46025e7c87cac0523b77e94d766e0fd46f1c655f`; that report and `586ce44f98f5f64908deaed628d26fe39e2a83c3` remain intact. This work used existing Git objects, JSON, manifests and logs only, plus the installed semver calculation. It made no install, npm, signature, registry, test, gate, browser, product or upstream PR change and makes no new product/gate claim. Raw gate failures and exceptions remain as previously recorded; Front-owned PR disclosures and Mac acceptance remain pending. No fresh product finding or debt candidate is asserted.
