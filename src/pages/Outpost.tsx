import { useState } from "react"
import { Castle, ArrowUp, Coins, Users, Map, TrendingUp } from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { GUILD_DATA } from "@/data/airspace"
import { RESOURCE_LABELS } from "@/types"
import type { ResourceType } from "@/types"

const CONTRIBUTABLE_RESOURCES: ResourceType[] = ["ironwood", "mithril", "crystal", "aether", "fabric"]

function ContributionModal({
  outpost,
  onClose,
  onContribute,
}: {
  outpost: { id: string; name: string; contribution: Record<string, number>; maxContribution: number; currentContribution: number }
  onClose: () => void
  onContribute: (resourceType: string, amount: number) => void
}) {
  const player = useGameStore(s => s.player)
  const [resourceType, setResourceType] = useState<string>(CONTRIBUTABLE_RESOURCES[0])
  const [amount, setAmount] = useState(10)

  const owned = player.resources[resourceType] ?? 0
  const canContribute = amount > 0 && amount <= owned

  function handleContribute() {
    if (!canContribute) return
    onContribute(resourceType, amount)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-amber-900/50 bg-gray-900 p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <ArrowUp className="w-4 h-4 text-amber-400" />
          为 {outpost.name} 捐献资源
        </h3>

        <div className="text-xs text-gray-400 mb-1">
          当前进度：{outpost.currentContribution} / {outpost.maxContribution}
        </div>
        <div className="h-2 rounded-full bg-gray-700 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
            style={{ width: `${Math.min(100, (outpost.currentContribution / outpost.maxContribution) * 100)}%` }}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">资源类型</label>
            <select
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              value={resourceType}
              onChange={e => { setResourceType(e.target.value); setAmount(10) }}
            >
              {CONTRIBUTABLE_RESOURCES.map(r => (
                <option key={r} value={r}>
                  {RESOURCE_LABELS[r]}（拥有 {player.resources[r] ?? 0}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">捐献数量</label>
            <input
              type="number"
              min={1}
              max={owned}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              value={amount}
              onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleContribute}
            disabled={!canContribute}
            className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-2 text-sm font-bold text-white hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            确认捐献
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Outpost() {
  const { player, outposts, upgradeOutpost } = useGameStore()
  const [modalOutpostId, setModalOutpostId] = useState<string | null>(null)

  const modalOutpost = outposts.find(o => o.id === modalOutpostId) ?? null

  function handleContribute(resourceType: string, amount: number) {
    if (!modalOutpostId) return
    upgradeOutpost(modalOutpostId, resourceType, amount)
  }

  return (
    <div className="space-y-6">
      {/* === 公会信息卡 === */}
      <section className="rounded-xl border border-cyan-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-950/20 p-5">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-cyan-400" />
          公会信息
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">公会名称</div>
            <div className="text-sm font-semibold text-cyan-300">{player.guild ?? "未加入"}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">成员数量</div>
            <div className="text-sm font-semibold text-cyan-300">
              {GUILD_DATA.find(g => g.name === player.guild)?.members ?? "-"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">公会财富</div>
            <div className="text-sm font-semibold flex items-center justify-center gap-1">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              {GUILD_DATA.find(g => g.name === player.guild)?.wealth.toLocaleString() ?? "-"}
            </div>
          </div>
        </div>
      </section>

      {/* === 前哨站卡片 === */}
      <section className="rounded-xl border border-amber-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 p-5">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Castle className="w-5 h-5 text-amber-400" />
          前哨站管理
        </h2>

        {outposts.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">暂无前哨站</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outposts.map(outpost => {
              const progressPct = Math.min(100, (outpost.currentContribution / outpost.maxContribution) * 100)
              return (
                <div key={outpost.id} className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Map className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-sm">{outpost.name}</span>
                    </div>
                    <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded">
                      等级 {outpost.level}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>建设进度</span>
                      <span>{outpost.currentContribution}/{outpost.maxContribution}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                      航程 +{outpost.bonuses.cruiseRange}
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" />
                      采集 +{outpost.bonuses.gatherYield}%
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    已捐献：{Object.entries(outpost.contribution).map(([k, v]) => `${RESOURCE_LABELS[k as ResourceType] ?? k} ${v}`).join("、")}
                  </div>

                  <button
                    onClick={() => setModalOutpostId(outpost.id)}
                    className="w-full rounded-lg border border-amber-700/50 bg-amber-900/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-800/40 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    捐献升级
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* === 公会总览表 === */}
      <section className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-5">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-cyan-400" />
          公会总览
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-xs">
                <th className="py-2 px-3 text-left">公会名称</th>
                <th className="py-2 px-3 text-right">成员数</th>
                <th className="py-2 px-3 text-right">财富</th>
                <th className="py-2 px-3 text-right">控制空域</th>
              </tr>
            </thead>
            <tbody>
              {GUILD_DATA.map(guild => (
                <tr
                  key={guild.id}
                  className={`border-b border-gray-800 ${guild.name === player.guild ? "bg-cyan-950/20" : ""}`}
                >
                  <td className="py-2 px-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: guild.color }} />
                    <span className={guild.name === player.guild ? "text-cyan-300 font-semibold" : "text-gray-300"}>
                      {guild.name}
                      {guild.name === player.guild && <span className="ml-1 text-xs text-cyan-500">（我的公会）</span>}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-gray-400">{guild.members}</td>
                  <td className="py-2 px-3 text-right text-gray-400">{guild.wealth.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-gray-400">{guild.controlledAirspaces}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* === 捐献弹窗 === */}
      {modalOutpost && (
        <ContributionModal
          outpost={modalOutpost}
          onClose={() => setModalOutpostId(null)}
          onContribute={handleContribute}
        />
      )}
    </div>
  )
}
