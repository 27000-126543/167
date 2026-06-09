import { useState, useMemo } from "react"
import { useGameStore } from "@/store/gameStore"
import { WEATHER_LABELS, RESOURCE_LABELS } from "@/types"
import type { Airspace } from "@/types"
import GaugeChart from "@/components/GaugeChart"
import { MapPin, Cloud, Wind, Mountain, Compass } from "lucide-react"

const TERRAIN_NAMES: Record<Airspace["terrain"], string> = {
  island: "浮空岛",
  cloud_sea: "云海",
  storm_zone: "风暴带",
  ruins: "远古遗迹",
  void: "虚空裂隙",
}

const TERRAIN_ICONS: Record<Airspace["terrain"], React.ReactNode> = {
  island: <Mountain className="w-3 h-3" />,
  cloud_sea: <Cloud className="w-3 h-3" />,
  storm_zone: <Wind className="w-3 h-3" />,
  ruins: <MapPin className="w-3 h-3" />,
  void: <Compass className="w-3 h-3" />,
}

const HEX_SIZE = 60
const HEX_W = Math.sqrt(3) * HEX_SIZE
const HEX_H = 2 * HEX_SIZE

function hexToPixel(q: number, r: number) {
  const x = HEX_W * (q + r / 2)
  const y = HEX_H * 0.75 * r
  return { x, y }
}

