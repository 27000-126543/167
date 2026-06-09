import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { RARITY_LABELS, RARITY_COLORS } from "@/types"
import type { TradeItem, TradeItemType } from "@/types"
import { isPriceInRange, calculateSuggestedPrice, generateTradeId } from "@/engine/priceEngine"
import { ShoppingBag, Tag, TrendingUp, DollarSign, Search, Filter } from "lucide-react"

function PriceBadge({ price, suggestedMin, suggestedMax }: { price: number; suggestedMin: number; suggestedMax: number }) {
  const range = isPriceInRange(price, suggestedMin, suggestedMax)
  const colorMap = { low: "#22C55E", fair: "#EAB308", high: "#EF4444" }
  const labelMap = { low: "低价", fair: "合理", high: "高价" }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        backgroundColor: colorMap[range],
      }}
    >
      {labelMap[range]}
    </span>
  )
}

function MarketCard({ item, onBuy, playerGold }: { item: TradeItem; onBuy: () => void; playerGold: number }) {
  const canAfford = playerGold >= item.price
  return (
    <div
      style={{
        border: `1px solid ${RARITY_COLORS[item.rarity]}40`,
        borderRadius: 8,
        padding: 16,
        backgroundColor: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#e0e0e0" }}>{item.name}</span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: RARITY_COLORS[item.rarity],
          }}
        >
          {RARITY_LABELS[item.rarity]}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{item.description}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Tag size={14} style={{ color: "#9ca3af" }} />
        <span style={{ color: "#9ca3af" }}>类型：{item.type === "blueprint" ? "图纸" : "组件"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <DollarSign size={14} style={{ color: "#fbbf24" }} />
        <span style={{ color: "#fbbf24", fontWeight: 700 }}>{item.price} 金币</span>
        <PriceBadge price={item.price} suggestedMin={item.suggestedMin} suggestedMax={item.suggestedMax} />
      </div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>
        建议价格：{item.suggestedMin} - {item.suggestedMax} 金币
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <TrendingUp size={14} style={{ color: "#60a5fa" }} />
        <span style={{ color: "#60a5fa" }}>7日均价：{item.avgPrice7d} 金币</span>
      </div>
      <div style={{ fontSize: 12, color: "#6b7280" }}>卖家：{item.seller}</div>
      <button
        onClick={onBuy}
        disabled={!canAfford}
        style={{
          marginTop: 4,
          padding: "8px 0",
          borderRadius: 6,
          border: "none",
          fontWeight: 700,
          fontSize: 13,
          cursor: canAfford ? "pointer" : "not-allowed",
          backgroundColor: canAfford ? "#3b82f6" : "#374151",
          color: canAfford ? "#fff" : "#6b7280",
        }}
      >
        {canAfford ? "购买" : "金币不足"}
      </button>
    </div>
  )
}

function SellPanel() {
  const { player, listMarketItem } = useGameStore()
  const [selectedAirshipIdx, setSelectedAirshipIdx] = useState(0)
  const [selectedPartKey, setSelectedPartKey] = useState<string>("")
  const [sellPrice, setSellPrice] = useState("")

  const airship = player.airships[selectedAirshipIdx]
  const parts = airship
    ? [
        { key: "keel", label: "龙骨", comp: airship.keel },
        { key: "engine", label: "引擎", comp: airship.engine },
        { key: "sail", label: "帆翼", comp: airship.sail },
        ...(airship.specialDevice ? [{ key: "special", label: "特殊装置", comp: airship.specialDevice }] : []),
      ]
    : []

  const selectedPart = parts.find((p) => p.key === selectedPartKey)
  const suggested = selectedPart ? calculateSuggestedPrice(0, selectedPart.comp.rarity) : null

  function handleList() {
    if (!selectedPart) return
    const price = parseInt(sellPrice)
    if (!price || price <= 0) return
    const item: TradeItem = {
      id: generateTradeId(),
      name: selectedPart.comp.name,
      type: "component",
      componentId: selectedPart.comp.id,
      seller: player.name,
      price,
      suggestedMin: suggested?.min ?? price,
      suggestedMax: suggested?.max ?? price,
      avgPrice7d: price,
      rarity: selectedPart.comp.rarity,
      listedAt: Date.now(),
      description: selectedPart.comp.description,
    }
    listMarketItem(item)
    setSellPrice("")
    setSelectedPartKey("")
  }

  return (
    <div
      style={{
        border: "1px solid #2d2d44",
        borderRadius: 8,
        padding: 16,
        backgroundColor: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "#e0e0e0" }}>
        <ShoppingBag size={18} />
        出售物品
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, color: "#9ca3af" }}>选择飞艇</label>
        <select
          value={selectedAirshipIdx}
          onChange={(e) => {
            setSelectedAirshipIdx(Number(e.target.value))
            setSelectedPartKey("")
          }}
          style={{
            padding: "6px 8px",
            borderRadius: 4,
            border: "1px solid #2d2d44",
            backgroundColor: "#0f0f1a",
            color: "#e0e0e0",
            fontSize: 13,
          }}
        >
          {player.airships.map((a, i) => (
            <option key={a.id} value={i}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, color: "#9ca3af" }}>选择部件</label>
        <select
          value={selectedPartKey}
          onChange={(e) => setSelectedPartKey(e.target.value)}
          style={{
            padding: "6px 8px",
            borderRadius: 4,
            border: "1px solid #2d2d44",
            backgroundColor: "#0f0f1a",
            color: "#e0e0e0",
            fontSize: 13,
          }}
        >
          <option value="">-- 请选择 --</option>
          {parts.map((p) => (
            <option key={p.key} value={p.key}>
              [{p.label}] {p.comp.name}
            </option>
          ))}
        </select>
      </div>
      {selectedPart && (
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          建议价格范围：{suggested?.min} - {suggested?.max} 金币
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, color: "#9ca3af" }}>出售价格</label>
        <input
          type="number"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          placeholder="输入价格"
          style={{
            padding: "6px 8px",
            borderRadius: 4,
            border: "1px solid #2d2d44",
            backgroundColor: "#0f0f1a",
            color: "#e0e0e0",
            fontSize: 13,
          }}
        />
      </div>
      <button
        onClick={handleList}
        disabled={!selectedPartKey || !sellPrice}
        style={{
          padding: "8px 0",
          borderRadius: 6,
          border: "none",
          fontWeight: 700,
          fontSize: 13,
          cursor: selectedPartKey && sellPrice ? "pointer" : "not-allowed",
          backgroundColor: selectedPartKey && sellPrice ? "#22c55e" : "#374151",
          color: selectedPartKey && sellPrice ? "#fff" : "#6b7280",
        }}
      >
        上架出售
      </button>
    </div>
  )
}

