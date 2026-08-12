'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || password.length < 6) {
    return redirect('/reset-password?message=Kata sandi minimal 6 karakter.')
  }

  if (password !== confirmPassword) {
    return redirect('/reset-password?message=Konfirmasi kata sandi tidak cocok.')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return redirect(`/reset-password?message=Gagal mengubah kata sandi: ${error.message}`)
  }

  // Setelah berhasil, langsung redirect ke halaman utama (Dashboard) karena user sudah memiliki sesi valid, atau ke halaman sukses.
  return redirect('/?success=Kata sandi berhasil diubah.')
}
