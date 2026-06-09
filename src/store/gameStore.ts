import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Airship, AirshipComponent, AirshipType, CrewMember, Airspace,
  BattleReport, Outpost, TradeItem, Announcement, LeaderboardEntry,
  WeeklyReport, BattleState, ExplorationEvent, FlightRoute, RouteProgress,
  GuildWarRecord, GuildSeasonState, SellRecord, PriceHistoryEntry, RouteNode,
} from "@/types"
import { KEEL_COMPONENTS, ENGINE_COMPONENTS, SAIL_COMPONENTS, SPECIAL_COMPONENTS } from "@/data/components"
import { generateInitialCrew, generateRecruitmentPool } from "@/data/crew"
import { INITIAL_AIRSPACES, GUILD_NAMES, GUILD_COLORS } from "@/data/airspace"
import { generateMarketItems, generateAnnouncements, generateLeaderboard, generateWeeklyReport } from "@/data/server"
import { calculateAirshipStats, calculateCombatPower } from "@/engine/statsCalc"
import { runFullBattle, createInitialBattleState } from "@/engine/battleSim"
import { generateEvent } from "@/engine/eventGen"
import { findPath, estimateRoute, buildRouteNodes, getAdjacentAirspaces, hexDistance } from "@/engine/routePlanner"

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
  currentRoute: FlightRoute | null
  routeProgress: RouteProgress | null
  guildSeason: GuildSeasonState
  playerListings: SellRecord[]
  priceHistory: PriceHistoryEntry[]
  savedRoutes: Array<{
    id: string
    name: string
    startId: string
    startName: string
    endId: string
    endName: string
    lastResult?: {
      gatheredResources: Record<string, number>
      discoveries: string[]
      sailWear: number
      engineWear: number
      completedAt: number
    }
  }>
  completedRoutes: Array<{
    route: FlightRoute
    gatheredResources: Record<string, number>
    discoveries: string[]
    sailWear: number
    engineWear: number
    completedAt: number
  }>

  buildAirship: (name: string, type: AirshipType, keel: AirshipComponent, engine: AirshipComponent, sail: AirshipComponent, special: AirshipComponent | null) => void
  recruitCrew: (crewId: string) => void
  refreshRecruitment: () => void
  assignCrew: (crewId: string, airshipId: string | null) => void
  startExploration: (airshipId: string, airspaceId: string) => void
  triggerEvent: (airshipId: string) => void
  resolveEvent: (airshipId: string, choiceIndex: number) => void
  planRoute: (airshipId: string, startId: string, endId: string) => FlightRoute | null
  launchRoute: (route: FlightRoute) => void
  advanceRouteNode: () => void
  completeRoute: () => void
  clearCurrentRoute: () => void
  saveRoute: (name: string, startId: string, startName: string, endId: string, endName: string) => void
  deleteSavedRoute: (id: string) => void
  startBattle: (attackerAirshipId: string, defenderAirshipId: string, airspaceId: string) => void
  advanceBattleRound: () => void
  launchGuildWar: (airshipId: string, airspaceId: string, action: "attack" | "defend") => void
  upgradeOutpost: (outpostId: string, resourceType: string, amount: number) => void
  buyMarketItem: (itemId: string) => void
  listMarketItem: (item: TradeItem) => void
  cancelListing: (listingId: string) => void
  repriceListing: (listingId: string, newPrice: number) => void
  repairAirship: (airshipId: string, targetSail: number, targetEngine: number) => void
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

