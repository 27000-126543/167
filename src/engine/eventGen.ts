import type { ExplorationEvent, EventChoice, Weather, AirshipType } from "@/types"

const STORM_EVENTS: Omit<ExplorationEvent, "id" | "timestamp">[] = [
  {
    type: "storm",
    title: "风暴来袭！",
    description: "一道巨大的风暴墙正在逼近，闪电在云层中肆虐。",
    choices: [
      { text: "全速穿越", outcome: "成功穿越风暴！但帆布受损严重", statChange: { sailIntegrity: -15, maxSpeed: -5 }, loyaltyChange: 5 },
      { text: "绕行避风", outcome: "安全绕行，但耗费了大量时间和燃料", statChange: { range: -10, enginePower: -5 } },
    ],
  },
  {
    type: "turbulence",
    title: "暗流涌动",
    description: "前方检测到强烈的魔力乱流，飞艇剧烈颠簸！",
    choices: [
      { text: "稳住船身", outcome: "凭借精湛驾驶稳住了船身", statChange: { maneuverability: -3 }, loyaltyChange: 3 },
      { text: "借助乱流加速", outcome: "借助乱流的力量获得了速度提升！", statChange: { maxSpeed: 8, enginePower: -8 } },
    ],
  },
  {
    type: "eagle",
    title: "野生巨鹰袭击！",
    description: "一只翼展数十米的巨鹰向飞艇俯冲而来！",
    choices: [
      { text: "炮击驱赶", outcome: "成功击退巨鹰，获得了一些羽毛材料", statChange: { defense: -5 }, loyaltyChange: 8 },
      { text: "释放诱饵", outcome: "用食物引开了巨鹰，但损失了部分补给", statChange: { capacity: -5, oxygen: -5 } },
    ],
  },
  {
    type: "island",
    title: "发现浮空岛！",
    description: "在迷雾中，一座闪烁着奇异光芒的浮空岛缓缓浮现！",
    choices: [
      { text: "登岛探索", outcome: "在浮空岛上发现了丰富的资源和古代遗物！", statChange: { capacity: 5 }, loyaltyChange: 10 },
      { text: "远观记录", outcome: "详细记录了浮空岛的位置和特征，获得航线情报", statChange: { range: 5 } },
    ],
  },
  {
    type: "resource",
    title: "资源矿脉",
    description: "扫描仪检测到前方有高浓度魔力矿脉反应！",
    choices: [
      { text: "采集资源", outcome: "成功采集了大量稀有矿物！", statChange: { capacity: -3 }, loyaltyChange: 5 },
      { text: "标记位置后离开", outcome: "标记了矿脉位置，日后可派货运飞艇来采集", statChange: {} },
    ],
  },
  {
    type: "calm",
    title: "风平浪静",
    description: "这片空域出奇地平静，是进行维护和休整的好时机。",
    choices: [
      { text: "检修飞艇", outcome: "趁平静检修了帆布和引擎，恢复了一些耐久", statChange: { sailIntegrity: 10, enginePower: 5 } },
      { text: "训练船员", outcome: "组织了船员训练，士气有所提升", statChange: {}, loyaltyChange: 8 },
    ],
  },
]

export function generateEvent(dangerLevel: number, airshipType: AirshipType, weather: Weather): ExplorationEvent {
  let pool = [...STORM_EVENTS]
  
  if (weather === "storm") {
    pool = pool.filter(e => e.type === "storm" || Math.random() > 0.5)
  }
  if (dangerLevel > 5) {
    pool = pool.filter(e => e.type !== "calm")
  }
  if (airshipType === "exploration") {
    pool = [...pool, STORM_EVENTS.find(e => e.type === "island")!, STORM_EVENTS.find(e => e.type === "resource")!]
  }

  const selected = pool[Math.floor(Math.random() * pool.length)]
  return {
    ...selected,
    id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  }
}

export function generateWeather(): Weather {
  const weathers: Weather[] = ["clear", "clear", "windy", "storm", "turbulence", "fog"]
  return weathers[Math.floor(Math.random() * weathers.length)]
}
