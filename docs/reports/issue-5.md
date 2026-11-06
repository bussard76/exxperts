# Issue 5: serial gate documentation

## Rework 1

The preliminary review found that the factory verification command and review protocol omitted the serial smoke option. `scripts/serial-gate-config.test.mjs` proves both the parsed factory command and the documented full gate use `npm run build && npm run smokes -- --jobs 1`; both tests failed before the correction.

## Architecture impact

Level 1: aligns existing factory configuration and review documentation with the recorded decision; no module boundaries or public APIs change.
