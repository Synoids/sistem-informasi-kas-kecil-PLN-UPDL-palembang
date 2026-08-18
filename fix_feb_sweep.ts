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
    .update({ date: '2026-02-28' })
    .eq('amount', 12280)
    .eq('period_id', '35e7bb27-23c1-4f6c-b5e0-60f1005f4bfc')
    .eq('description', 'Sweep Closing Return')
  
  if (error) {
    console.error('Gagal update:', error)
  } else {
    console.log('Berhasil mengupdate tanggal sweep Februari menjadi 2026-02-28')
  }
}

run().catch(console.error)
