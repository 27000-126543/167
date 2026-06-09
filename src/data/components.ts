import type { AirshipComponent } from "@/types"

export const KEEL_COMPONENTS: AirshipComponent[] = [
  { id: "keel_ironwood", name: "铁木龙骨", category: "keel", rarity: "common", stats: { defense: 10, capacity: 15 }, description: "坚固耐用的基础龙骨，由铁木锻造而成", icon: "🦴" },
  { id: "keel_mithril", name: "秘银龙骨", category: "keel", rarity: "rare", stats: { defense: 20, capacity: 25, maneuverability: 5 }, description: "轻量且坚韧的秘银材质，兼顾防御与灵活", icon: "🦴" },
  { id: "keel_adamant", name: "精金龙骨", category: "keel", rarity: "epic", stats: { defense: 35, capacity: 30, maneuverability: 8 }, description: "极罕见的精金铸造，防御力冠绝诸骨", icon: "🦴" },
  { id: "keel_stormheart", name: "龙骨·风暴之心", category: "keel", rarity: "legendary", stats: { defense: 50, capacity: 40, maneuverability: 15, maxSpeed: 10 }, specialEffect: "风暴免疫：风暴天气中不受到速度惩罚", description: "传说中风暴巨人的脊骨，蕴含远古风暴之力", icon: "⚡" },
]

export const ENGINE_COMPONENTS: AirshipComponent[] = [
  { id: "engine_steam", name: "蒸汽核心", category: "engine", rarity: "common", stats: { maxSpeed: 15, range: 20 }, description: "基础蒸汽动力核心，稳定可靠", icon: "⚙️" },
  { id: "engine_arcane", name: "魔力涡轮", category: "engine", rarity: "rare", stats: { maxSpeed: 30, range: 35, maneuverability: 8 }, description: "以魔力驱动的涡轮引擎，动力充沛", icon: "⚙️" },
  { id: "engine_aether", name: "以太推进器", category: "engine", rarity: "epic", stats: { maxSpeed: 45, range: 50, maneuverability: 12 }, description: "以太能量推进，极速与续航兼得", icon: "⚙️" },
  { id: "engine_eternal", name: "引擎·永恒之火", category: "engine", rarity: "legendary", stats: { maxSpeed: 65, range: 70, maneuverability: 20, defense: 5 }, specialEffect: "永恒燃烧：引擎动力降至0时，保留10%基础动力", description: "传说中凤凰之火铸就的永动引擎", icon: "🔥" },
]

export const SAIL_COMPONENTS: AirshipComponent[] = [
  { id: "sail_cotton", name: "棉麻帆", category: "sail", rarity: "common", stats: { maxSpeed: 10, maneuverability: 10 }, description: "基础帆布，适合初学者操控", icon: "🪁" },
  { id: "sail_silk", name: "风灵丝绸", category: "sail", rarity: "rare", stats: { maxSpeed: 20, maneuverability: 22, range: 5 }, description: "附魔丝绸，与风的亲和力极高", icon: "🪁" },
  { id: "sail_stormwing", name: "暴风之翼", category: "sail", rarity: "epic", stats: { maxSpeed: 35, maneuverability: 38, range: 10 }, description: "能驾驭暴风的翼形帆布，机动性极佳", icon: "🪁" },
  { id: "sail_azure", name: "帆布·苍穹之翼", category: "sail", rarity: "legendary", stats: { maxSpeed: 50, maneuverability: 55, range: 15, defense: 5 }, specialEffect: "苍穹庇护：乱流事件中帆布不受损", description: "取自苍穹巨鹰羽翼的传说帆布", icon: "🦅" },
]

export const SPECIAL_COMPONENTS: AirshipComponent[] = [
  { id: "special_shield", name: "护盾发生器", category: "special", rarity: "rare", stats: { defense: 25 }, specialEffect: "能量护盾：战斗首回合伤害减免50%", description: "生成魔法护盾的装置，关键时刻保命利器", icon: "🛡️" },
  { id: "special_cloak", name: "隐形斗篷", category: "special", rarity: "epic", stats: { maneuverability: 15 }, specialEffect: "迷彩隐匿：探索时遭遇敌对事件概率降低40%", description: "光学迷彩系统，让飞艇融入天空", icon: "👻" },
  { id: "special_stormcaller", name: "风暴召唤器", category: "special", rarity: "epic", stats: { maxSpeed: 10 }, specialEffect: "呼风唤雨：争夺战中将天气改为风暴，降低对手机动性20%", description: "操控天气的禁忌装置，以风暴制敌", icon: "🌪️" },
  { id: "special_repair", name: "修复蜂群", category: "special", rarity: "rare", stats: { defense: 10 }, specialEffect: "自动修复：每回合恢复5%帆布完整度和引擎动力", description: "纳米修复蜂群，持续维护飞艇状态", icon: "🐝" },
  { id: "special_cargo", name: "折叠货舱", category: "special", rarity: "rare", stats: { capacity: 30 }, specialEffect: "空间折叠：载重提升30%，不影响速度", description: "利用空间折叠技术的超规格货舱", icon: "📦" },
  { id: "special_compass", name: "星罗盘", category: "special", rarity: "epic", stats: { range: 20 }, specialEffect: "星象导航：探索时发现浮空岛概率提升50%", description: "读取星象的古老罗盘，指引隐藏航线", icon: "🧭" },
]

export const ALL_COMPONENTS = [...KEEL_COMPONENTS, ...ENGINE_COMPONENTS, ...SAIL_COMPONENTS, ...SPECIAL_COMPONENTS]

export function getComponentsByCategory(category: AirshipComponent["category"]): AirshipComponent[] {
  return ALL_COMPONENTS.filter(c => c.category === category)
}
