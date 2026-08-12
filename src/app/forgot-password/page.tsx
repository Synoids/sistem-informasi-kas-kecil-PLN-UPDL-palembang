import { resetPasswordAction } from './actions'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { SubmitButton } from './SubmitButton'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string, success?: string }>
}) {
  const { message, success } = await searchParams

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
            <h1 className="relative z-10 text-2xl font-bold text-white tracking-tight">Pemulihan Akun</h1>
            <p className="relative z-10 text-blue-100 text-sm mt-2">Sistem Informasi Kas Kecil</p>
          </div>

          <div className="p-8">
            {success ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-800">Cek Kotak Masuk Anda</h2>
                  <p className="text-slate-600 text-sm">{success}</p>
                </div>
                <Link 
                  href="/login" 
                  className="block w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors text-center"
                >
                  Kembali ke halaman Login
                </Link>
              </div>
            ) : (
              <>
                <p className="text-slate-600 text-sm mb-6 text-center">
                  Masukkan alamat email akun Anda. Jika terdaftar, kami akan mengirimkan tautan untuk menyetel ulang kata sandi.
                </p>

                <form className="space-y-5" action={resetPasswordAction}>
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

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                    ← Kembali masuk
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
