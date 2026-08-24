import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getMasterData } from '@/lib/services/dashboard.service'
import { fetchTransactions } from '@/lib/services/transaction.service'
import { getActivePeriod, getAllPeriods } from '@/lib/services/period.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TransactionFilters } from './components/TransactionFilters'
import { TransactionTable } from './components/TransactionTable'
import { PageGuide } from '@/app/components/PageGuide'

const PAGE_SIZE = 25

export default async function RiwayatTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; source?: string; category?: string; status?: string; search?: string; page?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const resolvedParams = await searchParams

  const [cashSources, masterData, rawPeriods] = await Promise.all([
    getAccessibleCashSources(),
    getMasterData(),
    getAllPeriods()
  ])
  
  const allPeriods = (rawPeriods || []) as any[]
  const activePeriod = allPeriods.find((p: any) => p.status === 'OPEN')

  // Default period is the active period, or the first one if there are no active ones.
  const targetPeriodId = resolvedParams.period || activePeriod?.id || allPeriods[0]?.id

  const currentPage = Number(resolvedParams.page ?? '1')
  const offset = (currentPage - 1) * PAGE_SIZE

  const { data: transactions, count } = await fetchTransactions({
    periodId: targetPeriodId,
    cashSourceId: resolvedParams.source,
    categoryId: resolvedParams.category,
    receiptStatus: resolvedParams.status,
    search: resolvedParams.search,
    limit: PAGE_SIZE,
    offset,
  })

  const totalPages = Math.ceil(count / PAGE_SIZE)
  const isAdmin = profile.role === 'ADMIN'

  function pageUrl(page: number) {
    const params = new URLSearchParams()
    if (resolvedParams.period) params.set('period', resolvedParams.period)
    if (resolvedParams.source) params.set('source', resolvedParams.source)
    if (resolvedParams.category) params.set('category', resolvedParams.category)
    if (resolvedParams.status) params.set('status', resolvedParams.status)
    if (resolvedParams.search) params.set('search', resolvedParams.search)
    params.set('page', String(page))
    return `/transaksi/riwayat?${params.toString()}`
  }

  const isTrashView = resolvedParams.status === 'DIBATALKAN'

  return (
    <div className="space-y-4">
      {isTrashView && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-sm">Mode Log Sampah</p>
            <p className="text-xs mt-0.5 opacity-90">Anda sedang melihat daftar transaksi yang telah dibatalkan/dihapus (nominal Rp 0).</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-heading font-semibold ${isTrashView ? 'text-rose-700' : 'text-slate-800'}`}>
              {isTrashView ? 'Log Sampah (Dibatalkan)' : 'Riwayat Transaksi'}
            </h2>
            <PageGuide title="Panduan Riwayat Transaksi">
              <p>Halaman ini menampilkan seluruh rekam jejak pengeluaran kas kecil.</p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-600">
                <li><strong>Filter:</strong> Anda bisa menyaring data berdasarkan Periode, Sumber Dana, Kategori, atau mencari kata kunci spesifik.</li>
                <li><strong>Log Sampah (Admin):</strong> Transaksi yang dibatalkan akan masuk ke Log Sampah agar tidak memengaruhi saldo utama, namun jejak auditnya tetap tersimpan rapi.</li>
                <li><strong>Detail & Hapus:</strong> Klik pada baris mana saja untuk melihat rincian lengkap atau mengunduh nota aslinya. Admin dapat membatalkan transaksi dari tampilan detail tersebut jika periode belum ditutup (OPEN).</li>
              </ul>
            </PageGuide>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {count} transaksi ditemukan
          </p>
        </div>
        {isAdmin && (
          isTrashView ? (
            <Link
              href="/transaksi/riwayat"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors border border-slate-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Riwayat
            </Link>
          ) : (
            <Link
              href="/transaksi/riwayat?status=DIBATALKAN"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-medium transition-colors border border-rose-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Log Sampah
            </Link>
          )
        )}
      </div>

      <TransactionFilters
        cashSources={cashSources}
        categories={masterData.categories}
        periods={allPeriods}
      />

      <TransactionTable transactions={transactions} isAdmin={isAdmin} searchWord={resolvedParams.search} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border border-slate-200 bg-white rounded-lg mt-4">
          <p className="text-xs text-slate-500">
            Halaman {currentPage} dari {totalPages} ({count} data)
          </p>
          <div className="flex gap-1">
            {currentPage > 1 && (
              <Link
                href={pageUrl(currentPage - 1)}
                className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50"
              >
                ← Sebelumnya
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={pageUrl(currentPage + 1)}
                className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50"
              >
                Selanjutnya →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
