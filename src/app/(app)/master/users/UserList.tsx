'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileAdminView, CashSourceAdminView } from '@/lib/services/master-data.service'
import { createProfileAction, updateProfileAction, updateUserAccessAction, resetUserPasswordAction } from '@/app/(app)/master/actions'
import { showToast } from '@/app/components/Toast'
import { SuccessModal } from '@/app/components/SuccessModal'
import { Spinner } from '@/app/components/Spinner'

export function UserList({ 
  initialData: data,
  cashSources,
  currentUserId
}: { 
  initialData: ProfileAdminView[]
  cashSources: CashSourceAdminView[]
  currentUserId: string
}) {
  const router = useRouter()
  
  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const [isPending, setIsPending] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ProfileAdminView | null>(null)
  const [managingAccessUser, setManagingAccessUser] = useState<ProfileAdminView | null>(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<ProfileAdminView | null>(null)
  
  // Access state
  const [selectedAccess, setSelectedAccess] = useState<Set<string>>(new Set())

  function openCreateProfileModal() {
    setEditingProfile(null)
    setIsProfileModalOpen(true)
  }

  function openEditProfileModal(profile: ProfileAdminView) {
    if (profile.id === currentUserId) {
      showToast('Anda tidak dapat mengedit profile Anda sendiri.', 'error')
      return
    }
    setEditingProfile(profile)
    setIsProfileModalOpen(true)
  }

  function openAccessModal(profile: ProfileAdminView) {
    setManagingAccessUser(profile)
    setSelectedAccess(new Set(profile.accessed_cash_source_ids))
    setIsAccessModalOpen(true)
  }

  function openResetPasswordModal(profile: ProfileAdminView) {
    if (profile.id === currentUserId) {
      showToast('Gunakan menu pemulihan kata sandi untuk mengubah kata sandi akun Anda sendiri.', 'error')
      return
    }
    setResetPasswordTarget(profile)
    setIsResetPasswordModalOpen(true)
  }

  function closeModals() {
    setIsProfileModalOpen(false)
    setIsAccessModalOpen(false)
    setIsResetPasswordModalOpen(false)
    setError(null)
    setEditingProfile(null)
    setManagingAccessUser(null)
    setResetPasswordTarget(null)
  }

  async function handleProfileSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    try {
      const result = editingProfile 
        ? await updateProfileAction(editingProfile.id, formData)
        : await createProfileAction(formData)
        
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccessMessage(editingProfile ? 'Profile berhasil diupdate.' : 'Profile berhasil ditambahkan.')
        closeModals()
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsPending(false)
    }
  }

  async function handleAccessSubmit() {
    if (!managingAccessUser) return

    const currentArray = Array.from(selectedAccess)
    
    setIsPending(true)
    setError(null)
    
    try {
      const result = await updateUserAccessAction(managingAccessUser.id, currentArray)
      
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccessMessage('Akses Sumber Dana berhasil diperbarui.')
        closeModals()
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsPending(false)
    }
  }

  function toggleAccess(cashSourceId: string) {
    const newSet = new Set(selectedAccess)
    if (newSet.has(cashSourceId)) {
      newSet.delete(cashSourceId)
    } else {
      newSet.add(cashSourceId)
    }
    setSelectedAccess(newSet)
  }

  async function handleResetPasswordSubmit(formData: FormData) {
    if (!resetPasswordTarget) return
    setIsPending(true)
    setError(null)
    
    try {
      const result = await resetUserPasswordAction(resetPasswordTarget.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccessMessage('Password berhasil direset.')
        closeModals()
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <SuccessModal 
        isOpen={!!successMessage} 
        message={successMessage} 
        onClose={() => setSuccessMessage('')} 
      />

      <div className="flex justify-end">
        <button 
          onClick={openCreateProfileModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0"
        >
          + Tambah Profile
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">User ID (UID)</th>
              <th className="px-4 py-3 font-semibold text-center">Jumlah Akses Sumber Dana</th>
              <th className="px-4 py-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada data profile yang ditemukan.
                </td>
              </tr>
            ) : (
              data.map(item => {
                const isSelf = item.id === currentUserId
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 ${isSelf ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.full_name}
                      {isSelf && <span className="ml-2 text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Anda</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${item.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      {item.role === 'ADMIN' ? (
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs border border-purple-200">
                          Semua Akses
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs">
                          {item.accessed_cash_source_ids.length} Akses
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button 
                        onClick={() => openEditProfileModal(item)}
                        disabled={isSelf}
                        className={`transition-colors ${isSelf ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        Edit
                      </button>
                      {item.role === 'ADMIN' ? (
                        <button disabled className="text-slate-300 cursor-not-allowed">Kelola Akses</button>
                      ) : (
                        <button onClick={() => openAccessModal(item)} className="text-indigo-600 hover:text-indigo-800">Kelola Akses</button>
                      )}
                      <button 
                        onClick={() => openResetPasswordModal(item)}
                        disabled={isSelf}
                        className={`transition-colors ${isSelf ? 'text-slate-300 cursor-not-allowed hidden' : 'text-rose-600 hover:text-rose-800'}`}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">{editingProfile ? 'Edit Profile' : 'Tambah Profile'}</h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>}
            
            <form action={handleProfileSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4">
                {editingProfile && (
                  <div>
                    <label htmlFor="id" className="block text-sm font-medium text-slate-700 mb-1">User ID (UID)</label>
                    <input type="text" id="id" name="id" readOnly defaultValue={editingProfile.id} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed text-sm" />
                  </div>
                )}
                
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                  <input type="text" id="full_name" name="full_name" required defaultValue={editingProfile?.full_name || ''} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                {!editingProfile && (
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Alamat Email *</label>
                      <input type="email" id="email" name="email" required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi Awal *</label>
                      <input type="text" id="password" name="password" required minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select id="role" name="role" required defaultValue={editingProfile?.role || 'USER'} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50">
                <button type="button" onClick={closeModals} disabled={isPending} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50">Batal</button>
                <button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                  {isPending ? <><Spinner className="mr-2" /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAccessModalOpen && managingAccessUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-slate-800">Kelola Akses</h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {cashSources.map(cs => (
                <label key={cs.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 mb-2 cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={selectedAccess.has(cs.id)} onChange={() => toggleAccess(cs.id)} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{cs.name}</span>
                </label>
              ))}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0 bg-slate-50">
              <button type="button" onClick={closeModals} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Batal</button>
              <button type="button" onClick={handleAccessSubmit} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                {isPending ? <><Spinner className="mr-2" /> Menyimpan...</> : 'Simpan Akses'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isResetPasswordModalOpen && resetPasswordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-rose-700">Reset Password</h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>}
            <form action={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Password Baru *</label>
                <input type="password" name="password" required minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Konfirmasi Password Baru *</label>
                <input type="password" name="confirm_password" required minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-md mt-1 text-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Batal</button>
                <button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[150px]">
                  {isPending ? <><Spinner className="mr-2" /> Mereset...</> : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
