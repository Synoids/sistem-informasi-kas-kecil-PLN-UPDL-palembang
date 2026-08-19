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

  const leftMaxRows = Math.max(dto.categories.length, 1)
  const rightMaxRows = Math.max(sortedHolders.length, 1)

  // ----------------------------------------------------
  // LEFT SIDE: Categories
  // ----------------------------------------------------
  for (let i = 0; i < leftMaxRows; i++) {
    const row = sheet.getRow(startRow + i)
    const cat = dto.categories[i]

    if (cat) {
      row.getCell(1).value = i + 1
      row.getCell(2).value = cat.categoryName
      if (i === 0) row.getCell(3).value = dto.paguAmount || 0
      row.getCell(4).value = cat.totalAmount
      
      hardcodedDivisions.forEach((divName, j) => {
        const divDto = dto.divisions.find(d => d.name === divName)
        const val = divDto && cat.divisions[divDto.id] ? cat.divisions[divDto.id] : 0
        row.getCell(divCols[j]).value = val
      })
    }
    
    // Apply borders & formats
    [1, 2, 3, 4].forEach(c => row.getCell(c).border = borderThin)
    divCols.forEach(c => row.getCell(c).border = borderThin)
    
    row.getCell(3).numFmt = numFormat
    row.getCell(4).numFmt = numFormat
    divCols.forEach(c => row.getCell(c).numFmt = numFormat)
  }

  // ----------------------------------------------------
  // RIGHT SIDE: Cash Holders
  // ----------------------------------------------------
  for (let i = 0; i < rightMaxRows; i++) {
    const row = sheet.getRow(startRow + i)
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

    // Apply borders & formats
    [11, 12, 13, 14].forEach(c => row.getCell(c).border = borderThin)
    row.getCell(12).numFmt = noFormat
    row.getCell(13).numFmt = noFormat
    row.getCell(14).numFmt = noFormat
  }

  // Merge Pagu Anggaran
  if (dto.categories.length > 1) {
    sheet.mergeCells(`C${startRow}:C${startRow + dto.categories.length - 1}`)
    const paguCell = sheet.getCell(`C${startRow}`)
    paguCell.alignment = { vertical: 'middle', horizontal: 'center' }
  }

  // ----------------------------------------------------
  // TOTAL ROWS
  // ----------------------------------------------------
  // Left Total
  const leftTotalRowIndex = startRow + leftMaxRows
  const leftTotalRow = sheet.getRow(leftTotalRowIndex)
  sheet.mergeCells(`A${leftTotalRowIndex}:B${leftTotalRowIndex}`)
  leftTotalRow.getCell(1).value = 'TOTAL'
  leftTotalRow.getCell(3).value = { formula: `C${startRow}` }
  leftTotalRow.getCell(4).value = { formula: `SUM(D${startRow}:D${leftTotalRowIndex-1})` }
  divCols.forEach(c => {
    const colLetter = sheet.getColumn(c).letter
    leftTotalRow.getCell(c).value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${leftTotalRowIndex-1})` }
  });
  
  [1, 3, 4, ...divCols].forEach(c => {
    const cell = leftTotalRow.getCell(c)
    cell.fill = fillGrey
    cell.border = borderThin
    cell.font = { bold: true }
    if (c === 3 || c === 4 || divCols.includes(c)) cell.numFmt = numFormat
  })
  leftTotalRow.getCell(1).alignment = { horizontal: 'center' }

  // Right Total
  const rightTotalRowIndex = startRow + rightMaxRows
  const rightTotalRow = sheet.getRow(rightTotalRowIndex)
  rightTotalRow.getCell(11).value = 'Total'
  rightTotalRow.getCell(12).value = { formula: `SUM(L${startRow}:L${rightTotalRowIndex-1})` };
  
  [11, 12, 13, 14].forEach(c => {
    const cell = rightTotalRow.getCell(c)
    cell.fill = fillGrey
    cell.border = borderThin
    cell.font = { bold: true }
    if (c >= 12 && c <= 14) cell.numFmt = noFormat
  })

  // ----------------------------------------------------
  // SISA CASH ROWS
  // ----------------------------------------------------
  // Left Sisa
  const leftSisaRowIndex = leftTotalRowIndex + 1
  const leftSisaRow = sheet.getRow(leftSisaRowIndex)
  sheet.mergeCells(`A${leftSisaRowIndex}:B${leftSisaRowIndex}`)
  leftSisaRow.getCell(1).value = 'SISA CASH'
  leftSisaRow.getCell(3).value = { formula: `C${leftTotalRowIndex}-D${leftTotalRowIndex}` }
  
  const divLetters = divCols.map(c => sheet.getColumn(c).letter)
  const sumFormula = divLetters.map(l => `${l}${leftTotalRowIndex}`).join('+')
  divCols.forEach(c => {
    leftSisaRow.getCell(c).value = { formula: sumFormula } 
  });

  [1, 3, ...divCols].forEach(c => {
    const cell = leftSisaRow.getCell(c)
    cell.fill = fillGrey
    cell.border = borderThin
    cell.font = { bold: true }
    if (c === 3 || divCols.includes(c)) cell.numFmt = numFormat
  })
  leftSisaRow.getCell(1).alignment = { horizontal: 'left' }
  sheet.mergeCells(`F${leftSisaRowIndex}:I${leftSisaRowIndex}`)

  // Extra row for F12 equivalent (Below left sisa)
  const leftExtraRowIndex = leftSisaRowIndex + 1
  const leftExtraRow = sheet.getRow(leftExtraRowIndex)
  leftExtraRow.getCell(6).value = { formula: `C${leftTotalRowIndex}-F${leftSisaRowIndex}` }
  leftExtraRow.getCell(6).numFmt = numFormat

  // Right Sisa
  const rightSisaRowIndex = rightTotalRowIndex + 1
  const rightSisaRow = sheet.getRow(rightSisaRowIndex)
  rightSisaRow.getCell(11).value = 'Selisih Uang Cash'
  rightSisaRow.getCell(12).value = { formula: `L${rightTotalRowIndex}-C${leftTotalRowIndex}` }
  rightSisaRow.getCell(13).value = { formula: `L${rightTotalRowIndex}-C${leftTotalRowIndex}` }
  rightSisaRow.getCell(14).value = { formula: `L${rightTotalRowIndex}-C${leftTotalRowIndex}` };

  [11, 12, 13, 14].forEach(c => {
    const cell = rightSisaRow.getCell(c)
    cell.fill = fillGrey
    cell.border = borderThin
    cell.font = { bold: true }
    cell.numFmt = noFormat
  })

  // ----------------------------------------------------
  // TERBILANG ROW
  // ----------------------------------------------------
  const terbilangRowIndex = Math.max(leftExtraRowIndex, rightSisaRowIndex) + 3
  const terbilangRow = sheet.getRow(terbilangRowIndex)
  terbilangRow.getCell(1).value = 'Terbilang'
  
  // Capitalize first letter of each word
  const words = generateTerbilang(dto.globalTotals.totalTransaction)
  const properWords = words.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  
  terbilangRow.getCell(2).value = properWords
  terbilangRow.getCell(2).font = { italic: true }

  return await workbook.xlsx.writeBuffer() as any
}
