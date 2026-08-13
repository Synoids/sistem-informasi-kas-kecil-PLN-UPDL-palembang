export function Logo({ 
  className = "w-10 h-10", 
  withText = false, 
  variant = "light",
  textClassName = ""
}: { 
  className?: string, 
  withText?: boolean, 
  variant?: "light" | "dark",
  textClassName?: string
}) {
  const strokeColor = variant === "light" ? "#0f172a" : "#ffffff";
  const lineColor = variant === "light" ? "#0EA5E9" : "#38BDF8";

  const icon = (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* The Vault / Container ('C' shape) */}
      <path d="M 90 25 L 45 25 A 35 35 0 0 0 45 95 L 90 95" stroke={strokeColor} strokeWidth="16" strokeLinecap="round" />
      {/* The Fund / Coin */}
      <circle cx="45" cy="60" r="14" fill="#FBBF24" />
      {/* The Ledger Flow / Input */}
      <path d="M 105 60 L 70 60" stroke={lineColor} strokeWidth="16" strokeLinecap="round" />
    </svg>
  );

  if (!withText) return icon;

  const textColor = variant === "light" ? "text-slate-900" : "text-white";
  const descColor = variant === "light" ? "text-slate-500" : "text-slate-400";

  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className={`flex flex-col justify-center ${textClassName}`}>
        <span className={`font-extrabold text-xl leading-none tracking-tight ${textColor}`} style={{ fontFamily: 'var(--font-geist-sans), Inter, sans-serif' }}>
          Petty Cash
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${descColor}`}>
          UPDL Palembang
        </span>
      </div>
    </div>
  )
}
