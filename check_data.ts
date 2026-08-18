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
  const { data: cats, error: catErr } = await supabase.from('categories').select('*')
  console.log('Categories:', cats, 'Error:', catErr)
  
  const { data: divs, error: divErr } = await supabase.from('divisions').select('*')
  console.log('Divisions:', divs, 'Error:', divErr)
  
  const { data: cash } = await supabase.from('cash_sources').select('*')
  console.log('Cash Sources:', cash)
}

run().catch(console.error)
