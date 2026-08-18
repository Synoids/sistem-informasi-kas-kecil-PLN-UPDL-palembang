import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  workbook.eachSheet((sheet, id) => {
    console.log(`Sheet: ${sheet.name} (ID: ${id})`)
    
    // Print first 10 rows
    for (let i = 1; i <= Math.min(10, sheet.rowCount); i++) {
      const row = sheet.getRow(i)
      console.log(`Row ${i}:`, JSON.stringify(row.values))
    }
    console.log('-------------------------')
  })
}

run().catch(console.error)