function HexCell({
  airspace,
  isRouteNode,
  isCurrentNode,
}: {
  airspace: Airspace
  isRouteNode: boolean
  isCurrentNode: boolean
}) {
  const { x, y } = hexToPixel(airspace.hexQ, airspace.hexR)
  const halfW = HEX_W / 2
  const halfH = HEX_H / 2
  const points = [
    [halfW, 0],
    [HEX_W, halfH * 0.5],
    [HEX_W, halfH * 1.5],
    [halfW, HEX_H],
    [0, halfH * 1.5],
    [0, halfH * 0.5],
  ]
    .map((p) => p.join(","))
    .join(" ")

  const discovered = airspace.discovered

  return (
    <g transform={`translate(${x - HEX_W / 2}, ${y - HEX_H / 2})`}>
      {isRouteNode && (
        <polygon
          points={points}
          fill="none"
          stroke="#D4A843"
          strokeWidth={3}
          opacity={0.8}
        />
      )}
      {isCurrentNode && (
        <>
          <polygon
            points={points}
            fill="#D4A84322"
            stroke="#F59E0B"
            strokeWidth={3}
          />
          <circle
            cx={halfW}
            cy={halfH}
            r={HEX_SIZE * 0.35}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={2}
            opacity={0.6}
          >
            <animate
              attributeName="r"
              values={`${HEX_SIZE * 0.3};${HEX_SIZE * 0.4};${HEX_SIZE * 0.3}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.2;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
      <polygon
        points={points}
        fill={discovered ? `${airspace.ownerColor}22` : "#0B1D3A"}
        stroke={discovered ? `${airspace.ownerColor}66` : "#1A3F6544"}
        strokeWidth={1.5}
      />
      {discovered && (
        <>
          <circle cx={halfW} cy={halfH - 10} r={5} fill={airspace.ownerColor} opacity={0.7} />
          <text x={halfW} y={halfH + 4} textAnchor="middle" fill="#E8E8E8" fontSize={8} className="pointer-events-none select-none">
            {TERRAIN_NAMES[airspace.terrain]}
          </text>
          <text x={halfW} y={halfH + 14} textAnchor="middle" fill="#9CA3AF" fontSize={6} className="pointer-events-none select-none">
            {WEATHER_LABELS[airspace.weather]}
          </text>
        </>
      )}
      {!discovered && (
        <text x={halfW} y={halfH + 2} textAnchor="middle" fill="#1A3F65" fontSize={12} className="pointer-events-none select-none">
          ?
        </text>
      )}
    </g>
  )
}

const RISK_COLORS: Record<string, string> = {
  low: "#2A9D8F",
  medium: "#D4A843",
  high: "#C0392B",
}

function riskLabel(level: number) {
  if (level <= 3) return { text: "低风险", key: "low" }
  if (level <= 6) return { text: "中风险", key: "medium" }
  return { text: "高风险", key: "high" }
}

export default function Explore() {
  const player = useGameStore((s) => s.player)
  const airspaces = useGameStore((s) => s.airspaces)
  const currentEvent = useGameStore((s) => s.currentEvent)
  const isStormSeason = useGameStore((s) => s.isStormSeason)
  const triggerEvent = useGameStore((s) => s.triggerEvent)
  const resolveEvent = useGameStore((s) => s.resolveEvent)
  const planRouteAction = useGameStore((s) => s.planRoute)
  const launchRouteAction = useGameStore((s) => s.launchRoute)
  const advanceRouteNodeAction = useGameStore((s) => s.advanceRouteNode)
  const completeRouteAction = useGameStore((s) => s.completeRoute)
  const currentRoute = useGameStore((s) => s.currentRoute)
  const routeProgress = useGameStore((s) => s.routeProgress)
  const completedRoutes = useGameStore((s) => s.completedRoutes)

  const [selectedAirshipId, setSelectedAirshipId] = useState("")
  const [startAirspaceId, setStartAirspaceId] = useState("")
  const [endAirspaceId, setEndAirspaceId] = useState("")

  const dockedAirships = player.airships.filter((a) => a.status === "docked")
  const discoveredAirspaces = airspaces.filter((a) => a.discovered)

  const isInFlight = routeProgress !== null && routeProgress.completedAt === null
  const isRouteComplete = routeProgress !== null && routeProgress.completedAt !== null
  const isPlanning = !isInFlight && !isRouteComplete

  const routeAirspaceIds = useMemo(() => {
    if (!currentRoute) return new Set<string>()
    return new Set(currentRoute.nodes.map((n) => n.airspaceId))
  }, [currentRoute])

  const currentAirspaceId = routeProgress
    ? routeProgress.route.nodes[routeProgress.currentNodeIndex]?.airspaceId ?? null
    : null

  const minQ = Math.min(...airspaces.map((a) => a.hexQ))
  const maxQ = Math.max(...airspaces.map((a) => a.hexQ))
  const minR = Math.min(...airspaces.map((a) => a.hexR))
  const maxR = Math.max(...airspaces.map((a) => a.hexR))

  const topLeft = hexToPixel(minQ, minR)
  const bottomRight = hexToPixel(maxQ, maxR)
  const svgW = bottomRight.x - topLeft.x + HEX_W + 20
  const svgH = bottomRight.y - topLeft.y + HEX_H + 20
  const offsetX = -topLeft.x + HEX_W / 2 + 10
  const offsetY = -topLeft.y + HEX_H / 2 + 10

  function handlePlanRoute() {
    if (!selectedAirshipId || !startAirspaceId || !endAirspaceId) return
    if (startAirspaceId === endAirspaceId) return
    planRouteAction(selectedAirshipId, startAirspaceId, endAirspaceId)
  }

  function handleLaunchRoute() {
    if (!currentRoute || currentRoute.nodes.length <= 1) return
    launchRouteAction(currentRoute)
  }

  const flyingAirship = routeProgress
    ? player.airships.find((a) => a.id === routeProgress.route.airshipId)
    : null

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col gap-6">
      <h1 className="section-title flex items-center gap-2">
        <Compass className="w-5 h-5" />
        航线探索
      </h1>

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
          <Wind className="w-4 h-4" />
          ⚠️ 暴风季预警：当前飞行风险升高，探索事件可能遭遇强风暴，请谨慎出行
        </div>
      )}

      <div className="card-metal p-4 rounded-lg overflow-auto">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="mx-auto block"
          style={{ maxWidth: "100%" }}
        >
          <g transform={`translate(${offsetX}, ${offsetY})`}>
            {currentRoute && (
              <>
                {currentRoute.nodes.slice(0, -1).map((node, i) => {
                  const next = currentRoute.nodes[i + 1]
                  const p1 = hexToPixel(node.hexQ, node.hexR)
                  const p2 = hexToPixel(next.hexQ, next.hexR)
                  return (
                    <line
                      key={`path-${i}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#D4A843"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      opacity={0.6}
                    />
                  )
                })}
              </>
            )}
            {airspaces.map((a) => (
              <HexCell
                key={a.id}
                airspace={a}
                isRouteNode={routeAirspaceIds.has(a.id)}
                isCurrentNode={a.id === currentAirspaceId}
              />
            ))}
          </g>
        </svg>
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {(["island", "cloud_sea", "storm_zone", "ruins", "void"] as const).map((t) => (
            <div key={t} className="flex items-center gap-1 text-[10px] text-gray-400">
              {TERRAIN_ICONS[t]}
              {TERRAIN_NAMES[t]}
            </div>
          ))}
        </div>
      </div>

      {isPlanning && (
        <div className="card-metal p-4 rounded-lg">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-gray-300">航线规划</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedAirshipId}
                onChange={(e) => setSelectedAirshipId(e.target.value)}
                className="flex-1 bg-navy-700 border border-navy-600/50 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-gold-500/40"
              >
                <option value="">选择飞艇</option>
                {dockedAirships.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select
                value={startAirspaceId}
                onChange={(e) => setStartAirspaceId(e.target.value)}
                className="flex-1 bg-navy-700 border border-navy-600/50 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-gold-500/40"
              >
                <option value="">起始空域</option>
                {discoveredAirspaces.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({TERRAIN_NAMES[a.terrain]})
                  </option>
                ))}
              </select>
              <select
                value={endAirspaceId}
                onChange={(e) => setEndAirspaceId(e.target.value)}
                className="flex-1 bg-navy-700 border border-navy-600/50 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-gold-500/40"
              >
                <option value="">目标空域</option>
                {airspaces.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.discovered ? `${a.name} (${TERRAIN_NAMES[a.terrain]})` : `未知空域 (${a.hexQ},${a.hexR})`}
                  </option>
                ))}
              </select>
              <button
                onClick={handlePlanRoute}
                disabled={!selectedAirshipId || !startAirspaceId || !endAirspaceId || startAirspaceId === endAirspaceId}
                className="btn-outline flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Compass className="w-4 h-4" />
                规划航线
              </button>
            </div>

            {currentRoute && !routeProgress && (
              <div className="flex flex-col gap-3 mt-2 p-3 rounded-lg border border-gold-500/20 bg-navy-800/50">
                <h3 className="text-sm font-medium text-gold-400">航线预览 — {currentRoute.airshipName}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="flex flex-col items-center gap-1 p-2 rounded bg-navy-900/60">
                    <span className="text-gray-400">预计距离</span>
                    <span className="text-gray-200 font-medium">{currentRoute.estimatedDistance} 海里</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded bg-navy-900/60">
                    <span className="text-gray-400">燃料消耗</span>
                    <span className="text-blue-400 font-medium">{currentRoute.estimatedFuel}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded bg-navy-900/60">
                    <span className="text-gray-400">耐久损耗</span>
                    <span className="text-orange-400 font-medium">{currentRoute.estimatedDurability}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded bg-navy-900/60">
                    <span className="text-gray-400">风险等级</span>
                    <span style={{ color: RISK_COLORS[riskLabel(currentRoute.estimatedRisk).key] }} className="font-medium">
                      {riskLabel(currentRoute.estimatedRisk).text}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 rounded bg-navy-900/60">
                    <span className="text-gray-400">预期资源</span>
                    <span className="text-emerald-400 font-medium">
                      {currentRoute.estimatedResources.length > 0
                        ? currentRoute.estimatedResources.map((r) => `${RESOURCE_LABELS[r.type] ?? r.type} x${r.amount}`).join(", ")
                        : "无"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs text-gray-400">途经节点：</span>
                  {currentRoute.nodes.map((n, i) => (
                    <span key={i} className="text-xs text-gray-300 flex items-center gap-1">
                      {i > 0 && <span className="text-gold-500">→</span>}
                      <span className={i === 0 ? "text-gold-400" : ""}>{n.airspaceName}</span>
                      <span className="text-gray-500">({TERRAIN_NAMES[n.terrain]})</span>
                    </span>
                  ))}
                </div>
                {currentRoute.nodes.length <= 1 && (
                  <div className="text-xs text-red-400 mt-1">起点与目标相同，无法规划有效航线</div>
                )}
                <button
                  onClick={handleLaunchRoute}
                  disabled={currentRoute.nodes.length <= 1}
                  className="btn-gold flex items-center justify-center gap-1.5 self-end mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MapPin className="w-4 h-4" />
                  起飞出发
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isInFlight && routeProgress && (
        <div className="flex flex-col gap-5">
          <div className="card-metal p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gold-400">
                {routeProgress.route.airshipName} 飞行中...
              </h2>
              <span className="text-xs text-gray-500">
                节点 {routeProgress.currentNodeIndex + 1}/{routeProgress.route.nodes.length}
              </span>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="flex items-center gap-0 min-w-max">
                {routeProgress.route.nodes.map((node, i) => {
                  const isCurrent = i === routeProgress.currentNodeIndex
                  const isPast = i < routeProgress.currentNodeIndex
                  return (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center gap-1" style={{ minWidth: 80 }}>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{
                            backgroundColor: isCurrent ? "#D4A843" : isPast ? "#2A9D8F" : "#1A3F65",
                            color: isCurrent || isPast ? "#0B1D3A" : "#4A6FA5",
                            boxShadow: isCurrent ? "0 0 8px #D4A84388" : "none",
                          }}
                        >
                          {i + 1}
                        </div>
                        <span className={`text-[10px] text-center leading-tight ${isCurrent ? "text-gold-400 font-medium" : isPast ? "text-emerald-400" : "text-gray-500"}`}>
                          {node.airspaceName}
                        </span>
                        <span className="text-[9px] text-gray-600 flex items-center gap-0.5">
                          {TERRAIN_ICONS[node.terrain]}
                          {TERRAIN_NAMES[node.terrain]}
                        </span>
                      </div>
                      {i < routeProgress.route.nodes.length - 1 && (
                        <div
                          className="h-0.5 w-6"
                          style={{
                            backgroundColor: isPast ? "#2A9D8F" : "#1A3F65",
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {flyingAirship && (
            <div className="card-metal p-4 rounded-lg">
              <div className="flex flex-wrap gap-4 justify-center">
                <GaugeChart label="海拔" value={flyingAirship.currentAltitude} max={2000} unit="m" color="#3B82F6" size="sm" />
                <GaugeChart label="氧气" value={flyingAirship.currentOxygen} max={100} unit="%" color="#2A9D8F" size="sm" />
                <GaugeChart
                  label="帆完整度"
                  value={Math.max(0, flyingAirship.sailIntegrity - routeProgress.sailWear)}
                  max={100}
                  unit="%"
                  color="#D4A843"
                  size="sm"
                />
                <GaugeChart
                  label="引擎功率"
                  value={Math.max(0, flyingAirship.enginePower - routeProgress.engineWear)}
                  max={100}
                  unit="%"
                  color="#C0392B"
                  size="sm"
                />
              </div>
            </div>
          )}

          <div className="card-metal p-4 rounded-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">探索事件</h3>
                {!currentEvent && (
                  <button
                    onClick={() => {
                      if (routeProgress.route.airshipId) {
                        triggerEvent(routeProgress.route.airshipId)
                      }
                    }}
                    className="btn-outline flex items-center gap-1 text-xs px-2.5 py-1"
                  >
                    <Wind className="w-3 h-3" />
                    触发事件
                  </button>
                )}
              </div>

              {currentEvent ? (
                <div className="card-metal p-4 rounded-lg border-gold-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-4 h-4 text-gold-400" />
                    <span className="font-medium text-gold-400">{currentEvent.title}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">{currentEvent.description}</p>
                  <div className="flex flex-col gap-2">
                    {currentEvent.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (routeProgress.route.airshipId) {
                            resolveEvent(routeProgress.route.airshipId, idx)
                          }
                        }}
                        className="btn-outline text-left text-xs px-3 py-2"
                      >
                        {choice.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card-metal p-4 rounded-lg text-center text-gray-500 text-sm">
                  当前无事件，点击"触发事件"可能遭遇随机探索事件
                </div>
              )}

              <button
                onClick={() => advanceRouteNodeAction()}
                className="btn-copper flex items-center justify-center gap-1.5 self-end mt-1"
              >
                <MapPin className="w-4 h-4" />
                前进至下一节点
              </button>
            </div>
          </div>
        </div>
      )}

      {isRouteComplete && routeProgress && (
        <div className="card-metal p-4 rounded-lg">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-gold-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              航线探索完成
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 p-3 rounded-lg bg-navy-900/60">
                <h4 className="text-xs text-gray-400 font-medium">采集资源</h4>
                {Object.keys(routeProgress.gatheredResources).length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {Object.entries(routeProgress.gatheredResources).map(([type, amount]) => (
                      <div key={type} className="flex justify-between text-xs">
                        <span className="text-gray-300">{RESOURCE_LABELS[type as keyof typeof RESOURCE_LABELS] ?? type}</span>
                        <span className="text-emerald-400">x{amount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">无</span>
                )}
              </div>

              <div className="flex flex-col gap-2 p-3 rounded-lg bg-navy-900/60">
                <h4 className="text-xs text-gray-400 font-medium">发现空域</h4>
                {routeProgress.discoveries.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {routeProgress.discoveries.map((name, i) => (
                      <span key={i} className="text-xs text-blue-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">无新发现</span>
                )}
              </div>

              <div className="flex flex-col gap-2 p-3 rounded-lg bg-navy-900/60">
                <h4 className="text-xs text-gray-400 font-medium">损耗情况</h4>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">帆磨损</span>
                    <span className={routeProgress.sailWear > 20 ? "text-red-400" : "text-yellow-400"}>
                      -{routeProgress.sailWear.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">引擎磨损</span>
                    <span className={routeProgress.engineWear > 20 ? "text-red-400" : "text-yellow-400"}>
                      -{routeProgress.engineWear.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">燃料消耗</span>
                    <span className="text-blue-400">{routeProgress.fuelUsed}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => completeRouteAction()}
              className="btn-gold flex items-center justify-center gap-1.5 self-end"
            >
              <MapPin className="w-4 h-4" />
              返航停靠
            </button>
          </div>
        </div>
      )}

      {completedRoutes.length > 0 && (
        <div className="card-metal p-4 rounded-lg">
          <h2 className="section-title text-sm mb-3">历史航线</h2>
          <div className="flex flex-col gap-3">
            {completedRoutes.map((entry, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-navy-900/40 border border-navy-600/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gold-400">
                    {entry.route.airshipName}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {entry.completedAt ? new Date(entry.completedAt).toLocaleString() : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                  <span>节点: {entry.route.nodes.length}</span>
                  <span>
                    采集: {Object.entries(entry.gatheredResources).map(([t, a]) => `${RESOURCE_LABELS[t as keyof typeof RESOURCE_LABELS] ?? t} x${a}`).join(", ") || "无"}
                  </span>
                  <span>发现: {entry.discoveries.length > 0 ? entry.discoveries.join(", ") : "无"}</span>
                  <span>帆磨损: -{entry.sailWear.toFixed(1)}%</span>
                  <span>引擎磨损: -{entry.engineWear.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
