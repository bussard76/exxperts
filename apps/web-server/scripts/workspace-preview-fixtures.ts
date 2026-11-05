// Synthetic files for the workspace preview smokes. All content is invented.
import JSZip from "jszip";
import * as XLSX from "xlsx";

export const ONE_PIXEL_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==", "base64");

export function onePagePdf(text: string): Buffer {
	const stream = `BT /F1 24 Tf 40 700 Td (${text}) Tj ET`;
	const objects = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
		"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
	];
	let body = "%PDF-1.4\n";
	const offsets: number[] = [];
	objects.forEach((object, index) => {
		offsets.push(body.length);
		body += `${index + 1} 0 obj\n${object}\nendobj\n`;
	});
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
	body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return Buffer.from(body, "latin1");
}

export async function smallDocx(): Promise<Buffer> {
	const zip = new JSZip();
	zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
	zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
	zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com/track" TargetMode="External"/></Relationships>`);
	zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>
<w:p><w:r><w:t>Hello from Word</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold part</w:t></w:r></w:p>
<w:p><w:r><w:t>&lt;script&gt;alert(1)&lt;/script&gt;</w:t></w:r></w:p>
<w:p><w:hyperlink r:id="rId9"><w:r><w:t>A link</w:t></w:r></w:hyperlink></w:p>
<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell one</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Cell two</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
</w:body></w:document>`);
	return zip.generateAsync({ type: "nodebuffer" });
}

export function smallWorkbook(extraRows = 0): Buffer {
	const workbook = XLSX.utils.book_new();
	const first: Array<Array<string | number>> = [["Name", "Amount"], ["Apples", 3], ["Pears", 4.5]];
	for (let i = 0; i < extraRows; i++) first.push([`Row ${i}`, i]);
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(first), "Fruit");
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["City"], ["Springfield"]]), "Places");
	return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
