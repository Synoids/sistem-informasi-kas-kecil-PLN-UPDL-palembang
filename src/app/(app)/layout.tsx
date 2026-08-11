import { getCurrentProfile } from '@/lib/services/auth.service'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { Header } from '@/app/components/Header'
import { ToastProvider } from '@/app/components/Toast'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  if (!profile) {
    throw new Error('Data profil tidak ditemukan di database. Pastikan tabel "profiles" sudah diisi untuk user ini.')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={profile.role} fullName={profile.full_name} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header fullName={profile.full_name} role={profile.role} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <ToastProvider />
    </div>
  )
}
