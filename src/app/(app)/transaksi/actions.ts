'use server'

import { createTransaction, updateTransaction } from '@/lib/services/rpc.service'
import { Database } from '@/lib/types/database.types'
import { revalidatePath } from 'next/cache'

type CreateArgs = Database['public']['Functions']['create_transaction']['Args']
type UpdateArgs = Database['public']['Functions']['update_transaction']['Args']

export async function submitTransaction(formData: FormData) {
  const args: CreateArgs = {
    p_date: formData.get('date') as string,
    p_cash_source_id: formData.get('cash_source_id') as string,
    p_recipient_name: (formData.get('recipient_name') as string).trim(),
    p_category_id: formData.get('category_id') as string,
    p_vehicle_number: (formData.get('vehicle_number') as string)?.trim() || null,
    p_division_id: formData.get('division_id') as string,
    p_amount: Number(formData.get('amount')),
    p_description: (formData.get('description') as string)?.trim() || null,
    p_receipt_date: formData.get('receipt_date') as string,
    p_handover_date: formData.get('handover_date') as string,
  }

  const result = await createTransaction(args)

  if (result.success) {
    revalidatePath('/', 'layout')
  }

  return result
}

export async function editTransaction(formData: FormData) {
  const args: UpdateArgs = {
    p_transaction_id: formData.get('transaction_id') as string,
    p_date: formData.get('date') as string,
    p_cash_source_id: formData.get('cash_source_id') as string,
    p_recipient_name: (formData.get('recipient_name') as string).trim(),
    p_category_id: formData.get('category_id') as string,
    p_vehicle_number: (formData.get('vehicle_number') as string)?.trim() || null,
    p_division_id: formData.get('division_id') as string,
    p_amount: Number(formData.get('amount')),
    p_description: (formData.get('description') as string)?.trim() || null,
    p_receipt_date: formData.get('receipt_date') as string,
    p_handover_date: formData.get('handover_date') as string,
  }

  const result = await updateTransaction(args)

  if (result.success) {
    revalidatePath('/', 'layout')
  }

  return result
}
