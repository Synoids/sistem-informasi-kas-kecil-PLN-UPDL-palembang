'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    return redirect('/forgot-password?message=Alamat email wajib diisi')
  }

  const supabase = await createClient()

  // DO NOT use admin client here. Normal supabase auth client handles password resets.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Determine the host dynamically or rely on NEXT_PUBLIC_SITE_URL if available
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    // If rate limit error, show generic error
    if (error.status === 429) {
      return redirect('/forgot-password?message=Terlalu banyak permintaan. Silakan coba beberapa saat lagi.')
    }
    // DO NOT expose raw error to prevent enumeration. Just fall through.
  }

  // Always return the exact same generic success message regardless of whether the email exists.
  return redirect('/forgot-password?success=Permintaan reset telah diproses. Jika email tersebut terdaftar di sistem, instruksi pemulihan akan dikirim ke alamat tersebut. Pastikan alamat email yang dimasukkan sudah benar dan periksa folder Spam/Junk.')
}
