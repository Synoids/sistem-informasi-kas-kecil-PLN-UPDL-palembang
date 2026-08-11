import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getMasterData } from '@/lib/services/dashboard.service'
import { fetchTransactionById } from '@/lib/services/transaction.service'
import { redirect, notFound } from 'next/navigation'
import { TransactionForm } from '../../components/TransactionForm'
import Link from 'next/link'

export default async function EditTransaksiPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  // Only ADMIN can edit
  if (profile.role !== 'ADMIN') {
    redirect('/')
  }

  const { id } = await params

  const transaction = await fetchTransactionById(id)
  if (!transaction) {
    notFound()
  }

  const masterData = await getMasterData()
  const cashSources = await getAccessibleCashSources()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/transaksi/riwayat"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Kembali ke Riwayat
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800">Edit Transaksi</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Perubahan akan divalidasi oleh database. Audit trail (updated_by, updated_at) akan diperbarui otomatis.
        </p>
      </div>

      {/* Transaction metadata */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-500 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <span className="block font-medium text-slate-600">ID Transaksi</span>
          <code className="font-mono">{transaction.id.substring(0, 8)}...</code>
        </div>
        <div>
          <span className="block font-medium text-slate-600">Dibuat oleh</span>
          {transaction.created_by_name}
        </div>
        <div>
          <span className="block font-medium text-slate-600">Dibuat pada</span>
          {new Date(transaction.created_at).toLocaleString('id-ID')}
        </div>
        <div>
          <span className="block font-medium text-slate-600">Terakhir diperbarui</span>
          {new Date(transaction.updated_at).toLocaleString('id-ID')}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <TransactionForm
          cashSources={cashSources}
          categories={masterData.categories}
          divisions={masterData.divisions}
          mode="edit"
          defaultValues={{
            transaction_id: transaction.id,
            date: transaction.date,
            cash_source_id: transaction.cash_source_id,
            recipient_name: transaction.recipient_name,
            category_id: transaction.category_id,
            vehicle_number: transaction.vehicle_number ?? '',
            division_id: transaction.division_id,
            amount: transaction.amount,
            description: transaction.description ?? '',
            receipt_date: transaction.receipt_date,
            handover_date: transaction.handover_date,
          }}
        />
      </div>
    </div>
  )
}
