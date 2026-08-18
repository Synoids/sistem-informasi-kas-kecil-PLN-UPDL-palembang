import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getMasterData } from '@/lib/services/dashboard.service'
import { fetchTransactions } from '@/lib/services/transaction.service'
import { getActivePeriod, getAllPeriods } from '@/lib/services/period.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TransactionFilters } from './components/TransactionFilters'
import { TransactionTable } from './components/TransactionTable'

const PAGE_SIZE = 25

export default async function RiwayatTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; source?: string; category?: string; status?: string; search?: string; page?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const resolvedParams = await searchParams

  const cashSources = await getAccessibleCashSources()
  const masterData = await getMasterData()
  const allPeriods = (await getAllPeriods() || []) as any[]
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Riwayat Transaksi</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {count} transaksi ditemukan
        </p>
      </div>

      <TransactionFilters
        cashSources={cashSources}
        categories={masterData.categories}
        periods={allPeriods}
      />

      <TransactionTable transactions={transactions} isAdmin={isAdmin} />

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
