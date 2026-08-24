import { getAccessibleCashSources } from '@/lib/services/cash-source.service'
import { getMasterData } from '@/lib/services/dashboard.service'
import { TransactionForm } from './components/TransactionForm'
import { PageGuide } from '@/app/components/PageGuide'

export default async function InputTransaksiPage() {
  const [cashSources, masterData] = await Promise.all([
    getAccessibleCashSources(),
    getMasterData()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-semibold text-slate-800">Input Transaksi</h2>
            <PageGuide title="Panduan Input Transaksi">
              <p>Gunakan formulir ini untuk mencatat setiap pengeluaran kas kecil.</p>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-600">
                <li><strong>Wajib Diisi:</strong> Semua kolom dengan tanda bintang merah (*) adalah wajib.</li>
                <li><strong>Kuitansi:</strong> Anda dapat mengunggah bukti/nota secara langsung. Jika diunggah, status akan menjadi "SUDAH ADA". Jika tidak, status akan menjadi "BELUM ADA" dan admin harus menagihnya di kemudian hari.</li>
                <li><strong>Maksimal Ukuran File:</strong> Foto atau PDF kuitansi tidak boleh lebih dari 5MB.</li>
              </ul>
              <p className="mt-3">Pastikan Anda memilih Sumber Dana (Kas) yang tepat sesuai dengan jenis pengeluaran.</p>
            </PageGuide>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Catat pengeluaran kas kecil. Semua field yang bertanda <span className="text-red-500">*</span> wajib diisi.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <TransactionForm
          cashSources={cashSources}
          categories={masterData.categories}
          divisions={masterData.divisions}
        />
      </div>
    </div>
  )
}
