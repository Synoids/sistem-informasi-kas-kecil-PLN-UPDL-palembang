const ExcelJS = require('exceljs');
const path = require('path');

async function audit() {
  const filePath = path.resolve('Realisasi Kas Kecil UPDL Palembang.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0];
  console.log(`Worksheet Name: ${worksheet.name}`);
  console.log(`RowCount: ${worksheet.rowCount}`);
  
  for (let i = 1; i <= 40; i++) {
    const row = worksheet.getRow(i);
    const rowValues = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (cell.value !== null) {
         const val = typeof cell.value === 'object' && cell.value.formula ? 'FORMULA: ' + cell.value.formula : cell.value;
         rowValues.push(`[${colNumber}(${cell.address})]: ${val}`);
      }
    });
    if (rowValues.length > 0) {
      console.log(`Row ${i}: ${rowValues.join(' | ')}`);
    }
  }
  
  console.log('--- Merged Cells ---');
  console.log(worksheet.model.merges);
}

audit().catch(console.error);
