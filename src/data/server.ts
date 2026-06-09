import type { TradeItem, Announcement, LeaderboardEntry, WeeklyReport } from "@/types"

const SELLER_NAMES = ["飞翼商人", "龙骨铸造师", "风暴掠夺者", "星空旅者", "暗影交易者", "云中行者", "铁锤匠人", "苍穹猎手"]

export function generateMarketItems(): TradeItem[] {
  const items: TradeItem[] = [
    { id: "trade_1", name: "隐形斗篷图纸", type: "blueprint", seller: pick(SELLER_NAMES), price: 2800, suggestedMin: 2500, suggestedMax: 3200, avgPrice7d: 2750, rarity: "epic", listedAt: Date.now() - 3600000, description: "隐形斗篷的制造图纸，极为稀有" },
    { id: "trade_2", name: "精金龙骨", type: "component", componentId: "keel_adamant", seller: pick(SELLER_NAMES), price: 1500, suggestedMin: 1200, suggestedMax: 1800, avgPrice7d: 1450, rarity: "epic", listedAt: Date.now() - 7200000, description: "精金铸造的顶级龙骨" },
    { id: "trade_3", name: "风暴召唤器图纸", type: "blueprint", seller: pick(SELLER_NAMES), price: 3200, suggestedMin: 2900, suggestedMax: 3600, avgPrice7d: 3100, rarity: "epic", listedAt: Date.now() - 1800000, description: "禁忌的风暴操控装置图纸" },
    { id: "trade_4", name: "魔力涡轮", type: "component", componentId: "engine_arcane", seller: pick(SELLER_NAMES), price: 800, suggestedMin: 650, suggestedMax: 950, avgPrice7d: 780, rarity: "rare", listedAt: Date.now() - 5400000, description: "魔力驱动的涡轮引擎" },
    { id: "trade_5", name: "风灵丝绸", type: "component", componentId: "sail_silk", seller: pick(SELLER_NAMES), price: 750, suggestedMin: 600, suggestedMax: 900, avgPrice7d: 720, rarity: "rare", listedAt: Date.now() - 900000, description: "附魔丝绸，风之亲和力极高" },
    { id: "trade_6", name: "永恒之火引擎图纸", type: "blueprint", seller: pick(SELLER_NAMES), price: 8000, suggestedMin: 7200, suggestedMax: 9000, avgPrice7d: 7800, rarity: "legendary", listedAt: Date.now() - 600000, description: "凤凰之火铸就的永动引擎图纸，传说级" },
    { id: "trade_7", name: "护盾发生器", type: "component", componentId: "special_shield", seller: pick(SELLER_NAMES), price: 600, suggestedMin: 500, suggestedMax: 750, avgPrice7d: 610, rarity: "rare", listedAt: Date.now() - 10800000, description: "魔法护盾装置，关键时刻保命" },
    { id: "trade_8", name: "星罗盘图纸", type: "blueprint", seller: pick(SELLER_NAMES), price: 2500, suggestedMin: 2200, suggestedMax: 2800, avgPrice7d: 2450, rarity: "epic", listedAt: Date.now() - 14400000, description: "读取星象的古老罗盘图纸" },
  ]
  return items
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateAnnouncements(): Announcement[] {
  return [
    { id: "ann_1", type: "trade", message: "【交易】飞翼商人 以 2800 金币售出 隐形斗篷图纸", timestamp: Date.now() - 600000 },
    { id: "ann_2", type: "battle", message: "【争夺战】铁翼商会 击败 星尘骑士团，占领 赤焰海域", timestamp: Date.now() - 1200000 },
    { id: "ann_3", type: "storm", message: "【暴风季】全服暴风季来临！今日飞行风险大幅提升！", timestamp: Date.now() - 300000 },
    { id: "ann_4", type: "discovery", message: "【发现】苍穹海盗团 发现远古遗迹「星辉环礁」", timestamp: Date.now() - 1800000 },
    { id: "ann_5", type: "trade", message: "【交易】龙骨铸造师 以 1500 金币售出 精金龙骨", timestamp: Date.now() - 2400000 },
    { id: "ann_6", type: "battle", message: "【争夺战】天际联盟 成功防御 翡翠飞舟会 的进攻", timestamp: Date.now() - 3600000 },
  ]
}

export function generateLeaderboard(): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = []
  const names = ["风暴猎手", "星辰旅者", "铁翼先锋", "翡翠领主", "赤焰战神", "苍穹之眼", "暗夜行者", "银霜骑士", "碧波导航", "金耀船长"]
  const types: Array<"exploration" | "combat" | "cargo"> = ["exploration", "combat", "cargo"]
  const guildNames = ["天际联盟", "铁翼商会", "星尘骑士团", "苍穹海盗团", "翡翠飞舟会", "赤焰军团"]
  
  for (let i = 0; i < 10; i++) {
    const power = Math.floor(Math.random() * 300) + 200 - i * 20
    entries.push({
      rank: i + 1,
      name: names[i],
      airshipName: `${names[i]}号`,
      airshipType: types[i % 3],
      combatPower: power,
      airspaceScore: Math.floor(Math.random() * 500) + 100 - i * 30,
      guildName: guildNames[i % guildNames.length],
      wealth: Math.floor(Math.random() * 20000) + 5000 - i * 1000,
    })
  }
  entries.sort((a, b) => b.combatPower - a.combatPower)
  entries.forEach((e, i) => e.rank = i + 1)
  return entries
}

export function generateWeeklyReport(): WeeklyReport {
  const guildNames = ["天际联盟", "铁翼商会", "星尘骑士团", "苍穹海盗团", "翡翠飞舟会", "赤焰军团"]
  const heatMap = guildNames.map((name, i) => ({
    name,
    value: Math.floor(Math.random() * 30) + 5,
    guild: name,
  }))

  const attendanceCurve = Array.from({ length: 7 }, (_, i) => ({
    date: `第${i + 1}天`,
    count: Math.floor(Math.random() * 3000) + 1000,
  }))

  const tradeRevenue = [
    { route: "翡翠→赤焰航线", revenue: Math.floor(Math.random() * 5000) + 2000 },
    { route: "苍穹→星辉航线", revenue: Math.floor(Math.random() * 4000) + 1500 },
    { route: "暮光→晨曦航线", revenue: Math.floor(Math.random() * 3500) + 1000 },
    { route: "暗影→银霜航线", revenue: Math.floor(Math.random() * 3000) + 800 },
    { route: "碧波→金耀航线", revenue: Math.floor(Math.random() * 2500) + 600 },
  ]

  return {
    weekNumber: 42,
    territoryHeatmap: heatMap,
    attendanceCurve,
    tradeRevenue,
    topEvents: ["天际联盟占领翡翠港湾", "暴风季持续3天", "苍穹海盗团发现远古遗迹", "全服贸易额突破10万金币"],
  }
}
