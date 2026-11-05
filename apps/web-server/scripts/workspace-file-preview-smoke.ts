import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { closeWorkspaceTab, openWorkspaceTab, workspaceFileKind } from "../../web-ui/src/workspace-tabs.js";
import { workspaceFileUrl } from "../../web-ui/src/workspace-image-src.js";
import { PersistentRoomWorkspaceMarkdownError } from "../src/persistent-room-workspace-markdown-files.js";
import { hashPersistentRoomPath } from "../src/persistent-room-workspace-policy.js";
import {
	MAX_WORKSPACE_PREVIEW_ROWS,
	readWorkspacePreviewWithPolicy,
} from "../src/persistent-room-workspace-preview.js";
import { classifyRemoteRoute } from "../src/remote-route-policy.js";
import { onePagePdf, smallDocx, smallWorkbook } from "./workspace-preview-fixtures.js";

// Which files open, and as what.
assert.equal(workspaceFileKind("a/b/notes.md"), "markdown");
assert.equal(workspaceFileKind("notes.MD"), "markdown");
for (const name of ["a.png", "a.jpg", "a.JPEG", "a.gif", "a.webp", "a.svg"]) assert.equal(workspaceFileKind(name), "image", name);
assert.equal(workspaceFileKind("a.pdf"), "pdf");
assert.equal(workspaceFileKind("a.docx"), "word");
assert.equal(workspaceFileKind("a.doc"), "word");
for (const name of ["a.xlsx", "a.xlsm", "a.xls"]) assert.equal(workspaceFileKind(name), "spreadsheet", name);
for (const name of ["a.txt", "a.ts", "noextension", "a.pptx"]) assert.equal(workspaceFileKind(name), null, name);

// A file opens one tab; opening it again adds none and keeps the order.
assert.deepEqual(openWorkspaceTab([], "a.pdf"), ["a.pdf"]);
assert.deepEqual(openWorkspaceTab(["a.pdf"], "b.png"), ["a.pdf", "b.png"]);
assert.deepEqual(openWorkspaceTab(["a.pdf", "b.png"], "a.pdf"), ["a.pdf", "b.png"]);

// Closing the active tab moves to its right neighbour, then its left one, then none.
assert.deepEqual(closeWorkspaceTab(["a", "b", "c"], "b", "b"), { tabs: ["a", "c"], active: "c" });
assert.deepEqual(closeWorkspaceTab(["a", "b", "c"], "c", "c"), { tabs: ["a", "b"], active: "b" });
assert.deepEqual(closeWorkspaceTab(["a"], "a", "a"), { tabs: [], active: null });
// Closing another tab keeps the active one.
assert.deepEqual(closeWorkspaceTab(["a", "b", "c"], "a", "c"), { tabs: ["b", "c"], active: "c" });

const url = workspaceFileUrl("room 1", "conv", "workspace-preview", "docs/my file.pdf");
assert.ok(url.startsWith("/api/persistent-agents/room%201/workspace-preview?"));
assert.equal(new URLSearchParams(url.split("?")[1]).get("path"), "docs/my file.pdf");

assert.equal(classifyRemoteRoute("GET", "/api/persistent-agents/:id/workspace-preview"), "read");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-file-preview-"));
const realRoot = fs.realpathSync.native(root);
const policy = {
	schemaVersion: 1,
	policyId: "policy",
	agentId: "agent",
	conversationId: "conversation",
	workspaceAccessMode: "bounded",
	roots: [{ id: "root", displayLabel: "Workspace", path: root, realpath: realRoot, basename: path.basename(root), pathHash: hashPersistentRoomPath(realRoot) }],
	modes: { read: true, write: false },
	allowedToolNames: ["ls", "find", "grep", "read"],
	toolSelection: { kind: "standard" },
	deniedRoots: [],
	denySegments: [".git", "node_modules"],
	denyFilenameGlobs: [".env", ".env.*", "*.secret"],
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
} as any;

