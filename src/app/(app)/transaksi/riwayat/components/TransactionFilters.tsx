'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface FilterProps {
  cashSources: { cash_source_id: string; name: string }[]
  categories: { id: string; name: string }[]
  periods: { id: string; name: string; status: string }[]
}

export function TransactionFilters({ cashSources, categories, periods }: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [periodId, setPeriodId] = useState(searchParams.get('period') ?? '')
  const [sourceId, setSourceId] = useState(searchParams.get('source') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  function applyFilters() {
    const params = new URLSearchParams()
    if (periodId) params.set('period', periodId)
    if (sourceId) params.set('source', sourceId)
    if (categoryId) params.set('category', categoryId)
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    router.push(`/transaksi/riwayat?${params.toString()}`)
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      applyFilters()
    }, 500)
    return () => clearTimeout(handler)
  }, [search, periodId, sourceId, categoryId, status])

  function resetFilters() {
    setPeriodId('')
    setSourceId('')
    setCategoryId('')
    setStatus('')
    setSearch('')
    router.push('/transaksi/riwayat')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Pencarian</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari penerima / deskripsi..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Periode</label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Periode Aktif (Default)</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.status === 'OPEN' ? '(Aktif)' : ''}</option>
            ))}
          </select>
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
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Kuitansi</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua</option>
            <option value="SUDAH ADA">Sudah Ada</option>
            <option value="BELUM ADA">Belum Ada</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="w-full px-4 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      </div>
    </div>
  )
}
