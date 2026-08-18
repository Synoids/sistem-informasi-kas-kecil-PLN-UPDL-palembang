import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'

export type AllocationRow = Database['public']['Tables']['allocations']['Row']

export type AllocationWithDetails = AllocationRow & {
  source_name: string
  source_code: string
  destination_name: string
  destination_code: string
  created_by_name: string
}

interface FetchAllocationsOptions {
  limit?: number
  offset?: number
}

export async function fetchAllocations(
  options: FetchAllocationsOptions = {}
): Promise<{ data: AllocationWithDetails[]; count: number }> {
  const supabase = await createClient()
  const { limit = 25, offset = 0 } = options

  // Build query
  const query = supabase
    .from('allocations')
    .select(`
      *,
      source:cash_sources!allocations_source_id_fkey ( name, code ),
      destination:cash_sources!allocations_destination_id_fkey ( name, code ),
      profiles!allocations_created_by_fkey ( full_name )
    `, { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error || !data) {
    console.error('fetchAllocations error:', error)
    return { data: [], count: 0 }
  }

  // Flatten the joined data
  const flattened: AllocationWithDetails[] = data.map((row: any) => ({
    id: row.id,
    period_id: row.period_id,
    date: row.date,
    source_id: row.source_id,
    destination_id: row.destination_id,
    amount: row.amount,
    description: row.description,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
    source_name: row.source?.name ?? '',
    source_code: row.source?.code ?? '',
    destination_name: row.destination?.name ?? '',
    destination_code: row.destination?.code ?? '',
    created_by_name: row.profiles?.full_name ?? '',
  }))

  return { data: flattened, count: count ?? 0 }
}

export async function submitAllocation(data: {
  date: string
  source_id: string
  destination_id: string
  amount: number
  description: string
  period_id: string
}) {
  const supabase = await createClient()

  // Execute RPC for create_allocation
  const { data: allocationId, error } = await supabase.rpc('create_allocation', {
    p_date: data.date,
    p_source_id: data.source_id,
    p_destination_id: data.destination_id,
    p_amount: data.amount,
    p_description: data.description,
    p_period_id: data.period_id
  } as any)

  if (error) {
    console.error('submitAllocation RPC error:', error)
    throw new Error(error.message)
  }

  return allocationId
}
