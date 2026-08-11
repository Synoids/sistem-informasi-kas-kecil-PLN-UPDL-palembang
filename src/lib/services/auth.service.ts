import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw new Error('Supabase Error fetching profile: ' + error.message)
  }
  if (!profile) {
    throw new Error('Profile row not found for user ID: ' + user.id)
  }

  return profile
}
