'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/types/database.types'
import { showToast } from './Toast'

type CashSourceBalance = Database['public']['Views']['v_cash_source_balances']['Row']

interface AllocationFormProps {
  cashSources: CashSourceBalance[]
}

export function AllocationForm({ cashSources }: AllocationFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [amountStr, setAmountStr] = useState('')

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) {
      setAmountStr('')
      return
    }
    setAmountStr(Number(val).toLocaleString('id-ID'))
  }

  // Provide today's date as default
  const today = new Date().toISOString().split('T')[0]

  async function handleAction(formData: FormData) {
    setIsPending(true)

    try {
      const data = {
        source_id: formData.get('source_id') as string,
        destination_id: formData.get('destination_id') as string,
        amount: formData.get('amount') as string,
      }

      // Client-side validations
      if (data.source_id === data.destination_id) {
        showToast('Sumber dan tujuan dana tidak boleh sama.', 'error')
        setIsPending(false)
        return
      }

      if (Number(data.amount) <= 0) {
        showToast('Nominal alokasi harus lebih dari 0.', 'error')
        setIsPending(false)
        return
      }

      // Confirm action
      const sourceName = cashSources.find(c => c.cash_source_id === data.source_id)?.name || 'Sumber'
      const destName = cashSources.find(c => c.cash_source_id === data.destination_id)?.name || 'Tujuan'
      const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(data.amount))
      
      if (!window.confirm(`Alokasikan ${formattedAmount} dari ${sourceName} ke ${destName}?`)) {
        setIsPending(false)
        return
      }

      const { submitAllocationAction } = await import('@/app/(app)/alokasi/actions')
      const result = await submitAllocationAction(formData)
      
      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Alokasi berhasil disimpan!', 'success')
        setAmountStr('')
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setIsPending(false)
    }
  }

  // Find the MAIN cash source to use as default if available
  const mainCashSourceId = cashSources.find(c => c.type === 'MAIN')?.cash_source_id

  return (
    <form action={handleAction} className="space-y-5 bg-white p-6 rounded-xl border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={today}
            className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">Nominal</label>
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
              placeholder="0"
              className="block w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="source_id" className="block text-sm font-medium text-slate-700 mb-1">Sumber Dana</label>
          <select
            id="source_id"
            name="source_id"
            required
            defaultValue={mainCashSourceId || ''}
            className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="" disabled>Pilih Sumber Dana</option>
            {cashSources.map((cs) => (
              <option key={cs.cash_source_id} value={cs.cash_source_id}>
                {cs.name} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cs.balance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="destination_id" className="block text-sm font-medium text-slate-700 mb-1">Tujuan Dana</label>
          <select
            id="destination_id"
            name="destination_id"
            required
            className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="" disabled>Pilih Tujuan Dana</option>
            {cashSources.map((cs) => (
              <option key={cs.cash_source_id} value={cs.cash_source_id}>
                {cs.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          placeholder="Keterangan alokasi dana..."
          className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      <div className="pt-2 flex justify-end border-t border-slate-100">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Alokasikan Dana'}
        </button>
      </div>
    </form>
  )
}
