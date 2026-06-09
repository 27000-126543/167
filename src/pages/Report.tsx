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

const GUILD_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4"]

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "#e0e0e0", marginBottom: 12 }}>
      <Icon size={18} />
      {children}
    </div>
  )
}

export default function Report() {
  const { weeklyReport } = useGameStore()
  const { weekNumber, territoryHeatmap, attendanceCurve, tradeRevenue, topEvents } = weeklyReport

  function handleExport() {
    window.print()
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
  )
}
