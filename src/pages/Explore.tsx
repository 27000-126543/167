import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { WEATHER_LABELS } from "@/types"
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

function HexCell({ airspace }: { airspace: Airspace }) {
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

export default function Explore() {
  const player = useGameStore((s) => s.player)
  const airspaces = useGameStore((s) => s.airspaces)
  const currentEvent = useGameStore((s) => s.currentEvent)
  const isStormSeason = useGameStore((s) => s.isStormSeason)
  const startExploration = useGameStore((s) => s.startExploration)
  const triggerEvent = useGameStore((s) => s.triggerEvent)
  const resolveEvent = useGameStore((s) => s.resolveEvent)

  const [selectedAirshipId, setSelectedAirshipId] = useState("")
  const [selectedAirspaceId, setSelectedAirspaceId] = useState("")

  const exploringAirship = player.airships.find((a) => a.status === "exploring")
  const isExploring = !!exploringAirship

  const dockedAirships = player.airships.filter((a) => a.status === "docked")
  const discoveredAirspaces = airspaces.filter((a) => a.discovered)

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

  function handleStartExploration() {
    if (!selectedAirshipId || !selectedAirspaceId) return
    startExploration(selectedAirshipId, selectedAirspaceId)
  }

  function handleCompleteExploration() {
    if (!exploringAirship) return
    useGameStore.setState((state) => ({
      player: {
        ...state.player,
        airships: state.player.airships.map((a) =>
          a.id === exploringAirship.id ? { ...a, status: "docked" as const } : a
        ),
      },
    }))
  }

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col gap-6">
      <h1 className="section-title flex items-center gap-2">
        <Compass className="w-5 h-5" />
        空域探索
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
            {airspaces.map((a) => (
              <HexCell key={a.id} airspace={a} />
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

      <div className="card-metal p-4 rounded-lg">
        {!isExploring ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-gray-300">选择飞艇与空域开始探索</h2>
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
                value={selectedAirspaceId}
                onChange={(e) => setSelectedAirspaceId(e.target.value)}
                className="flex-1 bg-navy-700 border border-navy-600/50 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-gold-500/40"
              >
                <option value="">选择空域</option>
                {discoveredAirspaces.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({TERRAIN_NAMES[a.terrain]}) - 危险Lv.{a.dangerLevel}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartExploration}
                disabled={!selectedAirshipId || !selectedAirspaceId}
                className="btn-gold flex items-center justify-center gap-1.5 shrink-0"
              >
                <MapPin className="w-4 h-4" />
                出发探索
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gold-400">
                {exploringAirship.name} 正在探索中...
              </h2>
              <button onClick={handleCompleteExploration} className="btn-copper flex items-center gap-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                返航停靠
              </button>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <GaugeChart label="海拔" value={exploringAirship.currentAltitude} max={2000} unit="m" color="#3B82F6" size="sm" />
              <GaugeChart label="氧气" value={exploringAirship.currentOxygen} max={100} unit="%" color="#2A9D8F" size="sm" />
              <GaugeChart label="帆完整度" value={exploringAirship.sailIntegrity} max={100} unit="%" color="#D4A843" size="sm" />
              <GaugeChart label="引擎功率" value={exploringAirship.enginePower} max={100} unit="%" color="#C0392B" size="sm" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">探索事件</h3>
                {!currentEvent && (
                  <button
                    onClick={() => triggerEvent(exploringAirship.id)}
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
                        onClick={() => resolveEvent(exploringAirship.id, idx)}
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
