'use client'

import { useState } from 'react'
import { ReportData } from '@/lib/services/rekap.service'
import { TransactionWithDetails } from '@/lib/services/transaction.service'
import { TransactionDetailModal } from '../../transaksi/riwayat/components/TransactionDetailModal'
import { AllocationDetailModal } from './AllocationDetailModal'
import { getTransactionDetail, getAllocationDetail, AllocationDetail } from '../actions'

function formatRupiah(amount: number): string {
  if (amount === 0) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export function RekapTable({ data }: { data: ReportData }) {
  const [selectedTx, setSelectedTx] = useState<TransactionWithDetails | null>(null)
  const [selectedAlloc, setSelectedAlloc] = useState<AllocationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRowClick = async (type: string, referenceId: string | null) => {
    if (!referenceId) return
    
    if (type === 'TRANSACTION') {
      setIsLoading(true)
      const detail = await getTransactionDetail(referenceId)
      setIsLoading(false)
      if (detail) setSelectedTx(detail)
      else alert('Gagal memuat detail transaksi atau Anda tidak memiliki akses.')
    } else if (type === 'ALLOCATION_IN' || type === 'ALLOCATION_OUT') {
      setIsLoading(true)
      const detail = await getAllocationDetail(referenceId)
      setIsLoading(false)
      if (detail) setSelectedAlloc(detail)
      else alert('Gagal memuat detail alokasi atau Anda tidak memiliki akses.')
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto select-auto">
          {/* We use a standard table that is copy-paste friendly */}
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold border-r border-slate-200 w-28">Tanggal</th>
                <th className="px-4 py-3 font-semibold border-r border-slate-200 min-w-[200px]">Uraian / Keterangan</th>
                <th className="px-4 py-3 font-semibold border-r border-slate-200">Penerima</th>
                <th className="px-4 py-3 font-semibold border-r border-slate-200">Kategori</th>
                <th className="px-4 py-3 font-semibold border-r border-slate-200">Bidang</th>
                <th className="px-4 py-3 font-semibold border-r border-slate-200 text-right w-32">Dana Masuk (Rp)</th>
                <th className="px-4 py-3 font-semibold border-r border-slate-200 text-right w-32">Pengeluaran (Rp)</th>
                <th className="px-4 py-3 font-semibold text-right w-36">Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              


              {/* Mutasi Rows */}
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => {
                  const isClickable = row.type === 'TRANSACTION' || row.type === 'ALLOCATION_IN' || row.type === 'ALLOCATION_OUT'
                  const isSystemMutation = row.type === 'ALLOCATION_OUT' && (row.description.toLowerCase().includes('sweep') || row.description.toLowerCase().includes('tutup bulan') || row.description.toLowerCase().includes('kembali'))
                  
                  return (
                    <tr 
                      key={row.id} 
                      onClick={() => isClickable && handleRowClick(row.type, row.referenceId)}
                      className={`${isClickable ? "hover:bg-slate-50 transition-colors cursor-pointer" : ""} ${isSystemMutation ? "bg-slate-100/80 italic" : ""}`}
                      title={isClickable ? "Klik untuk melihat detail" : undefined}
                    >
                      <td className="px-4 py-2.5 border-r border-slate-200">{formatDate(row.date)}</td>
                      <td className="px-4 py-2.5 border-r border-slate-200 truncate max-w-md" title={row.description}>
                        {isSystemMutation && <span className="inline-block bg-slate-300 text-slate-700 text-xs px-2 py-0.5 rounded font-bold mr-2 not-italic">[MUTASI SISTEM]</span>}
                        {row.description}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200">{row.recipient || ''}</td>
                      <td className="px-4 py-2.5 border-r border-slate-200">{row.category === '—' ? '' : row.category}</td>
                      <td className="px-4 py-2.5 border-r border-slate-200">{row.division === '—' ? '' : row.division}</td>
                      <td className="px-4 py-2.5 border-r border-slate-200 text-right">
                        {row.inAmount > 0 ? formatRupiah(row.inAmount) : ''}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-200 text-right">
                        {row.outAmount > 0 ? formatRupiah(row.outAmount) : ''}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatRupiah(row.balance)}
                      </td>
                    </tr>
                  )
                })
              )}

              {/* Closing Balance Row */}
              <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                <td colSpan={5} className="px-4 py-3 border-r border-slate-200 text-right pr-6 text-slate-700 tracking-wide">TOTAL KESELURUHAN</td>
                <td className="px-4 py-3 border-r border-slate-200 text-right">
                  {formatRupiah(data.totalIn)}
                </td>
                <td className="px-4 py-3 border-r border-slate-200 text-right">
                  {formatRupiah(data.totalOut)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatRupiah(data.endingBalance)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Tips: Anda dapat menyorot (blok) tabel di atas, lalu copy-paste ke Excel. Baris transaksi juga dapat diklik untuk melihat detail.</span>
          {isLoading && <span className="text-blue-600 font-medium animate-pulse">Memuat detail...</span>}
        </div>
      </div>

      <TransactionDetailModal 
        transaction={selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />
      
      <AllocationDetailModal
        allocation={selectedAlloc}
        onClose={() => setSelectedAlloc(null)}
      />
    </>
  )
}
