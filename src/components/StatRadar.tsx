import type { AirshipStats } from "@/types"
import { getStatLabel } from "@/engine/statsCalc"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"

interface Props {
  stats: AirshipStats
  size?: number
}

export default function StatRadar({ stats, size = 280 }: Props) {
  const data = (Object.keys(stats) as Array<keyof AirshipStats>).map(key => ({
    stat: getStatLabel(key),
    value: stats[key],
    fullMark: 100,
  }))

  return (
    <ResponsiveContainer width={size} height={size}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(212,168,67,0.15)" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: "#D4A843", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="属性" dataKey="value" stroke="#D4A843" fill="#D4A843" fillOpacity={0.2} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
