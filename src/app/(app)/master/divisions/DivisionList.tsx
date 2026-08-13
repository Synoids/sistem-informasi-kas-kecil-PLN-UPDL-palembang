'use client'

import { useState } from 'react'
import { Database } from '@/lib/types/database.types'
import { createDivisionAction, updateDivisionAction, toggleDivisionActiveAction } from '@/app/(app)/master/actions'
import { showToast } from '@/app/components/Toast'
import { useRouter } from 'next/navigation'

type Division = Database['public']['Tables']['divisions']['Row']

export function DivisionList({ initialData }: { initialData: Division[] }) {
  const [data, setData] = useState<Division[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [editingItem, setEditingItem] = useState<Division | null>(null)

  const router = useRouter()
  const [filterActive, setFilterActive] = useState<string>('all')

  const filteredData = data.filter(item => {
    if (filterActive === 'active') return item.is_active
    if (filterActive === 'inactive') return !item.is_active
    return true
  })

  function openCreateModal() {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  function openEditModal(item: Division) {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  async function handleAction(formData: FormData) {
    setIsPending(true)
    try {
      const result = editingItem 
        ? await updateDivisionAction(editingItem.id, formData)
        : await createDivisionAction(formData)
        
      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        showToast(editingItem ? 'Bidang/Divisi berhasil diupdate.' : 'Bidang/Divisi berhasil ditambahkan.', 'success')
        closeModal()
        router.refresh()
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setIsPending(false)
    }
  }

  async function toggleStatus(item: Division) {
    if (!window.confirm(`Yakin ingin ${item.is_active ? 'menonaktifkan' : 'mengaktifkan'} bidang ini?`)) {
      return
    }
    
    setIsPending(true)
    try {
      const result = await toggleDivisionActiveAction(item.id, item.is_active)
      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        showToast(`Bidang/Divisi berhasil ${item.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`, 'success')
        router.refresh()
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <select 
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          + Tambah Bidang
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama Bidang</th>
              <th className="px-4 py-3 font-semibold w-24">Status</th>
              <th className="px-4 py-3 font-semibold w-32 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada data bidang.
                </td>
              </tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3">
                    {item.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => toggleStatus(item)}
                      disabled={isPending}
                      className={item.is_active ? "text-red-600 hover:text-red-800 transition-colors disabled:opacity-50" : "text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"}
                    >
                      {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingItem ? 'Edit Bidang' : 'Tambah Bidang'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <form action={handleAction} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Bidang
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={editingItem?.name || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Contoh: MAN, PMK, dll"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
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
    </div>
  )
}
