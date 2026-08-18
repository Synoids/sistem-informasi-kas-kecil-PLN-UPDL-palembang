'use server'

import { revalidatePath } from 'next/cache'
import { openPeriod, closePeriod, fundPeriod } from '@/lib/services/period.service'
import { createClient } from '@/lib/supabase/server'

export async function getClosingWarningsAction(periodId: string) {
  const supabase = await createClient()
  
  const { count: missingReceipts } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('period_id', periodId)
    .eq('receipt_status', 'BELUM ADA')

  const { count: pendingReimbursements } = await supabase
    .from('non_cash_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'BELUM DIGANTI')
    // Note: Non-cash claims might carry over periods, but they represent pending obligations.
    // We count all 'BELUM DIGANTI' regardless of period_id.

  return { missingReceipts: missingReceipts || 0, pendingReimbursements: pendingReimbursements || 0 }
}

export async function openPeriodAction(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string

    if (!name || !startDate || !endDate) {
      return { error: 'Semua field wajib diisi' }
    }

    await openPeriod(name, startDate, endDate)
    revalidatePath('/')
    revalidatePath('/master/periods')
    return { success: true }
  } catch (error: any) {
    console.error('Open period error:', error)
    return { error: error.message || 'Gagal membuka periode' }
  }
}

export async function closePeriodAction(periodId: string) {
  try {
    const result = await closePeriod(periodId)
    revalidatePath('/')
    revalidatePath('/master/periods')
    revalidatePath('/alokasi')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Close period error:', error)
    return { error: error.message || 'Gagal menutup periode' }
  }
}

export async function fundPeriodActionServer(periodId: string, amount: number) {
  try {
    const result = await fundPeriod(amount, periodId)
    revalidatePath('/')
    revalidatePath('/master/periods')
    revalidatePath('/alokasi')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Fund period error:', error)
    return { error: error.message || 'Gagal mendanai periode' }
  }
}
