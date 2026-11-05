# T5-GENERATOR architecture spec

Verdict: pass
Spec: `~/controller-exxperts/specs/t5-generator-dev.txt` (SHA-256 `001c9aedd50fcf9e0d1f81f0c67a968aaf3919eacf803a540c410dfc1a6362a1`); `~/controller-exxperts/analysis/T5-retro-review.md` (SHA-256 `99be05a6f1b487d70d717406f38f8f5528cdab65bab39f488a93c1c32d827167`). The Controller directory is not a Git checkout; the product repo base reviewed is `397034345dd38e57cb90e2f5666d8b35dff10b1f`.
Level: 1, confirmed for the explicitly scoped formatting correction within `templates/mkspec.mjs`; no new export, dependency, route, store, workflow or data flow.
Decision: none needed. Any workflow or process rule change requires escalation.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow | Evidence or required change |
| --- | --- | --- | --- |
| Omit empty optional browser prohibition | Controller `templates/mkspec.mjs`, generated Developer spec text | `lib.mjs` reads configuration into `CMDS`; the existing CLI renders and writes the spec | `DEV_CHECKS` currently interpolates `CMDS.e2e` even when it is the empty string. Omit the optional clause when absent; preserve the full verify prohibition. |
| Retain configured checks and stages | Same shared `DEV_CHECKS` used by `dev` and `rework` | Generated instructions remain the consumer interface | Preserve configured e2e prohibition, targeted typecheck/lint, affected unit and browser checks, and Tester/wave ownership of full gates. Do not alter Tester or other role rendering. |
| Verification and ownership | Generator CLI and generated text in isolated synthetic fixture | Invented config to real generator entry point to written output; no generated commands executed | Test absent and configured e2e, both Developer paths, unchanged targeted checks and full verify requirement. Candidate and tests stay under the specified controller analysis directory for independent review; live generator stays untouched. No other shared implementation interface or parallel dependency is specified. |
| States, privacy and errors | Existing configuration and generator behavior | No new input or error handling | Treat empty, missing or null optional e2e as absent; preserve nonempty configured command verbatim. Preserve existing behavior for unrelated configuration and errors. Invented data only; no real services. |
| Outside-in evidence | Text-only controller change | No product UI or route changes | The retrospective identifies the faulty rendered text and intended outcomes; no design export or visual logic diagram applies. Issue #5 describes a separate product feature and is context only. |

## Prefactoring

None needed. The existing shared text is the smallest implementation location and exercises both Developer render paths without a new seam.

## Findings

No design-relevant blockers. Binding precision for the Developer: in the absent case remove only the optional browser-command prohibition and its connecting wording, keeping a grammatical sentence and the existing verify prohibition and stage responsibility; in the configured case retain the existing command and all other check instructions. Test the written output through the generator CLI with invented fixtures, including both `dev` and `rework`, without executing rendered commands. Preserve existing unrelated output and do not change workflow, gates or the live controller. The original task's generic issue checklist and product-stage commands are superseded by its explicit controller-only scope and the coordinator's binding clarification.
