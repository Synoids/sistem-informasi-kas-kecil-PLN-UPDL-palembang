import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

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
  const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'ADMIN').limit(1)
  const adminId = profiles![0].id

  const { data: period } = await supabase.from('accounting_periods').select('id').eq('name', 'Februari 2026').limit(1).single()
  const periodId = period!.id

  console.log('Menghapus transaksi Februari yang lama...')
  await supabase.from('transactions').delete().eq('period_id', periodId)

  // BACA EXCEL LATEST
  const filePath = 'Realisasi Kas Kecil UPDL Palembang LATEST.xlsx'
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  
  const sheet = workbook.getWorksheet('real 2026')
  
  const { data: cashSources } = await supabase.from('cash_sources').select('id, name')

  function getCategoryId(nameStr: string): string {
    const clean = nameStr.toLowerCase().trim()
    if (clean.includes('perkakas') || clean.includes('rt umum') || clean.includes('laboratorium') || clean.includes('baterai') || clean.includes('galon')) return 'f684b733-e457-4954-892a-ef9e5acc39e5'
    if (clean.includes('bbm')) return 'cb615024-4d0a-437d-8596-7989fc6cd74c'
    if (clean.includes('e-toll') || clean.includes('toll') || clean.includes('etoll')) return 'd0b14ac9-ca49-4c82-9899-de40c3b8978d'
    if (clean.includes('konsumsi') || clean.includes('makan')) return '4ebd3614-7f64-4d3c-9532-f6a42cf000ff'
    return '6dd4e167-0636-47a1-a52d-1c4065678c5f' // lain-lain
  }

  function getDivisionId(nameStr: string): string {
    const clean = nameStr.toLowerCase().trim()
    if (clean === 'jar') return '8fbc66d7-4305-4fde-aa46-96292e43921e'
    if (clean.includes('k3l')) return '6abccfc8-579b-409c-ad79-b299298331db'
    return 'a2dad56b-34c5-44fe-bdb1-65088c4e884e' // PKU fallback
  }

  function getCashSourceId(nameStr: string): string {
    if (!cashSources || cashSources.length === 0) return ''
    let clean = nameStr.toLowerCase().trim()
    if (clean === 'uang cash' || clean === 'uang  cash' || clean === '') clean = 'kas utama'
    const match = cashSources.find(c => c.name.toLowerCase().includes(clean))
    return match ? match.id : (cashSources.find(c => c.name.toLowerCase() === 'kas utama')?.id || cashSources[0].id)
  }

  let successCount = 0
  let lastSeenDate = ''

  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i)
    if (row.values && (row.values as any[]).length > 5) {
        
        let dateStr = ''
        if (row.values[1]) {
            dateStr = String(row.values[1]).toLowerCase().trim()
            lastSeenDate = dateStr
        } else {
            dateStr = lastSeenDate
        }

        const amount = Number(row.values[10] || 0)
        
        if (dateStr.includes('feb') || dateStr.includes('2026-02')) {
            if (amount <= 0 || isNaN(amount)) continue

            // Jika pengembalian kas kecil, masukkan sebagai ALLOCATION OUT ke SISTEM
            const description = String(row.values[7] || 'Tanpa Keterangan').trim()
            const sourceName = String(row.values[9] || 'Uang Cash').trim()
            const sourceId = getCashSourceId(sourceName)

            if (description.toLowerCase().includes('pengembalian kas kecil')) {
                const sysCash = cashSources?.find(c => c.type === 'SYSTEM')
                await supabase.from('allocations').insert({
                    date: '2026-02-27',
                    amount: amount,
                    description: description,
                    source_id: sourceId,
                    destination_id: sysCash?.id || sourceId,
                    period_id: periodId,
                    created_by: adminId,
                    updated_by: adminId
                })
                successCount++
                continue
            }

            const parsedDate = dateStr.includes('2026') ? dateStr.replace(/[^0-9-]/g, '') : '2026-02-15'
            let finalDateStr = '2026-02-15'
            const match = dateStr.match(/(\d{1,2})\s+feb/i)
            if (match) {
                finalDateStr = `2026-02-${match[1].padStart(2, '0')}`
            } else if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
                finalDateStr = dateStr.match(/\d{4}-\d{2}-\d{2}/)![0]
            }

            const receiver = String(row.values[3] || '').trim() || '-'
            const categoryName = String(row.values[4] || '').trim()
            const divisionName = String(row.values[8] || '').trim()
            
            const categoryId = getCategoryId(categoryName)
            const divisionId = getDivisionId(divisionName)

            const { error: insErr } = await supabase.from('transactions').insert({
                date: finalDateStr,
                amount: amount,
                description: description,
                recipient_name: receiver,
                cash_source_id: sourceId,
                category_id: categoryId,
                division_id: divisionId,
                period_id: periodId,
                created_by: adminId,
                updated_by: adminId
            })
            if (insErr) {
               console.error(`Row ${i}: Error inserting ->`, insErr.message)
            } else {
               successCount++
            }
        }
    }
  }
  
  console.log(`Berhasil memproses dan menyimpan ${successCount} transaksi Februari.`)
}

run().catch(console.error)
