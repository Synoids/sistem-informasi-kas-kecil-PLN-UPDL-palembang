'use server'

import { createClient } from '@/lib/supabase/server'
import { createTransaction, updateTransaction } from '@/lib/services/rpc.service'
import { getActivePeriod } from '@/lib/services/period.service'
import { Database } from '@/lib/types/database.types'
import { revalidatePath } from 'next/cache'

type CreateArgs = Database['public']['Functions']['create_transaction']['Args']
type UpdateArgs = Database['public']['Functions']['update_transaction']['Args']

async function uploadReceiptFile(file: File, cashSourceId: string, transactionId: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran file maksimal 5MB')
  
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) throw new Error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.')

  const supabase = await createClient()
  const ext = file.name.split('.').pop()
  const path = `${cashSourceId}/${transactionId}.${ext}`

  const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: true })
  if (error) throw new Error(`Gagal mengupload kuitansi: ${error.message}`)

  return path
}

export async function deleteTransactionAction(transactionId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: { message: 'Unauthorized' } }
  }

  try {
    // 1. Fetch transaction and period
    const { data: rawTx, error: fetchErr } = await supabase
      .from('transactions')
      .select('amount, description, period_id, accounting_periods(status)')
      .eq('id', transactionId)
      .single()

    if (fetchErr || !rawTx) throw new Error('Transaksi tidak ditemukan')

    const tx = rawTx as any
    const periodStatus = tx.accounting_periods?.status
    if (periodStatus !== 'OPEN') throw new Error('Transaksi pada periode yang sudah ditutup tidak dapat dibatalkan')

    // 2. Perform Soft Delete (Void)
    const newDescription = `[DIBATALKAN] Alasan: ${reason} (Eks: Rp ${tx.amount}) | ${tx.description}`
    
    const { error: updateErr } = await supabase
      .from('transactions')
      // @ts-ignore
      .update({
        amount: 0,
        description: newDescription
      })
      .eq('id', transactionId)

    if (updateErr) throw updateErr

    // 3. If it was a reimbursement, unlink it from non_cash_transactions
    await supabase
      .from('non_cash_transactions')
      // @ts-ignore
      .update({
        status: 'BELUM DIGANTI',
        reimbursed_by_tx_id: null,
        reimbursed_at: null
      })
      .eq('reimbursed_by_tx_id', transactionId)

    revalidatePath('/transaksi')
    revalidatePath('/dashboard')
    revalidatePath('/')
    
    return { success: true }
  } catch (err: any) {
    console.error('deleteTransactionAction error:', err)
    return { success: false, error: { message: err.message || 'Gagal membatalkan transaksi' } }
  }
}

export async function submitTransaction(formData: FormData) {
  const activePeriod = await getActivePeriod()
  if (!activePeriod) {
    return { success: false, data: null, error: { message: 'Belum ada periode aktif' } }
  }

  const receiptFile = formData.get('receipt_file') as File | null
  const cashSourceId = formData.get('cash_source_id') as string

  const args: CreateArgs = {
    p_date: formData.get('date') as string,
    p_cash_source_id: cashSourceId,
    p_recipient_name: (formData.get('recipient_name') as string)?.trim() || '-',
    p_category_id: formData.get('category_id') as string,
    p_vehicle_number: (formData.get('vehicle_number') as string)?.trim() || null,
    p_division_id: formData.get('division_id') as string,
    p_amount: Number(formData.get('amount')),
    p_description: (formData.get('description') as string)?.trim() || null,
    p_receipt_date: (formData.get('receipt_date') as string) || null,
    p_handover_date: (formData.get('handover_date') as string) || null,
    p_period_id: activePeriod.id,
    p_receipt_status: 'BELUM ADA',
    p_receipt_file_path: null
  }

  // 1. Create Transaction
  const result = await createTransaction(args)

  // 2. Upload Receipt if provided and creation was successful
  if (result.success && result.data && receiptFile && receiptFile.size > 0) {
    try {
      const transactionId = result.data
      const path = await uploadReceiptFile(receiptFile, cashSourceId, transactionId)
      
      if (path) {
        // Update transaction to include the receipt
        await updateTransaction({
          p_transaction_id: transactionId,
          p_date: args.p_date,
          p_cash_source_id: args.p_cash_source_id,
          p_recipient_name: args.p_recipient_name,
          p_category_id: args.p_category_id,
          p_vehicle_number: args.p_vehicle_number,
          p_division_id: args.p_division_id,
          p_amount: args.p_amount,
          p_description: args.p_description,
          p_receipt_date: args.p_receipt_date,
          p_handover_date: args.p_handover_date,
          p_receipt_status: 'SUDAH ADA',
          p_receipt_file_path: path
        })
      }
    } catch (err: any) {
      // If upload fails, the transaction is already created, but we return a warning message
      return { success: true, data: result.data, error: { message: `Transaksi berhasil dibuat, namun kuitansi gagal diupload: ${err.message}` } }
    }
  }

  if (result.success) {
    revalidatePath('/', 'layout')
  }

  return result
}

export async function editTransaction(formData: FormData) {
  const transactionId = formData.get('transaction_id') as string
  const cashSourceId = formData.get('cash_source_id') as string
  const receiptFile = formData.get('receipt_file') as File | null
  
  let receiptPath = formData.get('existing_receipt_path') as string | null
  let receiptStatus = (formData.get('receipt_status') as string) || 'BELUM ADA'

  try {
    if (receiptFile && receiptFile.size > 0) {
      const newPath = await uploadReceiptFile(receiptFile, cashSourceId, transactionId)
      if (newPath) {
        receiptPath = newPath
        receiptStatus = 'SUDAH ADA'
      }
    }
  } catch (err: any) {
    return { success: false, data: null, error: { message: err.message } }
  }

  const args: UpdateArgs = {
    p_transaction_id: transactionId,
    p_date: formData.get('date') as string,
    p_cash_source_id: cashSourceId,
    p_recipient_name: (formData.get('recipient_name') as string)?.trim() || '-',
    p_category_id: formData.get('category_id') as string,
    p_vehicle_number: (formData.get('vehicle_number') as string)?.trim() || null,
    p_division_id: formData.get('division_id') as string,
    p_amount: Number(formData.get('amount')),
    p_description: (formData.get('description') as string)?.trim() || null,
    p_receipt_date: (formData.get('receipt_date') as string) || null,
    p_handover_date: (formData.get('handover_date') as string) || null,
    p_receipt_status: receiptStatus,
    p_receipt_file_path: receiptPath
  }

  const result = await updateTransaction(args)

  if (result.success) {
    revalidatePath('/', 'layout')
  }

  return result
}
