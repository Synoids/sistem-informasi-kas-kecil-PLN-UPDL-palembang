import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getMasterData } from '@/lib/services/dashboard.service'
import { TransactionForm } from './components/TransactionForm'

export default async function InputTransaksiPage() {
  const [cashSources, masterData] = await Promise.all([
    getAccessibleCashSources(),
    getMasterData()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Input Transaksi</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Catat pengeluaran kas kecil. Semua field yang bertanda <span className="text-red-500">*</span> wajib diisi.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <TransactionForm
          cashSources={cashSources}
          categories={masterData.categories}
          divisions={masterData.divisions}
        />
      </div>
    </div>
  )
}
