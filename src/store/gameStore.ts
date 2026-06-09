import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Airship, AirshipComponent, AirshipType, CrewMember, Airspace, BattleReport, Outpost, TradeItem, Announcement, LeaderboardEntry, WeeklyReport, BattleState, ExplorationEvent } from "@/types"
import { KEEL_COMPONENTS, ENGINE_COMPONENTS, SAIL_COMPONENTS, SPECIAL_COMPONENTS } from "@/data/components"
import { generateInitialCrew, generateRecruitmentPool } from "@/data/crew"
import { INITIAL_AIRSPACES, GUILD_DATA } from "@/data/airspace"
import { generateMarketItems, generateAnnouncements, generateLeaderboard, generateWeeklyReport } from "@/data/server"
import { calculateAirshipStats, calculateCombatPower } from "@/engine/statsCalc"
import { runFullBattle, createInitialBattleState } from "@/engine/battleSim"
import { generateEvent } from "@/engine/eventGen"

interface GameState {
  player: {
    id: string
    name: string
    gold: number
    resources: Record<string, number>
    airships: Airship[]
    crew: CrewMember[]
    guild: string | null
    airspaceScore: number
  }
  airspaces: Airspace[]
  outposts: Outpost[]
  battleReports: BattleReport[]
  marketItems: TradeItem[]
  announcements: Announcement[]
  leaderboard: LeaderboardEntry[]
  weeklyReport: WeeklyReport
  recruitmentPool: CrewMember[]
  battleState: BattleState
  currentEvent: ExplorationEvent | null
  isStormSeason: boolean
  todayWeather: string
  currentExplorationAirspaceId: string | null

  buildAirship: (name: string, type: AirshipType, keel: AirshipComponent, engine: AirshipComponent, sail: AirshipComponent, special: AirshipComponent | null) => void
  recruitCrew: (crewId: string) => void
  refreshRecruitment: () => void
  assignCrew: (crewId: string, airshipId: string | null) => void
  startExploration: (airshipId: string, airspaceId: string) => void
  triggerEvent: (airshipId: string) => void
  resolveEvent: (airshipId: string, choiceIndex: number) => void
  startBattle: (attackerAirshipId: string, defenderAirshipId: string, airspaceId: string) => void
  advanceBattleRound: () => void
  upgradeOutpost: (outpostId: string, resourceType: string, amount: number) => void
  buyMarketItem: (itemId: string) => void
  listMarketItem: (item: TradeItem) => void
  addGold: (amount: number) => void
  addResource: (type: string, amount: number) => void
  addAnnouncement: (ann: Announcement) => void
}

