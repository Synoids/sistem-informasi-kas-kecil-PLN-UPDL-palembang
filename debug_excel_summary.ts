import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('rekap 2026')
  
  for (let i = 90; i <= 98; i++) {
    const row = sheet.getRow(i)
    console.log(`Row ${i}:`, JSON.stringify(row.values))
  }
}

run().catch(console.error)
