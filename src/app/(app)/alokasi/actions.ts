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

export async function setBudgetCeilingAction(targetAmount: number) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const { getCurrentProfile } = await import('@/lib/services/auth.service');
    
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== 'ADMIN') {
      return { error: 'Anda tidak memiliki hak untuk menetapkan pagu.' };
    }

    if (typeof targetAmount !== 'number' || isNaN(targetAmount) || targetAmount <= 0) {
      return { error: 'Nilai pagu harus lebih besar dari Rp0.' };
    }

    const supabase = await createClient();

    // Call the RPC
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.rpc('set_budget_ceiling' as any, {
      p_target_amount: targetAmount,
      p_date: today
    } as any);

    if (error) {
      throw error;
    }

    // Revalidate paths to update UI
    revalidatePath('/')
    revalidatePath('/alokasi')
    revalidatePath('/alokasi/riwayat')
    revalidatePath('/rekap')

    return { success: true, data };
  } catch (error: any) {
    console.error('Set budget ceiling error:', error);
    
    let errorMsg = error.message || 'Terjadi kesalahan saat menetapkan pagu kas.';
    
    if (errorMsg.includes('ERR_UNAUTHORIZED')) {
      errorMsg = 'Anda tidak memiliki hak untuk menetapkan pagu.';
    } else if (errorMsg.includes('ERR_INVALID_TARGET')) {
      errorMsg = 'Nilai pagu harus lebih besar dari Rp0.';
    } else if (errorMsg.includes('ERR_MAIN_NOT_FOUND')) {
      errorMsg = 'Kas Utama tidak ditemukan.';
    } else if (errorMsg.includes('ERR_SYSTEM_NOT_FOUND')) {
      errorMsg = 'Sumber dana eksternal belum tersedia.';
    } else if (errorMsg.includes('ERR_INSUFFICIENT_FUNDS')) {
      errorMsg = 'Saldo Kas Utama tidak mencukupi untuk pengembalian dana.';
    } else if (errorMsg.includes('could not serialize access due to concurrent update')) {
      errorMsg = 'Saldo Kas Utama berubah saat proses berlangsung. Silakan coba lagi.';
    }

    return { error: errorMsg };
  }
}
