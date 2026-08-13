'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Pemegang Dana', href: '/master/fund-holders' },
  { name: 'Kategori', href: '/master/categories' },
  { name: 'Bidang / Divisi', href: '/master/divisions' },
  { name: 'Sumber Dana', href: '/master/cash-sources' },
  { name: 'Users & Akses', href: '/master/users' },
]

export function MasterNavigation() {
  const pathname = usePathname()

  return (
    <div className="flex overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link 
            key={tab.href}
            href={tab.href} 
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive 
                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                : 'border-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-50 hover:border-blue-600/30'
            }`}
          >
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
