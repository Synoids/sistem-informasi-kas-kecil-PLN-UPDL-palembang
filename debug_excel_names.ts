import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  
  let janSum = 0
  let febSum = 0
  
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values) {
       const dateStr = String(row.values[1]).toLowerCase()
       const amount = Number(row.values[10]) || 0
       
       if (dateStr.includes('jan')) {
           janSum += amount
       }
       if (dateStr.includes('feb')) {
           febSum += amount
       }
    }
  }
  
  console.log(`Total Januari: ${janSum}`)
  console.log(`Total Februari: ${febSum}`)
  console.log(`Total Jan+Feb: ${janSum + febSum}`)
}

run().catch(console.error)
