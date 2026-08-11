import { createClient } from '@/lib/supabase/server'
import { getAccessibleCashSources } from './cash-source.service'
import { getCurrentProfile } from './auth.service'

export interface ReportRow {
  id: string
  date: string
  description: string
  recipient: string
  category: string
  division: string
  inAmount: number
  outAmount: number
  balance: number
  isInternalTransfer: boolean
}

export interface ReportData {
  openingBalance: number
  totalIn: number
  totalOut: number
  endingBalance: number
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

  // 2. Validate Authorization
  const accessibleSources = await getAccessibleCashSources()
  const accessibleIds = accessibleSources.map((s) => s.cash_source_id)

  const isConsolidated = cashSourceId === 'ALL'
  let targetSourceIds: string[] = []

  if (isConsolidated) {
    const profile = await getCurrentProfile()
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

  if (targetSourceIds.length === 0) {
    return {
      openingBalance: 0,
      totalIn: 0,
      totalOut: 0,
      endingBalance: 0,
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
      id: `alloc-in-${item.id}`,
      date: item.date,
      description: desc,
      recipient: '—',
      category: '—',
      division: '—',
      inAmount: item.amount,
      outAmount: 0,
      balance: 0,
      isInternalTransfer: false
    })
  }

  // Period Allocation OUT
  for (const item of (allocOutPeriod.data || []) as any[]) {
    const isInternal = isConsolidated && targetSourceIds.includes(item.source_id) && targetSourceIds.includes(item.destination_id)
    if (isInternal) continue // Do not show internal transfer twice in consolidated report

    const destName = (item.dest as any)?.name || 'Unknown Destination'
    const desc = item.description ? `Ke ${destName} - ${item.description}` : `Transfer Kas ke ${destName}`

    reportRows.push({
      id: `alloc-out-${item.id}`,
      date: item.date,
      description: desc,
      recipient: '—',
      category: '—',
      division: '—',
      inAmount: 0,
      outAmount: item.amount,
      balance: 0,
      isInternalTransfer: false // Because we skip internal, what makes it here is external out
    })
  }

  // Period Transactions
  for (const item of (transPeriod.data || []) as any[]) {
    const categoryName = (item.category as any)?.name || '—'
    const divisionName = (item.division as any)?.name || '—'

    reportRows.push({
      id: `trans-${item.id}`,
      date: item.date,
      description: item.description || '—',
      recipient: item.recipient_name,
      category: categoryName,
      division: divisionName,
      inAmount: 0,
      outAmount: item.amount,
      balance: 0,
      isInternalTransfer: false
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

  for (let i = 0; i < reportRows.length; i++) {
    const row = reportRows[i]
    currentBalance += row.inAmount
    currentBalance -= row.outAmount
    
    totalIn += row.inAmount
    totalOut += row.outAmount
    
    reportRows[i].balance = currentBalance
  }

  return {
    openingBalance,
    totalIn,
    totalOut,
    endingBalance: currentBalance,
    rows: reportRows
  }
}
