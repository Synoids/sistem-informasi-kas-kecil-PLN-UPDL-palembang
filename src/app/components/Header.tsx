import { logout } from '@/app/login/actions'
import { Logo } from '@/app/components/Logo'

export function Header({ fullName, role }: { fullName: string; role: string }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center md:hidden">
        <Logo className="w-6 h-6" withText textClassName="text-[10px]" />
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-700">{fullName}</p>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">{role}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded border border-slate-200 hover:border-red-200"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  )
}
