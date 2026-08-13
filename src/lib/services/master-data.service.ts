import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'

type FundHolder = Database['public']['Tables']['fund_holders']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Division = Database['public']['Tables']['divisions']['Row']

export async function fetchFundHolders(): Promise<FundHolder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fund_holders')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error('Gagal mengambil data fund holders: ' + error.message)
  return data || []
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error('Gagal mengambil data categories: ' + error.message)
  return data || []
}

export async function fetchDivisions(): Promise<Division[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error('Gagal mengambil data divisions: ' + error.message)
  return data || []
}

export type CashSourceAdminView = Database['public']['Tables']['cash_sources']['Row'] & {
  fund_holder_name: string | null
  balance: number
}

export async function fetchCashSourcesAdmin(): Promise<CashSourceAdminView[]> {
  const supabase = await createClient() as any
  
  // 1. Ambil data cash_sources beserta relasi fund_holders
  const { data: sources, error: sourcesError } = await supabase
    .from('cash_sources')
    .select(`
      *,
      fund_holders ( name )
    `)
    .neq('type', 'SYSTEM')
    .neq('code', 'MODAL_AWAL')
    .order('code', { ascending: true })

  if (sourcesError) throw new Error('Gagal mengambil data cash sources: ' + sourcesError.message)
  
  // 2. Ambil data balance dari view
  const { data: balances, error: balancesError } = await supabase
    .from('v_cash_source_balances')
    .select('cash_source_id, balance')

  if (balancesError) throw new Error('Gagal mengambil data balances: ' + balancesError.message)

  // 3. Gabungkan di backend (Node.js) agar tidak membebani frontend
  const balanceMap = new Map<string, number>()
  ;(balances || []).forEach((b: any) => balanceMap.set(b.cash_source_id, b.balance))

  const merged = ((sources as any[]) || []).map((source: any) => {
    // any cast because postgrest relations typing is sometimes strict
    const fh = source.fund_holders
    return {
      ...source,
      fund_holder_name: fh ? fh.name : null,
      balance: balanceMap.get(source.id) || 0
    }
  })

  return merged
}

export type ProfileAdminView = Database['public']['Tables']['profiles']['Row'] & {
  accessed_cash_source_ids: string[]
}

export async function fetchProfilesWithAccess(): Promise<ProfileAdminView[]> {
  const supabase = (await createClient()) as any
  
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (profError) throw new Error('Gagal mengambil data profiles: ' + profError.message)

  const { data: accesses, error: accError } = await supabase
    .from('user_cash_source_access')
    .select('user_id, cash_source_id')

  if (accError) throw new Error('Gagal mengambil data akses: ' + accError.message)

  const accessMap = new Map<string, string[]>()
  ;(accesses || []).forEach((acc: any) => {
    const arr = accessMap.get(acc.user_id) || []
    arr.push(acc.cash_source_id)
    accessMap.set(acc.user_id, arr)
  })

  return ((profiles as any[]) || []).map((p: any) => ({
    ...p,
    accessed_cash_source_ids: accessMap.get(p.id) || []
  }))
}
