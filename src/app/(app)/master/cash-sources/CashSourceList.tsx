'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CashSourceAdminView } from '@/lib/services/master-data.service'
import { Database } from '@/lib/types/database.types'
import { createCashSourceAction, updateCashSourceAction, toggleCashSourceActiveAction, deleteCashSourceAction } from '@/app/(app)/master/actions'
import { showToast } from '@/app/components/Toast'
import { useRouter } from 'next/navigation'
import { SuccessModal } from '@/app/components/SuccessModal'
import { Spinner } from '@/app/components/Spinner'

type FundHolder = Database['public']['Tables']['fund_holders']['Row']

export function CashSourceList({ 
  initialData,
  fundHolders 
}: { 
  initialData: CashSourceAdminView[]
  fundHolders: FundHolder[] 
}) {
  const [data, setData] = useState<CashSourceAdminView[]>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [editingItem, setEditingItem] = useState<CashSourceAdminView | null>(null)
  
  const [formFundHolder, setFormFundHolder] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const [filterActive, setFilterActive] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'MAIN' | 'INDIVIDUAL' | 'SYSTEM'>('ALL')

  // State untuk form dinamis (Type)
  const [formType, setFormType] = useState<'MAIN' | 'INDIVIDUAL' | 'SYSTEM'>('INDIVIDUAL')

  const filteredData = data.filter(item => {
    if (filterActive === 'active' && !item.is_active) return false
    if (filterActive === 'inactive' && item.is_active) return false
    if (filterType !== 'ALL' && item.type !== filterType) return false
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.code.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  // Fund holders yang boleh dipilih di form: hanya yang is_active = true
  const activeFundHolders = fundHolders.filter(fh => fh.is_active)

  function openCreateModal() {
    setEditingItem(null)
    setFormType('INDIVIDUAL') // Default form type
    setIsModalOpen(true)
  }

  function openEditModal(item: CashSourceAdminView) {
    setEditingItem(item)
    setFormType(item.type)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  async function handleAction(formData: FormData) {
    setIsPending(true)
    setError(null)
    try {
      const result = editingItem 
        ? await updateCashSourceAction(editingItem.id, formData)
        : await createCashSourceAction(formData)
        
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccessMessage(editingItem ? 'Sumber Dana berhasil diupdate.' : 'Sumber Dana berhasil ditambahkan.')
        closeModal()
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsPending(false)
    }
  }

  async function toggleStatus(item: CashSourceAdminView) {
    if (!window.confirm(`Yakin ingin ${item.is_active ? 'menonaktifkan' : 'mengaktifkan'} Sumber Dana ini?`)) {
      return
    }
    
    setIsPending(true)
    try {
      const result = await toggleCashSourceActiveAction(item.id, item.is_active)
      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        setSuccessMessage(`Sumber Dana berhasil ${item.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`)
        router.refresh()
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete(item: CashSourceAdminView) {
    if (!window.confirm(`PERINGATAN: Yakin ingin MENGHAPUS PERMANEN Sumber Dana "${item.name}"? Ini tidak dapat dibatalkan.`)) {
      return
    }
    
    setIsPending(true)
    try {
      const result = await deleteCashSourceAction(item.id)
      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        setSuccessMessage('Sumber Dana berhasil dihapus permanen.')
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
      <SuccessModal 
        isOpen={!!successMessage} 
        message={successMessage} 
        onClose={() => setSuccessMessage('')} 
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Cari kode / nama..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
          />
          <select 
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0"
        >
          + Tambah Data
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Kode</th>
              <th className="px-4 py-3 font-semibold">Nama Sumber Dana</th>
              <th className="px-4 py-3 font-semibold">Tipe</th>
              <th className="px-4 py-3 font-semibold">Pemegang Dana</th>
              <th className="px-4 py-3 font-semibold text-right">Saldo</th>
              <th className="px-4 py-3 font-semibold w-24">Status</th>
              <th className="px-4 py-3 font-semibold w-32 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada data sumber dana yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">{item.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${item.type === 'MAIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.fund_holder_name || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                    Rp {item.balance.toLocaleString('id-ID')}
                  </td>
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
                    <Link
                      href={`/master/cash-sources/${item.id}`}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors font-medium mr-2"
                    >
                      Detail
                    </Link>
                    <button 
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => toggleStatus(item)}
                      disabled={isPending}
                      className={item.is_active ? "text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50" : "text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"}
                    >
                      {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button 
                      onClick={() => handleDelete(item)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    >
                      Hapus
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
                {editingItem ? 'Edit Sumber Dana' : 'Tambah Sumber Dana'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
                {error}
              </div>
            )}
            
            <form action={handleAction} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">
                    Kode Sumber Dana
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    required
                    defaultValue={editingItem?.code || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono uppercase"
                    placeholder="Contoh: KAS-01"
                  />
                  <p className="text-xs text-slate-500 mt-1">Kode bersifat unik dan permanen.</p>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Sumber Dana
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={editingItem?.name || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Contoh: Kas Utama Palembang"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipe Sumber Dana
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        value="MAIN"
                        checked={formType === 'MAIN'}
                        onChange={() => setFormType('MAIN')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      MAIN
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        value="INDIVIDUAL"
                        checked={formType === 'INDIVIDUAL'}
                        onChange={() => setFormType('INDIVIDUAL')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      INDIVIDUAL
                    </label>
                  </div>
                </div>

                {formType === 'INDIVIDUAL' && (
                  <div>
                    <label htmlFor="fund_holder_id" className="block text-sm font-medium text-slate-700 mb-1">
                      Pemegang Dana
                    </label>
                    <select
                      id="fund_holder_id"
                      name="fund_holder_id"
                      required
                      defaultValue={editingItem?.fund_holder_id || ''}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                      <option value="" disabled>-- Pilih Pemegang Dana --</option>
                      {activeFundHolders.map(fh => (
                        <option key={fh.id} value={fh.id}>{fh.name}</option>
                      ))}
                      {/* Allow retaining inactive fund holder if already selected by this item */}
                      {editingItem?.fund_holder_id && !activeFundHolders.some(fh => fh.id === editingItem.fund_holder_id) && (
                        <option value={editingItem.fund_holder_id} className="text-slate-400">
                          {editingItem.fund_holder_name} (Nonaktif)
                        </option>
                      )}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                >
                  {isPending ? <><Spinner className="mr-2" /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
