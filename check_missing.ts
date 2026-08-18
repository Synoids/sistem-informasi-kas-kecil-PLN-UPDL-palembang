import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  
  let validTransCount = 0
  let totalAmount = 0
  
  let lastSeenDate = ''
  
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values) {
       let dateStr = ''
       if (row.values[1]) {
           dateStr = String(row.values[1]).toLowerCase().trim()
           lastSeenDate = dateStr
       } else {
           // Inherit date from previous row
           dateStr = lastSeenDate
       }
       
       const amount = Number(row.values[10]) || 0
       
       // Only count rows in February block
       if (dateStr.includes('feb') || dateStr.includes('2026-02')) {
           if (amount > 0) {
               validTransCount++
               totalAmount += amount
               console.log(`Row ${i} [${dateStr}]: ${amount} | Desc: ${row.values[7]}`)
           }
       }
    }
  }
  
  console.log(`Total February Transactions found: ${validTransCount}`)
  console.log(`Total February Amount: ${totalAmount}`)
}

run().catch(console.error)
