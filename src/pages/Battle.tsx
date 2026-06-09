import { useState } from "react"
import { Swords, Shield, Flame, Skull, Trophy, AlertCircle, CloudLightning } from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { calculateCombatPower } from "@/engine/statsCalc"
import { calculateAdvantage } from "@/engine/battleSim"
import type { DamageReport } from "@/types"
import { WEATHER_LABELS } from "@/types"
import { GUILD_NAMES, GUILD_COLORS } from "@/data/airspace"

function DamageBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100))
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function DamageReportPanel({ title, damage, isEnemy }: { title: string; damage: DamageReport; isEnemy: boolean }) {
  const accent = isEnemy ? "border-red-800/50" : "border-cyan-800/50"
  return (
    <div className={`flex-1 rounded-lg border bg-gray-900/60 p-4 ${accent}`}>
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        {isEnemy ? <Skull className="w-4 h-4 text-red-400" /> : <Shield className="w-4 h-4 text-cyan-400" />}
        {title}
      </h4>
      <DamageBar label="帆船完整度" current={100 - damage.sailIntegrity} max={100} color="#22D3EE" />
      <DamageBar label="引擎功率" current={100 - damage.enginePower} max={100} color="#F59E0B" />
      <DamageBar label="船员伤亡" current={damage.crewCasualties} max={20} color="#EF4444" />
    </div>
  )
}

type TabKey = "solo" | "guild"

