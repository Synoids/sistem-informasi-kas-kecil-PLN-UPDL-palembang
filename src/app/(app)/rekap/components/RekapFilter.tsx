'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Download } from 'lucide-react'

export function RekapFilter({ 
  months, 
  years, 
  cashSources,
  defaultMonth,
  defaultYear,
  defaultSource,
  isAdmin
}: {
  months: { value: number, label: string }[]
  years: number[]
  cashSources: { id: string, name: string, code: string }[]
  defaultMonth: number
  defaultYear: number
  defaultSource: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [source, setSource] = useState(defaultSource)

  function handleFilter() {
    const params = new URLSearchParams()
    params.set('month', month.toString())
    params.set('year', year.toString())
    params.set('source', source)
    router.push(`/rekap?${params.toString()}`)
  }

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-4 items-end">
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
        <select 
          value={month} 
          onChange={e => setMonth(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
        <select 
          value={year} 
          onChange={e => setYear(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto flex-1 max-w-xs">
        <label className="block text-sm font-medium text-slate-700 mb-1">Sumber Dana</label>
        <select 
          value={source} 
          onChange={e => setSource(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {isAdmin && <option value="ALL">-- Konsolidasi Semua Sumber Dana --</option>}
          {cashSources.map(cs => (
            <option key={cs.id} value={cs.id}>{cs.name} ({cs.code})</option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
        <button 
          onClick={handleFilter}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Tampilkan
        </button>
        {isAdmin && source === 'ALL' && (
          <a
            href={`/api/export-excel?month=${month}&year=${year}`}
            download
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </a>
        )}
      </div>
    </div>
  )
}
