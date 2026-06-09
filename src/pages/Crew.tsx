import { useGameStore } from "@/store/gameStore"
import { CREW_ROLE_LABELS } from "@/types"
import type { CrewMember } from "@/types"
import { UserPlus, RefreshCw, AlertTriangle, Shield, Wrench, Target } from "lucide-react"

const ROLE_ICONS: Record<string, React.ReactNode> = {
  navigator: <Shield className="w-3.5 h-3.5" />,
  technician: <Wrench className="w-3.5 h-3.5" />,
  gunner: <Target className="w-3.5 h-3.5" />,
}

const ROLE_COLORS: Record<string, string> = {
  navigator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  technician: "bg-green-500/20 text-green-400 border-green-500/30",
  gunner: "bg-red-500/20 text-red-400 border-red-500/30",
}

function loyaltyColor(val: number) {
  if (val >= 60) return "#22C55E"
  if (val >= 30) return "#EAB308"
  return "#EF4444"
}

function CrewCard({ member, airships }: { member: CrewMember; airships: { id: string; name: string }[] }) {
  const assignCrew = useGameStore((s) => s.assignCrew)
  const color = loyaltyColor(member.loyalty)
  const isDanger = member.loyalty < 30

  return (
    <div className="card-metal-hover p-3 rounded-lg flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-xl shrink-0">
          {member.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gold-400 truncate">{member.name}</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${ROLE_COLORS[member.role]}`}>
              {ROLE_ICONS[member.role]}
              {CREW_ROLE_LABELS[member.role]}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-400">薪资</span>
            <span className="text-xs text-gold-400">{member.salary} 金币/周</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {member.skills.map((sk, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-navy-700/60 text-gray-300 border border-navy-600/50">
            {sk.name} Lv.{sk.level}
          </span>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-gray-400">忠诚度</span>
          <div className="flex items-center gap-1">
            {isDanger && <AlertTriangle className="w-3 h-3 text-red-500" />}
            {isDanger && <span className="text-[10px] text-red-400">叛变风险</span>}
            <span className="text-[10px] font-medium" style={{ color }}>{member.loyalty}</span>
          </div>
        </div>
        <div className="stat-bar">
          <div className="stat-bar-fill" style={{ width: `${member.loyalty}%`, backgroundColor: color }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 shrink-0">指派飞艇</span>
        <select
          value={member.assignedAirship ?? ""}
          onChange={(e) => assignCrew(member.id, e.target.value || null)}
          className="flex-1 bg-navy-700 border border-navy-600/50 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-gold-500/40"
        >
          <option value="">未指派</option>
          {airships.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function Crew() {
  const player = useGameStore((s) => s.player)
  const recruitmentPool = useGameStore((s) => s.recruitmentPool)
  const recruitCrew = useGameStore((s) => s.recruitCrew)
  const refreshRecruitment = useGameStore((s) => s.refreshRecruitment)

  const airshipOptions = player.airships.map((a) => ({ id: a.id, name: a.name }))

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col gap-6">
      <h1 className="section-title flex items-center gap-2">
        <Shield className="w-5 h-5" />
        船员管理
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">当前船员 ({player.crew.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {player.crew.map((c) => (
              <CrewCard key={c.id} member={c} airships={airshipOptions} />
            ))}
          </div>
          {player.crew.length === 0 && (
            <div className="card-metal p-8 text-center text-gray-500 text-sm">暂无船员，请从招募池中雇佣</div>
          )}
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-gold-400" />
              招募池
            </h2>
            <button onClick={refreshRecruitment} className="btn-outline flex items-center gap-1 text-xs px-2 py-1">
              <RefreshCw className="w-3 h-3" />
              刷新
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {recruitmentPool.map((r) => {
              const cost = r.salary * 3
              const canAfford = player.gold >= cost
              return (
                <div key={r.id} className="card-metal p-3 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-lg shrink-0">
                      {r.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-gold-400 truncate">{r.name}</span>
                        <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] border ${ROLE_COLORS[r.role]}`}>
                          {ROLE_ICONS[r.role]}
                          {CREW_ROLE_LABELS[r.role]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.skills.map((sk, i) => (
                      <span key={i} className="text-[10px] px-1 py-0.5 rounded bg-navy-700/60 text-gray-300 border border-navy-600/50">
                        {sk.name} Lv.{sk.level}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">忠诚度 {r.loyalty}</span>
                    <span className="text-gold-400">周薪 {r.salary}</span>
                  </div>
                  <button
                    onClick={() => recruitCrew(r.id)}
                    disabled={!canAfford}
                    className="btn-gold flex items-center justify-center gap-1 text-xs w-full"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    雇佣 ({cost} 金币)
                  </button>
                </div>
              )
            })}
          </div>

          <div className="card-metal p-3 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">当前金币</span>
              <span className="text-gold-400 font-medium">{player.gold}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
