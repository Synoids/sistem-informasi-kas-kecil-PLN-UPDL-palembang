import { getCashSourceDetailData } from '@/lib/services/cash-source.service'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

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

export default async function CashSourceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let data
  try {
    data = await getCashSourceDetailData(id)
  } catch (error: any) {
    if (error.message.includes('tidak memiliki akses')) {
      // User trying to access unauthorized source
      return (
        <div className="space-y-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
            Anda tidak memiliki akses ke sumber dana ini.
          </div>
          <Link href="/master/cash-sources" className="text-blue-600 hover:underline">
            &larr; Kembali ke Daftar Sumber Dana
          </Link>
        </div>
      )
    }
    throw error
  }

  if (!data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/master/cash-sources" className="text-slate-500 hover:text-slate-800 transition-colors">
          &larr; Kembali
        </Link>
        <h2 className="text-xl font-semibold text-slate-800">Detail Sumber Dana</h2>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-2xl font-bold text-slate-900">{data.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${data.type === 'MAIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {data.type}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${data.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {data.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <p className="text-sm font-mono text-slate-500">Kode: {data.code}</p>
          </div>
          
          <div className="flex items-center text-sm text-slate-600">
            <span className="font-medium mr-2">Pemegang Dana:</span>
            <span>{data.fund_holder_name || '—'}</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-5 text-right min-w-[240px]">
          <p className="text-sm text-slate-500 font-medium mb-1">Saldo Saat Ini</p>
          <p className="text-3xl font-bold text-blue-700">{formatRupiah(data.current_balance)}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total Alokasi Masuk</p>
          <p className="text-lg font-bold text-green-700 mt-1">{formatRupiah(data.total_allocation_in)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total Alokasi Keluar</p>
          <p className="text-lg font-bold text-orange-600 mt-1">{formatRupiah(data.total_allocation_out)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total Pengeluaran</p>
          <p className="text-lg font-bold text-red-700 mt-1">{formatRupiah(data.total_transaction_out)}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800">Riwayat Mutasi & Transaksi</h3>
          <span className="text-xs text-slate-500">Total {data.history.length} data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-28">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Jenis</th>
                <th className="px-4 py-3 font-semibold">Uraian</th>
                <th className="px-4 py-3 font-semibold">Sumber &rarr; Tujuan</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {data.history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    Belum ada riwayat mutasi untuk sumber dana ini.
                  </td>
                </tr>
              ) : (
                data.history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">{formatDate(row.date)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                        row.type === 'Alokasi Masuk' ? 'bg-green-100 text-green-700' :
                        row.type === 'Alokasi Keluar' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-sm truncate" title={row.description}>
                      {row.description}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <span className="font-medium">{row.source}</span>
                      <span className="mx-2 text-slate-400">&rarr;</span>
                      <span className="font-medium">{row.destination}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.category}</td>
                    <td className={`px-4 py-2.5 text-right font-medium ${
                        row.type === 'Alokasi Masuk' ? 'text-green-700' :
                        row.type === 'Alokasi Keluar' ? 'text-orange-600' :
                        'text-red-700'
                    }`}>
                      {row.type === 'Alokasi Masuk' ? '+' : '-'}{formatRupiah(row.amount)}
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
