'use client'

import { useState } from 'react'
import { Period } from '@/lib/services/period.service'
import { useRouter } from 'next/navigation'
import { openPeriodAction, closePeriodAction, fundPeriodActionServer, getClosingWarningsAction } from './actions'
import { SuccessModal } from '@/app/components/SuccessModal'
import { Spinner } from '@/app/components/Spinner'

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

export function PeriodList({ periods }: { periods: Period[] }) {
  const [isOpening, setIsOpening] = useState(false)
  const [fundingAmount, setFundingAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  const activePeriod = periods.find(p => p.status === 'OPEN')
  const historicalPeriods = periods.filter(p => p.status === 'CLOSED')

  async function handleOpenPeriod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const res = await openPeriodAction(formData)
    if (res.error) {
      setError(res.error)
    } else {
      setIsOpening(false)
      setSuccessMessage('Periode berhasil dibuka!')
      router.refresh()
    }
  }

  async function handleFundPeriod(periodId: string) {
    if (!fundingAmount) return
    setError(null)
    setLoadingId('fund')
    const res = await fundPeriodActionServer(periodId, Number(fundingAmount))
    if (res.error) {
      setError(res.error)
    } else {
      setFundingAmount('')
      setSuccessMessage('Pendanaan berhasil ditambahkan!')
      router.refresh()
    }
    setLoadingId(null)
  }

  async function handleClosePeriod(periodId: string) {
    setError(null)
    setLoadingId('close')
    
    try {
      const warnings = await getClosingWarningsAction(periodId)
      let warningMsg = `Tutup ${activePeriod?.name}?\n\nSisa dana operasional akan dikembalikan ke Pusat (Sweep).\n`
      
      if (warnings.missingReceipts > 0 || warnings.pendingReimbursements > 0) {
        warningMsg += `\nPERHATIAN:\n`
        if (warnings.missingReceipts > 0) warningMsg += `- Terdapat ${warnings.missingReceipts} transaksi tanpa kuitansi.\n`
        if (warnings.pendingReimbursements > 0) warningMsg += `- Terdapat ${warnings.pendingReimbursements} klaim Non Kas Kecil belum diganti.\n`
        warningMsg += `\nData administrasi tersebut tetap dapat dikelola setelah periode ditutup, tetapi mutasi finansial akan dikunci secara mutlak.\n`
      }
      
      warningMsg += `\nLanjutkan Tutup Bulan?`

      if (!confirm(warningMsg)) {
        setLoadingId(null)
        return
      }

      const res = await closePeriodAction(periodId)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccessMessage('Periode berhasil ditutup dan sisa dana telah di-sweep!')
        router.refresh()
      }
    } catch (err: any) {
      setError('Gagal memeriksa data periode')
    }
    
    setLoadingId(null)
  }

  return (
    <div className="space-y-8">
      <SuccessModal 
        isOpen={!!successMessage} 
        message={successMessage} 
        onClose={() => setSuccessMessage('')} 
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Active Period Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Periode Aktif</h2>
          {!activePeriod && !isOpening && (
            <button 
              onClick={() => setIsOpening(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Buka Periode Baru
            </button>
          )}
        </div>

        {isOpening && (
          <form onSubmit={handleOpenPeriod} className="bg-white p-6 rounded-lg border border-slate-200 mb-6 shadow-sm">
            <h3 className="font-medium mb-4">Buka Periode Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Periode</label>
                <input required type="text" name="name" placeholder="Agustus 2026" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                <input required type="date" name="start_date" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Akhir</label>
                <input required type="date" name="end_date" className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={loadingId === 'open'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {loadingId === 'open' ? <><Spinner className="mr-2" /> Memproses...</> : 'Buka Periode'}
              </button>
              <button type="button" onClick={() => setIsOpening(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors">Batal</button>
            </div>
          </form>
        )}

        {activePeriod ? (
          <div className="bg-white border-l-4 border-l-blue-500 rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-800">{activePeriod.name}</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">OPEN</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(activePeriod.start_date)} - {formatDate(activePeriod.end_date)}
                </p>
              </div>
              
              <button 
                onClick={() => handleClosePeriod(activePeriod.id)}
                disabled={loadingId === 'close'}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center min-w-[130px] justify-center"
              >
                {loadingId === 'close' ? <><Spinner className="mr-2" /> Memproses...</> : 'Tutup Bulan'}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Pendanaan (Funding)</h4>
              <div className="flex gap-2 max-w-md">
                <input 
                  type="text" 
                  value={fundingAmount ? new Intl.NumberFormat('id-ID').format(Number(fundingAmount)) : ''}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '')
                    setFundingAmount(rawValue)
                  }}
                  placeholder="Nominal Pagu..." 
                  className="flex-1 px-3 py-2 border rounded-md text-sm" 
                />
                <button 
                  onClick={() => handleFundPeriod(activePeriod.id)}
                  disabled={loadingId === 'fund' || !fundingAmount}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors flex items-center min-w-[140px] justify-center"
                >
                  {loadingId === 'fund' ? <><Spinner className="mr-2" /> Memproses...</> : 'Beri Pendanaan'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Hanya dilakukan 1x per periode. Mengisi pagu dari pusat ke Kas Utama.</p>
            </div>
          </div>
        ) : (
          !isOpening && (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-8 text-center">
              <p className="text-slate-500">Belum ada periode aktif saat ini.</p>
            </div>
          )
        )}
      </section>

      {/* Historical Periods */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Riwayat Periode</h2>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600">Nama Periode</th>
                <th className="px-6 py-3 font-medium text-slate-600">Tanggal</th>
                <th className="px-6 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historicalPeriods.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada riwayat periode.
                  </td>
                </tr>
              )}
              {historicalPeriods.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500">
                      {formatDate(p.start_date)} - {formatDate(p.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
