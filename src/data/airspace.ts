import type { Airspace, Weather } from "@/types"

const GUILD_NAMES = ["天际联盟", "铁翼商会", "星尘骑士团", "苍穹海盗团", "翡翠飞舟会", "赤焰军团"]
const GUILD_COLORS = ["#2A9D8F", "#E76F51", "#6C5CE7", "#D63031", "#00B894", "#FDCB6E"]
const TERRAIN_NAMES: Record<Airspace["terrain"], string> = {
  island: "浮空岛",
  cloud_sea: "云海",
  storm_zone: "风暴带",
  ruins: "远古遗迹",
  void: "虚空裂隙",
}
const AIRSPACE_PREFIXES = ["翡翠", "赤焰", "苍穹", "星辉", "暮光", "晨曦", "暗影", "银霜", "碧波", "金耀", "紫雷", "风语", "月华", "霜华", "炎阳"]
const AIRSPACE_SUFFIXES = ["群岛", "海域", "空域", "云廊", "走廊", "领域", "走廊", "高原", "深渊", "环礁"]

function generateAirspaces(): Airspace[] {
  const airspaces: Airspace[] = []
  let id = 0
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      if (Math.abs(q + r) > 3) continue
      const dist = Math.abs(q) + Math.abs(r)
      const guildIdx = dist > 1 ? Math.floor(Math.random() * GUILD_NAMES.length) : -1
      const weatherPool: Weather[] = dist <= 1 ? ["clear", "windy"] : dist <= 3 ? ["clear", "windy", "storm", "turbulence"] : ["storm", "turbulence", "fog"]
      const terrainPool: Airspace["terrain"][] = dist <= 1 ? ["island", "cloud_sea"] : dist <= 3 ? ["island", "cloud_sea", "ruins", "storm_zone"] : ["storm_zone", "ruins", "void"]
      const resourceTypes = ["ironwood", "mithril", "crystal", "aether", "fabric"] as const

      airspaces.push({
        id: `airspace_${id}`,
        name: `${AIRSPACE_PREFIXES[Math.floor(Math.random() * AIRSPACE_PREFIXES.length)]}${AIRSPACE_SUFFIXES[Math.floor(Math.random() * AIRSPACE_SUFFIXES.length)]}`,
        hexQ: q,
        hexR: r,
        owner: guildIdx >= 0 ? GUILD_NAMES[guildIdx] : "天际联盟",
        ownerColor: guildIdx >= 0 ? GUILD_COLORS[guildIdx] : "#2A9D8F",
        resources: dist <= 1
          ? [{ type: resourceTypes[Math.floor(Math.random() * 3)], amount: Math.floor(Math.random() * 50) + 20 }]
          : [{ type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)], amount: Math.floor(Math.random() * 100) + 30 }],
        discovered: dist <= 2,
        dangerLevel: Math.min(10, dist + Math.floor(Math.random() * 3)),
        weather: weatherPool[Math.floor(Math.random() * weatherPool.length)],
        terrain: terrainPool[Math.floor(Math.random() * terrainPool.length)],
      })
      id++
    }
  }
  airspaces[0].name = "翡翠港湾"
  airspaces[0].discovered = true
  airspaces[0].dangerLevel = 0
  airspaces[0].weather = "clear"
  airspaces[0].owner = "天际联盟"
  airspaces[0].terrain = "island"
  return airspaces
}

export const INITIAL_AIRSPACES = generateAirspaces()

export const GUILD_DATA = GUILD_NAMES.map((name, i) => ({
  id: `guild_${i}`,
  name,
  color: GUILD_COLORS[i],
  members: Math.floor(Math.random() * 200) + 50,
  wealth: Math.floor(Math.random() * 50000) + 10000,
  controlledAirspaces: 0,
  outposts: [],
}))

export { TERRAIN_NAMES, GUILD_NAMES, GUILD_COLORS }
