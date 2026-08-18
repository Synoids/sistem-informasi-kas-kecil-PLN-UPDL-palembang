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
  const { data, error } = await supabase.from('allocations')
    .update({ date: '2026-01-31' })
    .eq('amount', 16310)
    .eq('date', '2026-07-31')
  
  if (error) {
    console.error('Gagal update:', error)
  } else {
    console.log('Berhasil mengupdate tanggal sweep Januari menjadi 2026-01-31')
  }
}

run().catch(console.error)
