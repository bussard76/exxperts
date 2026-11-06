const ExcelJS = require(process.cwd() + '/node_modules/exceljs');
const JSZip = require(process.cwd() + '/node_modules/jszip');
const n = Number(process.argv[2]);
(async()=>{
 const seed = new ExcelJS.Workbook(); seed.addWorksheet('Invented');
 const zip = await JSZip.loadAsync(Buffer.from(await seed.xlsx.writeBuffer()));
 let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
 const merges = Array.from({length:n},(_,i)=>`<mergeCell ref="A${i+1}:B${i+1}"/>`).join('');
 xml=xml.replace('<sheetData/>',`<sheetData/><mergeCells count="${n}">${merges}</mergeCells>`);
 zip.file('xl/worksheets/sheet1.xml',xml);
 const bytes = await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
 console.log(JSON.stringify({fixtureMerges:(xml.match(/<mergeCell ref=/g)||[]).length,gridSlots:n*2,cellObjects:n*2,archiveBytes:bytes.length,worksheetBytes:Buffer.byteLength(xml)}));
 const start=process.hrtime.bigint(); const book=await new ExcelJS.Workbook().xlsx.load(bytes);
 console.log(JSON.stringify({merges:n, gridSlots:n*2, bytes:bytes.length, rows:book.worksheets[0].rowCount, elapsedMs:Number(process.hrtime.bigint()-start)/1e6}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
