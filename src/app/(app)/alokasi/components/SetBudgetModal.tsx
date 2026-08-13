'use client'

import { useState } from 'react'
import { setBudgetCeilingAction } from '../actions'
import { showToast } from '@/app/components/Toast'

interface SetBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  currentMainBalance: number
}

export function SetBudgetModal({ isOpen, onClose, currentMainBalance }: SetBudgetModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [targetAmountStr, setTargetAmountStr] = useState('')

  if (!isOpen) return null

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) {
      setTargetAmountStr('')
      return
    }
    setTargetAmountStr(Number(val).toLocaleString('id-ID'))
  }

  const targetAmount = Number(targetAmountStr.replace(/\./g, ''))
  const difference = targetAmount - currentMainBalance
  
  let previewText = 'Masukkan target pagu untuk melihat penyesuaian.'
  let previewColor = 'text-slate-500'
  
  if (targetAmount > 0) {
    if (difference > 0) {
      previewText = `Penyesuaian: + Rp ${difference.toLocaleString('id-ID')} (Pengisian Kas)`
      previewColor = 'text-emerald-600 font-medium'
    } else if (difference < 0) {
      previewText = `Penyesuaian: - Rp ${Math.abs(difference).toLocaleString('id-ID')} (Pengembalian Dana)`
      previewColor = 'text-rose-600 font-medium'
    } else {
      previewText = 'Tidak ada penyesuaian dana yang diperlukan.'
      previewColor = 'text-slate-500'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (targetAmount <= 0) {
      showToast('Target pagu harus lebih dari Rp 0', 'error')
      return
    }

    if (difference !== 0) {
      const formattedTarget = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(targetAmount)
      const formattedDiff = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(difference))
      
      let confirmMessage = ''
      if (difference > 0) {
        confirmMessage = `Saldo Kas Utama akan disesuaikan menjadi ${formattedTarget}. Sistem akan membuat perpindahan dana sebesar ${formattedDiff} dari Rekening Bank/Pusat ke Kas Utama. Lanjutkan?`
      } else {
        confirmMessage = `Saldo Kas Utama melebihi target sebesar ${formattedDiff}. Sistem akan membuat perpindahan dana dari Kas Utama ke Rekening Bank/Pusat. Lanjutkan?`
      }

      if (!window.confirm(confirmMessage)) {
        return
      }
    }

    setIsPending(true)
    
    try {
      const result = await setBudgetCeilingAction(targetAmount)
      
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        if ((result.data as any)?.status === 'NO_CHANGE') {
          showToast('Tidak ada penyesuaian yang diperlukan.', 'success')
        } else if ((result.data as any)?.status === 'REPLENISHED') {
          showToast('Pengisian kas berhasil dilakukan!', 'success')
        } else if ((result.data as any)?.status === 'RETURNED') {
          showToast('Pengembalian dana kas berhasil dilakukan!', 'success')
        } else {
          showToast('Pagu anggaran berhasil ditetapkan!', 'success')
        }
        onClose()
        setTargetAmountStr('')
      }
    } catch (error: any) {
      showToast('Terjadi kesalahan saat menyimpan data.', 'error')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800">Isi / Tetapkan Pagu</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100/50 space-y-2">
            <div className="text-sm text-slate-500">Saldo Kas Utama Saat Ini</div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentMainBalance)}
            </div>
            <div className="text-xs text-slate-400">*Saldo ditarik secara real-time dari sistem.</div>
          </div>

          <div>
            <label htmlFor="target_amount" className="block text-sm font-medium text-slate-700 mb-1.5">
              Target Pagu Kas Utama
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 font-medium">Rp</span>
              </div>
              <input
                id="target_amount"
                type="text"
                inputMode="numeric"
                required
                autoFocus
                value={targetAmountStr}
                onChange={handleAmountChange}
                placeholder="0"
                className="block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              />
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100">
            <div className={previewColor}>{previewText}</div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || targetAmount <= 0}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isPending ? 'Memproses...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
