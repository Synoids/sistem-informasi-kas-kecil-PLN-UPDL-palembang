'use client'

import { useState } from 'react'
import { DashboardStats } from '@/lib/services/dashboard.service'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface CashSource {
  cash_source_id: string
  name: string
  code: string
  balance: number
  type: string
}

interface Props {
  stats: DashboardStats
  cashSources: CashSource[]
  isAdmin: boolean
  mainCashBalance: number
}

export function DashboardStatsTabs({ stats, cashSources, isAdmin, mainCashBalance }: Props) {
  const [activeTab, setActiveTab] = useState<string>('ALL')

  const totalBalance = cashSources.reduce((sum, cs) => sum + cs.balance, 0)
  
  // Data for 'ALL'
  const globalData = {
    box1: {
      label: isAdmin ? 'Saldo Kas Utama' : 'Total Alokasi (Global)',
      value: isAdmin ? formatRupiah(mainCashBalance) : formatRupiah(stats.periodFundingAmount),
      color: 'slate',
      subtext: ''
    },
    box2: {
      label: 'Pengeluaran Kas Kecil',
      value: formatRupiah(stats.totalExpenseThisMonth),
      color: 'slate',
      subtext: ''
    },
    box3: {
      label: 'Sisa Saldo Anda',
      value: formatRupiah(totalBalance),
      color: 'emerald',
      subtext: ''
    },
    box4: {
      label: 'Hutang Klaim Non-Kas',
      value: formatRupiah(stats.unreimbursedNonCashAmount),
      color: 'rose',
      subtext: `${stats.unreimbursedNonCashCount} klaim menunggu ganti`
    }
  }

  const getSpecificData = (id: string) => {
    const cs = cashSources.find(c => c.cash_source_id === id)
    const csStats = stats.perCashSource[id] || {
      allocationReceived: 0,
      expenseThisMonth: 0,
      transactionCount: 0,
      unreceiptedCount: 0
    }

    return {
      box1: {
        label: 'Alokasi Diterima',
        value: formatRupiah(csStats.allocationReceived),
        color: 'slate',
        subtext: ''
      },
      box2: {
        label: 'Total Pengeluaran',
        value: formatRupiah(csStats.expenseThisMonth),
        color: 'slate',
        subtext: `${csStats.transactionCount} transaksi`
      },
      box3: {
        label: 'Sisa Saldo Saat Ini',
        value: formatRupiah(cs?.balance || 0),
        color: 'emerald',
        subtext: ''
      },
      box4: {
        label: 'Belum Berkuitansi',
        value: `${csStats.unreceiptedCount} Transaksi`,
        color: csStats.unreceiptedCount > 0 ? 'amber' : 'slate',
        subtext: 'Menunggu upload kuitansi'
      }
    }
  }

  const currentData = activeTab === 'ALL' ? globalData : getSpecificData(activeTab)

  const renderCard = (box: any) => {
    const isRose = box.color === 'rose'
    const isAmber = box.color === 'amber'
    
    let bgClass = "bg-white border-slate-200"
    let textClass = "text-slate-800"
    let labelClass = "text-slate-500"
    let subClass = "text-slate-500"

    if (isRose) {
      bgClass = "bg-rose-50/30 border-rose-100"
      textClass = "text-rose-700"
      labelClass = "text-rose-600"
      subClass = "text-rose-600"
    } else if (isAmber) {
      bgClass = "bg-amber-50/30 border-amber-100"
      textClass = "text-amber-700"
      labelClass = "text-amber-600"
      subClass = "text-amber-600"
    } else if (box.color === 'emerald') {
      textClass = "text-emerald-600"
    }

    return (
      <div className={`rounded-xl border p-5 shadow-sm transition-all duration-300 ${bgClass}`}>
        <p className={`text-xs font-medium uppercase tracking-wider ${labelClass}`}>
          {box.label}
        </p>
        <p className={`text-2xl font-heading font-bold mt-1 ${textClass}`}>
          {box.value}
        </p>
        {box.subtext && (
          <p className={`text-xs mt-1 ${subClass}`}>{box.subtext}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 pb-px">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Keseluruhan
          </button>
          
          {cashSources.map(cs => (
            <button
              key={cs.cash_source_id}
              onClick={() => setActiveTab(cs.cash_source_id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === cs.cash_source_id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cs.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" key={activeTab}>
        {renderCard(currentData.box1)}
        {renderCard(currentData.box2)}
        {renderCard(currentData.box3)}
        {renderCard(currentData.box4)}
      </div>
    </div>
  )
}
