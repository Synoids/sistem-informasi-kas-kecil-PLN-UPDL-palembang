'use client'

import { useState, useRef } from 'react'
import { submitTransaction, editTransaction } from '../actions'
import { showToast } from '@/app/components/Toast'

interface CashSource {
  cash_source_id: string
  code: string
  name: string
  balance: number
}

interface MasterItem {
  id: string
  name: string
}

interface TransactionFormProps {
  cashSources: CashSource[]
  categories: MasterItem[]
  divisions: MasterItem[]
  mode?: 'create' | 'edit'
  defaultValues?: {
    transaction_id?: string
    date?: string
    cash_source_id?: string
    recipient_name?: string
    category_id?: string
    vehicle_number?: string
    division_id?: string
    amount?: number
    description?: string
    receipt_date?: string
    handover_date?: string
  }
  onSuccess?: () => void
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TransactionForm({
  cashSources,
  categories,
  divisions,
  mode = 'create',
  defaultValues = {},
  onSuccess,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amountStr, setAmountStr] = useState<string>(
    defaultValues.amount ? Number(defaultValues.amount).toLocaleString('id-ID') : ''
  )
  const formRef = useRef<HTMLFormElement>(null)

  const today = new Date().toISOString().split('T')[0]

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) {
      setAmountStr('')
      return
    }
    setAmountStr(Number(val).toLocaleString('id-ID'))
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    // Basic client-side validation
    const amount = Number(formData.get('amount'))
    if (!amount || amount <= 0) {
      setError('Nominal harus lebih dari 0.')
      setLoading(false)
      return
    }
    if (!(formData.get('recipient_name') as string)?.trim()) {
      setError('Nama penerima wajib diisi.')
      setLoading(false)
      return
    }

    try {
      const result = mode === 'edit'
        ? await editTransaction(formData)
        : await submitTransaction(formData)

      if (result.success) {
        showToast(
          mode === 'edit'
            ? 'Transaksi berhasil diperbarui.'
            : 'Transaksi berhasil disimpan.',
          'success'
        )
        if (mode === 'create') {
          formRef.current?.reset()
        }
        onSuccess?.()
      } else {
        setError(result.error.message)
      }
    } catch {
      setError('Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      {mode === 'edit' && defaultValues.transaction_id && (
        <input type="hidden" name="transaction_id" value={defaultValues.transaction_id} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Tanggal */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
            Tanggal <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultValues.date ?? today}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 2. Sumber Dana */}
        <div>
          <label htmlFor="cash_source_id" className="block text-sm font-medium text-slate-700 mb-1">
            Sumber Dana <span className="text-red-500">*</span>
          </label>
          <select
            id="cash_source_id"
            name="cash_source_id"
            required
            defaultValue={defaultValues.cash_source_id ?? ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">Pilih sumber dana</option>
            {cashSources.map((cs) => (
              <option key={cs.cash_source_id} value={cs.cash_source_id}>
                {cs.name} — Saldo: Rp{formatRupiah(cs.balance)}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Nama Penerima */}
        <div>
          <label htmlFor="recipient_name" className="block text-sm font-medium text-slate-700 mb-1">
            Nama Penerima <span className="text-red-500">*</span>
          </label>
          <input
            id="recipient_name"
            name="recipient_name"
            type="text"
            required
            defaultValue={defaultValues.recipient_name ?? ''}
            placeholder="contoh: Pak Abu, SPBU Pertamina"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 4. Kategori Keperluan */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-1">
            Kategori Keperluan <span className="text-red-500">*</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={defaultValues.category_id ?? ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 5. No Polisi / No Kartu Etoll */}
        <div>
          <label htmlFor="vehicle_number" className="block text-sm font-medium text-slate-700 mb-1">
            No Polisi / No Kartu E-Toll
          </label>
          <input
            id="vehicle_number"
            name="vehicle_number"
            type="text"
            defaultValue={defaultValues.vehicle_number ?? ''}
            placeholder="opsional"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 6. Bidang / Sub Bidang */}
        <div>
          <label htmlFor="division_id" className="block text-sm font-medium text-slate-700 mb-1">
            Bidang / Sub Bidang <span className="text-red-500">*</span>
          </label>
          <select
            id="division_id"
            name="division_id"
            required
            defaultValue={defaultValues.division_id ?? ''}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">Pilih bidang</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* 7. Nominal */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
            Nominal (Rp) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">Rp</span>
            </div>
            <input type="hidden" name="amount" value={amountStr.replace(/\./g, '')} />
            <input
              id="amount_display"
              type="text"
              inputMode="numeric"
              required
              value={amountStr}
              onChange={handleAmountChange}
              placeholder="100.000"
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 8. Deskripsi Keperluan */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Deskripsi Keperluan
          </label>
          <input
            id="description"
            name="description"
            type="text"
            defaultValue={defaultValues.description ?? ''}
            placeholder="opsional"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 9. Tanggal Kuitansi */}
        <div>
          <label htmlFor="receipt_date" className="block text-sm font-medium text-slate-700 mb-1">
            Tanggal Kuitansi <span className="text-red-500">*</span>
          </label>
          <input
            id="receipt_date"
            name="receipt_date"
            type="date"
            required
            defaultValue={defaultValues.receipt_date ?? today}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* 10. Tanggal Penyerahan */}
        <div>
          <label htmlFor="handover_date" className="block text-sm font-medium text-slate-700 mb-1">
            Tanggal Penyerahan <span className="text-red-500">*</span>
          </label>
          <input
            id="handover_date"
            name="handover_date"
            type="date"
            required
            defaultValue={defaultValues.handover_date ?? today}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? 'Menyimpan...'
            : mode === 'edit'
              ? 'Perbarui Transaksi'
              : 'Simpan Transaksi'}
        </button>
        {mode === 'create' && (
          <button
            type="reset"
            disabled={loading}
            className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  )
}
