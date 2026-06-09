import type { TradeItem } from "@/types"

export function calculateSuggestedPrice(avgPrice7d: number, rarity: string): { min: number; max: number } {
  const rarityMultiplier: Record<string, number> = {
    common: 0.1,
    rare: 0.15,
    epic: 0.2,
    legendary: 0.25,
  }
  const spread = rarityMultiplier[rarity] || 0.15
  return {
    min: Math.round(avgPrice7d * (1 - spread)),
    max: Math.round(avgPrice7d * (1 + spread)),
  }
}

export function isPriceInRange(price: number, suggestedMin: number, suggestedMax: number): "low" | "fair" | "high" {
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
