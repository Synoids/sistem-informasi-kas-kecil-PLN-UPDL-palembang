import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

/**
 * SERVER-ONLY ADMIN CLIENT
 * 
 * Peringatan Keras:
 * Client ini menggunakan `SUPABASE_SERVICE_ROLE_KEY` yang mem-bypass seluruh RLS.
 * JANGAN PERNAH diekspos ke klien.
 * HANYA gunakan untuk tugas administratif (seperti pembuatan Auth User).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

export const createAdminClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
