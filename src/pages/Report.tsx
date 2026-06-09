import { useRef } from "react"
import { useGameStore } from "@/store/gameStore"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { BarChart3, Download, TrendingUp, Globe } from "lucide-react"
import { calculateCombatPower, getStatLabel } from "@/engine/statsCalc"
import type { AirshipStats } from "@/types"
import jsPDF from "jspdf"

const GUILD_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4"]

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "#e0e0e0", marginBottom: 12 }}>
      <Icon size={18} />
      {children}
    </div>
  )
}

function drawRadarOnPdf(doc: jsPDF, cx: number, cy: number, radius: number, labels: string[], values: number[], maxVal: number) {
  const n = labels.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  doc.setDrawColor(100, 100, 120)
  doc.setLineWidth(0.3)
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius * ring) / 4
    for (let i = 0; i < n; i++) {
      const a1 = startAngle + i * angleStep
      const a2 = startAngle + ((i + 1) % n) * angleStep
      doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2))
    }
  }

  doc.setDrawColor(80, 80, 100)
  for (let i = 0; i < n; i++) {
    const a = startAngle + i * angleStep
    doc.line(cx, cy, cx + radius * Math.cos(a), cy + radius * Math.sin(a))
  }

  doc.setFillColor(212, 168, 67)
  doc.setDrawColor(212, 168, 67)
  doc.setLineWidth(0.8)
  const points: number[] = []
  for (let i = 0; i < n; i++) {
    const a = startAngle + i * angleStep
    const r = (Math.min(values[i], maxVal) / maxVal) * radius
    points.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    doc.line(points[i * 2], points[i * 2 + 1], points[next * 2], points[next * 2 + 1])
  }

  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  for (let i = 0; i < n; i++) {
    const a = startAngle + i * angleStep
    const labelR = radius + 8
    doc.text(labels[i], cx + labelR * Math.cos(a), cy + labelR * Math.sin(a) + 2, { align: "center" })
  }
}

export default function Report() {
  const { weeklyReport, player } = useGameStore()
  const { weekNumber, territoryHeatmap, attendanceCurve, tradeRevenue, topEvents } = weeklyReport
  const reportRef = useRef<HTMLDivElement>(null)

  function handleExport() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFillColor(11, 29, 58)
    doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F")

    doc.setTextColor(212, 168, 67)
    doc.setFontSize(20)
    doc.text(`SKYFLEET Weekly Report - Week ${weekNumber}`, pageW / 2, 20, { align: "center" })

    doc.setTextColor(200, 200, 200)
    doc.setFontSize(10)
    doc.text("Territory Distribution", 14, 35)
    let y = 40
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    for (const item of territoryHeatmap) {
      const barW = Math.min(item.value * 3, pageW - 60)
      doc.setFillColor(59, 130, 246)
      doc.roundedRect(40, y - 3, barW, 5, 1, 1, "F")
      doc.setTextColor(200, 200, 200)
      doc.text(`${item.name}: ${item.value}`, 14, y)
      y += 8
    }

    y += 5
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(10)
    doc.text("Attendance Curve", 14, y)
    y += 6
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    for (const item of attendanceCurve) {
      const barW = Math.min(item.count / 30, pageW - 60)
      doc.setFillColor(59, 130, 246)
      doc.roundedRect(40, y - 3, barW, 4, 1, 1, "F")
      doc.text(`${item.date}: ${item.count}`, 14, y)
      y += 6
    }

    y += 5
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(10)
    doc.text("Trade Revenue", 14, y)
    y += 6
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    for (const item of tradeRevenue) {
      const barW = Math.min(item.revenue / 40, pageW - 70)
      doc.setFillColor(245, 158, 11)
      doc.roundedRect(55, y - 3, barW, 4, 1, 1, "F")
      doc.text(`${item.route}`, 14, y)
      doc.text(`${item.revenue} gold`, 14 + barW + 58, y)
      y += 6
    }

    y += 5
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(10)
    doc.text("Top Events", 14, y)
    y += 6
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    for (let i = 0; i < topEvents.length; i++) {
      doc.text(`${i + 1}. ${topEvents[i]}`, 14, y)
      y += 5
    }

    if (y > 220) {
      doc.addPage()
      doc.setFillColor(11, 29, 58)
      doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F")
      y = 20
    }

    y += 5
    doc.setTextColor(212, 168, 67)
    doc.setFontSize(12)
    doc.text("Airship Combat Power Radar", 14, y)
    y += 8

    const statKeys: Array<keyof AirshipStats> = ["maxSpeed", "maneuverability", "defense", "capacity", "range"]
    const radarLabels = statKeys.map(k => getStatLabel(k))

    for (let i = 0; i < Math.min(player.airships.length, 3); i++) {
      const airship = player.airships[i]
      const cx = pageW / 2
      const radarR = 25

      doc.setTextColor(200, 200, 200)
      doc.setFontSize(8)
      doc.text(`${airship.name} (CP: ${calculateCombatPower(airship.stats)})`, cx, y)

      const values = (Object.values(airship.stats) as number[]).map(v => Math.min(v, 100))
      drawRadarOnPdf(doc, cx, y + 30, radarR, radarLabels, values, 100)
      y += 70

      if (y > 260 && i < Math.min(player.airships.length, 3) - 1) {
        doc.addPage()
        doc.setFillColor(11, 29, 58)
        doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F")
        y = 20
      }
    }

    doc.save(`skyfleet-weekly-report-${weekNumber}.pdf`)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 20, color: "#e0e0e0" }}>
          <BarChart3 size={24} />
          全服周报 — 第 {weekNumber} 周
        </div>
        <button
          onClick={handleExport}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #2d2d44",
            backgroundColor: "#1a1a2e",
            color: "#e0e0e0",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Download size={16} />
          导出PDF
        </button>
      </div>

      <div ref={reportRef} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            border: "1px solid #2d2d44",
            borderRadius: 8,
            padding: 20,
            backgroundColor: "#1a1a2e",
          }}
        >
          <SectionTitle icon={Globe}>领地势力分布</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={territoryHeatmap}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f0f1a", border: "1px solid #2d2d44", borderRadius: 6, color: "#e0e0e0" }}
                labelStyle={{ color: "#e0e0e0" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {territoryHeatmap.map((_, i) => (
                  <Cell key={i} fill={GUILD_COLORS[i % GUILD_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            border: "1px solid #2d2d44",
            borderRadius: 8,
            padding: 20,
            backgroundColor: "#1a1a2e",
          }}
        >
          <SectionTitle icon={TrendingUp}>活跃度曲线</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={attendanceCurve}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f0f1a", border: "1px solid #2d2d44", borderRadius: 6, color: "#e0e0e0" }}
                labelStyle={{ color: "#e0e0e0" }}
              />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            border: "1px solid #2d2d44",
            borderRadius: 8,
            padding: 20,
            backgroundColor: "#1a1a2e",
          }}
        >
          <SectionTitle icon={BarChart3}>贸易收入排行</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tradeRevenue} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis type="category" dataKey="route" tick={{ fill: "#9ca3af", fontSize: 12 }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f0f1a", border: "1px solid #2d2d44", borderRadius: 6, color: "#e0e0e0" }}
                labelStyle={{ color: "#e0e0e0" }}
              />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            border: "1px solid #2d2d44",
            borderRadius: 8,
            padding: 20,
            backgroundColor: "#1a1a2e",
          }}
        >
          <SectionTitle icon={TrendingUp}>本周大事记</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topEvents.map((evt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  backgroundColor: "#0f0f1a",
                  fontSize: 13,
                  color: "#d1d5db",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                {evt}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