async function rejectsCode(run: () => Promise<unknown>, code: string): Promise<void> {
	await assert.rejects(run, (error: unknown) => error instanceof PersistentRoomWorkspaceMarkdownError && error.code === code, `expected ${code}`);
}

try {
	const pdf = onePagePdf("Quarter");
	fs.writeFileSync(path.join(root, "report.pdf"), pdf);
	const asPdf = await readWorkspacePreviewWithPolicy(policy, "report.pdf");
	assert.ok(asPdf.kind === "pdf");
	assert.deepEqual(asPdf.bytes, pdf);

	// A file only called .pdf is not handed out as one.
	fs.writeFileSync(path.join(root, "fake.pdf"), "<html><script>alert(1)</script></html>");
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "fake.pdf"), "invalid_file");

	fs.writeFileSync(path.join(root, "letter.docx"), await smallDocx());
	const asWord = await readWorkspacePreviewWithPolicy(policy, "letter.docx");
	assert.ok(asWord.kind === "word");
	assert.match(asWord.html, /Hello from Word/);
	assert.match(asWord.html, /<strong>Bold part<\/strong>/);
	assert.match(asWord.html, /<table>/);
	assert.match(asWord.html, /Cell two/);
	assert.ok(!asWord.html.includes("<script>"), "text that looks like a script stays text");
	assert.match(asWord.html, /&lt;script&gt;/);
	assert.ok(!asWord.html.includes("example.com"), "a read-only view follows no links");
	assert.match(asWord.html, /A link/);

	fs.writeFileSync(path.join(root, "broken.docx"), "this is no zip");
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "broken.docx"), "parse_failed");
	fs.writeFileSync(path.join(root, "old.doc"), "legacy");
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "old.doc"), "unsupported_file_type");

	fs.writeFileSync(path.join(root, "book.xlsx"), smallWorkbook());
	const asSheet = await readWorkspacePreviewWithPolicy(policy, "book.xlsx");
	assert.ok(asSheet.kind === "spreadsheet");
	assert.deepEqual(asSheet.sheets.map((sheet) => sheet.name), ["Fruit", "Places"]);
	assert.deepEqual(asSheet.sheets[0].rows, [["Name", "Amount"], ["Apples", "3"], ["Pears", "4.5"]]);
	assert.equal(asSheet.sheets[0].truncated, false);

	fs.writeFileSync(path.join(root, "long.xlsx"), smallWorkbook(MAX_WORKSPACE_PREVIEW_ROWS + 10));
	const long = await readWorkspacePreviewWithPolicy(policy, "long.xlsx");
	assert.ok(long.kind === "spreadsheet");
	assert.equal(long.sheets[0].rows.length, MAX_WORKSPACE_PREVIEW_ROWS);
	assert.equal(long.sheets[0].truncated, true);

	fs.writeFileSync(path.join(root, "bad.xlsx"), Buffer.from([0, 1, 2, 3, 4, 5]));
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "bad.xlsx"), "parse_failed");

	// The same guards as every other workspace read.
	fs.writeFileSync(path.join(root, "notes.txt"), "text");
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "notes.txt"), "unsupported_file_type");
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "../x.pdf"), "invalid_path");
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "missing.pdf"), "file_not_found");
	fs.mkdirSync(path.join(root, "node_modules"));
	fs.writeFileSync(path.join(root, "node_modules", "x.pdf"), pdf);
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "node_modules/x.pdf"), "blocked_by_policy");
	fs.symlinkSync(path.join(root, "report.pdf"), path.join(root, "link.pdf"));
	await rejectsCode(() => readWorkspacePreviewWithPolicy(policy, "link.pdf"), "not_file");
	await rejectsCode(() => readWorkspacePreviewWithPolicy({ ...policy, modes: { read: false, write: false } }, "report.pdf"), "workspace_read_forbidden");

	console.log("workspace file preview smoke passed");
} finally {
	fs.rmSync(root, { recursive: true, force: true });
}
