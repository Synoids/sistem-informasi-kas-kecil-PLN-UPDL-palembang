import { getCurrentProfile } from '@/lib/services/auth.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'

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
        <div className="flex overflow-x-auto border-b border-slate-200">
          <Link href="/master/fund-holders" className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-b-2 border-transparent hover:border-blue-600 transition-colors">Pemegang Dana</Link>
          <Link href="/master/categories" className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-b-2 border-transparent hover:border-blue-600 transition-colors">Kategori</Link>
          <Link href="/master/divisions" className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-b-2 border-transparent hover:border-blue-600 transition-colors">Bidang / Divisi</Link>
          <Link href="/master/cash-sources" className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-b-2 border-transparent hover:border-blue-600 transition-colors">Sumber Dana</Link>
          <Link href="/master/users" className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-b-2 border-transparent hover:border-blue-600 transition-colors">Users & Akses</Link>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
