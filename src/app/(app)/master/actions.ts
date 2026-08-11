'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/services/auth.service'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('Anda tidak memiliki izin untuk melakukan tindakan ini.')
  }
}

function handleSupabaseError(error: any): string {
  if (error?.code === '23505') {
    return 'Data dengan kode/nama tersebut sudah digunakan.'
  }
  if (error?.code === '23503') {
    return 'Data tidak dapat dimodifikasi karena sedang digunakan dalam transaksi atau alokasi.'
  }
  return 'Terjadi kesalahan saat memproses data.'
}

// ==========================================
// FUND HOLDERS
// ==========================================
export async function createFundHolderAction(formData: FormData) {
  try {
    await checkAdmin()
    const name = (formData.get('name') as string)?.trim()
    const employee_id = (formData.get('employee_id') as string)?.trim() || null

    if (!name) return { error: 'Nama wajib diisi.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('fund_holders').insert({ name, employee_id })

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/fund-holders')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function updateFundHolderAction(id: string, formData: FormData) {
  try {
    await checkAdmin()
    const name = (formData.get('name') as string)?.trim()
    const employee_id = (formData.get('employee_id') as string)?.trim() || null

    if (!id) return { error: 'ID tidak valid.' }
    if (!name) return { error: 'Nama wajib diisi.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('fund_holders').update({ name, employee_id }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/fund-holders')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function toggleFundHolderActiveAction(id: string, currentStatus: boolean) {
  try {
    await checkAdmin()
    if (!id) return { error: 'ID tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('fund_holders').update({ is_active: !currentStatus }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/fund-holders')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

// ==========================================
// CATEGORIES
// ==========================================
export async function createCategoryAction(formData: FormData) {
  try {
    await checkAdmin()
    const name = (formData.get('name') as string)?.trim()
    if (!name) return { error: 'Nama wajib diisi.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('categories').insert({ name })

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/categories')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function updateCategoryAction(id: string, formData: FormData) {
  try {
    await checkAdmin()
    const name = (formData.get('name') as string)?.trim()
    if (!id) return { error: 'ID tidak valid.' }
    if (!name) return { error: 'Nama wajib diisi.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('categories').update({ name }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/categories')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function toggleCategoryActiveAction(id: string, currentStatus: boolean) {
  try {
    await checkAdmin()
    if (!id) return { error: 'ID tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('categories').update({ is_active: !currentStatus }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/categories')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

// ==========================================
// DIVISIONS
// ==========================================
export async function createDivisionAction(formData: FormData) {
  try {
    await checkAdmin()
    const name = (formData.get('name') as string)?.trim()
    if (!name) return { error: 'Nama wajib diisi.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('divisions').insert({ name })

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/divisions')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function updateDivisionAction(id: string, formData: FormData) {
  try {
    await checkAdmin()
    const name = (formData.get('name') as string)?.trim()
    if (!id) return { error: 'ID tidak valid.' }
    if (!name) return { error: 'Nama wajib diisi.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('divisions').update({ name }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/divisions')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function toggleDivisionActiveAction(id: string, currentStatus: boolean) {
  try {
    await checkAdmin()
    if (!id) return { error: 'ID tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('divisions').update({ is_active: !currentStatus }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/divisions')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

// ==========================================
// CASH SOURCES
// ==========================================
export async function createCashSourceAction(formData: FormData) {
  try {
    await checkAdmin()
    const code = (formData.get('code') as string)?.trim()
    const name = (formData.get('name') as string)?.trim()
    const type = formData.get('type') as 'MAIN' | 'INDIVIDUAL'
    let fund_holder_id = (formData.get('fund_holder_id') as string)?.trim() || null

    if (!code) return { error: 'Kode wajib diisi.' }
    if (!name) return { error: 'Nama wajib diisi.' }
    if (type !== 'MAIN' && type !== 'INDIVIDUAL') return { error: 'Jenis sumber dana tidak valid.' }
    
    if (type === 'INDIVIDUAL' && !fund_holder_id) {
      return { error: 'Pemegang dana wajib dipilih untuk sumber dana individual.' }
    }
    if (type === 'MAIN') {
      fund_holder_id = null
    }

    const supabase = await createClient() as any
    const { error } = await supabase.from('cash_sources').insert({ code, name, type, fund_holder_id })

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/cash-sources')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function updateCashSourceAction(id: string, formData: FormData) {
  try {
    await checkAdmin()
    const code = (formData.get('code') as string)?.trim()
    const name = (formData.get('name') as string)?.trim()
    const type = formData.get('type') as 'MAIN' | 'INDIVIDUAL'
    let fund_holder_id = (formData.get('fund_holder_id') as string)?.trim() || null

    if (!id) return { error: 'ID tidak valid.' }
    if (!code) return { error: 'Kode wajib diisi.' }
    if (!name) return { error: 'Nama wajib diisi.' }
    if (type !== 'MAIN' && type !== 'INDIVIDUAL') return { error: 'Jenis sumber dana tidak valid.' }
    
    if (type === 'INDIVIDUAL' && !fund_holder_id) {
      return { error: 'Pemegang dana wajib dipilih untuk sumber dana individual.' }
    }
    if (type === 'MAIN') {
      fund_holder_id = null
    }

    const supabase = await createClient() as any

    // Audit perubahan TYPE
    const { data: current } = await supabase.from('cash_sources').select('type').eq('id', id).single()
    if (current && current.type !== type) {
      // Type is changing, check history
      const [{ data: hasTx }, { data: hasAlloc }] = await Promise.all([
        supabase.from('transactions').select('id').eq('cash_source_id', id).limit(1),
        supabase.from('allocations').select('id').or(`source_id.eq.${id},destination_id.eq.${id}`).limit(1)
      ])
      
      if ((hasTx && hasTx.length > 0) || (hasAlloc && hasAlloc.length > 0)) {
        return { error: 'Jenis sumber dana tidak dapat diubah karena sudah memiliki histori transaksi atau alokasi.' }
      }
    }

    const { error } = await supabase.from('cash_sources').update({ code, name, type, fund_holder_id }).eq('id', id)

    if (error) {
      if (error.code === '23503') return { error: 'Pemegang dana yang dipilih tidak valid.' }
      return { error: handleSupabaseError(error) }
    }
    
    revalidatePath('/master/cash-sources')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function toggleCashSourceActiveAction(id: string, currentStatus: boolean) {
  try {
    await checkAdmin()
    if (!id) return { error: 'ID tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('cash_sources').update({ is_active: !currentStatus }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/cash-sources')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

// ==========================================
// USERS & ACCESS
// ==========================================
export async function createProfileAction(formData: FormData) {
  try {
    await checkAdmin()
    const id = (formData.get('id') as string)?.trim()
    const full_name = (formData.get('full_name') as string)?.trim()
    const role = formData.get('role') as 'ADMIN' | 'USER'

    if (!id) return { error: 'User UID wajib diisi.' }
    if (!full_name) return { error: 'Nama Lengkap wajib diisi.' }
    if (role !== 'ADMIN' && role !== 'USER') return { error: 'Role tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('profiles').insert({ id, full_name, role })

    if (error) {
      if (error.code === '23503') return { error: 'User UID tidak valid atau belum terdaftar di Supabase Auth.' }
      if (error.code === '23505') return { error: 'Profile untuk User ID tersebut sudah terdaftar.' }
      return { error: handleSupabaseError(error) }
    }
    
    revalidatePath('/master/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function updateProfileAction(id: string, formData: FormData) {
  try {
    await checkAdmin()
    
    const profile = await getCurrentProfile()
    if (!profile) return { error: 'Sesi tidak valid.' }
    if (profile.id === id) {
      return { error: 'Admin tidak dapat mengubah profile sendiri.' }
    }

    const full_name = (formData.get('full_name') as string)?.trim()
    const role = formData.get('role') as 'ADMIN' | 'USER'

    if (!full_name) return { error: 'Nama Lengkap wajib diisi.' }
    if (role !== 'ADMIN' && role !== 'USER') return { error: 'Role tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('profiles').update({ full_name, role }).eq('id', id)

    if (error) return { error: handleSupabaseError(error) }
    
    revalidatePath('/master/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}

export async function updateUserAccessAction(userId: string, selectedCashSourceIds: string[]) {
  try {
    await checkAdmin()
    if (!userId) return { error: 'User ID tidak valid.' }

    const supabase = await createClient() as any

    // Get current access
    const { data: currentAccess, error: fetchError } = await supabase
      .from('user_cash_source_access')
      .select('cash_source_id')
      .eq('user_id', userId)

    if (fetchError) return { error: 'Gagal mengambil data akses pengguna.' }

    const currentIds: string[] = (currentAccess || []).map((a: any) => a.cash_source_id)
    
    const toInsert = selectedCashSourceIds.filter(id => !currentIds.includes(id))
    const toDelete = currentIds.filter(id => !selectedCashSourceIds.includes(id))

    if (toInsert.length > 0) {
      const insertData = toInsert.map(cash_source_id => ({ user_id: userId, cash_source_id }))
      const { error: insertError } = await supabase.from('user_cash_source_access').insert(insertData)
      if (insertError) return { error: 'Gagal menambahkan akses baru: ' + insertError.message }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_cash_source_access')
        .delete()
        .eq('user_id', userId)
        .in('cash_source_id', toDelete)
      if (deleteError) return { error: 'Gagal mencabut akses lama: ' + deleteError.message }
    }

    revalidatePath('/master/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error' }
  }
}
