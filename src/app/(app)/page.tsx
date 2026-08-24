import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getDashboardStats } from '@/lib/services/dashboard.service'
import { fetchTransactions } from '@/lib/services/transaction.service'
import { getActivePeriod } from '@/lib/services/period.service'
import { redirect } from 'next/navigation'
import { DashboardStatsTabs } from './components/DashboardStatsTabs'
import { PageGuide } from '@/app/components/PageGuide'
import { FileText, AlertCircle, CheckCircle2, Wallet, CreditCard, User } from 'lucide-react'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
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

  // Calculate Time Progress for active period
  let timeProgress = 0
  if (activePeriod) {
    const start = new Date(activePeriod.start_date).getTime()
    const end = new Date(activePeriod.end_date).getTime()
    const now = new Date().getTime()
    
    if (now >= end) {
      timeProgress = 100
    } else if (now <= start) {
      timeProgress = 0
    } else {
      timeProgress = Math.round(((now - start) / (end - start)) * 100)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-heading font-bold text-slate-800">Dashboard</h2>
            <PageGuide title="Panduan Dashboard">
              <p>Selamat datang di <strong>Dashboard</strong> Kas Kecil.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                <li><strong>Periode Aktif:</strong> Menunjukkan rentang waktu keuangan yang sedang berjalan dan total Pagu.</li>
                <li><strong>Sisa Saldo & Limit:</strong> Kartu statistik (warna-warni) menunjukkan berapa sisa uang saat ini. Bar Limit akan berwarna merah jika pengeluaran hampir menyentuh ambang batas.</li>
                <li><strong>Riwayat Terbaru:</strong> Tabel di bawah menampilkan 5 transaksi terakhir yang di-input.</li>
              </ul>
              <p className="mt-3">Gunakan menu di samping untuk berpindah halaman.</p>
            </PageGuide>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan operasional kas kecil.
          </p>
        </div>
      </div>

      {/* Period Indicator */}
      {activePeriod ? (
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 shadow-lg text-white overflow-hidden flex items-center justify-between flex-wrap gap-4 border border-blue-600/50">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold bg-blue-400/30 text-blue-100 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-400/20 backdrop-blur-sm">
                Periode Aktif
              </span>
              <h3 className="text-xl font-heading font-bold tracking-tight">{activePeriod.name}</h3>
            </div>
            <p className="text-blue-200/80 text-sm font-medium flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {formatDate(activePeriod.start_date)} - {formatDate(activePeriod.end_date)}
            </p>
          </div>
          
          <div className="relative z-10 text-right">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1 opacity-80">Pagu / Funding Periode</p>
            <p className="text-3xl font-heading font-black tracking-tight">{formatRupiah(stats.periodFundingAmount)}</p>
          </div>

          {/* Time Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-900/50">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-300 relative rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              style={{ width: `${timeProgress}%` }}
            >
            </div>
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

      {/* Summary Cards with Tabs */}
      <DashboardStatsTabs 
        stats={stats} 
        cashSources={cashSources} 
        isAdmin={profile.role === 'ADMIN'}
        mainCashBalance={mainCash?.balance || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Cash Sources */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-lg font-heading font-semibold text-slate-800">
                {profile.role === 'ADMIN' ? 'Seluruh Sumber Dana' : 'Sumber Dana Anda'}
              </h3>
            </div>
            <div>
              {cashSources.length === 0 ? (
                <div className="text-center py-8 bg-white border border-slate-200 rounded-xl text-slate-400 text-sm">
                  Tidak ada sumber dana operasional yang dapat diakses.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cashSources.map((cs) => (
                    <div 
                      key={cs.cash_source_id} 
                      className="flex flex-col p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-white group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            cs.type === 'MAIN' ? 'bg-blue-100 text-blue-700 shadow-inner' : 'bg-slate-100 text-slate-500 shadow-inner'
                          }`}>
                            {cs.type === 'MAIN' ? <CreditCard size={20} strokeWidth={2} /> : <User size={20} strokeWidth={2} />}
                          </div>
                          <div>
                            <h4 className="font-heading font-semibold text-slate-800 text-base leading-tight">{cs.name}</h4>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{cs.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto pt-2 border-t border-slate-100 border-dashed">
                        <p className="text-2xl font-heading font-bold text-slate-900">{formatRupiah(cs.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Transactions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-lg font-heading font-semibold text-slate-800">Transaksi Terbaru</h3>
              {stats.unreceiptedTransactionCount > 0 && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  {stats.unreceiptedTransactionCount} Belum Berkuitansi
                </span>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-4">Tanggal</th>
                      <th className="px-5 py-4">Penerima</th>
                      <th className="px-5 py-4">Sumber Dana</th>
                      <th className="px-5 py-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                          Belum ada transaksi pada riwayat.
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">{tx.recipient_name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5" title={tx.description || undefined}>
                              {tx.description}
                            </p>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                              {tx.cash_source_code}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right font-heading font-semibold text-slate-800">
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
        </div>

        {/* Right Col: Action Status */}
        <div className="lg:col-span-1">
          <div className="space-y-4 sticky top-6">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1.5 bg-indigo-100/50 text-indigo-600 rounded-lg">
                <AlertCircle size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-heading font-semibold text-slate-800">Status & Tindakan</h3>
            </div>
            
            <div className="space-y-4">
              {/* Total Transaksi */}
              <div className="flex items-center gap-4 py-4 px-1">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 shrink-0">
                  <FileText size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transaksi</p>
                  <p className="text-2xl font-heading font-bold text-slate-800 mt-0.5">{stats.transactionCountThisMonth}</p>
                </div>
              </div>

              {/* Tanpa Kuitansi */}
              <div className="flex items-start gap-4 py-4 px-1 border-t border-slate-200/60">
                <div className={`w-12 h-12 rounded-2xl shadow-sm border flex items-center justify-center shrink-0 ${stats.unreceiptedTransactionCount > 0 ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-emerald-100 border-emerald-200 text-emerald-600'}`}>
                  {stats.unreceiptedTransactionCount > 0 ? <AlertCircle size={22} strokeWidth={2} /> : <CheckCircle2 size={22} strokeWidth={2} />}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${stats.unreceiptedTransactionCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    Tanpa Kuitansi
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-3xl font-heading font-black ${stats.unreceiptedTransactionCount > 0 ? 'text-slate-800' : 'text-slate-800'}`}>
                      {stats.unreceiptedTransactionCount}
                    </p>
                    {stats.unreceiptedTransactionCount > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Pending</span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 font-medium ${stats.unreceiptedTransactionCount > 0 ? 'text-slate-600' : 'text-slate-600'}`}>
                    {stats.unreceiptedTransactionCount > 0 ? 'Segera lengkapi bukti pembayaran.' : 'Semua transaksi berdokumen.'}
                  </p>
                </div>
              </div>

              {/* Klaim Non-Kas */}
              <div className="flex items-start gap-4 py-4 px-1 border-t border-slate-200/60">
                <div className={`w-12 h-12 rounded-2xl shadow-sm border flex items-center justify-center shrink-0 ${stats.unreimbursedNonCashCount > 0 ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-emerald-100 border-emerald-200 text-emerald-600'}`}>
                  {stats.unreimbursedNonCashCount > 0 ? <Wallet size={22} strokeWidth={2} /> : <CheckCircle2 size={22} strokeWidth={2} />}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${stats.unreimbursedNonCashCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    Klaim Belum Diganti
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-3xl font-heading font-black ${stats.unreimbursedNonCashCount > 0 ? 'text-slate-800' : 'text-slate-800'}`}>
                      {stats.unreimbursedNonCashCount}
                    </p>
                    {stats.unreimbursedNonCashCount > 0 && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Hutang</span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 font-medium ${stats.unreimbursedNonCashCount > 0 ? 'text-slate-600' : 'text-slate-600'}`}>
                    {stats.unreimbursedNonCashCount > 0 ? 'Terdapat tagihan menunggu.' : 'Tidak ada hutang reimburse.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
