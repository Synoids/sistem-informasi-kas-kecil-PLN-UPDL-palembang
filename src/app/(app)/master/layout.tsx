import { getCurrentProfile } from '@/lib/services/auth.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'
import { MasterNavigation } from './MasterNavigation'
import { PageGuide } from '@/app/components/PageGuide'

export default async function MasterLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile()
  
  if (!profile || profile.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-semibold text-slate-800">Master Data</h2>
            <PageGuide title="Panduan Master Data">
              <p>Halaman ini adalah pusat kontrol utama untuk mengatur fondasi aplikasi Kas Kecil.</p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-600">
                <li><strong>Periode:</strong> Tentukan rentang waktu operasional keuangan (bulan) dan tetapkan limit anggaran (Pagu). Pastikan hanya ada 1 periode yang berstatus OPEN.</li>
                <li><strong>Sumber Dana:</strong> Kelola dompet/sumber uang (misal: Brankas Utama, Rekening Bank). Anda juga dapat menentukan PIC atau pemegang dana untuk setiap sumber dana.</li>
                <li><strong>Kategori & Divisi:</strong> Tambahkan atau sesuaikan daftar label agar pencatatan transaksi lebih terorganisir dan pelaporan lebih rapi.</li>
                <li><strong>Pengguna (Users):</strong> Kelola hak akses aplikasi. Hanya pengguna dengan peran ADMIN yang dapat mengakses halaman Master Data ini.</li>
              </ul>
            </PageGuide>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Kelola data referensi aplikasi Kas Kecil.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <MasterNavigation />
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
