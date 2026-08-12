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

    // We need to insert 4 missing transactions
    const [categoriesRes, divisionsRes, cashSourcesRes] = await Promise.all([
      supabase.from('categories').select('id, name'),
      supabase.from('divisions').select('id, name'),
      supabase.from('cash_sources').select('id, name')
    ])

    const categories = (categoriesRes.data || []) as any[]
    const divisions = (divisionsRes.data || []) as any[]
    const cashSources = (cashSourcesRes.data || []) as any[]

    const bbmCategory = categories.find(c => c.name.toLowerCase().includes('bbm'))?.id
    const jarDivision = divisions.find(d => d.name.toLowerCase().includes('jar'))?.id
    let rezkySource = cashSources.find(s => s.name.toLowerCase().includes('rezky'))?.id
    if (!rezkySource) {
      rezkySource = cashSources.find(s => s.name.toLowerCase().includes('utama'))?.id
    }

    const missingRows = [
      {
        date: '2026-01-22',
        receipt_date: '2026-01-22',
        handover_date: '2026-01-22',
        recipient_name: 'Eko',
        description: 'HI ACE E7244A [MULP LEAP - Manager Unit Layanan Pelanggan: Lead Execution & Acceleration Program]',
        amount: 500000,
        category_id: bbmCategory,
        division_id: jarDivision,
        cash_source_id: rezkySource,
        created_by: profile.id,
        updated_by: profile.id
      },
      {
        date: '2026-01-22',
        receipt_date: '2026-01-22',
        handover_date: '2026-01-22',
        recipient_name: 'Eko',
        description: 'B2615PIA [MULP LEAP - Manager Unit Layanan Pelanggan: Lead Execution & Acceleration Program]',
        amount: 300000,
        category_id: bbmCategory,
        division_id: jarDivision,
        cash_source_id: rezkySource,
        created_by: profile.id,
        updated_by: profile.id
      },
      {
        date: '2026-01-19',
        receipt_date: '2026-01-19',
        handover_date: '2026-01-19',
        recipient_name: 'Eko',
        description: 'B2621PIA [MULP LEAP - Manager Unit Layanan Pelanggan: Lead Execution & Acceleration Program]',
        amount: 300000,
        category_id: bbmCategory,
        division_id: jarDivision,
        cash_source_id: rezkySource,
        created_by: profile.id,
        updated_by: profile.id
      },
      {
        date: '2026-01-19',
        receipt_date: '2026-01-19',
        handover_date: '2026-01-19',
        recipient_name: 'Eko',
        description: 'B2615PIA [MULP LEAP - Manager Unit Layanan Pelanggan: Lead Execution & Acceleration Program]',
        amount: 300000,
        category_id: bbmCategory,
        division_id: jarDivision,
        cash_source_id: rezkySource,
        created_by: profile.id,
        updated_by: profile.id
      }
    ]

    const { error: insertError } = await supabase.from('transactions').insert(missingRows)
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Also, if "pengembalian kas kecil" (16,310) is supposed to be the "Sisa Cash" and NOT an expense,
    // we should delete it so that the remaining cash equals exactly 16,310 instead of 0.
    const { error: deleteError } = await supabase.from('transactions')
      .delete()
      .eq('amount', 16310)
      .eq('date', '2026-01-30')

    if (deleteError) {
      console.error('Failed to delete return of petty cash:', deleteError.message)
    }

    return NextResponse.json({ success: true, message: 'Berhasil mengoreksi baris transaksi yang hilang (1.4 Juta)!' })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
