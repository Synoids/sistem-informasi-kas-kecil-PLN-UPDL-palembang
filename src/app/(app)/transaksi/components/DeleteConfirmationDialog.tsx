'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { deleteTransactionAction } from '../actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  transactionId: string
  onSuccess: () => void
}

export function DeleteConfirmationDialog({ isOpen, onClose, transactionId, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteTransactionAction(transactionId, reason || 'Dibatalkan oleh Admin')
      if (res.success) {
        onSuccess()
        onClose()
      } else {
        setError(res.error?.message || 'Gagal menghapus transaksi')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-heading font-bold">Batalkan Transaksi?</h3>
          </div>
          
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Apakah Anda yakin ingin membatalkan transaksi ini? Nominal akan di-set menjadi <strong>Rp 0</strong> dan transaksi akan dipindahkan ke Log Sampah (Void).
          </p>

          <div className="space-y-2 mb-6">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Alasan Pembatalan (Opsional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Salah input nominal, double entry..."
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all"
              rows={3}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-red-600/20 transition-all active:scale-95"
            >
              {isDeleting ? 'Membatalkan...' : 'Ya, Batalkan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
