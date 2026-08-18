import * as fs from 'fs'
import ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'

// Parse .env.local
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Utility function
function parseExcelDate(dateVal: any): string | null {
  if (!dateVal) return null
  
  if (typeof dateVal === 'string') {
    // Basic Indonesian date parsing "27 Februari 2026" -> "2026-02-27"
    const months: Record<string, string> = {
      'januari': '01', 'jan': '01',
      'februari': '02', 'feb': '02',
      'maret': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'mei': '05',
      'juni': '06', 'jun': '06',
      'juli': '07', 'jul': '07',
      'agustus': '08', 'agt': '08', 'agu': '08',
      'september': '09', 'sep': '09',
      'oktober': '10', 'okt': '10',
      'november': '11', 'nov': '11',
      'desember': '12', 'des': '12'
    }
    const cleanStr = dateVal.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
    const parts = cleanStr.split(' ')
    if (parts.length >= 3) {
      let d = parseInt(parts[0])
      let m = months[parts[1]] || '01'
      let y = parseInt(parts[2])
      if (!isNaN(d) && !isNaN(y)) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
    }
    return null
  }
  return null
}

async function run() {
  // 1. Dapatkan/Buka Periode Februari 2026
  let periodId = ''
  
  const { data: existingPeriod } = await supabase
    .from('accounting_periods')
    .select('id')
    .eq('name', 'Februari 2026')
    .maybeSingle()

  if (existingPeriod) {
    periodId = existingPeriod.id
    console.log('Periode Februari 2026 sudah ada, ID:', periodId)
  } else {
    // Dapatkan sembarang user admin untuk created_by
    const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'ADMIN').limit(1)
    if (!profiles || profiles.length === 0) throw new Error('No admin user found')
    const adminId = profiles[0].id

    const { data: newPeriod, error: periodErr } = await supabase
      .from('accounting_periods')
      .insert({
        name: 'Februari 2026',
        start_date: '2026-02-01',
        end_date: '2026-02-28',
        status: 'OPEN',
        created_by: adminId,
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (periodErr) throw periodErr
    periodId = newPeriod.id
    console.log('Berhasil membuat Periode Februari 2026, ID:', periodId)
    
    // FUND THE PERIOD (80.000.000) directly (bypassing RPC)
    const { data: sysCash } = await supabase.from('cash_sources').select('id').eq('type', 'SYSTEM').limit(1).single()
    const { data: mainCash } = await supabase.from('cash_sources').select('id').eq('type', 'MAIN').limit(1).single()
    
    if (sysCash && mainCash) {
      const { error: fundErr } = await supabase.from('allocations').insert({
        date: '2026-02-01',
        source_id: sysCash.id,
        destination_id: mainCash.id,
        amount: 80000000,
        description: 'Pendanaan Periode',
        period_id: periodId,
        created_by: adminId,
        updated_by: adminId
      })
      if (fundErr) console.error('Gagal mendanai periode:', fundErr.message)
      else console.log('Berhasil mendanai periode dengan 80 Juta.')
    }
  }

  // 2. Persiapkan Data Referensi (Kategori, Bidang, Kas)
  const { data: cashSources } = await supabase.from('cash_sources').select('id, name')

  function getCategoryId(nameStr: string): string {
    const clean = nameStr.toLowerCase().trim()
    if (clean.includes('perkakas') || clean.includes('rt umum')) return 'f684b733-e457-4954-892a-ef9e5acc39e5'
    if (clean.includes('bbm')) return 'cb615024-4d0a-437d-8596-7989fc6cd74c'
    if (clean.includes('e-toll') || clean.includes('toll')) return 'd0b14ac9-ca49-4c82-9899-de40c3b8978d'
    if (clean.includes('konsumsi')) return '4ebd3614-7f64-4d3c-9532-f6a42cf000ff'
    return '6dd4e167-0636-47a1-a52d-1c4065678c5f' // lain-lain
  }

  function getDivisionId(nameStr: string): string {
    const clean = nameStr.toLowerCase().trim()
    if (clean === 'jar') return '8fbc66d7-4305-4fde-aa46-96292e43921e'
    if (clean.includes('k3l')) return '6abccfc8-579b-409c-ad79-b299298331db'
    return 'a2dad56b-34c5-44fe-bdb1-65088c4e884e' // PKU fallback
  }

  function getCashSourceId(nameStr: string): string | null {
    if (!cashSources || cashSources.length === 0) return null
    let clean = nameStr.toLowerCase().trim()
    if (clean === 'uang cash') clean = 'kas utama'
    const match = cashSources.find(c => c.name.toLowerCase().includes(clean))
    return match ? match.id : (cashSources.find(c => c.name.toLowerCase() === 'kas utama')?.id || cashSources[0].id)
  }

  const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'ADMIN').limit(1)
  const adminId = profiles![0].id

  // 3. Baca Excel
  const filePath = 'Realisasi Kas Kecil UPDL Palembang.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  
  let insertedCount = 0
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values && row.values[1]) {
      const dateRaw = String(row.values[1]).toLowerCase()
      if (dateRaw.includes('februari') || dateRaw.includes('feb ')) {
        const parsedDate = parseExcelDate(dateRaw)
        if (!parsedDate) {
          console.log(`Row ${i}: Format tanggal gagal diparse -> ${dateRaw}`)
          continue
        }
        
        const sourceName = row.values[2] ? String(row.values[2]) : 'Uang Cash'
        const recipientName = row.values[3] ? String(row.values[3]) : String(row.values[2] || 'Tanpa Nama')
        const categoryName = row.values[4] ? String(row.values[4]) : 'lain-lain'
        const vehicleNumber = row.values[5] ? String(row.values[5]) : null
        const desc = row.values[7] ? String(row.values[7]) : ''
        const divisionName = row.values[8] ? String(row.values[8]) : 'PKU' // Fallback to PKU
        const amount = Number(row.values[10] || 0)
        
        if (amount <= 0 || isNaN(amount)) {
           // Maybe a balance row or string
           continue
        }

        const transDate = parsedDate
        const sourceId = getCashSourceId(sourceName)
        const categoryId = getCategoryId(categoryName)
        const divisionId = getDivisionId(divisionName)

        // Insert Transaction directly bypassing RLS / RPC since this is service_role
        const { error: insErr } = await supabase.from('transactions').insert({
          date: transDate,
          cash_source_id: sourceId,
          recipient_name: recipientName,
          category_id: categoryId,
          vehicle_number: vehicleNumber,
          division_id: divisionId,
          amount: amount,
          description: desc,
          receipt_date: transDate,
          handover_date: transDate,
          period_id: periodId,
          created_by: adminId,
          updated_by: adminId,
          receipt_status: 'BELUM ADA'
        })

        if (insErr) {
          console.error(`Row ${i}: Error inserting ->`, insErr.message)
        } else {
          insertedCount++
        }
      }
    }
  }

  console.log(`Berhasil memproses dan menyimpan ${insertedCount} transaksi Februari.`)
}

run().catch(console.error)
