import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/services/auth.service'

export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.from('cash_sources').insert([
    {
      code: 'SYS',
      name: 'Bank / Modal Awal (Sistem)',
      type: 'SYSTEM',
      is_active: true
    }
  ]).select()

  if (error) {
    return NextResponse.json({ error })
  }

  return NextResponse.json({ success: true, data })
}
