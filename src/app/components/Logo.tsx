export function Logo({ 
  className = "w-8 h-8", 
  withText = false, 
  textClassName = "",
  variant = "light"
}: { 
  className?: string, 
  withText?: boolean, 
  textClassName?: string,
  variant?: "light" | "dark"
}) {
  const icon = (
    <svg className={className} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="240" rx="56" fill="url(#bg-grad)"/>
      <rect x="50" y="60" width="140" height="120" rx="16" fill="white" fillOpacity="0.15"/>
      <rect x="70" y="80" width="100" height="80" rx="12" fill="white"/>
      <circle cx="120" cy="120" r="16" fill="#FBBF24"/>
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9"/>
          <stop offset="1" stopColor="#0284C7"/>
        </linearGradient>
      </defs>
    </svg>
  );

  if (!withText) return icon;

  const textColor = variant === "light" ? "text-slate-800" : "text-white";
  const descColor = variant === "light" ? "text-slate-500" : "text-slate-400";

  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className={`flex flex-col ${textClassName}`}>
        <span className={`font-bold text-lg leading-tight tracking-tight ${textColor}`}>
          Petty Cash
        </span>
        <span className={`text-xs font-semibold ${descColor}`}>
          UPDL Palembang
        </span>
      </div>
    </div>
  )
}
