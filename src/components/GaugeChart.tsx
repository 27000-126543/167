interface Props {
  value: number
  max?: number
  label: string
  color?: string
  unit?: string
  size?: "sm" | "md" | "lg"
}

export default function GaugeChart({ value, max = 100, label, color = "#D4A843", unit = "%", size = "md" }: Props) {
  const pct = Math.min(value / max, 1)
  const sizeMap = { sm: 80, md: 120, lg: 160 }
  const s = sizeMap[size]
  const r = s / 2 - 8
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct * 0.75)

  const colorMap: Record<string, string> = {
    "#D4A843": "#D4A843",
    "#2A9D8F": "#2A9D8F",
    "#C0392B": "#C0392B",
    "#3B82F6": "#3B82F6",
  }
  const barColor = colorMap[color] || color

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: s, height: s }}>
        <svg width={s} height={s} className="transform -rotate-[225deg]">
          <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="rgba(212,168,67,0.1)" strokeWidth={6} strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
          <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={barColor} strokeWidth={6} strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: "none" }}>
          <span className="text-lg font-bold" style={{ color: barColor }}>{Math.round(value)}</span>
          <span className="text-[10px] text-gray-400">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
