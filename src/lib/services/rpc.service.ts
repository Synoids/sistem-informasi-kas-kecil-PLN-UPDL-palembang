import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database.types'
import { handleRpcError, AppError } from '@/lib/utils/error-handler'

type RpcArgs = Database['public']['Functions']

export type RpcResponse<T> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: AppError }

export async function createAllocation(
  args: RpcArgs['create_allocation']['Args']
): Promise<RpcResponse<string>> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('create_allocation', args as any)

  if (error) {
    return { success: false, data: null, error: handleRpcError(error) }
  }

  return { success: true, data: data as string, error: null }
}

export async function createTransaction(
  args: RpcArgs['create_transaction']['Args']
): Promise<RpcResponse<string>> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('create_transaction', args as any)

  if (error) {
    return { success: false, data: null, error: handleRpcError(error) }
  }

  return { success: true, data: data as string, error: null }
}

export async function updateTransaction(
  args: RpcArgs['update_transaction']['Args']
): Promise<RpcResponse<string>> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('update_transaction', args as any)

  if (error) {
    return { success: false, data: null, error: handleRpcError(error) }
  }

  return { success: true, data: data as string, error: null }
}
