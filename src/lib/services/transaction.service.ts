import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'

type TransactionRow = Database['public']['Tables']['transactions']['Row']

export type TransactionWithDetails = TransactionRow & {
  cash_source_name: string
  cash_source_code: string
  category_name: string
  division_name: string
  created_by_name: string
}

interface FetchTransactionsOptions {
  cashSourceId?: string
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export async function fetchTransactions(
  options: FetchTransactionsOptions = {}
): Promise<{ data: TransactionWithDetails[]; count: number }> {
  const supabase = await createClient()
  const { cashSourceId, categoryId, dateFrom, dateTo, limit = 25, offset = 0 } = options

  // Build query with joins via foreign key relations
  let query = supabase
    .from('transactions')
    .select(`
      *,
      cash_sources!inner ( name, code ),
      categories!inner ( name ),
      divisions!inner ( name ),
      profiles!transactions_created_by_fkey ( full_name )
    `, { count: 'exact' })

  if (cashSourceId) {
    query = query.eq('cash_source_id', cashSourceId)
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  if (dateFrom) {
    query = query.gte('date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('date', dateTo)
  }

  query = query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error || !data) {
    console.error('fetchTransactions error:', error)
    return { data: [], count: 0 }
  }

  // Flatten the joined data
  const flattened: TransactionWithDetails[] = data.map((row: any) => ({
    id: row.id,
    date: row.date,
    cash_source_id: row.cash_source_id,
    recipient_name: row.recipient_name,
    category_id: row.category_id,
    vehicle_number: row.vehicle_number,
    division_id: row.division_id,
    amount: row.amount,
    description: row.description,
    receipt_date: row.receipt_date,
    handover_date: row.handover_date,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
    cash_source_name: row.cash_sources?.name ?? '',
    cash_source_code: row.cash_sources?.code ?? '',
    category_name: row.categories?.name ?? '',
    division_name: row.divisions?.name ?? '',
    created_by_name: row.profiles?.full_name ?? '',
  }))

  return { data: flattened, count: count ?? 0 }
}

export async function fetchTransactionById(
  id: string
): Promise<TransactionWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      cash_sources!inner ( name, code ),
      categories!inner ( name ),
      divisions!inner ( name ),
      profiles!transactions_created_by_fkey ( full_name )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  const row: any = data
  return {
    id: row.id,
    date: row.date,
    cash_source_id: row.cash_source_id,
    recipient_name: row.recipient_name,
    category_id: row.category_id,
    vehicle_number: row.vehicle_number,
    division_id: row.division_id,
    amount: row.amount,
    description: row.description,
    receipt_date: row.receipt_date,
    handover_date: row.handover_date,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
    cash_source_name: row.cash_sources?.name ?? '',
    cash_source_code: row.cash_sources?.code ?? '',
    category_name: row.categories?.name ?? '',
    division_name: row.divisions?.name ?? '',
    created_by_name: row.profiles?.full_name ?? '',
  }
}
