import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/services/auth.service'
import { getConsolidatedMatrixReport } from '@/lib/services/rekap.service'
import { generateExcelReport } from '@/lib/services/excel.service'

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Hanya Admin yang dapat mengunduh laporan konsolidasi' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '0', 10)
    const year = parseInt(searchParams.get('year') || '0', 10)

    if (!month || month < 1 || month > 12 || !year || year < 2000) {
      return NextResponse.json({ error: 'Parameter bulan atau tahun tidak valid' }, { status: 400 })
    }

    // Generate DTO with reconciliation and business rules applied
    const reportData = await getConsolidatedMatrixReport(month, year)

    // Render Excel
    const buffer = await generateExcelReport(reportData)

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    const filename = `Rekap-Kas-Kecil-${monthNames[month - 1]}-${year}.xlsx`

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    console.error('Error generating excel:', error)
    return NextResponse.json({ error: error.message || 'Gagal menghasilkan laporan Excel' }, { status: 500 })
  }
}
