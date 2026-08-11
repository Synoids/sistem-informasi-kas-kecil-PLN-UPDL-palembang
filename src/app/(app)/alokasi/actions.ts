'use server'

import { revalidatePath } from 'next/cache'
import { submitAllocation } from '@/lib/services/allocation.service'

export async function submitAllocationAction(formData: FormData) {
  try {
    const data = {
      date: formData.get('date') as string,
      source_id: formData.get('source_id') as string,
      destination_id: formData.get('destination_id') as string,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
    }

    if (data.source_id === data.destination_id) {
      return { error: 'Sumber dan tujuan dana tidak boleh sama.' }
    }
    if (data.amount <= 0) {
      return { error: 'Nominal alokasi harus lebih dari 0.' }
    }

    await submitAllocation(data)

    // Revalidate paths to update UI
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
    } else if (errorMsg.includes('ERR_INVALID_INPUT')) {
      errorMsg = 'Data alokasi belum lengkap atau tidak valid.'
    }

    return { error: errorMsg }
  }
}
