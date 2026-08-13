'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/app/components/Logo'

type NavItem = {
  label: string
  href: string
  icon: string
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Input Transaksi', href: '/transaksi', icon: '✏️' },
  { label: 'Riwayat Transaksi', href: '/transaksi/riwayat', icon: '📋' },
  { label: 'Alokasi Dana', href: '/alokasi', icon: '💰' },
  { label: 'Rekap Bulanan', href: '/rekap', icon: '📄' },
  { label: 'Master Data', href: '/master', icon: '⚙️' },
]

const userNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Input Transaksi', href: '/transaksi', icon: '✏️' },
  { label: 'Riwayat Transaksi', href: '/transaksi/riwayat', icon: '📋' },
]

export function Sidebar({ role, fullName }: { role: 'ADMIN' | 'USER'; fullName: string }) {
  const pathname = usePathname()
  const items = role === 'ADMIN' ? adminNav : userNav

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 bg-[#1e293b] text-slate-200 min-h-screen">
      <div className="px-5 py-6 border-b border-slate-700/50 flex items-center justify-center">
        <Logo className="w-10 h-10" withText variant="dark" textClassName="text-sm" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          let isActive = false
          if (item.href === '/') {
            isActive = pathname === '/'
          } else {
            isActive = pathname.startsWith(item.href)
            // Prevent "Input Transaksi" from being highlighted when in "Riwayat Transaksi"
            if (item.href === '/transaksi' && pathname.startsWith('/transaksi/riwayat')) {
              isActive = false
            }
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-sm font-medium text-white truncate">{fullName}</p>
        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-600 text-slate-200">
          {role}
        </span>
      </div>
    </aside>
  )
}
