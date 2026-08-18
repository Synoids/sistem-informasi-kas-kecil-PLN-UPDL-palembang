import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values) {
      const vals = row.values as any[]
      for (let j = 0; j < vals.length; j++) {
        const val = vals[j]
        if (typeof val === 'number') {
           if (val > 10000000 && val < 90000000) { // Look for large numbers
             // console.log(`Row ${i} Col ${j}: ${val} | Date: ${row.values[1]} | Desc: ${row.values[7]}`)
           }
        }
        if (val && val.result !== undefined && typeof val.result === 'number') {
           if (val.result > 10000000 && val.result < 90000000) {
             // console.log(`Row ${i} Col ${j} (formula): ${val.result} | Date: ${row.values[1]} | Desc: ${row.values[7]}`)
           }
        }
      }
      
      // Specifically look for large amounts in J or K for February
      const dateRaw = String(row.values[1]).toLowerCase()
      if (dateRaw.includes('feb') || dateRaw.includes('2026-02')) {
         const amount = Number(row.values[10])
         if (amount > 1000000) {
             console.log(`LARGE AMOUNT FEB Row ${i}: ${amount} | Desc: ${row.values[7]}`)
         }
      }
    }
  }
}

run().catch(console.error)
