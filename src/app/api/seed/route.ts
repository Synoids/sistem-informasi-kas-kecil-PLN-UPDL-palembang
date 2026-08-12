import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/services/auth.service'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dataPath = path.join(process.cwd(), 'scratch', 'parsed_jan_2026.json')
    const rows = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    
    const supabase = await createClient()

    const [categoriesRes, divisionsRes, cashSourcesRes] = await Promise.all([
      supabase.from('categories').select('id, name'),
      supabase.from('divisions').select('id, name'),
      supabase.from('cash_sources').select('id, name')
    ])

    const categories = categoriesRes.data || []
    const divisions = divisionsRes.data || []
    const cashSources = cashSourcesRes.data || []

    const cMap = categories.reduce((acc: any, c: any) => ({ ...acc, [c.name.toLowerCase().trim()]: c.id }), {})
    const dMap = divisions.reduce((acc: any, d: any) => ({ ...acc, [d.name.toLowerCase().trim()]: d.id }), {})
    const sMap = cashSources.reduce((acc: any, s: any) => ({ ...acc, [s.name.toLowerCase().trim()]: s.id }), {})

    const payloads = rows.map((r: any) => {
      let catId = cMap[r.category.toLowerCase().trim()]
      if (!catId && r.category.toLowerCase().includes('perkakas')) catId = categories.find((c: any) => c.name.toLowerCase().includes('perkakas'))?.id
      if (!catId) catId = categories.find((c: any) => c.name.toLowerCase() === 'lain-lain')?.id
      
      let divId = dMap[r.division.toLowerCase().trim()]
      if (!divId) divId = divisions.find((d: any) => d.name === 'PKU')?.id

      let sourceId = sMap[r.cashSource.toLowerCase().trim()]
      if (!sourceId && r.cashSource.toLowerCase().includes('uang cash')) sourceId = cashSources.find((c: any) => c.name.toLowerCase().includes('kas utama'))?.id
      if (!sourceId && r.cashSource.toLowerCase() === 'fanhar') sourceId = cashSources.find((c: any) => c.name.toLowerCase().includes('fanhar'))?.id
      if (!sourceId && r.cashSource.toLowerCase() === 'rezky') sourceId = cashSources.find((c: any) => c.name.toLowerCase().includes('rezky'))?.id
      if (!sourceId) sourceId = cashSources.find((c: any) => c.name.toLowerCase().includes('utama'))?.id

      return {
        date: r.date,
        receipt_date: r.date,
        handover_date: r.date,
        description: r.description,
        recipient_name: r.fundHolder || 'Unknown',
        amount: r.amount,
        category_id: catId,
        division_id: divId,
        cash_source_id: sourceId,
        created_by: profile.id,
        updated_by: profile.id
      }
    })

    const validPayloads = payloads.filter((p: any) => p.amount > 0)

    const { data, error } = await supabase.from('transactions').insert(validPayloads)
    
    if (error) {
      console.error('Error inserting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: validPayloads.length })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
