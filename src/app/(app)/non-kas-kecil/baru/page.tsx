import { getCurrentProfile } from '@/lib/services/auth.service'
import { getActivePeriod } from '@/lib/services/period.service'
import { redirect } from 'next/navigation'
import { NonCashForm } from '../components/NonCashForm'

export default async function CreateNonKasKecilPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  
  
  const activePeriod = await getActivePeriod()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buat Klaim NKK</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ajukan klaim atas pengeluaran dinas menggunakan dana pribadi.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <NonCashForm 
          mode="create" 
          activePeriodId={activePeriod?.id} 
        />
      </div>
    </div>
  )
}
