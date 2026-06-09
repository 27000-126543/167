import type { AirshipStats, AirshipComponent, AirshipType } from "@/types"

const TYPE_MULTIPLIERS: Record<AirshipType, Partial<Record<keyof AirshipStats, number>>> = {
  exploration: { range: 1.3, maneuverability: 1.15, maxSpeed: 1.1 },
  combat: { defense: 1.3, maxSpeed: 1.1, maneuverability: 1.1 },
  cargo: { capacity: 1.4, range: 1.1, defense: 1.1 },
}

const BASE_STATS: AirshipStats = {
  maxSpeed: 5,
  maneuverability: 5,
  defense: 5,
  capacity: 5,
  range: 5,
}

export function calculateAirshipStats(
  type: AirshipType,
  keel: AirshipComponent,
  engine: AirshipComponent,
  sail: AirshipComponent,
  specialDevice: AirshipComponent | null
): AirshipStats {
  const merged: AirshipStats = { ...BASE_STATS }

  const allComponents = [keel, engine, sail, ...(specialDevice ? [specialDevice] : [])]
  for (const comp of allComponents) {
    const s = comp.stats
    if (s.maxSpeed) merged.maxSpeed += s.maxSpeed
    if (s.maneuverability) merged.maneuverability += s.maneuverability
    if (s.defense) merged.defense += s.defense
    if (s.capacity) merged.capacity += s.capacity
    if (s.range) merged.range += s.range
  }

  const multipliers = TYPE_MULTIPLIERS[type]
  for (const [key, mult] of Object.entries(multipliers)) {
    merged[key as keyof AirshipStats] = Math.round(merged[key as keyof AirshipStats] * (mult as number))
  }

  merged.maxSpeed = Math.round(merged.maxSpeed * 10) / 10
  merged.maneuverability = Math.round(merged.maneuverability * 10) / 10
  merged.defense = Math.round(merged.defense * 10) / 10
  merged.capacity = Math.round(merged.capacity * 10) / 10
  merged.range = Math.round(merged.range * 10) / 10

  return merged
}

export function calculateCombatPower(stats: AirshipStats): number {
  return Math.round(
    stats.maxSpeed * 1.2 +
    stats.maneuverability * 1.5 +
    stats.defense * 2.0 +
    stats.capacity * 0.5 +
    stats.range * 0.8
  )
}

export function calculateTypeEfficiency(type: AirshipType, stats: AirshipStats): number {
  switch (type) {
    case "exploration":
      return Math.round(stats.range * 1.5 + stats.maneuverability * 1.2 + stats.maxSpeed * 0.8)
    case "combat":
      return Math.round(stats.defense * 1.5 + stats.maxSpeed * 1.2 + stats.maneuverability * 0.8)
    case "cargo":
      return Math.round(stats.capacity * 1.5 + stats.range * 1.0 + stats.defense * 0.5)
  }
}

export function getStatLabel(key: keyof AirshipStats): string {
  const labels: Record<keyof AirshipStats, string> = {
    maxSpeed: "极速",
    maneuverability: "机动性",
    defense: "防御力",
    capacity: "载重",
    range: "航程",
  }
  return labels[key]
}
