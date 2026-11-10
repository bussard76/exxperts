import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the packaged UI delivers the bundled PPTX renderer notices", () => {
	const [pack] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: root, encoding: "utf8" }));
	const packed = new Set(pack.files.map((entry) => entry.path));
	for (const name of ["LICENSE", "THIRD_PARTY_NOTICES.md", "licenses/mtx-decompressor-MPL-2.0.txt", "licenses/ECMA-text-copyright-notice.txt"]) {
		const shipped = `apps/web-ui/dist/pptx-notices/${name}`;
		assert(packed.has(shipped), `${shipped} is absent from the package`);
		assert.deepEqual(fs.readFileSync(path.join(root, shipped)), fs.readFileSync(path.join(root, "node_modules/@aiden0z/pptx-renderer", name)));
	}
});
