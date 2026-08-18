'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface FilterProps {
  periods: { id: string; name: string; status: string }[]
}

export function NonCashFilters({ periods }: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [periodId, setPeriodId] = useState(searchParams.get('period') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  function applyFilters() {
    const params = new URLSearchParams()
    if (periodId) params.set('period', periodId)
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    router.push(`/non-kas-kecil?${params.toString()}`)
  }

  function resetFilters() {
    setPeriodId('')
    setStatus('')
    setSearch('')
    router.push('/non-kas-kecil')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Pencarian</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari deskripsi / nama..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Periode Asal</label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua Periode</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.status === 'OPEN' ? '(Aktif)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status Klaim</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="BELUM DIGANTI">Belum Diganti</option>
            <option value="SUDAH DIGANTI">Sudah Diganti</option>
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
