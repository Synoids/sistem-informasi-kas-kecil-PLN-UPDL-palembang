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
  const { data: allocs } = await supabase.from('allocations').select('*').eq('amount', 16310)
  console.log('Allocations with 16310:', allocs)

  const { data: trans } = await supabase.from('transactions').select('*').eq('amount', 16310)
  console.log('Transactions with 16310:', trans)
}

run().catch(console.error)
