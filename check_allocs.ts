import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: sysCash } = await supabase.from('cash_sources').select('id').eq('type', 'SYSTEM').limit(1).single()
  const { data: mainCash } = await supabase.from('cash_sources').select('id').eq('type', 'MAIN').limit(1).single()
  
  const { data: period } = await supabase.from('accounting_periods').select('id').eq('name', 'Februari 2026').limit(1).single()

  const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'ADMIN').limit(1)
  const adminId = profiles![0].id

  const { error: fundErr } = await supabase.from('allocations').insert({
    date: '2026-02-01',
    source_id: sysCash!.id,
    destination_id: mainCash!.id,
    amount: 80000000,
    description: 'Pendanaan Periode',
    period_id: period!.id,
    created_by: adminId,
    updated_by: adminId
  })
  
  if (fundErr) console.error('Gagal mendanai:', fundErr)
  else console.log('Berhasil mendanai periode Februari 2026')
}

run().catch(console.error)
