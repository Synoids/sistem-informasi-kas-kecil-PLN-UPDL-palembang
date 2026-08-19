'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitTransaction, editTransaction } from '../actions'
import { showToast } from '@/app/components/Toast'
import { IndonesianDatePicker } from '@/app/components/IndonesianDatePicker'
import { ReceiptUploader } from '@/app/components/ReceiptUploader'
import { SuccessModal } from '@/app/components/SuccessModal'
import { Spinner } from '@/app/components/Spinner'

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
    receipt_status?: string
    receipt_file_path?: string
  }
  userRole?: string
  periodStatus?: 'OPEN' | 'CLOSED'
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
  userRole = 'USER',
  periodStatus = 'OPEN',
  onSuccess,
}: TransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  const isFinancialLocked = mode === 'edit' && (userRole !== 'ADMIN' || periodStatus === 'CLOSED')
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
    // Basic client-side validation
    const amount = Number(formData.get('amount'))
    if (!amount || amount <= 0) {
      setError('Nominal harus lebih dari 0.')
      return
    }
    if (!(formData.get('date') as string)?.trim()) {
      setError('Tanggal transaksi wajib diisi.')
      return
    }

    const cashSourceId = formData.get('cash_source_id') as string
    const selectedSource = cashSources.find(c => c.cash_source_id === cashSourceId)
    
    if (selectedSource) {
      const oldAmount = mode === 'edit' ? Number(defaultValues.amount || 0) : 0
      const isSameSource = mode === 'edit' && defaultValues.cash_source_id === selectedSource.cash_source_id
      
      const effectiveBalance = isSameSource ? selectedSource.balance + oldAmount : selectedSource.balance
      
      if (amount > effectiveBalance) {
        const shortage = amount - effectiveBalance
        const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
        
        setError(`Saldo tidak mencukupi!\nSaldo Tersedia: ${formatRp(effectiveBalance)}\nNominal Transaksi: ${formatRp(amount)}\nKekurangan: ${formatRp(shortage)}\n\nSilakan gunakan sumber dana lain atau lakukan pendanaan (Top-up) terlebih dahulu.`)
        return
      }
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = mode === 'edit'
        ? await editTransaction(formData)
        : await submitTransaction(formData)

      if (result.success) {
        setSuccessMessage(mode === 'edit' ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil disimpan.')
        if (mode === 'create') {
          formRef.current?.reset()
          setAmountStr('')
        }
        router.refresh()
        onSuccess?.()
      } else {
        setError(result.error?.message || 'Gagal menyimpan transaksi.')
      }
    } catch {
      setError('Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-8 max-w-2xl">
      <SuccessModal 
        isOpen={!!successMessage} 
        message={successMessage} 
        onClose={() => setSuccessMessage('')} 
      />

      {mode === 'edit' && defaultValues.transaction_id && (
        <input type="hidden" name="transaction_id" value={defaultValues.transaction_id} />
      )}

      {/* BAGIAN 1: INFORMASI DASAR */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
        <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">1. Informasi Dasar</h3>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
            Tanggal Transaksi <span className="text-red-500">*</span>
          </label>
          <IndonesianDatePicker
            id="date"
            name="date"
            required
            defaultValue={defaultValues.date ?? today}
            disabled={isFinancialLocked}
          />
          {isFinancialLocked && <input type="hidden" name="date" value={defaultValues.date ?? today} />}
        </div>

        <div>
          <label htmlFor="cash_source_id" className="block text-sm font-medium text-slate-700 mb-1">
            Sumber Dana <span className="text-red-500">*</span>
          </label>
          <select
            id="cash_source_id"
            name="cash_source_id"
            required
            defaultValue={defaultValues.cash_source_id ?? ''}
            disabled={isFinancialLocked}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Pilih sumber dana</option>
            {cashSources.map((cs) => (
              <option key={cs.cash_source_id} value={cs.cash_source_id}>
                {cs.name} — Saldo: Rp{formatRupiah(cs.balance)}
              </option>
            ))}
          </select>
          {isFinancialLocked && <input type="hidden" name="cash_source_id" value={defaultValues.cash_source_id} />}
        </div>

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
              autoComplete="off"
              value={amountStr}
              onChange={handleAmountChange}
              disabled={isFinancialLocked}
              placeholder=""
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold text-lg disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* BAGIAN 2: RINCIAN KEPERLUAN */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
        <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">2. Rincian Keperluan</h3>
        
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-1">
            Kategori Keperluan <span className="text-red-500">*</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={defaultValues.category_id ?? ''}
            disabled={isFinancialLocked}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {isFinancialLocked && <input type="hidden" name="category_id" value={defaultValues.category_id} />}
        </div>

        <div>
          <label htmlFor="division_id" className="block text-sm font-medium text-slate-700 mb-1">
            Bidang / Sub Bidang <span className="text-red-500">*</span>
          </label>
          <select
            id="division_id"
            name="division_id"
            required
            defaultValue={defaultValues.division_id ?? ''}
            disabled={isFinancialLocked}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Pilih bidang</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {isFinancialLocked && <input type="hidden" name="division_id" value={defaultValues.division_id} />}
        </div>

        <div>
          <label htmlFor="recipient_name" className="block text-sm font-medium text-slate-700 mb-1">
            Nama Penerima
          </label>
          <input
            id="recipient_name"
            name="recipient_name"
            type="text"
            autoComplete="off"
            defaultValue={defaultValues.recipient_name ?? ''}
            readOnly={isFinancialLocked}
            placeholder="Isi jika ada (opsional)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none read-only:bg-slate-100 read-only:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
            Deskripsi Spesifik
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={defaultValues.description ?? ''}
            readOnly={isFinancialLocked}
            placeholder="opsional"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y read-only:bg-slate-100 read-only:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="vehicle_number" className="block text-sm font-medium text-slate-700 mb-1">
            No Polisi / No Kartu E-Toll
          </label>
          <input
            id="vehicle_number"
            name="vehicle_number"
            type="text"
            defaultValue={defaultValues.vehicle_number ?? ''}
            readOnly={isFinancialLocked}
            placeholder="opsional (khusus kategori BBM/Toll)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none read-only:bg-slate-100 read-only:text-slate-500"
          />
        </div>
      </div>

      {/* BAGIAN 3: ADMINISTRASI KUITANSI */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
        <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">3. Administrasi Kuitansi</h3>
        
        {mode === 'edit' && defaultValues.receipt_file_path && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Kuitansi Tersimpan:</span> {' '}
              <a href={`/api/storage/receipts/${defaultValues.receipt_file_path}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">
                Lihat File
              </a>
            </p>
            <input type="hidden" name="existing_receipt_path" value={defaultValues.receipt_file_path} />
            <input type="hidden" name="receipt_status" value={defaultValues.receipt_status || 'SUDAH ADA'} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="receipt_date" className="block text-sm font-medium text-slate-700 mb-1">
              Tanggal Kuitansi (opsional)
            </label>
            <IndonesianDatePicker
              id="receipt_date"
              name="receipt_date"
              defaultValue={defaultValues.receipt_date ?? ''}
              placeholder="Kosongkan jika belum ada"
            />
          </div>

          <div>
            <label htmlFor="handover_date" className="block text-sm font-medium text-slate-700 mb-1">
              Tanggal Penyerahan (opsional)
            </label>
            <IndonesianDatePicker
              id="handover_date"
              name="handover_date"
              defaultValue={defaultValues.handover_date ?? ''}
              placeholder="Kosongkan jika belum ada"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="receipt_file" className="block text-sm font-medium text-slate-700 mb-1">
              Upload Kuitansi Fisik {mode === 'edit' && defaultValues.receipt_file_path && '(Opsional, untuk mengganti)'}
            </label>
            <ReceiptUploader name="receipt_file" id="receipt_file" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md whitespace-pre-wrap">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[160px]"
        >
          {loading
            ? <><Spinner className="mr-2" /> Menyimpan...</>
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