function createGuildSeason(airspaces: Airspace[]): GuildSeasonState {
  const guildScores: GuildSeasonState["guildScores"] = {}
  for (const name of GUILD_NAMES) {
    guildScores[name] = {
      points: Math.floor(Math.random() * 500) + 100,
      wins: Math.floor(Math.random() * 10),
      losses: Math.floor(Math.random() * 8),
      controlledAirspaces: airspaces.filter(a => a.owner === name).length,
    }
  }
  return { weekNumber: 42, guildScores, warRecords: [] }
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
      currentRoute: null,
      routeProgress: null,
      guildSeason: createGuildSeason(INITIAL_AIRSPACES),
      playerListings: [],
      priceHistory: [],
      savedRoutes: [],
      completedRoutes: [],

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

        let adjacentDiscovered = false
        const newAirspaces = state.airspaces.map(a => {
          if (a.id === targetAirspaceId && isDiscoveryEvent && !a.discovered) {
            return { ...a, discovered: true }
          }
          return a
        })

        if (isDiscoveryEvent && isGatherChoice && targetAirspaceId) {
          const targetAirspace = state.airspaces.find(a => a.id === targetAirspaceId)
          if (targetAirspace) {
            const adjacentUndiscovered = getAdjacentAirspaces(newAirspaces, targetAirspace.hexQ, targetAirspace.hexR)
              .filter(a => !a.discovered)
            if (adjacentUndiscovered.length > 0) {
              const toDiscover = adjacentUndiscovered[0]
              const idx = newAirspaces.findIndex(a => a.id === toDiscover.id)
              if (idx >= 0) {
                newAirspaces[idx] = { ...newAirspaces[idx], discovered: true }
                adjacentDiscovered = true
              }
            }
          }
        }

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
          announcements: adjacentDiscovered
            ? [{ id: `ann_${Date.now()}_disc`, type: "discovery" as const, message: `【发现】探索航线新发现：相邻未知空域已点亮！`, timestamp: Date.now() }, ...state.announcements]
            : state.announcements,
        }))
      },

      planRoute: (airshipId, startId, endId) => {
        const state = get()
        const airship = state.player.airships.find(a => a.id === airshipId)
        if (!airship) return null
        const pathAirspaces = findPath(state.airspaces, startId, endId)
        if (pathAirspaces.length === 0) return null
        const nodes = buildRouteNodes(pathAirspaces)
        const est = estimateRoute(nodes, airship.stats.range, airship.stats.capacity)
        const route: FlightRoute = {
          id: `route_${Date.now()}`,
          airshipId,
          airshipName: airship.name,
          nodes,
          estimatedDistance: est.distance,
          estimatedFuel: est.fuel,
          estimatedDurability: est.durability,
          estimatedRisk: est.risk,
          estimatedResources: est.resources,
          createdAt: Date.now(),
        }
        set({ currentRoute: route })
        return route
      },

      launchRoute: (route) => {
        const state = get()
        set({
          player: {
            ...state.player,
            airships: state.player.airships.map(a =>
              a.id === route.airshipId ? { ...a, status: "exploring" as const } : a
            ),
          },
          currentRoute: route,
          routeProgress: {
            route,
            currentNodeIndex: 0,
            gatheredResources: {},
            discoveries: [],
            sailWear: 0,
            engineWear: 0,
            fuelUsed: 0,
            startedAt: Date.now(),
            completedAt: null,
          },
          currentExplorationAirspaceId: route.nodes[0]?.airspaceId ?? null,
        })
      },

      advanceRouteNode: () => {
        const state = get()
        const progress = state.routeProgress
        if (!progress || progress.completedAt) return

        const nextIdx = progress.currentNodeIndex + 1
        const node = progress.route.nodes[nextIdx]
        if (!node) return

        const prevNode = progress.route.nodes[progress.currentNodeIndex]
        const dist = hexDistance(prevNode.hexQ, prevNode.hexR, node.hexQ, node.hexR)

        const newGathered = { ...progress.gatheredResources }
        if (node.discovered) {
          for (const res of node.resources) {
            const amount = Math.round(res.amount * 0.5)
            newGathered[res.type] = (newGathered[res.type] || 0) + amount
          }
        }

        const newDiscoveries = [...progress.discoveries]
        const newAirspaces = [...state.airspaces]
        if (!node.discovered) {
          const idx = newAirspaces.findIndex(a => a.id === node.airspaceId)
          if (idx >= 0) {
            newAirspaces[idx] = { ...newAirspaces[idx], discovered: true }
            newDiscoveries.push(node.airspaceName)
          }
        }

        const sailWear = progress.sailWear + dist * 2 + node.dangerLevel
        const engineWear = progress.engineWear + dist * 1.5
        const fuelUsed = progress.fuelUsed + dist * 8

        const isLastNode = nextIdx >= progress.route.nodes.length - 1

        set(state => ({
          airspaces: newAirspaces,
          routeProgress: {
            ...progress,
            currentNodeIndex: nextIdx,
            gatheredResources: newGathered,
            discoveries: newDiscoveries,
            sailWear,
            engineWear,
            fuelUsed,
            completedAt: isLastNode ? Date.now() : null,
          },
          currentExplorationAirspaceId: node.airspaceId,
          player: {
            ...state.player,
            resources: { ...state.player.resources, ...Object.fromEntries(Object.entries(newGathered).map(([k, v]) => [k, (state.player.resources[k] || 0) + (v - (progress.gatheredResources[k] || 0))])) },
          },
        }))
      },

      completeRoute: () => {
        const state = get()
        const progress = state.routeProgress
        if (!progress) return

        const completedEntry = {
          route: progress.route,
          gatheredResources: progress.gatheredResources,
          discoveries: progress.discoveries,
          sailWear: progress.sailWear,
          engineWear: progress.engineWear,
          completedAt: Date.now(),
        }

        const firstNode = progress.route.nodes[0]
        const lastNode = progress.route.nodes[progress.route.nodes.length - 1]

        const updatedSavedRoutes = state.savedRoutes.map(sr => {
          if (sr.startId === firstNode?.airspaceId && sr.endId === lastNode?.airspaceId) {
            return {
              ...sr,
              lastResult: {
                gatheredResources: progress.gatheredResources,
                discoveries: progress.discoveries,
                sailWear: progress.sailWear,
                engineWear: progress.engineWear,
                completedAt: Date.now(),
              },
            }
          }
          return sr
        })

        set(state => ({
          player: {
            ...state.player,
            airships: state.player.airships.map(a =>
              a.id === progress.route.airshipId
                ? {
                    ...a,
                    status: "docked" as const,
                    sailIntegrity: Math.max(0, a.sailIntegrity - progress.sailWear),
                    enginePower: Math.max(0, a.enginePower - progress.engineWear),
                  }
                : a
            ),
          },
          currentRoute: null,
          routeProgress: null,
          currentExplorationAirspaceId: null,
          currentEvent: null,
          completedRoutes: [completedEntry, ...state.completedRoutes],
          savedRoutes: updatedSavedRoutes,
          announcements: [
            { id: `ann_${Date.now()}_route`, type: "discovery" as const, message: `【返航】${progress.route.airshipName} 完成航线探索！发现 ${progress.discoveries.length} 个新空域`, timestamp: Date.now() },
            ...state.announcements,
          ],
        }))
      },

      clearCurrentRoute: () => {
        set({ currentRoute: null })
      },

      saveRoute: (name, startId, startName, endId, endName) => {
        set(state => ({
          savedRoutes: [
            ...state.savedRoutes,
            { id: `sr_${Date.now()}`, name, startId, startName, endId, endName },
          ],
        }))
      },

      deleteSavedRoute: (id) => {
        set(state => ({
          savedRoutes: state.savedRoutes.filter(sr => sr.id !== id),
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

      launchGuildWar: (airshipId, airspaceId, action) => {
        const state = get()
        const airship = state.player.airships.find(a => a.id === airshipId)
        const airspace = state.airspaces.find(a => a.id === airspaceId)
        if (!airship || !airspace || !state.player.guild) return

        const attackingGuild = action === "attack" ? state.player.guild! : (airspace.owner || "无主")
        const defendingGuild = action === "attack" ? (airspace.owner || "无主") : state.player.guild!
        const attackerPower = calculateCombatPower(airship.stats)
        const defenderPower = Math.round(attackerPower * (0.7 + Math.random() * 0.5))
        const won = attackerPower * (0.8 + Math.random() * 0.4) > defenderPower

        const result: "victory" | "defeat" | "draw" = won ? "victory" : (Math.random() > 0.3 ? "defeat" : "draw")
        const warRecord: GuildWarRecord = {
          id: `gw_${Date.now()}`,
          attackingGuild,
          defendingGuild,
          airspaceId,
          airspaceName: airspace.name,
          action,
          result,
          timestamp: Date.now(),
        }

        const newAirspaces = state.airspaces.map(a => {
          if (a.id !== airspaceId) return a
          if (result === "victory" && action === "attack") {
            const guildIdx = GUILD_NAMES.indexOf(state.player.guild!)
            return { ...a, owner: state.player.guild!, ownerColor: guildIdx >= 0 ? GUILD_COLORS[guildIdx] : "#2A9D8F" }
          }
          return a
        })

        const newGuildScores = { ...state.guildSeason.guildScores }
        for (const name of GUILD_NAMES) {
          if (!newGuildScores[name]) {
            newGuildScores[name] = { points: 0, wins: 0, losses: 0, controlledAirspaces: 0 }
          }
        }
        if (result === "victory") {
          const atk = newGuildScores[attackingGuild]
          if (atk) { atk.wins++; atk.points += 50 }
          const def = newGuildScores[defendingGuild]
          if (def) { def.losses++ }
        } else if (result === "defeat") {
          const atk = newGuildScores[attackingGuild]
          if (atk) { atk.losses++ }
          const def = newGuildScores[defendingGuild]
          if (def) { def.wins++; def.points += 30 }
        } else {
          const atk = newGuildScores[attackingGuild]
          if (atk) { atk.points += 10 }
          const def = newGuildScores[defendingGuild]
          if (def) { def.points += 10 }
        }

        for (const name of GUILD_NAMES) {
          if (newGuildScores[name]) {
            newGuildScores[name].controlledAirspaces = newAirspaces.filter(a => a.owner === name).length
          }
        }

        const goldReward = result === "victory" ? 800 : result === "draw" ? 200 : 100

        set(state => ({
          airspaces: newAirspaces,
          guildSeason: {
            ...state.guildSeason,
            guildScores: newGuildScores,
            warRecords: [warRecord, ...state.guildSeason.warRecords],
          },
          player: {
            ...state.player,
            gold: state.player.gold + goldReward,
            airspaces: state.player.airships.map(a =>
              a.id === airshipId ? { ...a, status: "docked" as const } : a
            ),
          },
          announcements: [
            { id: `ann_${Date.now()}_gw`, type: "battle" as const, message: `【公会战】${attackingGuild} ${result === "victory" ? "击败" : result === "defeat" ? "败于" : "战平"} ${defendingGuild} 于 ${airspace.name}`, timestamp: Date.now() },
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

        const isPlayerListing = state.playerListings.some(l => l.itemId === itemId)
        let updatedListings = state.playerListings
        let newPriceHistory = state.priceHistory
        if (isPlayerListing) {
          updatedListings = state.playerListings.map(l =>
            l.itemId === itemId ? { ...l, status: "sold" as const, soldAt: Date.now() } : l
          )
          const listing = state.playerListings.find(l => l.itemId === itemId)
          if (listing) {
            newPriceHistory = [
              ...state.priceHistory,
              { rarity: listing.rarity, category: listing.category, price: listing.price, timestamp: Date.now() },
            ]
          }
        }

        set(state => ({
          player: {
            ...state.player,
            gold: isPlayerListing
              ? state.player.gold + item.price
              : state.player.gold - item.price,
          },
          marketItems: state.marketItems.filter(i => i.id !== itemId),
          playerListings: updatedListings,
          priceHistory: newPriceHistory,
          isStormSeason: true,
          announcements: [
            { id: `ann_${Date.now()}_storm`, type: "storm" as const, message: `【暴风季】交易完成触发暴风季！今日飞行风险大幅提升！`, timestamp: Date.now() },
            { id: `ann_${Date.now()}`, type: "trade" as const, message: `【交易】${isPlayerListing ? `${item.name} 已售出，获得 ${item.price} 金币` : `舰长 以 ${item.price} 金币购入 ${item.name}`}`, timestamp: Date.now() },
            ...state.announcements,
          ],
        }))
      },

      listMarketItem: (item) => {
        const state = get()
        const sellRecord: SellRecord = {
          id: `sell_${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          rarity: item.rarity,
          category: item.type === "blueprint" ? "blueprint" : (item.componentId?.split("_")[0] || "keel"),
          price: item.price,
          status: "active",
          listedAt: Date.now(),
          soldAt: null,
        }
        set(state => ({
          marketItems: [...state.marketItems, item],
          playerListings: [...state.playerListings, sellRecord],
        }))
      },

      cancelListing: (listingId) => {
        const state = get()
        const listing = state.playerListings.find(l => l.id === listingId)
        if (!listing || listing.status !== "active") return
        set(state => ({
          playerListings: state.playerListings.map(l =>
            l.id === listingId ? { ...l, status: "cancelled" as const } : l
          ),
          marketItems: state.marketItems.filter(i => i.id !== listing.itemId),
        }))
      },

      repriceListing: (listingId, newPrice) => {
        const state = get()
        const listing = state.playerListings.find(l => l.id === listingId)
        if (!listing || listing.status !== "active" || newPrice <= 0) return
        set(state => ({
          playerListings: state.playerListings.map(l =>
            l.id === listingId ? { ...l, price: newPrice } : l
          ),
          marketItems: state.marketItems.map(i =>
            i.id === listing.itemId ? { ...i, price: newPrice } : i
          ),
        }))
      },

      repairAirship: (airshipId, targetSail, targetEngine) => {
        const state = get()
        const airship = state.player.airships.find(a => a.id === airshipId)
        if (!airship) return
        const sailRepair = Math.max(0, targetSail - airship.sailIntegrity)
        const engineRepair = Math.max(0, targetEngine - airship.enginePower)
        if (sailRepair <= 0 && engineRepair <= 0) return
        const goldCost = (sailRepair + engineRepair) * 3
        const fabricCost = Math.ceil(sailRepair / 5)
        const ironwoodCost = Math.ceil(engineRepair / 5)
        if (state.player.gold < goldCost) return
        if ((state.player.resources.fabric || 0) < fabricCost) return
        if ((state.player.resources.ironwood || 0) < ironwoodCost) return
        set(state => ({
          player: {
            ...state.player,
            gold: state.player.gold - goldCost,
            resources: {
              ...state.player.resources,
              fabric: (state.player.resources.fabric || 0) - fabricCost,
              ironwood: (state.player.resources.ironwood || 0) - ironwoodCost,
            },
            airships: state.player.airships.map(a =>
              a.id === airshipId
                ? {
                    ...a,
                    sailIntegrity: Math.min(100, a.sailIntegrity + sailRepair),
                    enginePower: Math.min(100, a.enginePower + engineRepair),
                  }
                : a
            ),
          },
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
    {
      name: "airship-game-storage",
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<GameState>) }
        if (merged.airspaces && merged.guildSeason) {
          const gs = { ...merged.guildSeason }
          const scores = { ...gs.guildScores }
          for (const name of Object.keys(scores)) {
            scores[name] = { ...scores[name], controlledAirspaces: merged.airspaces.filter(a => a.owner === name).length }
          }
          gs.guildScores = scores
          merged.guildSeason = gs
        }
        return merged
      },
    }
  )
)
