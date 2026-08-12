import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getDashboardStats } from '@/lib/services/dashboard.service'
import { fetchTransactions } from '@/lib/services/transaction.service'
import { redirect } from 'next/navigation'

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

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) {
    throw new Error('Data profil tidak ditemukan di database. Pastikan tabel "profiles" sudah diisi untuk user ini.')
  }

  const cashSources = await getAccessibleCashSources()
  const sourceIds = cashSources.map((cs) => cs.cash_source_id)

  const stats = await getDashboardStats(
    profile.role === 'USER' ? sourceIds : undefined
  )

  const { data: recentTransactions } = await fetchTransactions({ limit: 5 })

  const mainCash = cashSources.find((cs) => cs.type === 'MAIN')

  const now = new Date()
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Ringkasan kas kecil — {monthName}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profile.role === 'ADMIN' && mainCash && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Kas Utama</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatRupiah(mainCash.balance)}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pengeluaran Bulan Ini
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatRupiah(stats.totalExpenseThisMonth)}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Sisa Saldo Anda
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {formatRupiah(cashSources.reduce((sum, cs) => sum + cs.balance, 0))}
          </p>
        </div>
      </div>

      {/* Cash Sources Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            {profile.role === 'ADMIN' ? 'Seluruh Sumber Dana' : 'Sumber Dana Anda'}
          </h3>
        </div>
          <div className="p-5">
            {cashSources.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Tidak ada sumber dana yang dapat diakses.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cashSources.map((cs) => (
                  <div 
                    key={cs.cash_source_id} 
                    className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-slate-800 line-clamp-2">{cs.name}</h4>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Sisa Saldo</p>
                      <p className="text-lg font-bold text-slate-900">{formatRupiah(cs.balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Transaksi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Penerima</th>
                <th className="px-5 py-3">Sumber Dana</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-600">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{tx.recipient_name}</td>
                    <td className="px-5 py-3 text-slate-600">{tx.cash_source_name}</td>
                    <td className="px-5 py-3 text-slate-600">{tx.category_name}</td>
                    <td className="px-5 py-3 text-right font-medium text-red-600">
                      {formatRupiah(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
