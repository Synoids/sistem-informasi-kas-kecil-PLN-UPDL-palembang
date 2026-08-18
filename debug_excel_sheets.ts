import ExcelJS from 'exceljs'

async function run() {
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  workbook.eachSheet((sheet, id) => {
      console.log(`Sheet ID: ${id}, Name: ${sheet.name}`)
  })
}

run().catch(console.error)
