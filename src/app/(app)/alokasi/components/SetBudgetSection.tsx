'use client'

import { useState } from 'react'
import { SetBudgetModal } from './SetBudgetModal'

interface SetBudgetSectionProps {
  currentMainBalance: number
}

export function SetBudgetSection({ currentMainBalance }: SetBudgetSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Isi / Tetapkan Pagu
      </button>

      <SetBudgetModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentMainBalance={currentMainBalance}
      />
    </>
  )
}
