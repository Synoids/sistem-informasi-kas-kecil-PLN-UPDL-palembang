import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/services/auth.service'

export async function GET() {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await createClient()

    // 1. Get Cash Sources
    const { data, error: csError } = await supabase.from('cash_sources').select('id, name')
    if (csError) throw csError
    const cashSources: any[] = data || []
    const modalAwal = cashSources.find(c => c.name.toLowerCase().includes('modal awal') || c.name.toLowerCase().includes('sistem'))
    const kasUtama = cashSources.find(c => c.name.toLowerCase().includes('kas utama'))

    if (!modalAwal || !kasUtama) {
      return NextResponse.json({ error: 'System cash sources not found' }, { status: 404 })
    }

    // 2. Delete existing January 2026 allocations from Modal Awal just in case
    await supabase.from('allocations')
      .delete()
      .eq('source_id', modalAwal.id)
      .eq('destination_id', kasUtama.id)
      .gte('date', '2026-01-01')
      .lte('date', '2026-01-31')

    // 3. Inject Allocation for January 1st, 2026 with 80 Juta
    const payload = {
      date: '2026-01-01',
      source_id: modalAwal.id,
      destination_id: kasUtama.id,
      amount: 80000000,
      description: 'Pagu Anggaran Awal Januari 2026',
      created_by: profile.id,
      updated_by: profile.id
    }

    const { error: insertError } = await supabase.from('allocations').insert(payload)
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Berhasil mengoreksi dan menyuntikkan Saldo 80 Juta untuk Januari 2026!' })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
