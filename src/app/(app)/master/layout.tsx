import { getCurrentProfile } from '@/lib/services/auth.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'
import { MasterNavigation } from './MasterNavigation'

export default async function MasterLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile()
  
  if (!profile || profile.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Master Data</h2>
        <p className="text-sm text-slate-500 mt-0.5">Kelola data referensi aplikasi Kas Kecil.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <MasterNavigation />
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
