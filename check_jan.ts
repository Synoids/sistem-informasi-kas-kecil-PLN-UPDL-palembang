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
  const { data: allocsIn } = await supabase.from('allocations').select('*').gte('date', '2026-01-01').lte('date', '2026-01-31')
  console.log('January Allocations:', allocsIn)

  const { data: trans } = await supabase.from('transactions').select('*').gte('date', '2026-01-01').lte('date', '2026-01-31')
  console.log(`January Transactions Count: ${trans?.length}`)
  if (trans && trans.length > 0) {
     console.log('Sample Trans:', trans[0])
  }
}

run().catch(console.error)
