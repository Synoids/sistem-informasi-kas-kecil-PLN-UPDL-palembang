import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  
  let febCount = 0
  let janCount = 0
  let marCount = 0
  let otherCount = 0
  
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values && row.values[1]) {
      const dateVal = row.values[1]
      const type = typeof dateVal
      const isDate = dateVal instanceof Date
      const strVal = String(dateVal).toLowerCase()
      
      if (i >= 400 && i <= 550) {
        if (row.values[10] || row.values[11]) {
          console.log(`Row ${i}: Date=${dateVal}, Type=${type} | J=${JSON.stringify(row.values[10])}, L=${JSON.stringify(row.values[12])} | Desc: ${row.values[7]}`)
        }
      }
    }
  }
  
  console.log(`Summary: Feb: ${febCount}, Jan: ${janCount}, Mar: ${marCount}, Other: ${otherCount}`)
}

run().catch(console.error)
