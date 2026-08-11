import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  totalExpenseThisMonth: number
  transactionCountThisMonth: number
}

export async function getDashboardStats(
  cashSourceIds?: string[]
): Promise<DashboardStats> {
  const supabase = await createClient()

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  let query = supabase
    .from('transactions')
    .select('amount', { count: 'exact' })
    .gte('date', firstDayOfMonth)
    .lte('date', lastDayOfMonth)

  if (cashSourceIds && cashSourceIds.length > 0) {
    query = query.in('cash_source_id', cashSourceIds)
  }

  const { data, count, error } = await query

  if (error || !data) {
    return { totalExpenseThisMonth: 0, transactionCountThisMonth: 0 }
  }

  const total = (data as { amount: number }[]).reduce((sum, row) => sum + (row.amount || 0), 0)

  return {
    totalExpenseThisMonth: total,
    transactionCountThisMonth: count ?? data.length,
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
