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
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
const supabaseClient = createClient(supabaseUrl, anonKey)

async function run() {
  const dummyEmail = 'temp_admin_import@updl.co.id'
  const dummyPassword = 'Password123!'
  
  // Create dummy user
  console.log('Creating dummy user...')
  const { data: user, error: userErr } = await supabaseAdmin.auth.admin.createUser({
    email: dummyEmail,
    password: dummyPassword,
    email_confirm: true
  })
  
  if (userErr && !userErr.message.includes('already exists')) {
     console.error('Error creating user:', userErr)
     return
  }

  // Log in as dummy user
  console.log('Logging in...')
  const { data: authData, error: authErr } = await supabaseClient.auth.signInWithPassword({
    email: dummyEmail,
    password: dummyPassword
  })
  
  if (authErr) {
    console.error('Auth error:', authErr)
    return
  }

  console.log('Fetching categories and divisions...')
  const { data: cats } = await supabaseClient.from('categories').select('*')
  console.log('Categories:', cats)

  const { data: divs } = await supabaseClient.from('divisions').select('*')
  console.log('Divisions:', divs)

  // Cleanup
  console.log('Deleting dummy user...')
  if (user?.user) {
    await supabaseAdmin.auth.admin.deleteUser(user.user.id)
  }
}

run().catch(console.error)
