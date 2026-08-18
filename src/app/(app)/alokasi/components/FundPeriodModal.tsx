'use client'

import { useState } from 'react'
import { fundPeriodAction } from '../actions'
import Swal from 'sweetalert2'

interface FundPeriodModalProps {
  isOpen: boolean
  onClose: () => void
  currentMainBalance: number
}

export function FundPeriodModal({ isOpen, onClose, currentMainBalance }: FundPeriodModalProps) {
  const [targetAmount, setTargetAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const parsedAmount = parseInt(targetAmount.replace(/\D/g, ''), 10)
  const requiredFund = isNaN(parsedAmount) ? 0 : parsedAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Masukkan nominal pendanaan yang valid')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    Swal.fire({
      title: 'Memproses Pendanaan...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    try {
      const result = await fundPeriodAction(parsedAmount)
      
      if (result.error) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: result.error, confirmButtonColor: '#2563eb' })
        setError(result.error)
      } else {
        Swal.fire({ 
          icon: 'success', 
          title: 'Berhasil!', 
          text: 'Pendanaan kas utama berhasil ditambahkan.',
          confirmButtonColor: '#2563eb'
        }).then(() => {
          onClose()
          setTargetAmount('')
        })
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Kesalahan Sistem', text: err.message || 'Terjadi kesalahan', confirmButtonColor: '#2563eb' })
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '')
    setTargetAmount(value ? parseInt(value, 10).toString() : '')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800">Pendanaan Periode (Funding)</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100/50 space-y-2">
            <div className="text-sm text-slate-500">Saldo Kas Utama Saat Ini</div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentMainBalance)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nominal Pendanaan dari Pusat
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
              <input
                type="text"
                value={targetAmount ? parseInt(targetAmount, 10).toLocaleString('id-ID') : ''}
                onChange={handleAmountChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder="0"
                required
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Nominal ini akan ditambahkan ke Kas Utama untuk periode aktif.
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || requiredFund <= 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                'Beri Pendanaan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
