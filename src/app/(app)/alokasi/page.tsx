import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { AllocationForm } from '@/app/components/AllocationForm'

export const metadata = {
  title: 'Alokasi Dana',
}

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
  
  if (profile?.role !== 'ADMIN') {
    redirect('/')
  }

  const cashSources = await getAccessibleCashSources()
  const mainSource = cashSources.find(cs => cs.type === 'MAIN')
  const mainBalance = mainSource?.balance || 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Alokasi Dana</h1>
        <p className="text-slate-500 mt-1">Kelola distribusi dana dari Kas Utama ke masing-masing pemegang dana.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <AllocationForm cashSources={cashSources} />
        </div>

        {/* Monitoring Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 sticky top-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
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
                <tbody className="divide-y divide-slate-100">
                  {cashSources.map((source) => (
                    <tr key={source.cash_source_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{source.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            source.type === 'MAIN' ? 'bg-blue-500' : 'bg-slate-400'
                          }`}></span>
                          {source.code}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {formatRupiah(source.balance)}
                      </td>
                    </tr>
                  ))}
                  {cashSources.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                        Belum ada sumber dana aktif
                      </td>
                    </tr>
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
