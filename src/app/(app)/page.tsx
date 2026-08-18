import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getDashboardStats } from '@/lib/services/dashboard.service'
import { fetchTransactions } from '@/lib/services/transaction.service'
import { getActivePeriod } from '@/lib/services/period.service'
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

  const activePeriod = await getActivePeriod()

  const cashSources = await getAccessibleCashSources()
  const sourceIds = cashSources.map((cs) => cs.cash_source_id)

  const stats = await getDashboardStats(
    activePeriod?.id || '',
    profile.role === 'USER' ? sourceIds : undefined
  )

  const { data: recentTransactions } = await fetchTransactions({ limit: 5 })

  const mainCash = cashSources.find((cs) => cs.type === 'MAIN')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan operasional kas kecil.
        </p>
      </div>

      {/* Period Indicator */}
      {activePeriod ? (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-5 shadow-sm text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold bg-blue-500/50 text-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Periode Aktif</span>
              <h3 className="text-lg font-bold">{activePeriod.name}</h3>
            </div>
            <p className="text-blue-100 text-sm">
              {formatDate(activePeriod.start_date)} - {formatDate(activePeriod.end_date)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm border border-white/10">
            <p className="text-xs font-medium text-blue-100 uppercase tracking-wider mb-0.5">Pagu / Funding Periode</p>
            <p className="text-xl font-bold">{formatRupiah(stats.periodFundingAmount)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex items-start gap-3">
          <div className="text-amber-500 mt-0.5">⚠️</div>
          <div>
            <h3 className="font-semibold text-amber-800">Belum Ada Periode Aktif</h3>
            <p className="text-sm text-amber-700 mt-1">
              {profile.role === 'ADMIN' 
                ? 'Silakan buka periode baru di menu Manajemen Periode agar transaksi dapat dilakukan.'
                : 'Menunggu administrator membuka periode akuntansi baru.'}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Kas Utama (Admin Only) */}
        {profile.role === 'ADMIN' && mainCash && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Kas Utama</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatRupiah(mainCash.balance)}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pengeluaran Kas Kecil
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {formatRupiah(stats.totalExpenseThisMonth)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Sisa Saldo Anda
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatRupiah(cashSources.reduce((sum, cs) => sum + cs.balance, 0))}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-rose-100 p-5 shadow-sm bg-rose-50/30">
          <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">
            Hutang Klaim Non-Kas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-rose-700">
              {formatRupiah(stats.unreimbursedNonCashAmount)}
            </p>
          </div>
          <p className="text-xs text-rose-600 mt-1">{stats.unreimbursedNonCashCount} klaim menunggu ganti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Cash Sources */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                {profile.role === 'ADMIN' ? 'Seluruh Sumber Dana' : 'Sumber Dana Anda'}
              </h3>
            </div>
            <div className="p-5">
              {cashSources.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Tidak ada sumber dana operasional yang dapat diakses.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cashSources.map((cs) => (
                    <div 
                      key={cs.cash_source_id} 
                      className="flex flex-col p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors bg-white group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                            cs.type === 'MAIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {cs.code}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm leading-tight">{cs.name}</h4>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{cs.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <p className="text-lg font-bold text-slate-900">{formatRupiah(cs.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">Transaksi Terbaru</h3>
              {stats.unreceiptedTransactionCount > 0 && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  {stats.unreceiptedTransactionCount} Belum Berkuitansi
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/30">
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Penerima</th>
                    <th className="px-5 py-3">Sumber Dana</th>
                    <th className="px-5 py-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        Belum ada transaksi pada riwayat.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-600">{formatDate(tx.date)}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800 line-clamp-1">{tx.recipient_name}</p>
                          {tx.receipt_status === 'BELUM ADA' && (
                            <span className="inline-flex items-center text-[10px] font-medium text-amber-600 mt-0.5">⚠️ No Receipt</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {tx.cash_source_code}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-800">
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

        {/* Right Col: Quick Actions / Metrics summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Statistik Periode</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Transaksi</p>
                <p className="text-lg font-semibold text-slate-800">{stats.transactionCountThisMonth}</p>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Tanpa Kuitansi</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-semibold ${stats.unreceiptedTransactionCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {stats.unreceiptedTransactionCount}
                  </p>
                  {stats.unreceiptedTransactionCount > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">PENDING</span>}
                </div>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Klaim Non-Kas Belum Diganti</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-semibold ${stats.unreimbursedNonCashCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {stats.unreimbursedNonCashCount}
                  </p>
                  {stats.unreimbursedNonCashCount > 0 && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-medium">HUTANG</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
