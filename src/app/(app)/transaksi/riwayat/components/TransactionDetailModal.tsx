'use client'

import { useEffect, useRef, useState } from 'react'
import { TransactionWithDetails } from '@/lib/services/transaction.service'
import { DeleteConfirmationDialog } from '../../components/DeleteConfirmationDialog'

interface TransactionDetailModalProps {
  transaction: TransactionWithDetails | null
  onClose: () => void
}

function formatRupiah(amount: number | null): string {
  if (!amount) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!transaction) return null

  const Field = ({ label, value, isBold = false }: { label: string, value: string | React.ReactNode, isBold?: boolean }) => (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className={`text-sm text-slate-800 ${isBold ? 'font-semibold' : ''}`}>{value || '—'}</dd>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">Detail Transaksi</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 overflow-y-auto">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Tanggal Transaksi" value={formatDate(transaction.date)} />
            <Field label="Sumber Dana" value={transaction.cash_source_name} />
            
            <div className="col-span-1 sm:col-span-2">
              <Field label="Nama Penerima" value={transaction.recipient_name} isBold />
            </div>
            
            <Field label="Kategori" value={transaction.category_name} />
            <Field label="Bidang / Sub Bidang" value={transaction.division_name} />
            
            <Field label="No Polisi / E-Toll" value={transaction.vehicle_number} />
            <Field label="Nominal" value={<span className="text-red-600 font-bold">{formatRupiah(transaction.amount)}</span>} />
            
            <div className="col-span-1 sm:col-span-2">
              <Field label="Deskripsi Keperluan" value={transaction.description} />
            </div>

            <Field label="Tanggal Kuitansi" value={formatDate(transaction.receipt_date)} />
            <Field label="Tanggal Penyerahan" value={formatDate(transaction.handover_date)} />

            <div className="col-span-1 sm:col-span-2 mt-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Diinput oleh:</span>
                  <span className="font-medium text-slate-700">{transaction.created_by_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Waktu Dibuat:</span>
                  <span className="font-medium text-slate-700">{formatDateTime(transaction.created_at)}</span>
                </div>
                {transaction.updated_at && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Terakhir Diubah:</span>
                    <span className="font-medium text-slate-700">{formatDateTime(transaction.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </dl>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          {transaction.receipt_file_path && (
            <a
              href={`/api/storage/receipts/${transaction.receipt_file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Lihat Kuitansi
            </a>
          )}
          {transaction.period_status === 'OPEN' && (
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
            >
              Batalkan
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
      
      {transaction && (
        <DeleteConfirmationDialog 
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          transactionId={transaction.id}
          onSuccess={() => {
            setIsDeleteDialogOpen(false)
            onClose()
          }}
        />
      )}
    </div>
  )
}
