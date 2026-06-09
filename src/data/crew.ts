import type { CrewMember, Skill } from "@/types"

const NAVIGATOR_SKILLS: Skill[][] = [
  [{ name: "星象导航", level: 3, effect: "range+10%", description: "通过星象精准定位，增加航程" }, { name: "急速规避", level: 2, effect: "maneuverability+8%", description: "危险来临时快速转向规避" }],
  [{ name: "风暴感应", level: 4, effect: "storm_defense+20%", description: "预感风暴来临，提前做好防护" }, { name: "航线优化", level: 3, effect: "speed+5%", description: "选择最优航线提升速度" }],
  [{ name: "迷雾穿透", level: 2, effect: "fog_immunity", description: "在迷雾中保持正常航行" }, { name: "暗流识破", level: 3, effect: "turbulence_defense+15%", description: "识别暗流避免损失" }],
]

const TECHNICIAN_SKILLS: Skill[][] = [
  [{ name: "紧急修复", level: 3, effect: "repair+15%", description: "紧急修复受损部件" }, { name: "动力调校", level: 2, effect: "engine_power+10%", description: "优化引擎输出效率" }],
  [{ name: "护盾增幅", level: 4, effect: "shield+20%", description: "增强护盾发生器效果" }, { name: "节能驾驶", level: 3, effect: "fuel_efficiency+15%", description: "降低燃料消耗延长航程" }],
  [{ name: "超频运转", level: 2, effect: "speed_burst+25%", description: "短时间大幅提升速度" }, { name: "部件改造", level: 3, effect: "all_stats+5%", description: "微调部件获得全面提升" }],
]

const GUNNER_SKILLS: Skill[][] = [
  [{ name: "精准炮击", level: 3, effect: "attack+15%", description: "炮击命中率大幅提升" }, { name: "穿甲弹", level: 2, effect: "armor_pierce+10%", description: "无视部分防御造成伤害" }],
  [{ name: "散射轰炸", level: 4, effect: "aoe_damage+20%", description: "范围攻击覆盖多个目标" }, { name: "防空火力", level: 3, effect: "anti_air+15%", description: "对空中单位造成额外伤害" }],
  [{ name: "链弹缠绕", level: 2, effect: "slow_enemy+20%", description: "减速敌方飞艇" }, { name: "弹药管理", level: 3, effect: "ammo_efficiency+15%", description: "弹药消耗降低" }],
]

const NAMES = ["艾琳·霜翼", "卡斯·铁锤", "露娜·银风", "达克·焰心", "薇拉·星光", "索恩·雷击", "米拉·月影", "格兰·石拳", "菲奥娜·流光", "雷克斯·战锤", "希尔薇·云端", "布鲁诺·熔炉", "艾拉·晨曦", "维克多·暗潮", "诺拉·碧空", "加里安·钢铁", "赛琳·雾歌", "德拉什·裂风", "伊莎·星火", "巴伦·寒铁"]

const AVATARS = ["🧑‍✈️", "👩‍🔧", "🧑‍🚀", "👨‍🏭", "👩‍🔬", "🧑‍🎓", "👨‍🍳", "👩‍🎤", "🧑‍⚕️", "👨‍🎨"]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateCrewMember(role: CrewMember["role"], index: number): CrewMember {
  const skillSets = role === "navigator" ? NAVIGATOR_SKILLS : role === "technician" ? TECHNICIAN_SKILLS : GUNNER_SKILLS
  const skills = pick(skillSets)
  const loyalty = Math.floor(Math.random() * 40) + 30 + (Math.random() > 0.7 ? 30 : 0)
  const salary = Math.floor(Math.random() * 50) + 20 + skills.reduce((sum, s) => sum + s.level * 10, 0)

  return {
    id: `crew_${role}_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: pick(NAMES),
    role,
    skills,
    loyalty: Math.min(100, loyalty),
    salary,
    avatar: pick(AVATARS),
    assignedAirship: null,
  }
}

export function generateRecruitmentPool(): CrewMember[] {
  const pool: CrewMember[] = []
  for (let i = 0; i < 3; i++) pool.push(generateCrewMember("navigator", i))
  for (let i = 0; i < 3; i++) pool.push(generateCrewMember("technician", i))
  for (let i = 0; i < 3; i++) pool.push(generateCrewMember("gunner", i))
  return pool
}

export function generateInitialCrew(): CrewMember[] {
  return [
    { id: "crew_init_nav", name: "艾琳·霜翼", role: "navigator", skills: [{ name: "星象导航", level: 2, effect: "range+8%", description: "基础星象导航技能" }], loyalty: 75, salary: 30, avatar: "🧑‍✈️", assignedAirship: null },
    { id: "crew_init_tech", name: "卡斯·铁锤", role: "technician", skills: [{ name: "紧急修复", level: 2, effect: "repair+10%", description: "基础修复技能" }], loyalty: 80, salary: 35, avatar: "👩‍🔧", assignedAirship: null },
    { id: "crew_init_gun", name: "索恩·雷击", role: "gunner", skills: [{ name: "精准炮击", level: 2, effect: "attack+10%", description: "基础炮击技能" }], loyalty: 70, salary: 32, avatar: "🧑‍🚀", assignedAirship: null },
  ]
}
