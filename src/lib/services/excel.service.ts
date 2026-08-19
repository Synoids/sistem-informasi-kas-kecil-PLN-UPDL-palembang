import ExcelJS from 'exceljs'
import { ConsolidatedMatrixReportDTO } from './rekap.service'
import { generateTerbilang } from '@/lib/utils/terbilang'

export async function generateExcelReport(dto: ConsolidatedMatrixReportDTO): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Set metadata
  workbook.creator = 'Petty Cash System'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('real 2026') // Using name similar to old template

  // Formatting options
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }

  const fillOrange: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAC090' } }
  const fillGrey: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
  const fillLightBlue: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } }
  const fillGreen: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF1DE' } }

  const numFormat = '"Rp"#,##0_ ;-"Rp"#,##0_ '
  const noFormat = '#,##0_ ;-#,##0_ '

  // Column Config
  // A, B, C, D | E(space) | F, G, H, I | J(space) | K, L, M, N | O(space) | P, Q
  sheet.getColumn('A').width = 5
  sheet.getColumn('B').width = 30
  sheet.getColumn('C').width = 15
  sheet.getColumn('D').width = 15
  sheet.getColumn('E').width = 2
  sheet.getColumn('F').width = 15
  sheet.getColumn('G').width = 15
  sheet.getColumn('H').width = 15
  sheet.getColumn('I').width = 15
  sheet.getColumn('J').width = 2
  sheet.getColumn('K').width = 15
  sheet.getColumn('L').width = 15
  sheet.getColumn('M').width = 15
  sheet.getColumn('N').width = 15
  sheet.getColumn('O').width = 2
  sheet.getColumn('P').width = 15
  sheet.getColumn('Q').width = 15

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const monthName = monthNames[dto.month - 1]

  // Header rows
  sheet.getCell('A1').value = `Bersama ini kami sampaikan pertanggungjawaban Kas Kecil periode Bulan ${monthName} ${dto.year}`
  sheet.getCell('A2').value = 'sebagai berikut:'

  // Setup header
  const headerRowIndex = 4
  const headerRow = sheet.getRow(headerRowIndex)
  
  const headers = [
    { col: 1, val: 'No.' }, { col: 2, val: 'Keperluan' }, { col: 3, val: 'Pagu Anggaran' }, { col: 4, val: 'Realisasi' },
    // E is space
    { col: 6, val: '-' }, { col: 7, val: '-' }, { col: 8, val: '-' }, { col: 9, val: '-' },
    // J is space
    { col: 11, val: 'Nama' }, { col: 12, val: 'Jumlah Uang' }, { col: 13, val: 'Realisasi' }, { col: 14, val: 'Sisa' }
  ]

  // Hardcode divisions directly to match screenshot EXACTLY
  const divCols = [6, 7, 8, 9]
  const hardcodedDivisions = ['PKU', 'JAR', 'MUP', 'K3LHKam']
  hardcodedDivisions.forEach((name, i) => {
    const h = headers.find(h => h.col === divCols[i])
    if (h) h.val = name
  })

  headers.forEach(h => {
    const cell = headerRow.getCell(h.col)
    cell.value = h.val
    cell.fill = fillLightBlue
    cell.border = borderThin
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  let currentRow = 5
  const startRow = 5

  // Sort cash holders: "Utama" / "Cash" first
  const sortedHolders = [...dto.cashHolders].sort((a, b) => {
    const aMain = a.cashSourceName.toLowerCase().includes('utama') || a.cashSourceName.toLowerCase().includes('cash')
    const bMain = b.cashSourceName.toLowerCase().includes('utama') || b.cashSourceName.toLowerCase().includes('cash')
    if (aMain && !bMain) return -1
    if (!aMain && bMain) return 1
    return 0
  })

  const maxRows = Math.max(dto.categories.length, sortedHolders.length, 2)

  for (let i = 0; i < maxRows; i++) {
    const row = sheet.getRow(currentRow)
    const cat = dto.categories[i]

    // Category Block
    if (cat) {
      row.getCell(1).value = i + 1
      row.getCell(2).value = cat.categoryName
      
      // Pagu Anggaran only on first row of category if we merge later, but let's just put it on first row and merge.
      if (i === 0) row.getCell(3).value = dto.paguAmount || 0
      
      row.getCell(4).value = cat.totalAmount
      
      // Division Block - HARDCODED mapping
      hardcodedDivisions.forEach((divName, j) => {
        const divDto = dto.divisions.find(d => d.name === divName)
        const val = divDto && cat.divisions[divDto.id] ? cat.divisions[divDto.id] : 0
        row.getCell(divCols[j]).value = val
      })
    }

    // Cash Holder Block - DYNAMIC mapping
    const holder = sortedHolders[i]
    if (holder) {
      row.getCell(11).value = holder.cashSourceName
      row.getCell(12).value = holder.jumlahUang || 0
      row.getCell(13).value = holder.realisasi || 0
      row.getCell(14).value = holder.sisa || 0

      const isMain = holder.cashSourceName.toLowerCase().includes('utama') || holder.cashSourceName.toLowerCase().includes('cash')
      const fill = isMain ? fillOrange : fillGreen
      
      row.getCell(11).fill = fill
      row.getCell(12).fill = fill
      row.getCell(13).fill = fill
      row.getCell(14).fill = fill
    }

    // Apply borders
    [1, 2, 3, 4].forEach(c => row.getCell(c).border = borderThin);
    divCols.forEach(c => row.getCell(c).border = borderThin);
    [11, 12, 13, 14].forEach(c => row.getCell(c).border = borderThin);

    // Apply number formats
    row.getCell(3).numFmt = numFormat
    row.getCell(4).numFmt = numFormat
    divCols.forEach(c => row.getCell(c).numFmt = numFormat)
    row.getCell(12).numFmt = noFormat
    row.getCell(13).numFmt = noFormat
    row.getCell(14).numFmt = noFormat
    
    currentRow++
  }

  // Merge Pagu Anggaran
  if (dto.categories.length > 1) {
    sheet.mergeCells(`C${startRow}:C${startRow + dto.categories.length - 1}`)
    const paguCell = sheet.getCell(`C${startRow}`)
    paguCell.alignment = { vertical: 'middle', horizontal: 'center' }
  }

  // TOTAL ROW
  const totalRowIndex = currentRow
  const totalRow = sheet.getRow(totalRowIndex)
  sheet.mergeCells(`A${totalRowIndex}:B${totalRowIndex}`)
  totalRow.getCell(1).value = 'TOTAL'
  totalRow.getCell(3).value = { formula: `C${startRow}` }
  totalRow.getCell(4).value = { formula: `SUM(D${startRow}:D${totalRowIndex-1})` }
  
  divCols.forEach(c => {
    const colLetter = sheet.getColumn(c).letter
    totalRow.getCell(c).value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${totalRowIndex-1})` }
  })
  
  totalRow.getCell(11).value = 'Total'
  totalRow.getCell(12).value = { formula: `SUM(L${startRow}:L${startRow + sortedHolders.length - 1})` }

  // Total styling
  const totalCols = [1, 3, 4, ...divCols, 11, 12, 13, 14]
  totalCols.forEach(c => {
    const cell = totalRow.getCell(c)
    cell.fill = fillGrey
    cell.border = borderThin
    cell.font = { bold: true }
    if (c === 3 || c === 4 || divCols.includes(c)) cell.numFmt = numFormat
    if (c >= 12 && c <= 14) cell.numFmt = noFormat
  })
  totalRow.getCell(1).alignment = { horizontal: 'center' }

  // SISA CASH ROW
  const sisaRowIndex = totalRowIndex + 1
  const sisaRow = sheet.getRow(sisaRowIndex)
  sheet.mergeCells(`A${sisaRowIndex}:B${sisaRowIndex}`)
  sisaRow.getCell(1).value = 'SISA CASH'
  sisaRow.getCell(3).value = { formula: `C${totalRowIndex}-D${totalRowIndex}` }
  
  const divLetters = divCols.map(c => sheet.getColumn(c).letter)
  const sumFormula = divLetters.map(l => `${l}${totalRowIndex}`).join('+')
  divCols.forEach(c => {
    sisaRow.getCell(c).value = { formula: sumFormula } // Following old template which sums F10:I10
  })

  sisaRow.getCell(11).value = 'Selisih Uang Cash'
  sisaRow.getCell(12).value = { formula: `L${totalRowIndex}-C${totalRowIndex}` }
  sisaRow.getCell(13).value = { formula: `L${totalRowIndex}-C${totalRowIndex}` }
  sisaRow.getCell(14).value = { formula: `L${totalRowIndex}-C${totalRowIndex}` }

  // Sisa styling
  const sisaCols = [1, 3, ...divCols, 11, 12, 13, 14]
  sisaCols.forEach(c => {
    const cell = sisaRow.getCell(c)
    cell.fill = fillGrey
    cell.border = borderThin
    cell.font = { bold: true }
    if (c === 3 || divCols.includes(c)) cell.numFmt = numFormat
    if (c >= 12 && c <= 14) cell.numFmt = noFormat
  })
  sisaRow.getCell(1).alignment = { horizontal: 'left' }
  
  // Merge division columns in Sisa Cash row
  sheet.mergeCells(`F${sisaRowIndex}:I${sisaRowIndex}`)
  
  // Extra row for F12 equivalent
  const extraRowIndex = sisaRowIndex + 1
  const extraRow = sheet.getRow(extraRowIndex)
  extraRow.getCell(6).value = { formula: `C${totalRowIndex}-F${sisaRowIndex}` }
  extraRow.getCell(6).numFmt = numFormat

  // TERBILANG ROW
  const terbilangRowIndex = sisaRowIndex + 3
  const terbilangRow = sheet.getRow(terbilangRowIndex)
  terbilangRow.getCell(1).value = 'Terbilang'
  
  // Capitalize first letter of each word
  const words = generateTerbilang(dto.globalTotals.totalTransaction)
  const properWords = words.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  
  terbilangRow.getCell(2).value = properWords
  terbilangRow.getCell(2).font = { italic: true }

  return await workbook.xlsx.writeBuffer() as any
}
