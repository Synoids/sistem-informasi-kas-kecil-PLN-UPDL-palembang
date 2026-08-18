import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'

export type NonCashTransactionRow = Database['public']['Tables']['non_cash_transactions']['Row']
export type NonCashTransactionWithDetails = NonCashTransactionRow & {
  profiles: { full_name: string }
  accounting_periods: { name: string; status: string }
}

export async function getNonCashTransactions(options?: {
  periodId?: string
  status?: string
  search?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('non_cash_transactions')
    .select(`
      *,
      profiles!inner (full_name),
      accounting_periods!inner (name, status)
    `)
    .order('date', { ascending: false })
    
  if (options?.periodId) {
    query = query.eq('period_id_origin', options.periodId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.search) {
    query = query.or(`description.ilike.%${options.search}%,profiles.full_name.ilike.%${options.search}%`)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data as NonCashTransactionWithDetails[]
}

export async function getNonCashClaimById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('non_cash_transactions')
    .select(`
      *,
      profiles!inner (full_name),
      accounting_periods!inner (name, status)
    `)
    .eq('id', id)
    .single()
    
  if (error) throw error
  return data as NonCashTransactionWithDetails
}

export async function submitNonCashClaim(data: {
  amount: number
  description: string
  date: string
  period_id_origin: string
  receipt_file_path?: string
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: claim, error } = await supabase
    .from('non_cash_transactions')
    .insert({
      amount: data.amount,
      description: data.description,
      date: data.date,
      period_id_origin: data.period_id_origin,
      receipt_file_path: data.receipt_file_path || null,
      status: 'BELUM DIGANTI',
      user_id: user.id
    } as any)
    .select()
    .single()

  if (error) throw error
  return claim
}

export async function reimburseNonCash(claimId: string, periodId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('reimburse_non_cash', {
    p_non_cash_id: claimId,
    p_period_id: periodId
  } as any)

  if (error) throw error
  return data
}
