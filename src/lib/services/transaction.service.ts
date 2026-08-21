import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'

type TransactionRow = Database['public']['Tables']['transactions']['Row']

export type TransactionWithDetails = TransactionRow & {
  cash_source_name: string
  cash_source_code: string
  category_name: string
  division_name: string
  created_by_name: string
  period_status?: 'OPEN' | 'CLOSED'
}

interface FetchTransactionsOptions {
  periodId?: string
  cashSourceId?: string
  categoryId?: string
  receiptStatus?: string
  search?: string
  limit?: number
  offset?: number
}

export async function fetchTransactions(
  options: FetchTransactionsOptions = {}
): Promise<{ data: TransactionWithDetails[]; count: number }> {
  const supabase = await createClient()
  const { periodId, cashSourceId, categoryId, receiptStatus, search, limit = 25, offset = 0 } = options

  // Build query with joins via foreign key relations
  let query = supabase
    .from('transactions')
    .select(`
      *,
      cash_sources!inner ( name, code ),
      categories!inner ( name ),
      divisions!inner ( name ),
      profiles!transactions_created_by_fkey ( full_name ),
      accounting_periods!inner ( status )
    `, { count: 'exact' })

  if (periodId) {
    query = query.eq('period_id', periodId)
  }
  if (cashSourceId) {
    query = query.eq('cash_source_id', cashSourceId)
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  if (receiptStatus && receiptStatus !== 'DIBATALKAN') {
    query = query.eq('receipt_status', receiptStatus)
  }
  
  if (receiptStatus === 'DIBATALKAN') {
    // Log Sampah mode
    query = query.eq('amount', 0)
  } else {
    // Normal mode: hide voided transactions
    query = query.neq('amount', 0)
  }

  if (search) {
    const isNum = !isNaN(Number(search.replace(/\D/g, ''))) && search.replace(/\D/g, '').length > 0
    const numVal = Number(search.replace(/\D/g, ''))

    const { data: catMatches } = await supabase.from('categories').select('id').ilike('name', `%${search}%`)
    const catIds = catMatches?.map((c: any) => c.id).join(',') || ''

    const { data: divMatches } = await supabase.from('divisions').select('id').ilike('name', `%${search}%`)
    const divIds = divMatches?.map((d: any) => d.id).join(',') || ''

    const orParts = [
      `recipient_name.ilike.%${search}%`,
      `description.ilike.%${search}%`
    ]
    
    if (isNum && numVal > 0) orParts.push(`amount.eq.${numVal}`)
    if (catIds) orParts.push(`category_id.in.(${catIds})`)
    if (divIds) orParts.push(`division_id.in.(${divIds})`)

    query = query.or(orParts.join(','))
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
    period_id: row.period_id,
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
    receipt_status: row.receipt_status,
    receipt_file_path: row.receipt_file_path,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
    cash_source_name: row.cash_sources?.name ?? '',
    cash_source_code: row.cash_sources?.code ?? '',
    category_name: row.categories?.name ?? '',
    division_name: row.divisions?.name ?? '',
    created_by_name: row.profiles?.full_name ?? '',
    period_status: row.accounting_periods?.status,
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
      profiles!transactions_created_by_fkey ( full_name ),
      accounting_periods!inner ( status )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  const row: any = data
  return {
    id: row.id,
    period_id: row.period_id,
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
    receipt_status: row.receipt_status,
    receipt_file_path: row.receipt_file_path,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
    cash_source_name: row.cash_sources?.name ?? '',
    cash_source_code: row.cash_sources?.code ?? '',
    category_name: row.categories?.name ?? '',
    division_name: row.divisions?.name ?? '',
    created_by_name: row.profiles?.full_name ?? '',
    period_status: row.accounting_periods?.status,
  }
}
