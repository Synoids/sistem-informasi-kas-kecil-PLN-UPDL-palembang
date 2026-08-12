'use client'

import { useEffect, useRef } from 'react'
import { AllocationDetail } from '../actions'

interface AllocationDetailModalProps {
  allocation: AllocationDetail | null
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

export function AllocationDetailModal({ allocation, onClose }: AllocationDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!allocation) return null

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
          <h3 className="text-lg font-semibold text-slate-800">Detail Alokasi Dana</h3>
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
            <Field label="Tanggal" value={formatDate(allocation.date)} />
            <Field label="Nominal" value={<span className="text-green-600 font-bold">{formatRupiah(allocation.amount)}</span>} />
            
            <Field label="Sumber Dana" value={allocation.source_name} isBold />
            <Field label="Tujuan Dana" value={allocation.destination_name} isBold />
            
            <div className="col-span-1 sm:col-span-2">
              <Field label="Keterangan" value={allocation.description} />
            </div>

            <div className="col-span-1 sm:col-span-2 mt-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Diinput oleh:</span>
                  <span className="font-medium text-slate-700">{allocation.created_by_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Waktu Dibuat:</span>
                  <span className="font-medium text-slate-700">{formatDateTime(allocation.created_at)}</span>
                </div>
              </div>
            </div>
          </dl>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
