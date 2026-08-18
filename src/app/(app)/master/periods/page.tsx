import { getAllPeriods } from '@/lib/services/period.service'
import { getCurrentProfile } from '@/lib/services/auth.service'
import { PeriodList } from './PeriodList'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Manajemen Periode',
}

export default async function PeriodsPage() {
  const profile = await getCurrentProfile()
  
  if (profile?.role !== 'ADMIN') {
    redirect('/master')
  }

  const periods = await getAllPeriods()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Periode</h1>
        <p className="text-slate-500 mt-1">Kelola pembukaan dan penutupan periode akuntansi kas kecil.</p>
      </div>

      <PeriodList periods={periods || []} />
    </div>
  )
}
