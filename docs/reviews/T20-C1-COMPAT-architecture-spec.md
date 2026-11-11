# T20-C1-COMPAT architecture spec

Verdict: pass

Spec: Controller's 2026-11-11 binding compatibility correction, `design/t20-detach-window/contracts.md` and `docs/specs/T20-HARDEN.md` at source `9145edf59f79281f658192eb23ad0e2d27aa2b13` (`origin/agents/t20-harden`, verified after fetch). This is a reconciled pre-build review of the C1 allocation detail, not implementation or acceptance evidence.

Level: overall T20 remains **level 3**, accepted ADR-0009 option A, decided by Sascha on 2026-11-11; independent R2 spec pass is `0dd51dafd19550299d3c977f4dbba0326101ad15`. The narrow correction is **level 1**: a private implementation detail within the existing web UI ownership, preserving the identity contract and all external and internal field representations and flows. The frozen C1 comments require reconciliation under the register's first paragraph; this review supplies that reconciliation, not a new architecture or human decision.

## Fit checklist

| Requirement | Owning module and seam | Boundary/data flow and evidence |
| --- | --- | --- |
| Fresh owner and request identity | App owner and private C1 allocator → App's existing C1 consumers | OwnerId and RequestId remain UUIDv4 strings, unpredictable and freshly allocated at the specified lifecycle points. Context, Stamp and Correlation fields, generations, provenance and one-use rules stay as frozen. The allocator does not provide authority by itself. |
| Supported origin and privacy | Actual owner window's crypto → private allocator | `SECURITY.md` documents plain HTTP inside the encrypted remote tunnel. The locally intercepted invented HTTP-origin observation in `docs/reports/issue-20.md` found `randomUUID` unavailable and `getRandomValues` available; it is not paired-device acceptance. Controller cites W3C Web Cryptography API sections 10.1.1/10.1.2: `randomUUID` is secure-context-only, `getRandomValues` is not, and the UUID algorithm uses cryptographic bytes and version/variant bits. No credential, room, path or draft is added to IDs. |
| Failure and ownership | App admission and existing error/refusal paths; retained session remains App-owned | A failed allocation grants no identity, operation or child authority; it cannot tear down the existing session or authorize continuation. C3/C4/C5 validation, child registration and native prevention remain unchanged. The shell's native-prepare/native-return request production in C5 remains shell-owned; this correction does not move those producers into the renderer or change their contract. |
| Evidence and delivery | Real owner producer → request/child consumers, later independent Tester and level-3 conformance | Secure and intercepted insecure owner origins must exercise the real implementation; R14 still requires actual full-paired and read-only child flows when the host exists. No mock of both ends, format-only sample or intercepted-origin primitive check establishes paired support. |

The connected source currently has App-owned room selection and editor guard state; the C1–C8 interfaces are future internal contracts, not implemented APIs at this source. The accepted logic diagram and outside-in evidence remain the existing T20 basis; this correction changes neither its states nor its data flow. C5's shell-produced native requests and C1's owner-produced identity are distinct seams and retain their existing producers and exact fields.

## Prefactoring

None required for this correction. Keep the allocator private to the existing web UI implementation and limited to T20 owner/request consumers; no app-wide UUID rewrite, new dependency, package export, route, store, server API, transport or security-policy change is authorized. Follow the existing ordered T20 build: owner/admission precedes dependent host and native integrations, with their frozen real producer-to-consumer checks.

## Findings and binding Developer instructions

No design-relevant gap or new human decision is required for the stated correction. These precision instructions bind the implementation:

1. For each App-owner mount and each newly admitted owner request allocate a fresh, unpredictable canonical UUIDv4 string, never persisted or reused across mounts or actions. Use the actual owner realm's built-in `crypto.randomUUID()` when callable. When it is unavailable, use that same realm's `crypto.getRandomValues` to fill 16 bytes; set byte 6 to `(byte & 0x0f) | 0x40` and byte 8 to `(byte & 0x3f) | 0x80`, then format all bytes as canonical 8-4-4-4-12 hexadecimal. Do not use Math.random, clocks, counters, reduced entropy or another insecure fallback. Allocation at native popup arming remains for that one Detach attempt as C5 states; C5's shell-originated native requests retain their specified production and correlation.
2. Treat absent or throwing cryptographic allocation as failure, including a throwing available `randomUUID`; do not substitute a weak ID or retry with a different primitive after a failure. Before an ID exists, do not admit the operation, issue a permit, open or register an authoritative child, or run a destructive continuation. Preserve the current session and any existing authority/fence; report via existing failure/refusal paths without inventing a successful correlation or no-session result. Keep all existing validation, correlation, one-use and generation behavior intact.
3. Amend the C1 allocation comments and add a short dated Controller compatibility correction in the spec/contract with a pointer to this review. Preserve the reviewed history and accepted ADR, and do not attribute a new decision to Sascha. Later independent Tester and level-3 conformance must explicitly inspect this clarification, implementation and R14 consumer evidence.
4. Test through the actual App owner and request consumers on secure/localhost and a locally intercepted insecure HTTP owner origin, including the unavailable-`randomUUID` branch. Verify actual UUIDv4 format, version and variant, and that the fallback consumes 16 `getRandomValues` bytes with the specified masks; verify no weak fallback and fail-closed behavior when the primitive is missing or throws, including retained session and no child/operation authority. Exercise full paired and full read-only child flows under R14 when the host exists. Localhost API stubs are supplemental; collision/format samples alone prove neither unpredictability nor paired support. Use invented data and no external destinations.

## Review boundary

The Controller can proceed with the narrow correction under the existing T20 build and review gates. This review ran no tests, browser, native app, install, build or full gates; no implementation, paired-device or product acceptance is claimed. Only this review file is changed; no tests were added.
