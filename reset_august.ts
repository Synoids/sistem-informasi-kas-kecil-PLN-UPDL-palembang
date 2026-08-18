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
  const { data: periods } = await supabase.from('accounting_periods').select('*').eq('name', 'Agustus 2026').limit(1)
  
  if (!periods || periods.length === 0) {
    console.log('Periode Agustus 2026 tidak ditemukan')
    return
  }

  const periodId = periods[0].id
  console.log(`Mereset periode: ${periods[0].name} (ID: ${periodId})`)

  // 1. Delete all transactions
  const { error: transErr } = await supabase.from('transactions').delete().eq('period_id', periodId)
  if (transErr) console.error('Gagal hapus transaksi:', transErr)
  else console.log('Berhasil menghapus transaksi')

  // 2. Delete all allocations
  const { error: allocErr } = await supabase.from('allocations').delete().eq('period_id', periodId)
  if (allocErr) console.error('Gagal hapus alokasi:', allocErr)
  else console.log('Berhasil menghapus alokasi')

  // 3. Re-open the period
  const { error: updErr } = await supabase.from('accounting_periods').update({ status: 'OPEN' }).eq('id', periodId)
  if (updErr) console.error('Gagal membuka kembali periode:', updErr)
  else console.log('Berhasil mengubah status periode menjadi OPEN')
}

run().catch(console.error)
