import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  
  let found = false
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values) {
       const vals = row.values as any[]
       for (let j = 0; j < vals.length; j++) {
           if (vals[j] === 16250000 || vals[j] === 355328) {
               console.log(`Found ${vals[j]} in real 2026 at row ${i}, col ${j}`)
               found = true
           }
       }
    }
  }
  if (!found) console.log('Exact numbers 16250000 and 355328 NOT FOUND in real 2026 sheet.')
}

run().catch(console.error)
