import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { redirect } from 'next/navigation'
import { AllocationForm } from '@/app/components/AllocationForm'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function AlokasiPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    throw new Error('Data profil tidak ditemukan di database.')
  }

  if (profile.role !== 'ADMIN') {
    // Only ADMIN can access this page
    redirect('/')
  }

  // Admin gets all cash sources
  const cashSources = await getAccessibleCashSources()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Alokasi Dana</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Transfer dana operasional antar sumber dana (Kas Utama ke Pemegang Dana)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <AllocationForm cashSources={cashSources} />
        </div>

        {/* Monitoring Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 sticky top-6">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Monitoring Saldo</h3>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2">Sumber Dana</th>
                    <th className="px-4 py-2 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cashSources.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-center text-slate-400">
                        Tidak ada data.
                      </td>
                    </tr>
                  ) : (
                    cashSources.map((cs) => (
                      <tr key={cs.cash_source_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{cs.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{cs.type}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800 whitespace-nowrap">
                          {formatRupiah(cs.balance)}
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
    </div>
  )
}
