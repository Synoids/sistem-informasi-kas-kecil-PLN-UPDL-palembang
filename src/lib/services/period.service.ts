import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'
import { handleRpcError, AppError } from '@/lib/utils/error-handler'

export type Period = Database['public']['Tables']['accounting_periods']['Row']

export async function getActivePeriod(): Promise<Period | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounting_periods')
    .select('*')
    .eq('status', 'OPEN')
    .maybeSingle()
    
  if (error) {
    console.error('Error fetching active period:', JSON.stringify(error))
  }
  
  return data as Period | null
}

export async function getAllPeriods() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounting_periods')
    .select('*')
    .order('start_date', { ascending: false })
    
  if (error) {
    throw error
  }
  
  return data
}

export async function openPeriod(name: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('accounting_periods')
    .insert({
      name,
      start_date: startDate,
      end_date: endDate,
      status: 'OPEN',
      created_by: user.id
    } as any)
    .select()
    .single()
    
  if (error) throw error
  return data
}

export async function fundPeriod(amount: number, periodId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('fund_period', {
    p_amount: amount,
    p_period_id: periodId
  } as any)
  
  if (error) throw error
  return data
}

export async function closePeriod(periodId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('close_period', {
    p_period_id: periodId
  } as any)
  
  if (error) throw error
  return data
}
