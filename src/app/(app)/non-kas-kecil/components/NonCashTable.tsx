'use client'

import { useState } from 'react'
import { NonCashTransactionWithDetails } from '@/lib/services/non-cash.service'
import { reimburseNonCashAction } from '../actions'

interface NonCashTableProps {
  claims: NonCashTransactionWithDetails[]
  isAdmin: boolean
  activePeriodId?: string
  activePeriodName?: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export function NonCashTable({ claims, isAdmin, activePeriodId, activePeriodName }: NonCashTableProps) {
  const [reimbursingId, setReimbursingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReimburse(claim: NonCashTransactionWithDetails) {
    if (!activePeriodId) {
      alert('Tidak ada periode OPEN saat ini. Reimbursement tidak dapat dilakukan.')
      return
    }

    const confirmReimburse = confirm(
      `Apakah Anda yakin ingin melakukan reimbursement untuk klaim ini?\n\n` +
      `Pemilik: ${claim.profiles.full_name}\n` +
      `Nominal: Rp${formatRupiah(claim.amount)}\n` +
      `Periode Asal: ${claim.accounting_periods.name}\n\n` +
      `PENTING: Dana akan ditarik dari Cash Source MAIN dan dicatat pada periode berjalan (${activePeriodName}).`
    )

    if (!confirmReimburse) return

    setReimbursingId(claim.id)
    setError(null)
    
    const res = await reimburseNonCashAction(claim.id, activePeriodId)
    if (!res.success) {
      setError(res.error?.message || 'Gagal reimburse')
      alert(`Gagal: ${res.error?.message || 'Unknown error'}`)
    }
    
    setReimbursingId(null)
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
            <tr>
              <th className="px-5 py-3 w-32">Tanggal</th>
              <th className="px-5 py-3 min-w-[200px]">Deskripsi / Pemilik</th>
              <th className="px-5 py-3 w-40">Periode Asal</th>
              <th className="px-5 py-3 w-32">Kuitansi</th>
              <th className="px-5 py-3 text-right w-40">Nominal</th>
              <th className="px-5 py-3 text-center w-36">Status</th>
              <th className="px-5 py-3 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  Tidak ada klaim NKK yang ditemukan.
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 align-top">
                    <div className="font-medium text-slate-700">{formatDate(claim.date)}</div>
                  </td>
                  <td className="px-5 py-3 align-top whitespace-normal">
                    <div className="font-semibold text-slate-800">{claim.profiles.full_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2" title={claim.description}>
                      {claim.description}
                    </div>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {claim.accounting_periods.name}
                    </span>
                  </td>
                  <td className="px-5 py-3 align-top">
                    {claim.receipt_file_path ? (
                      <a 
                        href={`/api/storage/receipts/${claim.receipt_file_path}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Lihat Kuitansi
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada</span>
                    )}
                  </td>
                  <td className="px-5 py-3 align-top text-right">
                    <div className="font-semibold text-red-600 tabular-nums">
                      {formatRupiah(claim.amount)}
                    </div>
                  </td>
                  <td className="px-5 py-3 align-top text-center">
                    {claim.status === 'SUDAH DIGANTI' ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Sudah Diganti
                        </span>
                        {claim.reimbursed_at && (
                          <span className="text-[10px] text-slate-400 mt-1">
                            {formatDate(claim.reimbursed_at.split('T')[0])}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        Belum Diganti
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 align-top text-center">
                    {claim.status === 'BELUM DIGANTI' && isAdmin && (
                      <button
                        onClick={() => handleReimburse(claim)}
                        disabled={reimbursingId === claim.id}
                        className="block w-full text-center text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded px-2 py-1.5 shadow-sm disabled:opacity-50"
                      >
                        {reimbursingId === claim.id ? 'Memproses...' : 'Reimburse'}
                      </button>
                    )}
                    {claim.status === 'SUDAH DIGANTI' && (
                       <span className="text-xs text-slate-400">—</span>
                    )}
                    {claim.status === 'BELUM DIGANTI' && !isAdmin && (
                      <a
                        href={`/non-kas-kecil/${claim.id}/edit`}
                        className="block w-full text-center text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-blue-300 transition-colors rounded px-2 py-1.5 shadow-sm"
                      >
                        Upload Kuitansi
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