export default function Battle() {
  const { player, airspaces, battleState, battleReports, startBattle, isStormSeason, guildSeason, launchGuildWar } = useGameStore()
  const [activeTab, setActiveTab] = useState<TabKey>("solo")

  const [selectedAirshipId, setSelectedAirshipId] = useState<string>("")
  const [selectedAirspaceId, setSelectedAirspaceId] = useState<string>("")

  const [gwAirshipId, setGwAirshipId] = useState<string>("")
  const [gwAirspaceId, setGwAirspaceId] = useState<string>("")
  const [gwAction, setGwAction] = useState<"attack" | "defend">("attack")

  const dockedAirships = player.airships.filter(a => a.status === "docked")
  const discoveredAirspaces = airspaces.filter(a => a.discovered)

  const selectedAirship = player.airships.find(a => a.id === selectedAirshipId)
  const selectedAirspace = airspaces.find(a => a.id === selectedAirspaceId)

  const attackerPower = selectedAirship ? calculateCombatPower(selectedAirship.stats) : 0
  const defenderPower = selectedAirship ? Math.round(calculateCombatPower({
    maxSpeed: selectedAirship.stats.maxSpeed * 0.9,
    maneuverability: selectedAirship.stats.maneuverability * 0.85,
    defense: selectedAirship.stats.defense * 1.1,
    capacity: selectedAirship.stats.capacity * 0.7,
    range: selectedAirship.stats.range * 0.8,
  }) * 0.85) : 0

  const advantage = (selectedAirship && selectedAirspace)
    ? calculateAdvantage(selectedAirship, { ...selectedAirship, id: "enemy", name: "敌方", stats: { maxSpeed: selectedAirship.stats.maxSpeed * 0.9, maneuverability: selectedAirship.stats.maneuverability * 0.85, defense: selectedAirship.stats.defense * 1.1, capacity: selectedAirship.stats.capacity * 0.7, range: selectedAirship.stats.range * 0.8 } } as any, 50, selectedAirspace.weather)
    : 0

  const canStart = selectedAirshipId && selectedAirspaceId

  function handleStartBattle() {
    if (!canStart) return
    startBattle(selectedAirshipId, "enemy", selectedAirspaceId)
  }

  const resultColor: Record<string, string> = {
    victory: "text-green-400 border-green-800/50 bg-green-950/30",
    defeat: "text-red-400 border-red-800/50 bg-red-950/30",
    draw: "text-yellow-400 border-yellow-800/50 bg-yellow-950/30",
  }

  const resultLabel: Record<string, string> = {
    victory: "胜利",
    defeat: "战败",
    draw: "平局",
  }

  const resultIcon: Record<string, React.ReactNode> = {
    victory: <Trophy className="w-4 h-4 text-green-400" />,
    defeat: <Skull className="w-4 h-4 text-red-400" />,
    draw: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  }

  const gwSelectedAirspace = airspaces.find(a => a.id === gwAirspaceId)
  const myGuildName = player.guild || ""
  const myGuildScore = myGuildName ? guildSeason.guildScores[myGuildName] : null
  const canLaunchGw = gwAirshipId && gwAirspaceId && myGuildName

  function handleLaunchGuildWar() {
    if (!canLaunchGw) return
    launchGuildWar(gwAirshipId, gwAirspaceId, gwAction)
  }

  const sortedGuilds = Object.entries(guildSeason.guildScores)
    .sort(([, a], [, b]) => b.points - a.points)

  const tabClass = (tab: TabKey) =>
    `flex-1 text-center py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${
      activeTab === tab
        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/30"
        : "bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60"
    }`

  return (
    <div className="space-y-6">
      {isStormSeason && (
        <div style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #ef444444",
          backgroundColor: "#ef444418",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#fca5a5",
        }}>
          <CloudLightning className="w-4 h-4" />
          ⚠️ 暴风季预警：当前飞行风险升高，战斗伤害可能增加，请做好防御准备
        </div>
      )}

      {/* === Tab Switcher === */}
      <div className="flex gap-2 p-1 rounded-xl bg-gray-800/40 border border-gray-700/50">
        <div className={tabClass("solo")} onClick={() => setActiveTab("solo")}>
          <Swords className="w-4 h-4 inline-block mr-1 -mt-0.5" />
          单人争夺
        </div>
        <div className={tabClass("guild")} onClick={() => setActiveTab("guild")}>
          <Shield className="w-4 h-4 inline-block mr-1 -mt-0.5" />
          公会赛季战
        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB: Solo Battle                                                  */}
      {/* ================================================================ */}
      {activeTab === "solo" && (
        <>
          {/* === 争夺战发起面板 === */}
          <section className="rounded-xl border border-amber-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Swords className="w-5 h-5 text-amber-400" />
              空域争夺战
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">选择出击飞艇</label>
                <select
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  value={selectedAirshipId}
                  onChange={e => setSelectedAirshipId(e.target.value)}
                >
                  <option value="">-- 选择飞艇 --</option>
                  {dockedAirships.map(a => (
                    <option key={a.id} value={a.id}>{a.name}（{a.type === "combat" ? "战斗型" : a.type === "exploration" ? "探险型" : "货运型"}）</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">目标空域</label>
                <select
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  value={selectedAirspaceId}
                  onChange={e => setSelectedAirspaceId(e.target.value)}
                >
                  <option value="">-- 选择空域 --</option>
                  {discoveredAirspaces.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}（危险度 {a.dangerLevel} / 天气 {WEATHER_LABELS[a.weather]}）
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {canStart && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 mb-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  战力对比预览
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-400 mb-1">我方战力</div>
                    <div className="text-xl font-bold text-cyan-400">{attackerPower}</div>
                  </div>
                  <div className="text-gray-500 text-sm">VS</div>
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-400 mb-1">守方战力</div>
                    <div className="text-xl font-bold text-red-400">{defenderPower}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-400 mb-1">优势评估</div>
                    <div className={`text-xl font-bold ${advantage > 0 ? "text-green-400" : advantage < 0 ? "text-red-400" : "text-gray-300"}`}>
                      {advantage > 0 ? "+" : ""}{advantage}
                    </div>
                  </div>
                </div>
                {selectedAirspace && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    天气修正：{WEATHER_LABELS[selectedAirspace.weather]} · 危险等级：{selectedAirspace.dangerLevel}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleStartBattle}
              disabled={!canStart}
              className="w-full rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              发起争夺战
            </button>
          </section>

          {/* === 战斗模拟区域 === */}
          {battleState.phase !== "preparing" && (
            <section className="rounded-xl border border-red-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/20 p-5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-red-400" />
                战斗模拟
                <span className="ml-auto text-xs font-normal text-gray-400">
                  回合 {battleState.round} · 阶段 {battleState.phase === "fighting" ? "交战中" : "已结束"}
                </span>
              </h2>

              <div className="flex gap-4 mb-4 flex-col md:flex-row">
                <DamageReportPanel title="我方损伤" damage={battleState.currentDamage} isEnemy={false} />
                <DamageReportPanel title="敌方损伤" damage={battleState.enemyDamage} isEnemy={true} />
              </div>

              {battleState.report?.combatLog && (
                <div className="rounded-lg bg-gray-900/80 border border-gray-700 p-3 max-h-48 overflow-y-auto">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">战斗日志</h4>
                  {battleState.report.combatLog.map((log, i) => (
                    <div key={i} className="text-xs text-gray-300 py-1 border-b border-gray-800 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* === 战报列表 === */}
          <section className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              战报记录
            </h2>

            {battleReports.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">暂无战报，发起一场争夺战吧！</div>
            ) : (
              <div className="space-y-3">
                {battleReports.map(report => (
                  <div
                    key={report.id}
                    className={`rounded-lg border p-4 ${resultColor[report.result]}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {resultIcon[report.result]}
                        <span className="font-semibold text-sm">{report.airspaceName}</span>
                      </div>
                      <span className="text-xs font-bold">{resultLabel[report.result]}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <div>
                        <span className="text-gray-500">击杀：</span>
                        <span className="text-gray-300">{report.kills}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">战利品：</span>
                        <span className="text-gray-300">
                          {report.loot.length > 0 ? report.loot.map(l => `${l.amount}`).join(", ") : "无"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">损伤：</span>
                        <span className="text-gray-300">
                          帆-{report.damageReport.sailIntegrity}% 引-{report.damageReport.enginePower}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {report.attacker} vs {report.defender} · {new Date(report.timestamp).toLocaleString("zh-CN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ================================================================ */}
      {/* TAB: Guild War                                                    */}
      {/* ================================================================ */}
      {activeTab === "guild" && (
        <>
          {/* === Guild War Launch Panel === */}
          <section className="rounded-xl border border-purple-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-950/20 p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              公会赛季战
              <span className="ml-auto text-xs font-normal text-gray-500">第 {guildSeason.weekNumber} 周</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">选择出击飞艇</label>
                <select
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  value={gwAirshipId}
                  onChange={e => setGwAirshipId(e.target.value)}
                >
                  <option value="">-- 选择飞艇 --</option>
                  {dockedAirships.map(a => (
                    <option key={a.id} value={a.id}>{a.name}（{a.type === "combat" ? "战斗型" : a.type === "exploration" ? "探险型" : "货运型"}）</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">目标空域</label>
                <select
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  value={gwAirspaceId}
                  onChange={e => setGwAirspaceId(e.target.value)}
                >
                  <option value="">-- 选择空域 --</option>
                  {discoveredAirspaces.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}（所有者: {a.owner || "无主"}）
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action radio */}
            <div className="flex items-center gap-6 mb-4">
              <span className="text-sm text-gray-400">行动选择：</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gwAction"
                  value="attack"
                  checked={gwAction === "attack"}
                  onChange={() => setGwAction("attack")}
                  className="accent-red-500"
                />
                <span className="text-sm text-red-400 font-semibold">进攻</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gwAction"
                  value="defend"
                  checked={gwAction === "defend"}
                  onChange={() => setGwAction("defend")}
                  className="accent-cyan-500"
                />
                <span className="text-sm text-cyan-400 font-semibold">防守</span>
              </label>
            </div>

            {/* Airspace info */}
            {gwSelectedAirspace && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">空域所有者：</span>
                    <span className="font-semibold" style={{ color: gwSelectedAirspace.ownerColor || "#9CA3AF" }}>
                      {gwSelectedAirspace.owner || "无主"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">我方公会：</span>
                    {myGuildName ? (
                      <span className="font-semibold text-cyan-400">{myGuildName}</span>
                    ) : (
                      <span className="text-gray-600">未加入公会</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* My guild stats */}
            {myGuildScore && (
              <div className="rounded-lg border border-purple-800/30 bg-purple-950/20 p-4 mb-4">
                <h3 className="text-sm font-semibold mb-2 text-purple-300">我方公会赛季数据</h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-500">积分</div>
                    <div className="text-lg font-bold text-purple-300">{myGuildScore.points}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">胜场</div>
                    <div className="text-lg font-bold text-green-400">{myGuildScore.wins}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">败场</div>
                    <div className="text-lg font-bold text-red-400">{myGuildScore.losses}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">控制空域</div>
                    <div className="text-lg font-bold text-amber-400">{myGuildScore.controlledAirspaces}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLaunchGuildWar}
              disabled={!canLaunchGw}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              发起公会战
            </button>
          </section>

          {/* === Recent Guild War Records === */}
          <section className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-400" />
              公会战记录
            </h2>

            {guildSeason.warRecords.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">暂无公会战记录，发起一场公会战吧！</div>
            ) : (
              <div className="space-y-3">
                {guildSeason.warRecords.map(record => {
                  const atkIdx = GUILD_NAMES.indexOf(record.attackingGuild)
                  const defIdx = GUILD_NAMES.indexOf(record.defendingGuild)
                  return (
                    <div
                      key={record.id}
                      className={`rounded-lg border p-4 ${resultColor[record.result]}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {resultIcon[record.result]}
                          <span className="font-semibold text-sm">{record.airspaceName}</span>
                        </div>
                        <span className="text-xs font-bold">{resultLabel[record.result]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold" style={{ color: atkIdx >= 0 ? GUILD_COLORS[atkIdx] : "#9CA3AF" }}>
                          {record.attackingGuild}
                        </span>
                        <span className="text-gray-500">
                          ({record.action === "attack" ? "进攻" : "防守"})
                        </span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-semibold" style={{ color: defIdx >= 0 ? GUILD_COLORS[defIdx] : "#9CA3AF" }}>
                          {record.defendingGuild}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(record.timestamp).toLocaleString("zh-CN")}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* === Guild Leaderboard === */}
          <section className="rounded-xl border border-amber-900/40 bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/20 p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              公会赛季排行
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-xs">
                    <th className="text-left py-2 px-2">排名</th>
                    <th className="text-left py-2 px-2">公会</th>
                    <th className="text-right py-2 px-2">积分</th>
                    <th className="text-right py-2 px-2">胜</th>
                    <th className="text-right py-2 px-2">败</th>
                    <th className="text-right py-2 px-2">控制空域</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGuilds.map(([name, score], idx) => {
                    const guildIdx = GUILD_NAMES.indexOf(name)
                    const color = guildIdx >= 0 ? GUILD_COLORS[guildIdx] : "#9CA3AF"
                    const isMyGuild = name === myGuildName
                    return (
                      <tr
                        key={name}
                        className={`border-b border-gray-800/50 ${isMyGuild ? "bg-cyan-950/20" : ""}`}
                      >
                        <td className="py-2.5 px-2">
                          {idx === 0 ? <span className="text-amber-400 font-bold">1</span> :
                           idx === 1 ? <span className="text-gray-300 font-bold">2</span> :
                           idx === 2 ? <span className="text-orange-700 font-bold">3</span> :
                           <span className="text-gray-500">{idx + 1}</span>}
                        </td>
                        <td className="py-2.5 px-2 font-semibold" style={{ color }}>
                          {name}
                          {isMyGuild && <span className="ml-1.5 text-xs text-cyan-400">(我方)</span>}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-purple-300">{score.points}</td>
                        <td className="py-2.5 px-2 text-right text-green-400">{score.wins}</td>
                        <td className="py-2.5 px-2 text-right text-red-400">{score.losses}</td>
                        <td className="py-2.5 px-2 text-right text-amber-400">{score.controlledAirspaces}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
