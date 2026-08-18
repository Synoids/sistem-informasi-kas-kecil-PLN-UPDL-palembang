'use server'

import { revalidatePath } from 'next/cache'
import { submitAllocation } from '@/lib/services/allocation.service'
import { getActivePeriod, fundPeriod } from '@/lib/services/period.service'

export async function submitAllocationAction(formData: FormData) {
  try {
    const activePeriod = await getActivePeriod()
    if (!activePeriod) {
      return { error: 'Belum ada periode aktif' }
    }

    const data = {
      date: formData.get('date') as string,
      source_id: formData.get('source_id') as string,
      destination_id: formData.get('destination_id') as string,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      period_id: activePeriod.id
    }

    if (data.source_id === data.destination_id) {
      return { error: 'Sumber dan tujuan dana tidak boleh sama.' }
    }
    if (data.amount <= 0) {
      return { error: 'Nominal alokasi harus lebih dari 0.' }
    }

    await submitAllocation(data as any) // Updated typing to include period_id in allocation.service

    revalidatePath('/')
    revalidatePath('/alokasi')
    revalidatePath('/alokasi/riwayat')

    return { success: true }
  } catch (error: any) {
    console.error('Allocation server action error:', error)
    
    let errorMsg = error.message || 'Terjadi kesalahan saat memproses alokasi.'
    
    if (errorMsg.includes('ERR_INSUFFICIENT_FUNDS')) {
      errorMsg = 'Saldo sumber dana tidak mencukupi.'
    } else if (errorMsg.includes('ERR_SAME_SOURCE_DEST')) {
      errorMsg = 'Sumber dan tujuan dana tidak boleh sama.'
    } else if (errorMsg.includes('ERR_UNAUTHORIZED')) {
      errorMsg = 'Anda tidak memiliki izin melakukan alokasi.'
    } else if (errorMsg.includes('ERR_PERIOD_CLOSED')) {
      errorMsg = 'Periode ini sudah ditutup.'
    }

    return { error: errorMsg }
  }
}

export async function fundPeriodAction(amount: number) {
  try {
    const { getCurrentProfile } = await import('@/lib/services/auth.service')
    
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'ADMIN') {
      return { error: 'Anda tidak memiliki hak untuk melakukan pendanaan.' }
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return { error: 'Nilai pagu harus lebih besar dari Rp0.' }
    }

    const activePeriod = await getActivePeriod()
    if (!activePeriod) {
      return { error: 'Belum ada periode aktif untuk didanai.' }
    }

    const data = await fundPeriod(amount, activePeriod.id)

    revalidatePath('/')
    revalidatePath('/alokasi')
    revalidatePath('/alokasi/riwayat')
    revalidatePath('/rekap')

    return { success: true, data }
  } catch (error: any) {
    console.error('Fund period error:', error)
    
    let errorMsg = error.message || 'Terjadi kesalahan saat melakukan pendanaan.'
    
    if (errorMsg.includes('ERR_UNAUTHORIZED')) {
      errorMsg = 'Anda tidak memiliki hak untuk melakukan pendanaan.'
    } else if (errorMsg.includes('ERR_PERIOD_CLOSED')) {
      errorMsg = 'Periode ini sudah ditutup.'
    } else if (errorMsg.includes('ERR_ALREADY_FUNDED')) {
      errorMsg = 'Periode ini sudah menerima pendanaan utama.'
    }

    return { error: errorMsg }
  }
}
