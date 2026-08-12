import { getCurrentProfile } from '@/lib/services/auth.service'
import { redirect } from 'next/navigation'
import { fetchAllocations } from '@/lib/services/allocation.service'
import Link from 'next/link'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AlokasiRiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const profile = await getCurrentProfile()

  if (!profile) {
    throw new Error('Data profil tidak ditemukan di database.')
  }

  if (profile.role !== 'ADMIN') {
    // Only ADMIN can access this page
    redirect('/')
  }

  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const limit = 25
  const offset = (currentPage - 1) * limit

  const { data: allocations, count } = await fetchAllocations({ limit, offset })

  const totalPages = Math.ceil(count / limit)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Riwayat Alokasi</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar seluruh alokasi dana operasional yang pernah dilakukan
          </p>
        </div>
        <div>
          <Link
            href="/alokasi"
            className="inline-flex items-center gap-2 rounded-md bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            ← Kembali ke Form Alokasi
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Sumber Dana</th>
                <th className="px-6 py-4">Tujuan Dana</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Dibuat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    Belum ada riwayat alokasi dana.
                  </td>
                </tr>
              ) : (
                allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{formatDate(alloc.date)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{formatTime(alloc.created_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{alloc.source_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{alloc.source_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{alloc.destination_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{alloc.destination_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                      {formatRupiah(alloc.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate" title={alloc.description || undefined}>
                      {alloc.description}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{alloc.created_by_name}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Menampilkan {offset + 1} - {Math.min(offset + limit, count)} dari {count} data
            </p>
            <div className="flex gap-2">
              <Link
                href={`/alokasi/riwayat?page=${currentPage - 1}`}
                className={`px-3 py-1 text-sm border border-slate-300 rounded-md ${
                  currentPage <= 1
                    ? 'opacity-50 pointer-events-none bg-slate-50 text-slate-400'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Sebelumnya
              </Link>
              <Link
                href={`/alokasi/riwayat?page=${currentPage + 1}`}
                className={`px-3 py-1 text-sm border border-slate-300 rounded-md ${
                  currentPage >= totalPages
                    ? 'opacity-50 pointer-events-none bg-slate-50 text-slate-400'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Selanjutnya
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
