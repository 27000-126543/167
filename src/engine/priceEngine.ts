import type { TradeItem, Rarity } from "@/types"

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

export function calculateSuggestedPrice(avgPrice7d: number, rarity: string, category?: string): { min: number; max: number } {
  const rarityKey = rarity as Rarity
  const basePrices = RARITY_BASE_PRICES[rarityKey] || RARITY_BASE_PRICES.rare

  let effectiveAvg = avgPrice7d
  if (!effectiveAvg || effectiveAvg <= 0) {
    effectiveAvg = basePrices.avg
  }

  const catMultiplier = category ? (CATEGORY_MULTIPLIER[category] || 1.0) : 1.0
  effectiveAvg = Math.round(effectiveAvg * catMultiplier)

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

export function getAvgPrice7d(rarity: string, category?: string): number {
  const rarityKey = rarity as Rarity
  const basePrices = RARITY_BASE_PRICES[rarityKey] || RARITY_BASE_PRICES.rare
  const catMultiplier = category ? (CATEGORY_MULTIPLIER[category] || 1.0) : 1.0
  return Math.round(basePrices.avg * catMultiplier)
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
