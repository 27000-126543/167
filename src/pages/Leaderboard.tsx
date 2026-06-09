import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { AIRSHIP_TYPE_LABELS, RARITY_LABELS, RARITY_COLORS } from "@/types"
import type { LeaderboardEntry } from "@/types"
import { calculateCombatPower, getStatLabel } from "@/engine/statsCalc"
import { Trophy, Crown, Medal, ChevronDown, ChevronUp } from "lucide-react"
import StatRadar from "@/components/StatRadar"

type TabKey = "combat" | "airspace" | "wealth"

const TABS: { key: TabKey; label: string }[] = [
  { key: "combat", label: "战力排行" },
  { key: "airspace", label: "空域积分" },
  { key: "wealth", label: "公会财富" },
]

function getScore(entry: LeaderboardEntry, tab: TabKey): number {
  switch (tab) {
    case "combat":
      return entry.combatPower
    case "airspace":
      return entry.airspaceScore
    case "wealth":
      return entry.wealth
  }
}

function getScoreLabel(tab: TabKey): string {
  switch (tab) {
    case "combat":
      return "战力"
    case "airspace":
      return "积分"
    case "wealth":
      return "财富"
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Crown size={18} style={{ color: "#fbbf24" }} />
        <span style={{ fontWeight: 800, fontSize: 16, color: "#fbbf24" }}>1</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Medal size={18} style={{ color: "#9ca3af" }} />
        <span style={{ fontWeight: 800, fontSize: 16, color: "#9ca3af" }}>2</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Medal size={18} style={{ color: "#b45309" }} />
        <span style={{ fontWeight: 800, fontSize: 16, color: "#cd7f32" }}>3</span>
      </div>
    )
  }
  return <span style={{ fontWeight: 600, fontSize: 15, color: "#6b7280" }}>{rank}</span>
}

function TopRowStyle(rank: number): React.CSSProperties | undefined {
  if (rank === 1)
    return {
      background: "linear-gradient(90deg, #fbbf2415, transparent)",
      borderLeft: "3px solid #fbbf24",
    }
  if (rank === 2)
    return {
      background: "linear-gradient(90deg, #9ca3af15, transparent)",
      borderLeft: "3px solid #9ca3af",
    }
  if (rank === 3)
    return {
      background: "linear-gradient(90deg, #cd7f3215, transparent)",
      borderLeft: "3px solid #cd7f32",
    }
  return undefined
}

function AirshipConfigDetail({ entry }: { entry: LeaderboardEntry }) {
  if (!entry.airshipConfig) {
    return (
      <div style={{ padding: "8px 0", fontSize: 12, color: "#6b7280" }}>
        暂无飞艇详细配置数据
      </div>
    )
  }
  const { airshipConfig } = entry
  const combatPower = calculateCombatPower(airshipConfig.stats)
  return (
    <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flexShrink: 0 }}>
          <StatRadar stats={airshipConfig.stats} size={160} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, color: "#d1d5db", fontWeight: 600 }}>
            飞艇「{airshipConfig.name}」
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#9ca3af" }}>
            <span>类型：{AIRSHIP_TYPE_LABELS[airshipConfig.type]}</span>
            <span>综合战力：<span style={{ color: "#fbbf24" }}>{combatPower}</span></span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
            {(Object.entries(airshipConfig.stats) as [keyof typeof airshipConfig.stats, number][]).map(([key, val]) => (
              <span key={key} style={{ color: "#60a5fa" }}>
                {getStatLabel(key)}：{val}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#6b7280" }}>龙骨：</span>
              <span style={{ color: RARITY_COLORS[airshipConfig.keel.rarity] }}>{airshipConfig.keel.name}</span>
              <span style={{ fontSize: 10, color: "#4b5563" }}>({RARITY_LABELS[airshipConfig.keel.rarity]})</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#6b7280" }}>引擎：</span>
              <span style={{ color: RARITY_COLORS[airshipConfig.engine.rarity] }}>{airshipConfig.engine.name}</span>
              <span style={{ fontSize: 10, color: "#4b5563" }}>({RARITY_LABELS[airshipConfig.engine.rarity]})</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "#6b7280" }}>帆翼：</span>
              <span style={{ color: RARITY_COLORS[airshipConfig.sail.rarity] }}>{airshipConfig.sail.name}</span>
              <span style={{ fontSize: 10, color: "#4b5563" }}>({RARITY_LABELS[airshipConfig.sail.rarity]})</span>
            </div>
            {airshipConfig.specialDevice && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#6b7280" }}>特殊装置：</span>
                <span style={{ color: RARITY_COLORS[airshipConfig.specialDevice.rarity] }}>{airshipConfig.specialDevice.name}</span>
                <span style={{ fontSize: 10, color: "#4b5563" }}>({RARITY_LABELS[airshipConfig.specialDevice.rarity]})</span>
              </div>
            )}
            {!airshipConfig.specialDevice && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#6b7280" }}>特殊装置：</span>
                <span style={{ color: "#4b5563" }}>未安装</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {entry.outpostSummary && (
        <div style={{ marginTop: 4, padding: "8px 12px", borderRadius: 6, backgroundColor: "#0f0f1a", fontSize: 12 }}>
          <div style={{ color: "#d1d5db", fontWeight: 600, marginBottom: 4 }}>前哨站布局</div>
          <div style={{ display: "flex", gap: 16, color: "#9ca3af" }}>
            <span>数量：{entry.outpostSummary.count}</span>
            <span>总等级：{entry.outpostSummary.totalLevel}</span>
          </div>
          <div style={{ color: "#6b7280", marginTop: 2 }}>
            {entry.outpostSummary.names.join("、")}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Leaderboard() {
  const { leaderboard } = useGameStore()
  const [activeTab, setActiveTab] = useState<TabKey>("combat")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = [...leaderboard].sort((a, b) => getScore(b, activeTab) - getScore(a, activeTab))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 20, color: "#e0e0e0" }}>
        <Trophy size={24} />
        排行榜
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2d2d44" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setExpandedId(null) }}
            style={{
              padding: "10px 20px",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === tab.key ? "#3b82f6" : "#9ca3af",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((entry) => {
          const isExpanded = expandedId === entry.name
          const topStyle = TopRowStyle(entry.rank)
          return (
            <div
              key={entry.name}
              style={{
                border: "1px solid #2d2d44",
                borderRadius: 8,
                backgroundColor: "#1a1a2e",
                overflow: "hidden",
                ...(topStyle || {}),
              }}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : entry.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  gap: 16,
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
                  <RankBadge rank={entry.rank} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#e0e0e0" }}>{entry.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {entry.airshipName} · {AIRSHIP_TYPE_LABELS[entry.airshipType]} · {entry.guildName}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#fbbf24" }}>
                  {getScore(entry, activeTab).toLocaleString()}
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
                    {getScoreLabel(activeTab)}
                  </span>
                </div>
                <div style={{ color: "#6b7280" }}>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              {isExpanded && (
                <div
                  style={{
                    padding: "0 16px 12px 72px",
                    borderTop: "1px solid #2d2d44",
                  }}
                >
                  <AirshipConfigDetail entry={entry} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
