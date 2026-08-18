import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  if (!sheet) {
    console.log('Sheet real 2026 not found')
    return
  }

  console.log(`Sheet: ${sheet.name} has ${sheet.rowCount} rows`)
  
  // Print rows from 10 to 50
  for (let i = 10; i <= Math.min(50, sheet.rowCount); i++) {
    const row = sheet.getRow(i)
    if (row.values && (row.values as any[]).some(v => v != null && v !== '')) {
       console.log(`Row ${i}:`, JSON.stringify(row.values))
    }
  }
}

run().catch(console.error)
