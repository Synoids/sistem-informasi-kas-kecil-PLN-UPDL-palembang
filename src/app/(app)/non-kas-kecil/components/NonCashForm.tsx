'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IndonesianDatePicker } from '@/app/components/IndonesianDatePicker'
import { submitNonCashClaimAction, uploadNkkReceiptAction } from '../actions'
import { ReceiptUploader } from '@/app/components/ReceiptUploader'
import { SuccessModal } from '@/app/components/SuccessModal'
import { Spinner } from '@/app/components/Spinner'

interface NonCashFormProps {
  mode?: 'create' | 'upload'
  claim?: any
  activePeriodId?: string
}

export function NonCashForm({ mode = 'create', claim, activePeriodId }: NonCashFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  const isLocked = mode === 'upload'

  const [amountStr, setAmountStr] = useState<string>(
    claim?.amount ? Number(claim.amount).toLocaleString('id-ID') : ''
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val === '') {
      setAmountStr('')
      return
    }
    const num = parseInt(val, 10)
    setAmountStr(num.toLocaleString('id-ID'))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    if (mode === 'create') {
      if (!activePeriodId) {
        setError('Tidak ada periode OPEN saat ini.')
        setLoading(false)
        return
      }
      formData.set('period_id', activePeriodId)
      
      const res = await submitNonCashClaimAction(formData)
      if (res.success) {
        setSuccessMessage('Klaim Non-Kas Kecil berhasil disimpan.')
        setTimeout(() => router.push('/non-kas-kecil'), 1500)
      } else {
        setError(res.error?.message || 'Gagal menyimpan data')
        setLoading(false)
      }
    } else if (mode === 'upload' && claim) {
      formData.set('claim_id', claim.id)
      
      const res = await uploadNkkReceiptAction(formData)
      if (res.success) {
        setSuccessMessage('Kuitansi berhasil diupload.')
        setTimeout(() => router.push('/non-kas-kecil'), 1500)
      } else {
        setError(res.error?.message || 'Gagal upload kuitansi')
        setLoading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SuccessModal 
        isOpen={!!successMessage} 
        message={successMessage} 
        onClose={() => setSuccessMessage('')} 
      />

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}

      {mode === 'create' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Pengeluaran <span className="text-red-500">*</span></label>
            <IndonesianDatePicker
              name="date"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
            <input type="hidden" name="amount" value={amountStr.replace(/\./g, '')} />
            <input
              type="text"
              inputMode="numeric"
              required
              value={amountStr}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Pengeluaran <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm outline-none resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lampiran Kuitansi (opsional)</label>
            <ReceiptUploader name="receipt_file" />
          </div>
        </>
      ) : (
        <>
          <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-lg mb-4 flex items-start gap-3 border border-amber-200">
            <span>🔒</span>
            <div>
              <p className="font-semibold">Klaim tidak dapat diubah</p>
              <p className="mt-1">Anda hanya dapat mengupload ulang kuitansi untuk klaim ini.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lampiran Kuitansi (opsional)</label>
            <ReceiptUploader name="receipt_file" />
          </div>
        </>
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[150px]"
        >
          {loading ? <><Spinner className="mr-2" /> Menyimpan...</> : 'Simpan Data'}
        </button>
      </div>
    </form>
  )
}
