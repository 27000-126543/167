export type AirshipType = "exploration" | "combat" | "cargo"
export type ComponentCategory = "keel" | "engine" | "sail" | "special"
export type Rarity = "common" | "rare" | "epic" | "legendary"
export type CrewRole = "navigator" | "technician" | "gunner"
export type AirshipStatus = "docked" | "exploring" | "battle" | "repairing"
export type Weather = "clear" | "windy" | "storm" | "turbulence" | "fog"
export type ResourceType = "ironwood" | "mithril" | "crystal" | "aether" | "fabric" | "gold"
export type TradeItemType = "blueprint" | "component"

export interface AirshipStats {
  maxSpeed: number
  maneuverability: number
  defense: number
  capacity: number
  range: number
}

export interface AirshipComponent {
  id: string
  name: string
  category: ComponentCategory
  rarity: Rarity
  stats: Partial<AirshipStats>
  specialEffect?: string
  description: string
  icon: string
}

export interface Airship {
  id: string
  name: string
  type: AirshipType
  keel: AirshipComponent
  engine: AirshipComponent
  sail: AirshipComponent
  specialDevice: AirshipComponent | null
  stats: AirshipStats
  crew: CrewMember[]
  status: AirshipStatus
  currentAltitude: number
  currentOxygen: number
  sailIntegrity: number
  enginePower: number
}

export interface Skill {
  name: string
  level: number
  effect: string
  description: string
}

export interface CrewMember {
  id: string
  name: string
  role: CrewRole
  skills: Skill[]
  loyalty: number
  salary: number
  avatar: string
  assignedAirship: string | null
}

export interface Resource {
  type: ResourceType
  amount: number
}

export interface Airspace {
  id: string
  name: string
  hexQ: number
  hexR: number
  owner: string | null
  ownerColor: string
  resources: Resource[]
  discovered: boolean
  dangerLevel: number
  weather: Weather
  terrain: "island" | "cloud_sea" | "storm_zone" | "ruins" | "void"
}

export interface ExplorationEvent {
  id: string
  type: "storm" | "turbulence" | "eagle" | "island" | "resource" | "calm"
  title: string
  description: string
  choices: EventChoice[]
  timestamp: number
}

export interface EventChoice {
  text: string
  outcome: string
  statChange: Partial<AirshipStats & { oxygen: number; altitude: number; sailIntegrity: number; enginePower: number }>
  loyaltyChange?: number
}

export interface BattleReport {
  id: string
  attacker: string
  defender: string
  attackerAirship: string
  defenderAirship: string
  airspaceId: string
  airspaceName: string
  result: "victory" | "defeat" | "draw"
  kills: number
  loot: Resource[]
  damageReport: DamageReport
  timestamp: number
  combatLog: string[]
}

export interface DamageReport {
  sailIntegrity: number
  enginePower: number
  crewCasualties: number
}

export interface BattleState {
  phase: "preparing" | "fighting" | "finished"
  round: number
  attackerPower: number
  defenderPower: number
  attackerAdvantage: number
  weatherModifier: number
  currentDamage: DamageReport
  enemyDamage: DamageReport
  report: BattleReport | null
}

export interface Outpost {
  id: string
  name: string
  airspaceId: string
  level: number
  contribution: Record<string, number>
  bonuses: { cruiseRange: number; gatherYield: number }
  maxContribution: number
  currentContribution: number
}

export interface Guild {
  id: string
  name: string
  members: string[]
  wealth: number
  outposts: Outpost[]
  color: string
  controlledAirspaces: number
}

export interface TradeItem {
  id: string
  name: string
  type: TradeItemType
  componentId?: string
  seller: string
  price: number
  suggestedMin: number
  suggestedMax: number
  avgPrice7d: number
  rarity: Rarity
  listedAt: number
  description: string
}

export interface Announcement {
  id: string
  type: "trade" | "battle" | "storm" | "discovery"
  message: string
  timestamp: number
}

export interface WeeklyReport {
  weekNumber: number
  territoryHeatmap: Array<{ name: string; value: number; guild: string }>
  attendanceCurve: Array<{ date: string; count: number }>
  tradeRevenue: Array<{ route: string; revenue: number }>
  topEvents: string[]
}

export interface LeaderboardEntry {
  rank: number
  name: string
  airshipName: string
  airshipType: AirshipType
  combatPower: number
  airspaceScore: number
  guildName: string
  wealth: number
  airshipConfig?: Airship
}

export interface PlayerState {
  id: string
  name: string
  gold: number
  resources: Record<ResourceType, number>
  airships: Airship[]
  crew: CrewMember[]
  guild: string | null
  airspaceScore: number
}

export const AIRSHIP_TYPE_LABELS: Record<AirshipType, string> = {
  exploration: "探险型",
  combat: "战斗型",
  cargo: "货运型",
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9CA3AF",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
}

export const CREW_ROLE_LABELS: Record<CrewRole, string> = {
  navigator: "领航员",
  technician: "技师",
  gunner: "炮手",
}

export const WEATHER_LABELS: Record<Weather, string> = {
  clear: "晴朗",
  windy: "强风",
  storm: "风暴",
  turbulence: "乱流",
  fog: "迷雾",
}

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  ironwood: "铁木",
  mithril: "秘银",
  crystal: "水晶",
  aether: "以太",
  fabric: "织物",
  gold: "金币",
}
