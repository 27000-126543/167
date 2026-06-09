import type { Airspace, RouteNode, FlightRoute, Resource } from "@/types"

const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2
}

function getNeighborKeys(q: number, r: number): Array<{ q: number; r: number }> {
  return HEX_DIRECTIONS.map(d => ({ q: q + d.q, r: r + d.r }))
}

export function findPath(
  airspaces: Airspace[],
  startId: string,
  endId: string
): Airspace[] {
  const airspaceMap = new Map<string, Airspace>()
  for (const a of airspaces) airspaceMap.set(`${a.hexQ},${a.hexR}`, a)

  const start = airspaces.find(a => a.id === startId)
  const end = airspaces.find(a => a.id === endId)
  if (!start || !end) return []

  const visited = new Set<string>()
  const queue: Array<{ q: number; r: number; path: Airspace[] }> = [
    { q: start.hexQ, r: start.hexR, path: [start] },
  ]
  visited.add(`${start.hexQ},${start.hexR}`)

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.q === end.hexQ && current.r === end.hexR) {
      return current.path
    }

    const neighbors = getNeighborKeys(current.q, current.r)
    for (const n of neighbors) {
      const key = `${n.q},${n.r}`
      if (visited.has(key)) continue
      const airspace = airspaceMap.get(key)
      if (!airspace) continue
      visited.add(key)
      queue.push({ q: n.q, r: n.r, path: [...current.path, airspace] })
    }
  }
  return [start]
}

export function buildRouteNodes(airspaces: Airspace[]): RouteNode[] {
  return airspaces.map(a => ({
    airspaceId: a.id,
    airspaceName: a.name,
    hexQ: a.hexQ,
    hexR: a.hexR,
    terrain: a.terrain,
    weather: a.weather,
    dangerLevel: a.dangerLevel,
    resources: [...a.resources],
    discovered: a.discovered,
    owner: a.owner,
  }))
}

export function estimateRoute(
  nodes: RouteNode[],
  airshipRange: number,
  airshipCapacity: number
): {
  distance: number
  fuel: number
  durability: number
  risk: number
  resources: Resource[]
} {
  let distance = 0
  let risk = 0
  const resourceMap: Record<string, number> = {}

  for (let i = 1; i < nodes.length; i++) {
    distance += hexDistance(nodes[i - 1].hexQ, nodes[i - 1].hexR, nodes[i].hexQ, nodes[i].hexR)
    risk += nodes[i].dangerLevel
    if (!nodes[i].discovered) risk += 2
    for (const res of nodes[i].resources) {
      resourceMap[res.type] = (resourceMap[res.type] || 0) + res.amount
    }
  }

  const fuel = Math.round(distance * 8 * (1 + risk * 0.05))
  const durability = Math.round(risk * 3 + distance * 2)
  const resources = Object.entries(resourceMap).map(([type, amount]) => ({
    type: type as Resource["type"],
    amount: Math.round(amount * 0.6),
  }))

  return { distance, fuel, durability, risk, resources }
}

export function getAdjacentAirspaces(
  airspaces: Airspace[],
  hexQ: number,
  hexR: number
): Airspace[] {
  const neighborKeys = new Set(getNeighborKeys(hexQ, hexR).map(n => `${n.q},${n.r}`))
  return airspaces.filter(a => neighborKeys.has(`${a.hexQ},${a.hexR}`))
}

export { hexDistance }
