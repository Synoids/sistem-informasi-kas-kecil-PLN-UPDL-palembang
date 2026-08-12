import { updatePasswordAction } from './actions'
import { AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { SubmitButton } from './SubmitButton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  // Lakukan pengecekan sesi. Halaman ini hanya bisa diakses jika pengguna memiliki sesi aktif (baru saja login lewat token email)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?message=Sesi pemulihan tidak valid atau telah kedaluwarsa.')
  }

  return (
    <div className="flex min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      <div className="w-full max-w-md mx-auto flex flex-col justify-center px-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-700/50 mix-blend-overlay"></div>
            <div className="relative z-10 flex justify-center mb-4">
              <div className="w-14 h-14 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <Image src="/Logo_PLN.png" alt="Logo PLN" width={40} height={40} className="object-contain" />
              </div>
            </div>
            <h1 className="relative z-10 text-2xl font-bold text-white tracking-tight">Setel Ulang Sandi</h1>
            <p className="relative z-10 text-blue-100 text-sm mt-2">Buat kata sandi baru untuk akun Anda.</p>
          </div>

          <div className="p-8">
            <form className="space-y-5" action={updatePasswordAction}>
              
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Kata Sandi Baru
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm_password" className="block text-sm font-semibold text-slate-700">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={6}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className="flex items-center gap-2 text-rose-500 bg-rose-50/50 border border-rose-100 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}

              <div className="pt-2">
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
