import type { Airship, AirshipStats, Weather, DamageReport, BattleReport, BattleState } from "@/types"
import { calculateCombatPower } from "./statsCalc"

const WEATHER_BONUS: Record<Weather, number> = {
  clear: 0,
  windy: -0.05,
  storm: -0.15,
  turbulence: -0.10,
  fog: -0.08,
}

function roll(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function calculateAdvantage(
  attacker: Airship,
  defender: Airship,
  airspaceControl: number,
  weather: Weather
): number {
  const atkPower = calculateCombatPower(attacker.stats)
  const defPower = calculateCombatPower(defender.stats)
  const controlBonus = airspaceControl * 0.01
  const weatherMod = WEATHER_BONUS[weather]
  const advantage = (atkPower - defPower) / Math.max(atkPower, defPower, 1) + controlBonus + weatherMod
  return Math.round(advantage * 100) / 100
}

export function simulateBattleRound(
  attacker: Airship,
  defender: Airship,
  advantage: number,
  weather: Weather
): { attackerDmg: DamageReport; defenderDmg: DamageReport; log: string } {
  const weatherMod = 1 + WEATHER_BONUS[weather]
  const atkRoll = roll(0.7, 1.3) + advantage * 0.5
  const defRoll = roll(0.7, 1.3)

  const atkPower = calculateCombatPower(attacker.stats) * atkRoll * weatherMod
  const defPower = calculateCombatPower(defender.stats) * defRoll

  const attackerDmg: DamageReport = {
    sailIntegrity: Math.round(roll(3, 12) * (defPower / 200)),
    enginePower: Math.round(roll(2, 8) * (defPower / 200)),
    crewCasualties: Math.random() > 0.7 ? 1 : 0,
  }

  const defenderDmg: DamageReport = {
    sailIntegrity: Math.round(roll(5, 15) * (atkPower / 200)),
    enginePower: Math.round(roll(3, 10) * (atkPower / 200)),
    crewCasualties: Math.random() > 0.6 ? 1 : 0,
  }

  const log = atkPower > defPower
    ? `第回合：攻击方占优！造成 ${defenderDmg.sailIntegrity}% 帆布损伤，${defenderDmg.enginePower}% 引擎损耗`
    : `第回合：防御方顽强抵抗！造成 ${attackerDmg.sailIntegrity}% 帆布损伤，${attackerDmg.enginePower}% 引擎损耗`

  return { attackerDmg, defenderDmg, log }
}

export function runFullBattle(
  attacker: Airship,
  defender: Airship,
  airspaceName: string,
  weather: Weather
): BattleReport {
  const advantage = calculateAdvantage(attacker, defender, 50, weather)
  const rounds = 5
  const combatLog: string[] = []
  let totalAtkDmg: DamageReport = { sailIntegrity: 0, enginePower: 0, crewCasualties: 0 }
  let totalDefDmg: DamageReport = { sailIntegrity: 0, enginePower: 0, crewCasualties: 0 }

  for (let i = 0; i < rounds; i++) {
    const result = simulateBattleRound(attacker, defender, advantage, weather)
    totalAtkDmg.sailIntegrity += result.attackerDmg.sailIntegrity
    totalAtkDmg.enginePower += result.attackerDmg.enginePower
    totalAtkDmg.crewCasualties += result.attackerDmg.crewCasualties
    totalDefDmg.sailIntegrity += result.defenderDmg.sailIntegrity
    totalDefDmg.enginePower += result.defenderDmg.enginePower
    totalDefDmg.crewCasualties += result.defenderDmg.crewCasualties
    combatLog.push(`第${i + 1}${result.log.slice(1)}`)
  }

  const atkScore = calculateCombatPower(attacker.stats) * (1 + advantage) - totalAtkDmg.sailIntegrity - totalAtkDmg.enginePower
  const defScore = calculateCombatPower(defender.stats) - totalDefDmg.sailIntegrity - totalDefDmg.enginePower
  const result: BattleReport["result"] = atkScore > defScore * 1.1 ? "victory" : defScore > atkScore * 1.1 ? "defeat" : "draw"

  return {
    id: `battle_${Date.now()}`,
    attacker: attacker.name,
    defender: defender.name,
    attackerAirship: attacker.name,
    defenderAirship: defender.name,
    airspaceId: "",
    airspaceName,
    result,
    kills: totalDefDmg.crewCasualties,
    loot: result === "victory" ? [{ type: "crystal", amount: Math.floor(Math.random() * 50) + 20 }, { type: "aether", amount: Math.floor(Math.random() * 30) + 10 }] : [],
    damageReport: totalAtkDmg,
    timestamp: Date.now(),
    combatLog,
  }
}

export function createInitialBattleState(): BattleState {
  return {
    phase: "preparing",
    round: 0,
    attackerPower: 0,
    defenderPower: 0,
    attackerAdvantage: 0,
    weatherModifier: 0,
    currentDamage: { sailIntegrity: 0, enginePower: 0, crewCasualties: 0 },
    enemyDamage: { sailIntegrity: 0, enginePower: 0, crewCasualties: 0 },
    report: null,
  }
}
