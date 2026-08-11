import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'
import { getCurrentProfile } from './auth.service'

type CashSourceBalance = Database['public']['Views']['v_cash_source_balances']['Row']

export async function getAccessibleCashSources(): Promise<CashSourceBalance[]> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile) return []
  
  let sourceIds: string[] = []

  if (profile.role === 'ADMIN') {
    // Admin gets all active cash sources
    const { data: sources, error: sourceError } = await supabase
      .from('cash_sources')
      .select('id')
      .eq('is_active', true)

    if (sourceError || !sources) return []
    sourceIds = (sources as any[]).map((s: any) => s.id)
  } else {
    // User only gets active cash sources they have access to
    const { data: access, error: accessError } = await supabase
      .from('user_cash_source_access')
      .select('cash_source_id')
      .eq('user_id', profile.id)

    if (accessError || !access || access.length === 0) return []
    const allowedIds = (access as any[]).map((a: any) => a.cash_source_id)

    const { data: sources, error: sourceError } = await supabase
      .from('cash_sources')
      .select('id')
      .in('id', allowedIds)
      .eq('is_active', true)

    if (sourceError || !sources) return []
    sourceIds = (sources as any[]).map((s: any) => s.id)
  }

  if (sourceIds.length === 0) return []

  const { data: balances, error: balanceError } = await supabase
    .from('v_cash_source_balances')
    .select('*')
    .in('cash_source_id', sourceIds)
    .eq('is_active', true)
    .order('type', { ascending: false }) // MAIN first
    .order('name', { ascending: true })

  if (balanceError || !balances) {
    return []
  }

  return balances
}

export async function checkCashSourceAccess(cashSourceId: string): Promise<boolean> {
  const profile = await getCurrentProfile()
  if (!profile) return false
  if (profile.role === 'ADMIN') return true

  const supabase = await createClient()
  const { data } = await supabase
    .from('user_cash_source_access')
    .select('cash_source_id')
    .eq('user_id', profile.id)
    .eq('cash_source_id', cashSourceId)
    .single()

  return !!data
}

export interface CashSourceDetailHistory {
  id: string
  date: string
  type: 'Alokasi Masuk' | 'Alokasi Keluar' | 'Transaksi'
  description: string
  source: string
  destination: string
  category: string
  amount: number
}

export interface CashSourceDetailInfo {
  id: string
  code: string
  name: string
  type: string
  is_active: boolean
  fund_holder_name: string | null
  total_allocation_in: number
  total_allocation_out: number
  total_transaction_out: number
  current_balance: number
  history: CashSourceDetailHistory[]
}

export async function getCashSourceDetailData(id: string): Promise<CashSourceDetailInfo | null> {
  const hasAccess = await checkCashSourceAccess(id)
  if (!hasAccess) {
    throw new Error('Anda tidak memiliki akses ke sumber dana ini.')
  }

  const supabase = await createClient()

  const { data: sourceData, error: sourceError } = await supabase
    .from('cash_sources')
    .select('*, fund_holder:fund_holders(name)')
    .eq('id', id)
    .single()

  if (sourceError || !sourceData) return null

  // Fetch all history to calculate totals and running balance
  const [allocIn, allocOut, transOut] = await Promise.all([
    supabase
      .from('allocations')
      .select('id, date, amount, description, source:cash_sources!allocations_source_id_fkey(name)')
      .eq('destination_id', id),
    supabase
      .from('allocations')
      .select('id, date, amount, description, dest:cash_sources!allocations_destination_id_fkey(name)')
      .eq('source_id', id),
    supabase
      .from('transactions')
      .select('id, date, amount, description, recipient_name, category:categories(name), division:divisions(name)')
      .eq('cash_source_id', id)
  ])

  let history: CashSourceDetailHistory[] = []
  let totalAllocIn = 0
  let totalAllocOut = 0
  let totalTransOut = 0

  for (const item of (allocIn.data || []) as any[]) {
    totalAllocIn += item.amount
    history.push({
      id: `alloc-in-${item.id}`,
      date: item.date,
      type: 'Alokasi Masuk',
      description: item.description || 'Dropping/Transfer masuk',
      source: item.source?.name || '-',
      destination: (sourceData as any).name,
      category: '-',
      amount: item.amount
    })
  }

  for (const item of (allocOut.data || []) as any[]) {
    totalAllocOut += item.amount
    history.push({
      id: `alloc-out-${item.id}`,
      date: item.date,
      type: 'Alokasi Keluar',
      description: item.description || 'Transfer keluar',
      source: (sourceData as any).name,
      destination: item.dest?.name || '-',
      category: '-',
      amount: item.amount
    })
  }

  for (const item of (transOut.data || []) as any[]) {
    totalTransOut += item.amount
    history.push({
      id: `trans-${item.id}`,
      date: item.date,
      type: 'Transaksi',
      description: item.description || 'Pengeluaran',
      source: (sourceData as any).name,
      destination: item.recipient_name || '-',
      category: item.category?.name || '-',
      amount: item.amount
    })
  }

  // Sort chronological
  history.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    // Secondary sort: IN before OUT
    if (a.type === 'Alokasi Masuk' && b.type !== 'Alokasi Masuk') return -1
    if (a.type !== 'Alokasi Masuk' && b.type === 'Alokasi Masuk') return 1
    return 0
  })

  return {
    id: (sourceData as any).id,
    code: (sourceData as any).code,
    name: (sourceData as any).name,
    type: (sourceData as any).type,
    is_active: (sourceData as any).is_active,
    fund_holder_name: ((sourceData as any).fund_holder as any)?.name || null,
    total_allocation_in: totalAllocIn,
    total_allocation_out: totalAllocOut,
    total_transaction_out: totalTransOut,
    current_balance: totalAllocIn - totalAllocOut - totalTransOut,
    history
  }
}
