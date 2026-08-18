'use client'

import { useState } from 'react'
import { FundPeriodModal } from './FundPeriodModal'

export function FundPeriodSection({ currentMainBalance }: { currentMainBalance: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 shadow-sm text-white mb-8 flex justify-between items-center flex-wrap gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1">Pendanaan (Funding) Kas Kecil</h2>
          <p className="text-blue-100 text-sm">
            Isi atau sesuaikan pagu kas utama untuk periode berjalan
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-white text-blue-700 hover:bg-blue-50 hover:shadow-md px-6 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 group"
        >
          <span>Fund Period</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      <FundPeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentMainBalance={currentMainBalance}
      />
    </>
  )
}
