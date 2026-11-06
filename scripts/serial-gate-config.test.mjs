import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const verify = "npm run build && npm run smokes -- --jobs 1";

test("factory verification runs smokes sequentially", async () => {
  const config = JSON.parse(await readFile(new URL("../factory.config.json", import.meta.url), "utf8"));
  assert.equal(config.commands.verify, verify);
});

test("review protocol specifies the sequential full gate", async () => {
  const protocol = await readFile(new URL("../docs/review-protocol.md", import.meta.url), "utf8");
  assert.ok(protocol.includes(`\`${verify}\``));
});
