'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { IndonesianDatePicker } from '@/app/components/IndonesianDatePicker'

interface FilterProps {
  cashSources: { cash_source_id: string; name: string }[]
  categories: { id: string; name: string }[]
}

export function TransactionFilters({ cashSources, categories }: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [dateFrom, setDateFrom] = useState(searchParams.get('from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('to') ?? '')
  const [sourceId, setSourceId] = useState(searchParams.get('source') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? '')

  function applyFilters() {
    const params = new URLSearchParams()
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    if (sourceId) params.set('source', sourceId)
    if (categoryId) params.set('category', categoryId)
    router.push(`/transaksi/riwayat?${params.toString()}`)
  }

  function resetFilters() {
    setDateFrom('')
    setDateTo('')
    setSourceId('')
    setCategoryId('')
    router.push('/transaksi/riwayat')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
          <IndonesianDatePicker
            name="from_date"
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="dd/mm/yyyy"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
          <IndonesianDatePicker
            name="to_date"
            value={dateTo}
            onChange={setDateTo}
            placeholder="dd/mm/yyyy"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sumber Dana</label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua</option>
            {cashSources.map((cs) => (
              <option key={cs.cash_source_id} value={cs.cash_source_id}>{cs.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-1.5 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
