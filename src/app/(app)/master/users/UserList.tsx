'use client'

import { useState } from 'react'
import { ProfileAdminView, CashSourceAdminView } from '@/lib/services/master-data.service'
import { createProfileAction, updateProfileAction, updateUserAccessAction } from '@/app/(app)/master/actions'
import { showToast } from '@/app/components/Toast'

export function UserList({ 
  initialData,
  cashSources,
  currentUserId
}: { 
  initialData: ProfileAdminView[]
  cashSources: CashSourceAdminView[]
  currentUserId: string
}) {
  const [data, setData] = useState<ProfileAdminView[]>(initialData)
  
  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  
  const [isPending, setIsPending] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ProfileAdminView | null>(null)
  const [managingAccessUser, setManagingAccessUser] = useState<ProfileAdminView | null>(null)
  
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

  function closeModals() {
    setIsProfileModalOpen(false)
    setIsAccessModalOpen(false)
    setEditingProfile(null)
    setManagingAccessUser(null)
  }

  async function handleProfileSubmit(formData: FormData) {
    setIsPending(true)
    try {
      const result = editingProfile 
        ? await updateProfileAction(editingProfile.id, formData)
        : await createProfileAction(formData)
        
      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        showToast(editingProfile ? 'Profile berhasil diperbarui.' : 'Profile berhasil ditambahkan.', 'success')
        closeModals()
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setIsPending(false)
    }
  }

  async function handleAccessSubmit() {
    if (!managingAccessUser) return

    const originalSet = new Set(managingAccessUser.accessed_cash_source_ids)
    const currentArray = Array.from(selectedAccess)
    
    // Cek adakah akses yang dicabut
    const revoked = managingAccessUser.accessed_cash_source_ids.some(id => !selectedAccess.has(id))

    if (revoked) {
      if (!window.confirm("Peringatan:\nMencabut akses dapat membuat pengguna tidak lagi dapat melihat histori transaksi dari sumber dana tersebut.\n\nLanjutkan?")) {
        return
      }
    }

    setIsPending(true)
    try {
      const result = await updateUserAccessAction(managingAccessUser.id, currentArray)
      
      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Akses Sumber Dana berhasil diperbarui.', 'success')
        closeModals()
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
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

  return (
    <div className="space-y-4">
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
            {initialData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada data profile yang ditemukan.
                </td>
              </tr>
            ) : (
              initialData.map(item => {
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
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs">
                        {item.accessed_cash_source_ids.length} Akses
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button 
                        onClick={() => openEditProfileModal(item)}
                        disabled={isSelf}
                        className={`transition-colors ${isSelf ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                        title={isSelf ? "Anda tidak dapat mengedit profil sendiri" : "Edit Profile"}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => openAccessModal(item)}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Kelola Akses
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingProfile ? 'Edit Profile' : 'Tambah Profile'}
              </h3>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <form action={handleProfileSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="id" className="block text-sm font-medium text-slate-700 mb-1">
                    User ID (UID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="id"
                    name="id"
                    required
                    readOnly={!!editingProfile}
                    defaultValue={editingProfile?.id || ''}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-md outline-none text-sm font-mono ${editingProfile ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="Contoh: a1b2c3d4-..."
                  />
                  {!editingProfile && (
                    <p className="text-xs text-slate-500 mt-1">Salin UID pengguna dari Supabase Dashboard.</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    required
                    defaultValue={editingProfile?.full_name || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    defaultValue={editingProfile?.role || 'USER'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCESS MODAL */}
      {isAccessModalOpen && managingAccessUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Kelola Akses Sumber Dana</h3>
                <p className="text-sm text-slate-500 mt-0.5">User: <span className="font-medium text-slate-700">{managingAccessUser.full_name}</span></p>
              </div>
              <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {cashSources.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-4">Belum ada satupun Sumber Dana di sistem.</p>
                ) : (
                  cashSources.map(cs => {
                    const isChecked = selectedAccess.has(cs.id)
                    return (
                      <label 
                        key={cs.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${isChecked ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAccess(cs.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 shrink-0"
                        />
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-medium text-slate-800">
                            {cs.name} 
                            {!cs.is_active && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 uppercase">
                                Nonaktif
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-500 font-mono mt-0.5">{cs.code}</span>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAccessSubmit}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Akses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
