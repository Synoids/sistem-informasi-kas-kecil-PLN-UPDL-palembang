'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/services/auth.service'
import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { TransactionWithDetails } from '@/lib/services/transaction.service'

export async function getTransactionDetail(id: string): Promise<TransactionWithDetails | null> {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const supabase = await createClient()

  // 1. Check authorization
  const isAdmin = profile.role === 'ADMIN'
  const accessibleSources = await getAccessibleCashSources()
  const accessibleIds = accessibleSources.map(cs => cs.cash_source_id)

  // 2. Fetch the transaction
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      cash_sources (id, name),
      categories (id, name),
      divisions (id, name),
      created_by_profile:profiles!transactions_created_by_fkey (id, name),
      updated_by_profile:profiles!transactions_updated_by_fkey (id, name)
    `)
    .eq('id', id)
    .single()

  const tx: any = data

  if (error || !tx) {
    console.error('Error fetching transaction detail:', error)
    return null
  }

  // 3. Verify access
  if (!isAdmin && !accessibleIds.includes(tx.cash_source_id)) {
    return null // Unauthorized
  }

  // 4. Map to TransactionWithDetails
  return {
    ...tx,
    cash_source_name: (tx.cash_sources as any)?.name || 'Unknown',
    category_name: (tx.categories as any)?.name || 'Unknown',
    division_name: (tx.divisions as any)?.name || 'Unknown',
    created_by_name: (tx.created_by_profile as any)?.name || 'Unknown',
    updated_by_name: (tx.updated_by_profile as any)?.name || null
  }
}

export type AllocationDetail = {
  id: string
  date: string
  amount: number
  description: string | null
  source_name: string
  destination_name: string
  created_by_name: string
  created_at: string
}

export async function getAllocationDetail(id: string): Promise<AllocationDetail | null> {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const supabase = await createClient()

  const isAdmin = profile.role === 'ADMIN'
  const accessibleSources = await getAccessibleCashSources()
  const accessibleIds = accessibleSources.map(cs => cs.cash_source_id)

  const { data, error } = await supabase
    .from('allocations')
    .select(`
      *,
      source:cash_sources!allocations_source_id_fkey (id, name),
      destination:cash_sources!allocations_destination_id_fkey (id, name),
      created_by_profile:profiles!allocations_created_by_fkey (id, name)
    `)
    .eq('id', id)
    .single()

  const alloc: any = data

  if (error || !alloc) {
    console.error('Error fetching allocation detail:', error)
    return null
  }

  // Verify access: user must have access to either source or destination
  if (!isAdmin) {
    const hasAccess = accessibleIds.includes(alloc.source_id) || accessibleIds.includes(alloc.destination_id)
    if (!hasAccess) return null
  }

  return {
    id: alloc.id,
    date: alloc.date,
    amount: alloc.amount,
    description: alloc.description,
    source_name: (alloc.source as any)?.name || 'Unknown',
    destination_name: (alloc.destination as any)?.name || 'Unknown',
    created_by_name: (alloc.created_by_profile as any)?.name || 'Unknown',
    created_at: alloc.created_at
  }
}
