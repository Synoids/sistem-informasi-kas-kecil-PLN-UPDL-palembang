import { getCurrentProfile } from '@/lib/services/auth.service'
import { getNonCashClaimById } from '@/lib/services/non-cash.service'
import { redirect } from 'next/navigation'
import { NonCashForm } from '../../components/NonCashForm'

export default async function UploadKuitansiNkkPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  
  const { id } = await params
  const claim = await getNonCashClaimById(id)

  if (!claim) {
    redirect('/non-kas-kecil')
  }

  // Restrict access: only the owner can upload receipt, and ADMIN cannot upload user's receipt (based on the requirement "USER: dapat melengkapi kuitansi klaim miliknya")
  if (profile.role !== 'ADMIN' && claim.user_id !== profile.id) {
    redirect('/non-kas-kecil')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Kuitansi NKK</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lampirkan bukti pengeluaran untuk klaim ini.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <NonCashForm 
          mode="upload" 
          claim={claim} 
        />
      </div>
    </div>
  )
}
