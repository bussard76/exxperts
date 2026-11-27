import assert from "node:assert/strict";
import { runWorkspacePdfSnapshot } from "../src/persistent-room-shelf-reading.js";

function makeScannedPdf(pageCount: number): Buffer {
	const objects: string[] = [];
	const kids = Array.from({ length: pageCount }, (_v, index) => `${3 + index * 2} 0 R`).join(" ");
	objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
	objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`);
	for (let index = 0; index < pageCount; index += 1) {
		const pageObj = 3 + index * 2;
		const contentObj = pageObj + 1;
		const stream = `0.2 0.4 0.8 rg 20 20 160 60 re f`;
		objects.push(`${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents ${contentObj} 0 R >>\nendobj\n`);
		objects.push(`${contentObj} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
	}
	const header = "%PDF-1.4\n";
	let body = "";
	const offsets: number[] = [];
	for (const object of objects) {
		offsets.push(header.length + body.length);
		body += object;
	}
	const xrefAt = header.length + body.length;
	let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
	const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
	return Buffer.from(header + body + xref + trailer, "latin1");
}


const result = await runWorkspacePdfSnapshot(makeScannedPdf(2), new AbortController().signal);
assert.equal(result.ok, true);
assert.equal(result.result?.kind, "pdf");
assert.equal(result.result?.totalPages, 2);
assert.deepEqual(result.result?.pages.map((page) => page.page), [1, 2]);
assert(result.result!.pages.every((page) => page.mimeType === "image/jpeg" && Buffer.from(page.imageBase64, "base64").subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))));
assert.equal((await runWorkspacePdfSnapshot(Buffer.from("not a PDF"), new AbortController().signal)).code, "damaged_file");
assert.equal((await runWorkspacePdfSnapshot(makeScannedPdf(201), new AbortController().signal)).code, "preview_too_complex");
assert.equal((await runWorkspacePdfSnapshot(Buffer.alloc(26_214_401), new AbortController().signal)).code, "file_too_large");
const cancelled = new AbortController();
const pending = runWorkspacePdfSnapshot(makeScannedPdf(1), cancelled.signal);
cancelled.abort();
assert.equal((await pending).code, "preview_aborted");
console.log("workspace PDF snapshot smoke passed");
