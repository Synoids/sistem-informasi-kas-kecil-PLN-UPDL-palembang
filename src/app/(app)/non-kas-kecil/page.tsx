import { getCurrentProfile } from '@/lib/services/auth.service'
import { getNonCashTransactions } from '@/lib/services/non-cash.service'
import { getActivePeriod, getAllPeriods } from '@/lib/services/period.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NonCashTable } from './components/NonCashTable'
import { NonCashFilters } from './components/NonCashFilters'

export default async function NonKasKecilPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; status?: string; search?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const resolvedParams = await searchParams
  const allPeriods = (await getAllPeriods() || []) as any[]
  const activePeriod = allPeriods.find((p: any) => p.status === 'OPEN')

  const claims = await getNonCashTransactions({
    periodId: resolvedParams.period,
    status: resolvedParams.status,
    search: resolvedParams.search
  })

  // Filter based on role: USER can only see their own claims.
  const filteredClaims = profile.role === 'ADMIN' 
    ? claims 
    : claims.filter(c => c.user_id === profile.id)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Non-Kas Kecil (NKK)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola klaim pengeluaran menggunakan dana pribadi.
          </p>
        </div>
        <div className="flex gap-2">
          {activePeriod && (
            <Link
              href="/non-kas-kecil/baru"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Buat Klaim Baru
            </Link>
          )}
        </div>
      </div>

      <NonCashFilters periods={allPeriods} />

      <NonCashTable 
        claims={filteredClaims} 
        isAdmin={profile.role === 'ADMIN'}
        activePeriodId={activePeriod?.id}
        activePeriodName={activePeriod?.name}
      />
    </div>
  )
}
