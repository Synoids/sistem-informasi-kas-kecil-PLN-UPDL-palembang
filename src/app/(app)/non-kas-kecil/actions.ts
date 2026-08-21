'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadNkkReceiptFile(file: File, claimId: string): Promise<string | null> {
  const supabase = await createClient()
  const fileExt = file.name.split('.').pop()
  const path = `${claimId}.${fileExt}`

  const { error } = await supabase.storage
    .from('receipts')
    .upload(`nkk/${path}`, file, { upsert: true })

  if (error) {
    console.error('Storage upload error:', error)
    throw error
  }
  return `nkk/${path}`
}

export async function submitNonCashClaimAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: { message: 'Unauthorized' } }
  }

  const date = formData.get('date') as string
  const period_id_origin = formData.get('period_id') as string
  const amountStr = formData.get('amount') as string
  const description = formData.get('description') as string
  const receiptFile = formData.get('receipt_file') as File | null

  if (!date || !period_id_origin || !amountStr || !description) {
    return { success: false, error: { message: 'Semua field wajib diisi' } }
  }

  const amount = parseFloat(amountStr.replace(/\./g, ''))
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: { message: 'Nominal tidak valid' } }
  }

  try {
    // 1. Insert DB
    const { data: claim, error } = await supabase
      .from('non_cash_transactions')
      .insert({
        amount,
        description,
        date,
        period_id_origin,
        status: 'BELUM DIGANTI',
        user_id: user.id
      } as any)
      .select()
      .single()

    if (error || !claim) throw error

    // 2. Upload file if exists
    if (receiptFile && receiptFile.size > 0) {
      const newPath = await uploadNkkReceiptFile(receiptFile, (claim as any).id)
      if (newPath) {
        await supabase
          .from('non_cash_transactions')
          // @ts-ignore
          .update({ receipt_file_path: newPath })
          .eq('id', (claim as any).id)
      }
    }

    revalidatePath('/non-kas-kecil')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: { message: err.message || 'Gagal menyimpan klaim' } }
  }
}

export async function uploadNkkReceiptAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: { message: 'Unauthorized' } }
  }

  const claimId = formData.get('claim_id') as string
  const receiptFile = formData.get('receipt_file') as File | null

  if (!claimId || !receiptFile || receiptFile.size === 0) {
    return { success: false, error: { message: 'File kuitansi wajib dilampirkan' } }
  }

  try {
    const newPath = await uploadNkkReceiptFile(receiptFile, claimId)
    if (newPath) {
      const { error } = await supabase
        .from('non_cash_transactions')
        // @ts-ignore
        .update({ receipt_file_path: newPath })
        .eq('id', claimId)
        
      if (error) throw error
    }

    revalidatePath('/non-kas-kecil')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: { message: err.message || 'Gagal upload kuitansi' } }
  }
}

export async function reimburseNonCashAction(claimId: string, currentPeriodId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase.rpc('reimburse_non_cash', {
      p_non_cash_id: claimId,
      p_period_id: currentPeriodId
    } as any)

    if (error) throw error

    // Option B: Automatically copy the receipt from the Non-Cash claim to the Transaction
    const rpcData = data as any
    if (rpcData && rpcData.transaction_id) {
      // 1. Ambil data kuitansi dari klaim asli
      const { data: claimData } = await supabase
        .from('non_cash_transactions')
        .select('receipt_file_path')
        .eq('id', claimId)
        .single()

      // 2. Salin path kuitansi (jika ada) ke transaksi pencairan
      const claimRow = claimData as any
      const hasReceipt = !!(claimRow && claimRow.receipt_file_path)
      
      await supabase
        .from('transactions')
        // @ts-ignore
        .update({ 
          receipt_status: hasReceipt ? 'SUDAH ADA' : 'BELUM ADA',
          receipt_file_path: hasReceipt ? claimRow.receipt_file_path : null
        })
        .eq('id', rpcData.transaction_id)
    }

    revalidatePath('/non-kas-kecil')
    revalidatePath('/transaksi')
    revalidatePath('/')
    
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: { message: err.message || 'Gagal melakukan reimbursement' } }
  }
}
