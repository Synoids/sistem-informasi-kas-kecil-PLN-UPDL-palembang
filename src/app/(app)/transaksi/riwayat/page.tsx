import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getMasterData } from '@/lib/services/dashboard.service'
import { fetchTransactions } from '@/lib/services/transaction.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TransactionFilters } from './components/TransactionFilters'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const PAGE_SIZE = 25

export default async function RiwayatTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; source?: string; category?: string; page?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const resolvedParams = await searchParams

  const cashSources = await getAccessibleCashSources()
  const masterData = await getMasterData()

  const currentPage = Number(resolvedParams.page ?? '1')
  const offset = (currentPage - 1) * PAGE_SIZE

  const { data: transactions, count } = await fetchTransactions({
    dateFrom: resolvedParams.from,
    dateTo: resolvedParams.to,
    cashSourceId: resolvedParams.source,
    categoryId: resolvedParams.category,
    limit: PAGE_SIZE,
    offset,
  })

  const totalPages = Math.ceil(count / PAGE_SIZE)
  const isAdmin = profile.role === 'ADMIN'

  function pageUrl(page: number) {
    const params = new URLSearchParams()
    if (resolvedParams.from) params.set('from', resolvedParams.from)
    if (resolvedParams.to) params.set('to', resolvedParams.to)
    if (resolvedParams.source) params.set('source', resolvedParams.source)
    if (resolvedParams.category) params.set('category', resolvedParams.category)
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
      />

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-3 whitespace-nowrap">Sumber Dana</th>
                <th className="px-4 py-3 whitespace-nowrap">Penerima</th>
                <th className="px-4 py-3 whitespace-nowrap">Kategori</th>
                <th className="px-4 py-3 whitespace-nowrap">No Polisi / E-Toll</th>
                <th className="px-4 py-3 whitespace-nowrap">Bidang</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Nominal</th>
                <th className="px-4 py-3 whitespace-nowrap">Deskripsi</th>
                <th className="px-4 py-3 whitespace-nowrap">Tgl Kuitansi</th>
                <th className="px-4 py-3 whitespace-nowrap">Tgl Penyerahan</th>
                <th className="px-4 py-3 whitespace-nowrap">Diinput oleh</th>
                {isAdmin && <th className="px-4 py-3 whitespace-nowrap">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 12 : 11} className="px-4 py-12 text-center text-slate-400">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{tx.cash_source_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">{tx.recipient_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{tx.category_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{tx.vehicle_number ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{tx.division_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-red-600">{formatRupiah(tx.amount)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{tx.description ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(tx.receipt_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(tx.handover_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">{tx.created_by_name}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/transaksi/${tx.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              Halaman {currentPage} dari {totalPages} ({count} data)
            </p>
            <div className="flex gap-1">
              {currentPage > 1 && (
                <Link
                  href={pageUrl(currentPage - 1)}
                  className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-white"
                >
                  ← Sebelumnya
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={pageUrl(currentPage + 1)}
                  className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-white"
                >
                  Selanjutnya →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
