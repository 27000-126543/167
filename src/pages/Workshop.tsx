import { useState, useMemo } from "react"
import { Ship } from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { AIRSHIP_TYPE_LABELS, RARITY_LABELS, RARITY_COLORS } from "@/types"
import type { AirshipType, AirshipComponent } from "@/types"
import { KEEL_COMPONENTS, ENGINE_COMPONENTS, SAIL_COMPONENTS, SPECIAL_COMPONENTS } from "@/data/components"
import { calculateAirshipStats, calculateCombatPower } from "@/engine/statsCalc"
import StatRadar from "@/components/StatRadar"

const STATUS_LABELS: Record<string, string> = {
  docked: "停泊",
  exploring: "探索中",
  battle: "战斗中",
  repairing: "维修中",
}

const TYPE_KEYS: AirshipType[] = ["exploration", "combat", "cargo"]

const TYPE_ICONS: Record<AirshipType, string> = {
  exploration: "🧭",
  combat: "⚔️",
  cargo: "📦",
}

export default function Workshop() {
  const player = useGameStore((s) => s.player)
  const buildAirship = useGameStore((s) => s.buildAirship)

  const [showBuilder, setShowBuilder] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<AirshipType>("exploration")
  const [keel, setKeel] = useState<AirshipComponent>(KEEL_COMPONENTS[0])
  const [engine, setEngine] = useState<AirshipComponent>(ENGINE_COMPONENTS[0])
  const [sail, setSail] = useState<AirshipComponent>(SAIL_COMPONENTS[0])
  const [special, setSpecial] = useState<AirshipComponent | null>(null)

  const previewStats = useMemo(
    () => calculateAirshipStats(type, keel, engine, sail, special),
    [type, keel, engine, sail, special]
  )

  const previewPower = useMemo(
    () => calculateCombatPower(previewStats),
    [previewStats]
  )

  const buildCost = 500 + (special ? 800 : 0)
  const canBuild = name.trim().length > 0 && player.gold >= buildCost

  function handleBuild() {
    if (!canBuild) return
    buildAirship(name.trim(), type, keel, engine, sail, special)
    setName("")
    setType("exploration")
    setKeel(KEEL_COMPONENTS[0])
    setEngine(ENGINE_COMPONENTS[0])
    setSail(SAIL_COMPONENTS[0])
    setSpecial(null)
    setShowBuilder(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title">飞艇工坊</h1>
        {!showBuilder && (
          <button onClick={() => setShowBuilder(true)} className="btn-gold">
            制造新飞艇
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className={`space-y-4 ${showBuilder ? "lg:col-span-2" : "lg:col-span-5"}`}>
          <h2 className="text-sm font-semibold text-gold-500">我的飞艇</h2>
          {player.airships.length === 0 && (
            <div className="card-metal p-6 text-center text-gray-500 text-sm">
              暂无飞艇，点击右上方按钮开始制造
            </div>
          )}
          {player.airships.map((airship) => (
            <div key={airship.id} className="card-metal p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-gold-400" />
                  <span className="font-medium text-gray-200">{airship.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400">
                    {AIRSHIP_TYPE_LABELS[airship.type]}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    airship.status === "docked"
                      ? "bg-copper-500/20 text-copper-400"
                      : airship.status === "exploring"
                      ? "bg-gold-500/20 text-gold-400"
                      : airship.status === "battle"
                      ? "bg-crimson-500/20 text-crimson-500"
                      : "bg-navy-600/50 text-gray-400"
                  }`}
                >
                  {STATUS_LABELS[airship.status] ?? airship.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>战力 <span className="text-gold-400 font-bold">{calculateCombatPower(airship.stats)}</span></span>
                <span>极速 {airship.stats.maxSpeed}</span>
                <span>机动 {airship.stats.maneuverability}</span>
                <span>防御 {airship.stats.defense}</span>
                <span>载重 {airship.stats.capacity}</span>
                <span>航程 {airship.stats.range}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{airship.keel.name}</span>
                <span>·</span>
                <span>{airship.engine.name}</span>
                <span>·</span>
                <span>{airship.sail.name}</span>
                {airship.specialDevice && (
                  <>
                    <span>·</span>
                    <span>{airship.specialDevice.name}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {showBuilder && (
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gold-500">制造新飞艇</h2>
              <button onClick={() => setShowBuilder(false)} className="btn-outline text-xs">
                取消
              </button>
            </div>

            <div className="card-metal p-4">
              <label className="block text-xs text-gray-400 mb-1">飞艇名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="为你的飞艇命名"
                className="w-full bg-navy-900 border border-gold-500/20 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gold-500/50"
              />
            </div>

            <div className="card-metal p-4">
              <label className="block text-xs text-gray-400 mb-2">飞艇类型</label>
              <div className="grid grid-cols-3 gap-3">
                {TYPE_KEYS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      type === t
                        ? "border-gold-500/60 bg-gold-500/10 shadow-[0_0_12px_rgba(212,168,67,0.3)]"
                        : "border-gold-500/10 bg-navy-900/50 hover:border-gold-500/30"
                    }`}
                  >
                    <div className="text-2xl mb-1">{TYPE_ICONS[t]}</div>
                    <div className={`text-sm font-medium ${type === t ? "text-gold-400" : "text-gray-400"}`}>
                      {AIRSHIP_TYPE_LABELS[t]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <ComponentSelector
              label="龙骨"
              components={KEEL_COMPONENTS}
              selected={keel}
              onSelect={setKeel}
            />
            <ComponentSelector
              label="引擎"
              components={ENGINE_COMPONENTS}
              selected={engine}
              onSelect={setEngine}
            />
            <ComponentSelector
              label="帆布"
              components={SAIL_COMPONENTS}
              selected={sail}
              onSelect={setSail}
            />
            <ComponentSelector
              label="特殊装置"
              components={SPECIAL_COMPONENTS}
              selected={special}
              onSelect={setSpecial}
              allowNone
            />

            <div className="card-metal p-4 flex items-start gap-6">
              <div className="flex-1 space-y-3">
                <h3 className="text-xs text-gray-400">属性预览</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    Object.entries(previewStats) as [keyof typeof previewStats, number][]
                  ).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {{
                          maxSpeed: "极速",
                          maneuverability: "机动性",
                          defense: "防御力",
                          capacity: "载重",
                          range: "航程",
                        }[key]}
                      </span>
                      <span className="text-gold-400 font-bold">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm border-t border-gold-500/10 pt-2">
                  <span className="text-gray-400">战力</span>
                  <span className="text-gold-400 font-bold text-lg">{previewPower}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">制造费用</span>
                  <span className={player.gold >= buildCost ? "text-copper-400" : "text-crimson-500"}>
                    {buildCost} 金币
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <StatRadar stats={previewStats} size={200} />
              </div>
            </div>

            <button
              onClick={handleBuild}
              disabled={!canBuild}
              className="btn-gold w-full text-center"
            >
              {player.gold < buildCost ? "金币不足" : "开始制造"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ComponentSelector({
  label,
  components,
  selected,
  onSelect,
  allowNone = false,
}: {
  label: string
  components: AirshipComponent[]
  selected: AirshipComponent | null
  onSelect: (c: AirshipComponent | null) => void
  allowNone?: boolean
}) {
  return (
    <div className="card-metal p-4">
      <label className="block text-xs text-gray-400 mb-2">{label}</label>
      <div className="grid grid-cols-1 gap-2">
        {allowNone && (
          <button
            onClick={() => onSelect(null)}
            className={`flex items-center justify-between p-2 rounded-md border transition-all text-left ${
              selected === null
                ? "border-gold-500/50 bg-gold-500/5"
                : "border-gold-500/10 bg-navy-900/30 hover:border-gold-500/20"
            }`}
          >
            <span className="text-sm text-gray-500">不安装</span>
          </button>
        )}
        {components.map((comp) => (
          <button
            key={comp.id}
            onClick={() => onSelect(comp)}
            className={`flex items-center justify-between p-2 rounded-md border transition-all text-left ${
              selected?.id === comp.id
                ? "border-gold-500/50 bg-gold-500/5"
                : "border-gold-500/10 bg-navy-900/30 hover:border-gold-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{comp.icon}</span>
              <span className="text-sm text-gray-200">{comp.name}</span>
            </div>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                color: RARITY_COLORS[comp.rarity],
                backgroundColor: `${RARITY_COLORS[comp.rarity]}15`,
              }}
            >
              {RARITY_LABELS[comp.rarity]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
