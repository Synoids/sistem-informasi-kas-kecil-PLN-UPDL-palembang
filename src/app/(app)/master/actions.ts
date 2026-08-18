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

export async function deleteFundHolderAction(id: string) {
  try {
    await checkAdmin()
    if (!id) return { error: 'ID tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('fund_holders').delete().eq('id', id)

    if (error) {
      if (error.code === '23503') {
        return { error: 'Data tidak dapat dihapus karena sedang digunakan oleh Sumber Dana.' }
      }
      return { error: handleSupabaseError(error) }
    }
    
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

export async function deleteCashSourceAction(id: string) {
  try {
    await checkAdmin()
    if (!id) return { error: 'ID tidak valid.' }

    const supabase = await createClient() as any
    const { error } = await supabase.from('cash_sources').delete().eq('id', id)

    if (error) {
      if (error.code === '23503') {
        return { error: 'Data tidak dapat dihapus karena sudah memiliki histori transaksi, alokasi, atau terhubung dengan pengguna.' }
      }
      return { error: handleSupabaseError(error) }
    }
    
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
    const full_name = (formData.get('full_name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()
    const password = (formData.get('password') as string)?.trim()
    const role = formData.get('role') as 'ADMIN' | 'USER'
    const cashSourceIds = formData.getAll('cash_source_ids') as string[]

    if (!full_name) return { error: 'Nama Lengkap wajib diisi.' }
    if (!email) return { error: 'Email wajib diisi.' }
    if (!password) return { error: 'Kata sandi awal wajib diisi.' }
    if (role !== 'ADMIN' && role !== 'USER') return { error: 'Role tidak valid.' }

    // 1. Create Auth User using Admin Client
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true // bypass email confirmation
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return { error: 'Email tersebut sudah digunakan.' }
      }
      return { error: 'Gagal membuat akun autentikasi: ' + authError.message }
    }

    const newAuthUserId = authData.user.id

    try {
      const supabase = await createClient() as any
      
      // 2. Create Profile
      const { error: profileError } = await supabase.from('profiles').insert({ 
        id: newAuthUserId, 
        full_name, 
        role 
      })

      if (profileError) throw profileError

      // 3. Create Cash Source Access
      if (cashSourceIds && cashSourceIds.length > 0) {
        const insertData = cashSourceIds.map(cash_source_id => ({ 
          user_id: newAuthUserId, 
          cash_source_id 
        }))
        const { error: accessError } = await supabase.from('user_cash_source_access').insert(insertData)
        
        if (accessError) {
          // Attempt partial cleanup for access before throwing
          await supabase.from('user_cash_source_access').delete().eq('user_id', newAuthUserId)
          throw accessError
        }
      }

    } catch (err: any) {
      // ROLLBACK STRATEGY
      // If profile or access fails, delete the newly created auth user.
      await adminClient.auth.admin.deleteUser(newAuthUserId)
      
      if (err.code === '23505') return { error: 'Profile untuk User ID tersebut sudah terdaftar.' }
      return { error: 'Gagal membuat profil atau akses (Sistem dibatalkan): ' + (err.message || 'Error internal') }
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

export async function resetUserPasswordAction(userId: string, formData: FormData) {
  try {
    await checkAdmin()
    const profile = await getCurrentProfile()
    
    // Prevent self-reset via Admin Panel
    if (profile?.id === userId) {
      return { error: 'Gunakan menu pemulihan kata sandi untuk mengubah kata sandi akun Anda sendiri.' }
    }

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (!password || password.length < 6) {
      return { error: 'Password tidak memenuhi persyaratan (Minimal 6 karakter).' }
    }

    if (password !== confirmPassword) {
      return { error: 'Konfirmasi password tidak cocok.' }
    }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password
    })

    if (updateError) {
      // Map standard Supabase errors
      if (updateError.message.toLowerCase().includes('user not found')) {
        return { error: 'Pengguna tidak ditemukan.' }
      }
      // Hide raw error
      return { error: 'Reset password gagal. Silakan coba lagi beberapa saat.' }
    }

    return { success: true }
  } catch (err: any) {
    if (err.message?.includes('Unauthorized')) {
      return { error: 'Anda tidak memiliki izin untuk melakukan tindakan ini.' }
    }
    return { error: 'Terjadi kesalahan sistem internal.' }
  }
}
