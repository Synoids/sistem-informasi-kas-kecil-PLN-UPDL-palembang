import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  periodFundingAmount: number
  totalExpenseThisMonth: number
  transactionCountThisMonth: number
  unreceiptedTransactionCount: number
  unreimbursedNonCashCount: number
  unreimbursedNonCashAmount: number
}

export async function getDashboardStats(
  periodId: string,
  cashSourceIds?: string[]
): Promise<DashboardStats> {
  const supabase = await createClient()

  const defaultStats: DashboardStats = {
    periodFundingAmount: 0,
    totalExpenseThisMonth: 0,
    transactionCountThisMonth: 0,
    unreceiptedTransactionCount: 0,
    unreimbursedNonCashCount: 0,
    unreimbursedNonCashAmount: 0
  }

  if (!periodId) return defaultStats

  // 1. Period Funding: Sum of allocations from SYSTEM to MAIN in this period
  // (We don't need to filter by cashSourceIds since this is a global period stat, but we can if we want to strict RLS)
  // Wait, if a USER has no access to MAIN, should they see funding? Usually yes, it's a period context.
  const { data: fundingData } = await supabase
    .from('allocations')
    .select('amount, source:cash_sources!allocations_source_id_fkey(type)')
    .eq('period_id', periodId)

  const periodFundingAmount = (fundingData as any[] || [])
    .filter(a => a.source?.type === 'SYSTEM')
    .reduce((sum, row) => sum + Number(row.amount), 0)

  // 2. Transactions
  let txQuery = supabase
    .from('transactions')
    .select('amount, receipt_status')
    .eq('period_id', periodId)

  if (cashSourceIds && cashSourceIds.length > 0) {
    txQuery = txQuery.in('cash_source_id', cashSourceIds)
  }

  const { data: txData } = await txQuery

  let totalExpense = 0
  let unreceiptedCount = 0

  if (txData) {
    totalExpense = (txData as any[]).reduce((sum, row) => sum + Number(row.amount), 0)
    unreceiptedCount = (txData as any[]).filter(t => t.receipt_status === 'BELUM ADA').length
  }

  // 3. Non Cash Claims (BELUM DIGANTI)
  // Regardless of period origin, unreimbursed claims are outstanding liabilities.
  // Wait, the rule says "Nilai Non-Kas Kecil yang masih BELUM DIGANTI".
  // We'll fetch all pending claims for the user (or all if admin)
  // RLS will automatically filter by user_id if they are a USER.
  const { data: nonCashData } = await supabase
    .from('non_cash_transactions')
    .select('amount')
    .eq('status', 'BELUM DIGANTI')

  let unreimbursedCount = 0
  let unreimbursedAmount = 0

  if (nonCashData) {
    unreimbursedCount = nonCashData.length
    unreimbursedAmount = (nonCashData as any[]).reduce((sum, row) => sum + Number(row.amount), 0)
  }

  return {
    periodFundingAmount,
    totalExpenseThisMonth: totalExpense,
    transactionCountThisMonth: txData?.length || 0,
    unreceiptedTransactionCount: unreceiptedCount,
    unreimbursedNonCashCount: unreimbursedCount,
    unreimbursedNonCashAmount: unreimbursedAmount
  }
}

export async function getMasterData() {
  const supabase = await createClient()

  const [categoriesRes, divisionsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('name'),
    supabase.from('divisions').select('*').eq('is_active', true).order('name'),
  ])

  return {
    categories: categoriesRes.data ?? [],
    divisions: divisionsRes.data ?? [],
  }
}
