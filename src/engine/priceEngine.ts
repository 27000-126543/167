import type { PriceHistoryEntry, Rarity } from "@/types"

const RARITY_BASE_PRICES: Record<Rarity, { min: number; max: number; avg: number }> = {
  common: { min: 200, max: 500, avg: 350 },
  rare: { min: 500, max: 1200, avg: 800 },
  epic: { min: 1200, max: 3500, avg: 2200 },
  legendary: { min: 5000, max: 12000, avg: 8000 },
}

const CATEGORY_MULTIPLIER: Record<string, number> = {
  keel: 1.0,
  engine: 1.2,
  sail: 0.9,
  special: 1.3,
  blueprint: 1.5,
}

function computeMarketAvg(
  priceHistory: PriceHistoryEntry[],
  rarity: Rarity,
  category?: string
): number {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  let filtered = priceHistory.filter(
    (e) => e.rarity === rarity && e.timestamp >= sevenDaysAgo
  )
  if (category) {
    const byCategory = filtered.filter((e) => e.category === category)
    if (byCategory.length > 0) filtered = byCategory
  }
  if (filtered.length === 0) {
    const basePrices = RARITY_BASE_PRICES[rarity] || RARITY_BASE_PRICES.rare
    const catMultiplier = category ? (CATEGORY_MULTIPLIER[category] || 1.0) : 1.0
    return Math.round(basePrices.avg * catMultiplier)
  }
  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp)
  const recent = sorted.slice(0, 7)
  const sum = recent.reduce((s, e) => s + e.price, 0)
  return Math.round(sum / recent.length)
}

export function calculateSuggestedPrice(
  priceHistory: PriceHistoryEntry[],
  rarity: string,
  category?: string
): { min: number; max: number } {
  const rarityKey = rarity as Rarity
  const effectiveAvg = computeMarketAvg(priceHistory, rarityKey, category)

  const rarityMultiplier: Record<string, number> = {
    common: 0.15,
    rare: 0.2,
    epic: 0.25,
    legendary: 0.3,
  }
  const spread = rarityMultiplier[rarity] || 0.2
  return {
    min: Math.round(effectiveAvg * (1 - spread)),
    max: Math.round(effectiveAvg * (1 + spread)),
  }
}

export function getAvgPrice7d(
  priceHistory: PriceHistoryEntry[],
  rarity: string,
  category?: string
): number {
  return computeMarketAvg(priceHistory, rarity as Rarity, category)
}

export function isPriceInRange(price: number, suggestedMin: number, suggestedMax: number): "low" | "fair" | "high" {
  if (suggestedMin <= 0 && suggestedMax <= 0) return "fair"
  if (price < suggestedMin) return "low"
  if (price > suggestedMax) return "high"
  return "fair"
}

export function generateTradeId(): string {
  return `trade_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function calculateTransactionFee(price: number): number {
  return Math.round(price * 0.05)
}
