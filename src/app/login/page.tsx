import { login } from './actions'
import { SubmitButton } from './components/SubmitButton'
import { AlertCircle } from 'lucide-react'
import Image from 'next/image'

import { Logo } from '@/app/components/Logo'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      {/* KIRI - SPLIT SCREEN BRANDING */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-slate-900"
        style={{ backgroundColor: '#0f172a' }}
      >
        {/* Dekorasi Latar Belakang (Glassmorphism/Gradient accents) */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full filter blur-[100px] opacity-40 animate-blob pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyan-600 rounded-full filter blur-[100px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center drop-shadow-xl">
              <Image src="/Logo_PLN.png" alt="Logo PLN" width={32} height={44} className="object-contain" />
            </div>
            <div className="h-10 w-px bg-slate-700 mx-1"></div>
            <Logo className="w-10 h-10" withText variant="dark" textClassName="text-xl" />
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight drop-shadow-sm">
            Sistem Informasi<br />Kas Kecil
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Platform pengelolaan dana operasional PLN UPDL Palembang.
          </p>
        </div>

        <div className="relative z-10 text-sm text-blue-300 font-medium tracking-wide">
          © {new Date().getFullYear()} PT PLN (Persero) UPDL Palembang
        </div>
      </div>

      {/* KANAN - FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 md:px-24 xl:px-32 relative bg-white">
        <div className="w-full max-w-[420px] mx-auto space-y-8">
          {/* Header untuk Mobile (tampil saat split screen hilang) */}
          <div className="lg:hidden flex flex-col items-center mb-8 space-y-4">
            <div className="w-16 h-20 flex items-center justify-center drop-shadow-lg">
              <Image src="/Logo_PLN.png" alt="Logo PLN" width={64} height={80} className="object-contain" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Kas Kecil PKU</h2>
              <p className="text-sm text-slate-500 mt-1">UPDL PLN Palembang</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Selamat Datang</h2>
            <p className="text-slate-500 text-sm">Masuk ke akun Anda untuk mulai mengelola kas.</p>
          </div>

          <form className="space-y-6" action={login}>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Alamat Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                  placeholder="nama@updl.pln.co.id"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Kata Sandi
                  </label>
                  <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Lupa kata sandi?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
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
  )
}
