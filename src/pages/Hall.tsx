import { useNavigate } from "react-router-dom"
import { Ship, Users, Coins, Map, Swords, ShoppingBag, CloudLightning, ChevronRight, Zap, Shield } from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { RESOURCE_LABELS } from "@/types"
import { calculateCombatPower } from "@/engine/statsCalc"
import { GUILD_NAMES, GUILD_COLORS } from "@/data/airspace"

const NAV_ITEMS = [
  { path: "/workshop", icon: Ship, label: "飞艇工坊", color: "text-gold-400" },
  { path: "/explore", icon: Map, label: "空域探索", color: "text-copper-400" },
  { path: "/battle", icon: Swords, label: "空域争夺", color: "text-crimson-500" },
  { path: "/market", icon: ShoppingBag, label: "交易市场", color: "text-gold-500" },
]

const STATUS_LABELS: Record<string, string> = {
  docked: "停泊",
  exploring: "探索中",
  battle: "战斗中",
  repairing: "维修中",
}

export default function Hall() {
  const navigate = useNavigate()
  const player = useGameStore((s) => s.player)
  const announcements = useGameStore((s) => s.announcements)
  const isStormSeason = useGameStore((s) => s.isStormSeason)
  const todayWeather = useGameStore((s) => s.todayWeather)
  const guildSeason = useGameStore((s) => s.guildSeason)
  const completedRoutes = useGameStore((s) => s.completedRoutes)

  const totalCombatPower = player.airships.reduce(
    (sum, a) => sum + calculateCombatPower(a.stats),
    0
  )

  const resourceEntries = Object.entries(player.resources).filter(
    ([key]) => key !== "gold"
  )

  return (
    <div className="space-y-6">
      <h1 className="section-title">总览大厅</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-metal p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
            <Ship className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">飞艇数量</p>
            <p className="text-xl font-bold text-gold-400">{player.airships.length}</p>
          </div>
        </div>

        <div className="card-metal p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">金币</p>
            <p className="text-xl font-bold text-gold-400">{player.gold.toLocaleString()}</p>
          </div>
        </div>

        <div className="card-metal p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-copper-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-copper-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">总战力</p>
            <p className="text-xl font-bold text-copper-400">{totalCombatPower.toLocaleString()}</p>
          </div>
        </div>

        <div className="card-metal p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-copper-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-copper-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">船员数量</p>
            <p className="text-xl font-bold text-copper-400">{player.crew.length}</p>
          </div>
        </div>
      </div>

      <div className="card-metal p-4">
        <h2 className="text-sm font-semibold text-gold-500 mb-2">资源储备</h2>
        <div className="grid grid-cols-5 gap-3">
          {resourceEntries.map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-xs text-gray-400">{RESOURCE_LABELS[key as keyof typeof RESOURCE_LABELS] ?? key}</p>
              <p className="text-sm font-bold text-gray-200">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {(isStormSeason || todayWeather) && (
        <div className="card-metal border-crimson-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CloudLightning className="w-5 h-5 text-crimson-500" />
            <span className="font-semibold text-crimson-500">今日预警</span>
          </div>
          <div className="space-y-1">
            {todayWeather && (
              <p className="text-sm text-gray-300">天气状况：<span className="text-gold-400">{todayWeather}</span></p>
            )}
            {isStormSeason && (
              <p className="text-sm text-crimson-500 font-medium">⚠ 暴风季已来临！飞行风险大幅提升，请谨慎派遣飞艇！</p>
            )}
          </div>
        </div>
      )}

      {player.guild && guildSeason.guildScores[player.guild] && (
        <div className="card-metal p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-gold-400" />
            <span className="font-semibold text-gold-500">公会赛季 — {player.guild}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xs text-gray-400">赛季积分</p>
              <p className="text-sm font-bold text-gold-400">{guildSeason.guildScores[player.guild].points}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">胜场</p>
              <p className="text-sm font-bold text-green-400">{guildSeason.guildScores[player.guild].wins}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">败场</p>
              <p className="text-sm font-bold text-red-400">{guildSeason.guildScores[player.guild].losses}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">占领空域</p>
              <p className="text-sm font-bold text-copper-400">{guildSeason.guildScores[player.guild].controlledAirspaces}</p>
            </div>
          </div>
          {guildSeason.warRecords.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 mb-1">最近战报</p>
              {guildSeason.warRecords.slice(0, 3).map(r => (
                <div key={r.id} className="text-xs text-gray-400 flex items-center gap-2">
                  <span className={r.result === "victory" ? "text-green-400" : r.result === "defeat" ? "text-red-400" : "text-yellow-400"}>
                    {r.result === "victory" ? "胜" : r.result === "defeat" ? "败" : "平"}
                  </span>
                  <span>{r.attackingGuild} vs {r.defendingGuild} @ {r.airspaceName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {completedRoutes.length > 0 && (
        <div className="card-metal p-4">
          <div className="flex items-center gap-2 mb-3">
            <Map className="w-5 h-5 text-copper-400" />
            <span className="font-semibold text-copper-400">航线探索记录</span>
          </div>
          <div className="space-y-2">
            {completedRoutes.slice(0, 3).map((cr, i) => (
              <div key={i} className="p-2 rounded-md bg-navy-900/50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-200 font-medium">{cr.route.airshipName}</span>
                  <span className="text-gray-500">{new Date(cr.completedAt).toLocaleString("zh-CN")}</span>
                </div>
                <div className="flex gap-4 text-gray-400">
                  <span>途经 {cr.route.nodes.length} 节点</span>
                  <span>发现 {cr.discoveries.length} 空域</span>
                  <span>帆损 {cr.sailWear}% / 引损 {cr.engineWear}%</span>
                </div>
                {Object.keys(cr.gatheredResources).length > 0 && (
                  <div className="mt-1 text-gray-500">
                    收获：{Object.entries(cr.gatheredResources).map(([k, v]) => `${RESOURCE_LABELS[k as keyof typeof RESOURCE_LABELS] ?? k} +${v}`).join("、")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="card-metal-hover p-5 flex flex-col items-center gap-3 group"
          >
            <item.icon className={`w-8 h-8 ${item.color} group-hover:scale-110 transition-transform`} />
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-200">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gold-400 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="card-metal p-4">
        <h2 className="text-sm font-semibold text-gold-500 mb-3">飞艇状态</h2>
        <div className="space-y-2">
          {player.airships.map((airship) => (
            <div
              key={airship.id}
              className="flex items-center justify-between p-3 rounded-md bg-navy-900/50"
            >
              <div className="flex items-center gap-3">
                <Ship className="w-4 h-4 text-gold-400" />
                <div>
                  <p className="text-sm font-medium text-gray-200">{airship.name}</p>
                  <p className="text-xs text-gray-400">
                    战力 {calculateCombatPower(airship.stats)}
                  </p>
                </div>
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
          ))}
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="card-metal p-3 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gold-500 shrink-0">公告</span>
            <div className="overflow-hidden flex-1">
              <div className="animate-scroll-left whitespace-nowrap">
                {announcements.map((ann) => (
                  <span key={ann.id} className="inline-block mr-8 text-xs text-gray-400">
                    {ann.message}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