export default function Market() {
  const { marketItems, announcements, buyMarketItem, player } = useGameStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<TradeItemType | "all">("all")

  const filtered = marketItems.filter((item) => {
    const matchSearch = item.name.includes(search) || item.description.includes(search)
    const matchCategory = categoryFilter === "all" || item.type === categoryFilter
    return matchSearch && matchCategory
  })

  const tradeAnnouncements = announcements.filter((a) => a.type === "trade")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 20, color: "#e0e0e0" }}>
        <ShoppingBag size={24} />
        交易市场
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #2d2d44", backgroundColor: "#0f0f1a" }}>
          <Search size={16} style={{ color: "#6b7280" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索物品名称或描述..."
            style={{ flex: 1, border: "none", backgroundColor: "transparent", color: "#e0e0e0", fontSize: 13, outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={16} style={{ color: "#9ca3af" }} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TradeItemType | "all")}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #2d2d44",
              backgroundColor: "#0f0f1a",
              color: "#e0e0e0",
              fontSize: 13,
            }}
          >
            <option value="all">全部类型</option>
            <option value="blueprint">图纸</option>
            <option value="component">组件</option>
          </select>
        </div>
        <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
          💰 {player.gold} 金币
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        <div style={{ flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>暂无符合条件的商品</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {filtered.map((item) => (
                <MarketCard key={item.id} item={item} onBuy={() => buyMarketItem(item.id)} playerGold={player.gold} />
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 280, flexShrink: 0 }}>
          <SellPanel />
        </div>
      </div>

      <div
        style={{
          border: "1px solid #2d2d44",
          borderRadius: 8,
          padding: 16,
          backgroundColor: "#1a1a2e",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: "#e0e0e0", marginBottom: 10 }}>
          📜 最近交易公告
        </div>
        {tradeAnnouncements.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 13 }}>暂无交易公告</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tradeAnnouncements.slice(0, 8).map((ann) => (
              <div key={ann.id} style={{ fontSize: 12, color: "#9ca3af", padding: "4px 0", borderBottom: "1px solid #1f1f33" }}>
                {ann.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