function createInitialAirship(): Airship {
  const keel = KEEL_COMPONENTS[0]
  const engine = ENGINE_COMPONENTS[0]
  const sail = SAIL_COMPONENTS[0]
  return {
    id: "airship_initial",
    name: "破浪号",
    type: "exploration",
    keel, engine, sail,
    specialDevice: null,
    stats: calculateAirshipStats("exploration", keel, engine, sail, null),
    crew: [],
    status: "docked",
    currentAltitude: 500,
    currentOxygen: 100,
    sailIntegrity: 100,
    enginePower: 100,
  }
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: {
        id: "player_1",
        name: "舰长",
        gold: 5000,
        resources: { ironwood: 100, mithril: 50, crystal: 30, aether: 20, fabric: 80, gold: 5000 },
        airships: [createInitialAirship()],
        crew: generateInitialCrew(),
        guild: "天际联盟",
        airspaceScore: 150,
      },
      airspaces: INITIAL_AIRSPACES,
      outposts: [
        { id: "outpost_1", name: "翡翠前哨站", airspaceId: "airspace_0", level: 1, contribution: { ironwood: 50, crystal: 20 }, bonuses: { cruiseRange: 5, gatherYield: 10 }, maxContribution: 200, currentContribution: 70 },
        { id: "outpost_2", name: "星辉前哨站", airspaceId: "airspace_3", level: 2, contribution: { mithril: 80, aether: 40 }, bonuses: { cruiseRange: 10, gatherYield: 20 }, maxContribution: 400, currentContribution: 120 },
      ],
      battleReports: [],
      marketItems: generateMarketItems(),
      announcements: generateAnnouncements(),
      leaderboard: generateLeaderboard(),
      weeklyReport: generateWeeklyReport(),
      recruitmentPool: generateRecruitmentPool(),
      battleState: createInitialBattleState(),
      currentEvent: null,
      isStormSeason: false,
      todayWeather: "多云转风",
      currentExplorationAirspaceId: null,

      buildAirship: (name, type, keel, engine, sail, special) => {
        const stats = calculateAirshipStats(type, keel, engine, sail, special)
        const newAirship: Airship = {
          id: `airship_${Date.now()}`,
          name, type, keel, engine, sail, specialDevice: special,
          stats, crew: [], status: "docked",
          currentAltitude: 500, currentOxygen: 100,
          sailIntegrity: 100, enginePower: 100,
        }
        const cost = 500 + (special ? 800 : 0)
        set(state => ({
          player: { ...state.player, airships: [...state.player.airships, newAirship], gold: Math.max(0, state.player.gold - cost) },
        }))
      },

      recruitCrew: (crewId) => {
        const state = get()
        const member = state.recruitmentPool.find(c => c.id === crewId)
        if (!member) return
        const cost = member.salary * 3
        if (state.player.gold < cost) return
        set(state => ({
          player: { ...state.player, crew: [...state.player.crew, { ...member, assignedAirship: null }], gold: state.player.gold - cost },
          recruitmentPool: state.recruitmentPool.filter(c => c.id !== crewId),
        }))
      },

      refreshRecruitment: () => {
        set({ recruitmentPool: generateRecruitmentPool() })
      },

      assignCrew: (crewId, airshipId) => {
        set(state => ({
          player: {
            ...state.player,
            crew: state.player.crew.map(c => c.id === crewId ? { ...c, assignedAirship: airshipId } : c),
          },
        }))
      },

      startExploration: (airshipId, airspaceId) => {
        set(state => ({
          player: {
            ...state.player,
            airships: state.player.airships.map(a =>
              a.id === airshipId ? { ...a, status: "exploring" as const, currentAltitude: 500, currentOxygen: 100, sailIntegrity: 100, enginePower: 100 } : a
            ),
          },
          currentExplorationAirspaceId: airspaceId,
        }))
      },

      triggerEvent: (airshipId) => {
        const state = get()
        const airship = state.player.airships.find(a => a.id === airshipId)
        if (!airship) return
        const targetAirspaceId = state.currentExplorationAirspaceId
        const airspace = targetAirspaceId
          ? state.airspaces.find(a => a.id === targetAirspaceId)
          : state.airspaces.find(a => !a.discovered) || state.airspaces[Math.floor(Math.random() * state.airspaces.length)]
        const event = generateEvent(airspace.dangerLevel, airship.type, airspace.weather)
        set({ currentEvent: event, currentExplorationAirspaceId: airspace.id })
      },

      resolveEvent: (airshipId, choiceIndex) => {
        const state = get()
        const event = state.currentEvent
        if (!event) return
        const choice = event.choices[choiceIndex]
        if (!choice) return

        const isDiscoveryEvent = event.type === "island" || event.type === "resource"
        const isGatherChoice = choiceIndex === 0 && isDiscoveryEvent
        const targetAirspaceId = state.currentExplorationAirspaceId

        const newResources = { ...state.player.resources }
        if (isGatherChoice && targetAirspaceId) {
          const airspace = state.airspaces.find(a => a.id === targetAirspaceId)
          if (airspace) {
            for (const res of airspace.resources) {
              const gathered = Math.round(res.amount * 0.6)
              newResources[res.type] = (newResources[res.type] || 0) + gathered
            }
          }
        }

        const newAirspaces = state.airspaces.map(a => {
          if (a.id !== targetAirspaceId) return a
          if (isDiscoveryEvent && !a.discovered) return { ...a, discovered: true }
          return a
        })

        set(state => ({
          player: {
            ...state.player,
            resources: newResources,
            airships: state.player.airships.map(a => {
              if (a.id !== airshipId) return a
              const updated = { ...a }
              if (choice.statChange.sailIntegrity) updated.sailIntegrity = Math.max(0, Math.min(100, a.sailIntegrity + (choice.statChange.sailIntegrity || 0)))
              if (choice.statChange.enginePower) updated.enginePower = Math.max(0, Math.min(100, a.enginePower + (choice.statChange.enginePower || 0)))
              if (choice.statChange.oxygen) updated.currentOxygen = Math.max(0, Math.min(100, a.currentOxygen + (choice.statChange.oxygen || 0)))
              if (choice.statChange.altitude) updated.currentAltitude = Math.max(0, a.currentAltitude + (choice.statChange.altitude || 0))
              return updated
            }),
            crew: state.player.crew.map(c => {
              if (c.assignedAirship !== airshipId || !choice.loyaltyChange) return c
              return { ...c, loyalty: Math.max(0, Math.min(100, c.loyalty + choice.loyaltyChange!)) }
            }),
          },
          airspaces: newAirspaces,
          currentEvent: null,
        }))
      },

      startBattle: (attackerAirshipId, defenderAirshipId, airspaceId) => {
        const state = get()
        const attacker = state.player.airships.find(a => a.id === attackerAirshipId)
        const airspace = state.airspaces.find(a => a.id === airspaceId)
        if (!attacker || !airspace) return

        const defenderStats = {
          ...attacker,
          id: "enemy",
          name: "敌方飞艇",
          stats: { maxSpeed: attacker.stats.maxSpeed * 0.9, maneuverability: attacker.stats.maneuverability * 0.85, defense: attacker.stats.defense * 1.1, capacity: attacker.stats.capacity * 0.7, range: attacker.stats.range * 0.8 },
        }
        const report = runFullBattle(attacker, defenderStats, airspace.name, airspace.weather)

        set(state => ({
          battleState: {
            phase: "finished",
            round: 5,
            attackerPower: calculateCombatPower(attacker.stats),
            defenderPower: calculateCombatPower(defenderStats.stats),
            attackerAdvantage: 0,
            weatherModifier: 0,
            currentDamage: report.damageReport,
            enemyDamage: { sailIntegrity: 30, enginePower: 20, crewCasualties: 2 },
            report,
          },
          battleReports: [report, ...state.battleReports],
          player: {
            ...state.player,
            gold: state.player.gold + (report.result === "victory" ? 500 : 100),
            airspaceScore: state.player.airspaceScore + (report.result === "victory" ? 50 : report.result === "draw" ? 10 : 0),
            airships: state.player.airships.map(a =>
              a.id === attackerAirshipId ? { ...a, status: "docked" as const, sailIntegrity: Math.max(0, a.sailIntegrity - report.damageReport.sailIntegrity), enginePower: Math.max(0, a.enginePower - report.damageReport.enginePower) } : a
            ),
          },
          announcements: [
            { id: `ann_${Date.now()}`, type: "battle" as const, message: `【争夺战】${report.result === "victory" ? "胜利" : "失败"}！${report.attacker} ${report.result === "victory" ? "击败" : "未能攻克"} 防守方于 ${airspace.name}`, timestamp: Date.now() },
            ...state.announcements,
          ],
        }))
      },

      advanceBattleRound: () => {
        set(state => ({
          battleState: { ...state.battleState, round: state.battleState.round + 1 },
        }))
      },

      upgradeOutpost: (outpostId, resourceType, amount) => {
        const state = get()
        const goldCost = amount * 5
        const ownedResource = state.player.resources[resourceType] ?? 0
        if (ownedResource < amount || state.player.gold < goldCost) return

        set(state => ({
          player: {
            ...state.player,
            resources: { ...state.player.resources, [resourceType]: ownedResource - amount },
            gold: state.player.gold - goldCost,
          },
          outposts: state.outposts.map(o => {
            if (o.id !== outpostId) return o
            const newContribution = { ...o.contribution, [resourceType]: (o.contribution[resourceType] || 0) + amount }
            const totalContrib = Object.values(newContribution).reduce((s, v) => s + v, 0)
            const newLevel = totalContrib >= o.maxContribution ? o.level + 1 : o.level
            return {
              ...o,
              contribution: newContribution,
              currentContribution: totalContrib,
              level: newLevel,
              bonuses: {
                cruiseRange: newLevel * 5,
                gatherYield: newLevel * 10,
              },
              maxContribution: newLevel * 200,
            }
          }),
        }))
      },

      buyMarketItem: (itemId) => {
        const state = get()
        const item = state.marketItems.find(i => i.id === itemId)
        if (!item || state.player.gold < item.price) return
        set(state => ({
          player: { ...state.player, gold: state.player.gold - item.price },
          marketItems: state.marketItems.filter(i => i.id !== itemId),
          isStormSeason: true,
          announcements: [
            { id: `ann_${Date.now()}_storm`, type: "storm" as const, message: `【暴风季】交易完成触发暴风季！今日飞行风险大幅提升！`, timestamp: Date.now() },
            { id: `ann_${Date.now()}`, type: "trade" as const, message: `【交易】舰长 以 ${item.price} 金币购入 ${item.name}`, timestamp: Date.now() },
            ...state.announcements,
          ],
        }))
      },

      listMarketItem: (item) => {
        set(state => ({
          marketItems: [...state.marketItems, item],
        }))
      },

      addGold: (amount) => {
        set(state => ({ player: { ...state.player, gold: state.player.gold + amount } }))
      },

      addResource: (type, amount) => {
        set(state => ({
          player: {
            ...state.player,
            resources: { ...state.player.resources, [type]: (state.player.resources[type] || 0) + amount },
          },
        }))
      },

      addAnnouncement: (ann) => {
        set(state => ({ announcements: [ann, ...state.announcements] }))
      },
    }),
    { name: "airship-game-storage" }
  )
)
