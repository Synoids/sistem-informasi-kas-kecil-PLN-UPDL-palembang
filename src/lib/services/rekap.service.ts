import { createClient } from '@/lib/supabase/server'
import { getAccessibleCashSources } from './cash-source.service'
import { getCurrentProfile } from './auth.service'

export interface ReportRow {
  id: string
  date: string
  description: string
  recipient: string | null
  category: string
  division: string
  inAmount: number
  outAmount: number
  balance: number
  isInternalTransfer: boolean
  type: 'OPENING' | 'TRANSACTION' | 'ALLOCATION_IN' | 'ALLOCATION_OUT' | 'CLOSING'
  referenceId: string | null
}

export interface ReportData {
  openingBalance: number
  totalIn: number
  totalOut: number
  totalBelanja: number
  totalSweep: number
  endingBalance: number
  isClosed: boolean
  rows: ReportRow[]
}

export async function getRekapReport(
  month: number, // 1-12
  year: number,
  cashSourceId: string // 'ALL' or UUID
): Promise<ReportData> {
  const supabase = await createClient()

  // 1. Resolve period (Half-open logic via dates)
  const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`
  // Get last day of the month
  const endDate = new Date(year, month, 0)
  const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  // 2. Fetch Initial Data Concurrently
  const [accessibleSources, profile, { data: periodMatch }] = await Promise.all([
    getAccessibleCashSources(),
    getCurrentProfile(),
    supabase.from('accounting_periods')
      .select('status')
      .gte('start_date', startDateStr)
      .lte('start_date', endDateStr)
      .limit(1)
      .maybeSingle()
  ])

  const accessibleIds = accessibleSources.map((s) => s.cash_source_id)

  const isConsolidated = cashSourceId === 'ALL'
  let targetSourceIds: string[] = []

  if (isConsolidated) {
    if (profile?.role !== 'ADMIN') {
      throw new Error('Anda tidak memiliki akses ke laporan konsolidasi.')
    }
    targetSourceIds = accessibleIds
  } else {
    if (!accessibleIds.includes(cashSourceId)) {
      throw new Error('Anda tidak memiliki akses ke sumber dana ini.')
    }
    targetSourceIds = [cashSourceId]
  }

  const isClosed = (periodMatch as any)?.status === 'CLOSED'

  if (targetSourceIds.length === 0) {
    return {
      openingBalance: 0,
      totalIn: 0,
      totalOut: 0,
      totalBelanja: 0,
      totalSweep: 0,
      endingBalance: 0,
      isClosed,
      rows: []
    }
  }

  // 3. Fetch Data BEFORE Period (For Opening Balance)
  const [allocInPast, allocOutPast, transOutPast] = await Promise.all([
    supabase
      .from('allocations')
      .select('amount, source_id, destination_id')
      .in('destination_id', targetSourceIds)
      .lt('date', startDateStr),
    supabase
      .from('allocations')
      .select('amount, source_id, destination_id')
      .in('source_id', targetSourceIds)
      .lt('date', startDateStr),
    supabase
      .from('transactions')
      .select('amount')
      .in('cash_source_id', targetSourceIds)
      .lt('date', startDateStr)
  ])

  let openingBalance = 0

  // Past Allocation IN
  for (const row of (allocInPast.data || []) as any[]) {
    // If consolidated, check if it's an internal transfer (both source and dest are in targetSourceIds)
    const isInternal = isConsolidated && targetSourceIds.includes(row.source_id) && targetSourceIds.includes(row.destination_id)
    if (!isInternal) {
      openingBalance += (row.amount || 0)
    }
  }

  // Past Allocation OUT
  for (const row of (allocOutPast.data || []) as any[]) {
    const isInternal = isConsolidated && targetSourceIds.includes(row.source_id) && targetSourceIds.includes(row.destination_id)
    if (!isInternal) {
      openingBalance -= (row.amount || 0)
    }
  }

  // Past Transactions OUT
  for (const row of (transOutPast.data || []) as any[]) {
    openingBalance -= (row.amount || 0)
  }

  // 4. Fetch Period Data
  const [allocInPeriod, allocOutPeriod, transPeriod] = await Promise.all([
    supabase
      .from('allocations')
      .select('id, date, amount, description, source_id, destination_id, source:cash_sources!allocations_source_id_fkey(name)')
      .in('destination_id', targetSourceIds)
      .gte('date', startDateStr)
      .lte('date', endDateStr),
      
    supabase
      .from('allocations')
      .select('id, date, amount, description, source_id, destination_id, dest:cash_sources!allocations_destination_id_fkey(name)')
      .in('source_id', targetSourceIds)
      .gte('date', startDateStr)
      .lte('date', endDateStr),
      
    supabase
      .from('transactions')
      .select('id, date, amount, description, recipient_name, category:categories(name), division:divisions(name)')
      .in('cash_source_id', targetSourceIds)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
  ])

  let reportRows: ReportRow[] = []

  // Period Allocation IN
  for (const item of (allocInPeriod.data || []) as any[]) {
    const isInternal = isConsolidated && targetSourceIds.includes(item.source_id) && targetSourceIds.includes(item.destination_id)
    if (isInternal) continue // Do not show internal transfer twice in consolidated report

    const sourceName = (item.source as any)?.name || 'Unknown Source'
    const desc = item.description ? `Dari ${sourceName} - ${item.description}` : `Dropping/Transfer dari ${sourceName}`

    reportRows.push({
      id: `alloc_in_${item.id}`,
      date: item.date,
      description: item.description || 'Alokasi Dana Masuk',
      recipient: '—',
      category: '—',
      division: '—',
      inAmount: item.amount,
      outAmount: 0,
      balance: 0,
      isInternalTransfer: true,
      type: 'ALLOCATION_IN',
      referenceId: item.id
    })
  }

  // Period Allocation OUT
  for (const item of (allocOutPeriod.data || []) as any[]) {
    const isInternal = isConsolidated && targetSourceIds.includes(item.source_id) && targetSourceIds.includes(item.destination_id)
    if (isInternal) continue // Do not show internal transfer twice in consolidated report

    const destName = (item.dest as any)?.name || 'Unknown Destination'
    const desc = item.description ? `Ke ${destName} - ${item.description}` : `Transfer Kas ke ${destName}`

    reportRows.push({
      id: `alloc_out_${item.id}`,
      date: item.date,
      description: item.description || 'Mutasi Keluar',
      recipient: '—',
      category: '—',
      division: '—',
      inAmount: 0,
      outAmount: item.amount,
      balance: 0,
      isInternalTransfer: true,
      type: 'ALLOCATION_OUT',
      referenceId: item.id
    })
  }

  // Period Transactions
  for (const item of (transPeriod.data || []) as any[]) {
    const categoryName = (item.category as any)?.name || '—'
    const divisionName = (item.division as any)?.name || '—'

    reportRows.push({
      id: `trans_${item.id}`,
      date: item.date,
      description: item.description || '—',
      recipient: item.recipient_name,
      category: categoryName,
      division: divisionName,
      inAmount: 0,
      outAmount: item.amount,
      balance: 0,
      isInternalTransfer: false,
      type: 'TRANSACTION',
      referenceId: item.id
    })
  }

  // 5. Sort and Calculate Running Balance
  reportRows.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    // If same date, IN before OUT
    if (a.inAmount > 0 && b.outAmount > 0) return -1
    if (a.outAmount > 0 && b.inAmount > 0) return 1
    // Fallback deterministic sort by ID
    return a.id.localeCompare(b.id)
  })

  let currentBalance = openingBalance
  let totalIn = 0
  let totalOut = 0
  let totalBelanja = 0
  let totalSweep = 0

  for (let i = 0; i < reportRows.length; i++) {
    const row = reportRows[i]
    currentBalance += row.inAmount
    currentBalance -= row.outAmount
    
    totalIn += row.inAmount
    totalOut += row.outAmount
    
    if (row.type === 'TRANSACTION') {
      totalBelanja += row.outAmount
    }
    if (row.type === 'ALLOCATION_OUT' && (row.description.toLowerCase().includes('sweep') || row.description.toLowerCase().includes('tutup bulan') || row.description.toLowerCase().includes('kembali'))) {
      totalSweep += row.outAmount
    }
    
    reportRows[i].balance = currentBalance
  }

  return {
    openingBalance,
    totalIn,
    totalOut,
    totalBelanja,
    totalSweep,
    endingBalance: currentBalance,
    isClosed,
    rows: reportRows
  }
}

// --- NEW CODE FOR EXCEL CONSOLIDATED REPORT ---

export interface MatrixCategoryDTO {
  categoryId: string
  categoryName: string
  totalAmount: number
  divisions: Record<string, number> // divisionId -> amount
}

export interface CashHolderDTO {
  cashSourceId: string
  cashSourceName: string
  jumlahUang: number // Opening Balance + Allocations In (Net of Allocations Out)
  realisasi: number  // Transactions out during the month
  sisa: number       // jumlahUang - realisasi (Ending Balance)
}

export interface ConsolidatedMatrixReportDTO {
  month: number
  year: number
  paguAmount: number
  categories: MatrixCategoryDTO[]
  divisions: { id: string, name: string }[]
  cashHolders: CashHolderDTO[]
  globalTotals: {
    totalCategory: number
    totalMatrix: number
    totalCashHolderRealisasi: number
    totalTransaction: number // Used for reconciliation
  }
}

export async function getConsolidatedMatrixReport(month: number, year: number): Promise<ConsolidatedMatrixReportDTO> {
  const supabase = await createClient()

  // 1. Resolve period dates
  const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0)
  const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  // 2. Fetch Master Data
  const [categoriesRes, divisionsRes, cashSourcesRes] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('divisions').select('id, name').order('name'),
    supabase.from('cash_sources').select('id, name, type').order('type', { ascending: false }).order('name')
  ])

  const categories: any[] = categoriesRes.data || []
  const divisions: any[] = divisionsRes.data || []
  const cashSources: any[] = cashSourcesRes.data || []

  // 3. Fetch Transactions for the period
  const transPeriodRes = await supabase
    .from('transactions')
    .select('id, amount, category_id, division_id, cash_source_id')
    .gte('date', startDateStr)
    .lte('date', endDateStr)

  const transactionsPeriod: any[] = transPeriodRes.data || []
  const totalTransaction = transactionsPeriod.reduce((sum, t) => sum + Number(t.amount || 0), 0)

  // 4. Build Category Matrix
  let totalCategory = 0
  let totalMatrix = 0
  const matrixCategories: MatrixCategoryDTO[] = categories.map(cat => ({
    categoryId: cat.id,
    categoryName: cat.name,
    totalAmount: 0,
    divisions: divisions.reduce((acc, div) => {
      acc[div.id] = 0
      return acc
    }, {} as Record<string, number>)
  }))

  transactionsPeriod.forEach(t => {
    const amount = Number(t.amount || 0)
    const cat = matrixCategories.find(c => c.categoryId === t.category_id)
    if (cat) {
      cat.totalAmount += amount
      totalCategory += amount
      if (t.division_id && cat.divisions[t.division_id] !== undefined) {
        cat.divisions[t.division_id] += amount
        totalMatrix += amount
      }
    }
  })

  // 5. Build Cash Holders
  const cashHolders: CashHolderDTO[] = []
  let totalCashHolderRealisasi = 0

  // We need to calculate Opening Balance & Allocations for EACH cash source
  const [allocInPastRes, allocOutPastRes, transOutPastRes, allocInPeriodRes, allocOutPeriodRes] = await Promise.all([
    supabase.from('allocations').select('amount, destination_id').lt('date', startDateStr),
    supabase.from('allocations').select('amount, source_id').lt('date', startDateStr),
    supabase.from('transactions').select('amount, cash_source_id').lt('date', startDateStr),
    supabase.from('allocations').select('amount, destination_id').gte('date', startDateStr).lte('date', endDateStr),
    supabase.from('allocations').select('amount, source_id, description').gte('date', startDateStr).lte('date', endDateStr)
  ])

  const allocInPast: any[] = allocInPastRes.data || []
  const allocOutPast: any[] = allocOutPastRes.data || []
  const transOutPast: any[] = transOutPastRes.data || []
  const allocInPeriod: any[] = allocInPeriodRes.data || []
  const allocOutPeriod: any[] = allocOutPeriodRes.data || []

  for (const source of cashSources) {
    const nameLow = source.name.toLowerCase()
    // Abaikan akun virtual "Modal Awal / Sistem / Pusat / Bank" dari laporan Excel konsolidasi
    if (nameLow.includes('modal awal') || nameLow.includes('sistem') || nameLow.includes('pusat') || nameLow.includes('bank')) {
      continue
    }

    let openingBalance = 0
    
    // Past IN
    allocInPast.filter(a => a.destination_id === source.id).forEach(a => openingBalance += Number(a.amount || 0))
    // Past OUT
    allocOutPast.filter(a => a.source_id === source.id).forEach(a => openingBalance -= Number(a.amount || 0))
    // Past Trans
    transOutPast.filter(t => t.cash_source_id === source.id).forEach(t => openingBalance -= Number(t.amount || 0))

    let allocInThisMonth = 0
    let allocOutThisMonth = 0
    
    allocInPeriod.filter(a => a.destination_id === source.id).forEach(a => allocInThisMonth += Number(a.amount || 0))
    allocOutPeriod.filter(a => a.source_id === source.id && a.description !== 'Sweep Closing Return').forEach(a => allocOutThisMonth += Number(a.amount || 0))

    const jumlahUang = openingBalance + allocInThisMonth - allocOutThisMonth
    
    let realisasi = 0
    transactionsPeriod.filter(t => t.cash_source_id === source.id).forEach(t => realisasi += Number(t.amount || 0))
    
    totalCashHolderRealisasi += realisasi

    // We only want to show cash holders that have either balance or activity
    if (jumlahUang !== 0 || realisasi !== 0 || openingBalance !== 0) {
      cashHolders.push({
        cashSourceId: source.id,
        cashSourceName: source.name,
        jumlahUang,
        realisasi,
        sisa: jumlahUang - realisasi
      })
    }
  }

  // 6. Reconciliation Check
  if (totalCategory !== totalTransaction) {
    const unmatched = transactionsPeriod.filter(t => !matrixCategories.find(c => c.categoryId === t.category_id))
    throw new Error(`Reconciliation Failed: Category Total (${totalCategory}) != Total Transactions (${totalTransaction}). Unmatched trans count: ${unmatched.length}`)
  }
  if (totalCashHolderRealisasi !== totalTransaction) {
    const unmatched = transactionsPeriod.filter(t => !cashSources.find(c => c.id === t.cash_source_id))
    throw new Error(`Reconciliation Failed: Cash Holder Realization (${totalCashHolderRealisasi}) != Total Transactions (${totalTransaction}). Unmatched source trans count: ${unmatched.length}`)
  }
  // Note: totalMatrix might not equal totalTransaction if some transactions don't have a division. 
  // We should enforce it if the template assumes all transactions have a division.
  // Actually, standard behavior is they all should have divisions.

  const { data: periodMatch } = await supabase.from('accounting_periods')
    .select('id')
    .gte('start_date', startDateStr)
    .lte('start_date', endDateStr)
    .limit(1)
    .maybeSingle()

  let paguAmount = 0
  if (periodMatch) {
    const { data: fundingAllocs } = await supabase.from('allocations')
      .select('amount')
      .eq('period_id', (periodMatch as any).id)
      .eq('description', 'Pendanaan Periode')
    
    if (fundingAllocs) {
      paguAmount = fundingAllocs.reduce((sum, a) => sum + Number((a as any).amount), 0)
    }
  }

  if (paguAmount === 0) {
    const modalAwal = cashSources.find(c => c.name.toLowerCase().includes('modal awal') || c.name.toLowerCase().includes('sistem'))
    paguAmount = modalAwal ? allocOutPeriod.filter(a => a.source_id === modalAwal.id).reduce((sum, a) => sum + Number(a.amount || 0), 0) : 0
  }

  return {
    month,
    year,
    paguAmount,
    categories: matrixCategories,
    divisions,
    cashHolders,
    globalTotals: {
      totalCategory,
      totalMatrix,
      totalCashHolderRealisasi,
      totalTransaction
    }
  }
}
