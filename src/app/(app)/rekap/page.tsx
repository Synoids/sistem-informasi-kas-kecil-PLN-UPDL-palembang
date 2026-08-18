import { getRekapReport } from '@/lib/services/rekap.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getCurrentProfile } from '@/lib/services/auth.service'
import { RekapFilter } from './components/RekapFilter'
import { RekapTable } from './components/RekapTable'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function RekapPage(props: {
  searchParams: Promise<{ month?: string, year?: string, source?: string }>
}) {
  const searchParams = await props.searchParams
  
  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'ADMIN'

  const cashSources = await getAccessibleCashSources()
  
  if (cashSources.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800">Rekapitulasi</h2>
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
          Anda tidak memiliki akses ke sumber dana manapun.
        </div>
      </div>
    )
  }

  const now = new Date()
  const defaultMonth = now.getMonth() + 1
  const defaultYear = now.getFullYear()
  const defaultSource = isAdmin ? 'ALL' : cashSources[0].cash_source_id

  const selectedMonth = searchParams.month ? parseInt(searchParams.month, 10) : defaultMonth
  const selectedYear = searchParams.year ? parseInt(searchParams.year, 10) : defaultYear
  const selectedSource = searchParams.source || defaultSource

  let reportData
  let errorMsg = ''
  
  try {
    reportData = await getRekapReport(selectedMonth, selectedYear, selectedSource)
  } catch (err: any) {
    errorMsg = err.message || 'Terjadi kesalahan saat memuat rekapitulasi.'
  }

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const months = monthNames.map((name, idx) => ({ value: idx + 1, label: name }))
  
  const currentYear = now.getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1] // simple range

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Rekapitulasi Laporan</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Lihat, pantau, dan salin (copy) data transaksi pengeluaran bulanan.
        </p>
      </div>

      <RekapFilter 
        months={months}
        years={years}
        cashSources={cashSources.map(cs => ({ id: cs.cash_source_id, name: cs.name, code: cs.code }))}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        defaultSource={selectedSource}
        isAdmin={isAdmin}
      />

      {errorMsg ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {errorMsg}
        </div>
      ) : reportData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium">Pagu Anggaran</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatRupiah(reportData.totalIn)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium">Total Belanja Operasional</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatRupiah(reportData.totalBelanja)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium">Uang yang Belum Terpakai</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatRupiah(reportData.openingBalance + reportData.totalIn - reportData.totalBelanja)}</p>
            </div>
            <div className={`p-4 rounded-lg border shadow-sm ${reportData.isClosed ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-sm font-medium ${reportData.isClosed ? 'text-yellow-700' : 'text-blue-700'}`}>
                {reportData.isClosed ? 'Dikembalikan ke Pusat' : 'Status Periode'}
              </p>
              <p className={`text-lg font-bold mt-1 ${reportData.isClosed ? 'text-yellow-800' : 'text-blue-800'}`}>
                {reportData.isClosed ? formatRupiah(reportData.totalSweep) : 'Sedang Berjalan (Belum Ditutup)'}
              </p>
            </div>
          </div>

          <RekapTable data={reportData} />
        </>
      ) : null}
    </div>
  )
}
