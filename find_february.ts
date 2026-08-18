import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  let count = 0
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values && row.values[1]) {
      const dateStr = String(row.values[1]).toLowerCase()
      if (dateStr.includes('februari') || dateStr.includes('feb ')) {
        console.log(`Row ${i}:`, JSON.stringify(row.values))
        count++
        if (count > 2) break
      }
    }
  }
  console.log(`Found ${count} rows matching February`)
}

run().catch(console.error)
