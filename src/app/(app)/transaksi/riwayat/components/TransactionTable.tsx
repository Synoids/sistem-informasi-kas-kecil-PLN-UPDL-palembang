'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TransactionDetailModal } from './TransactionDetailModal'
import { TransactionWithDetails } from '@/lib/services/transaction.service'

interface TransactionTableProps {
  transactions: TransactionWithDetails[]
  isAdmin: boolean
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

export function TransactionTable({ transactions, isAdmin }: TransactionTableProps) {
  const [selectedTx, setSelectedTx] = useState<TransactionWithDetails | null>(null)

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        
        {/* DESKTOP VIEW (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3 w-32">Tanggal</th>
                <th className="px-5 py-3 w-40">Sumber Dana</th>
                <th className="px-5 py-3 min-w-[250px]">Keperluan</th>
                <th className="px-5 py-3 w-48">Kategori</th>
                <th className="px-5 py-3 w-36">Administrasi</th>
                <th className="px-5 py-3 text-right w-40">Nominal</th>
                <th className="px-5 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 align-top">
                      <div className="font-medium text-slate-700">{formatDate(tx.date)}</div>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <div className="text-slate-700 truncate max-w-[150px]" title={tx.cash_source_name || ''}>
                        {tx.cash_source_name}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top whitespace-normal">
                      <div className="font-semibold text-slate-800">{tx.recipient_name || '—'}</div>
                      {tx.description && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2" title={tx.description}>
                          {tx.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">
                      <div className="font-medium text-slate-700 truncate">{tx.category_name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {tx.division_name}
                        </span>
                        {tx.vehicle_number && (
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-1 border border-slate-200 rounded">
                            {tx.vehicle_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top text-xs text-slate-500">
                      <div>Kw: {formatDate(tx.receipt_date)}</div>
                      <div className="mt-0.5">Sh: {formatDate(tx.handover_date)}</div>
                    </td>
                    <td className="px-5 py-3 align-top text-right">
                      <div className="font-semibold text-red-600 tabular-nums">
                        {formatRupiah(tx.amount)}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top text-center space-y-2" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <Link
                          href={`/transaksi/${tx.id}/edit`}
                          className="block w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors bg-white border border-slate-200 rounded px-2 py-1"
                        >
                          Edit
                        </Link>
                      )}
                      {!isAdmin && (
                        <span className="block w-full text-center text-xs font-medium text-slate-400">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW (Visible only on small screens) */}
        <div className="md:hidden divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada transaksi pada periode ini.
            </div>
          ) : (
            transactions.map((tx) => (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)}
                className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">{formatDate(tx.date)}</div>
                    <div className="font-semibold text-slate-800">{tx.recipient_name || 'Tanpa Penerima'}</div>
                  </div>
                  <div className="font-bold text-red-600 tabular-nums">
                    {formatRupiah(tx.amount)}
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 line-clamp-2">
                  {tx.description || <span className="italic opacity-50">Tanpa deskripsi</span>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {tx.category_name}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                    {tx.division_name}
                  </span>
                  {tx.vehicle_number && (
                    <span className="inline-flex items-center font-mono text-[10px] text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">
                      {tx.vehicle_number}
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/transaksi/${tx.id}/edit`}
                      className="flex-1 text-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Modal Detail */}
      <TransactionDetailModal 
        transaction={selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />
    </>
  )
}
