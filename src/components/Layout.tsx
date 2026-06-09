import { NavLink, Outlet } from "react-router-dom"
import { Ship, Users, Map, Swords, Castle, ShoppingBag, BarChart3, Trophy, Home, Settings } from "lucide-react"

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "总览大厅" },
  { path: "/workshop", icon: Ship, label: "飞艇工坊" },
  { path: "/crew", icon: Users, label: "船员管理" },
  { path: "/explore", icon: Map, label: "空域探索" },
  { path: "/battle", icon: Swords, label: "空域争夺" },
  { path: "/outpost", icon: Castle, label: "前哨站" },
  { path: "/market", icon: ShoppingBag, label: "交易市场" },
  { path: "/report", icon: BarChart3, label: "全服报告" },
  { path: "/leaderboard", icon: Trophy, label: "排行榜" },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#060E1A]">
      <aside className="w-56 flex-shrink-0 bg-navy-900/95 border-r border-gold-500/10 flex flex-col">
        <div className="p-4 border-b border-gold-500/10">
          <h1 className="font-cinzel text-lg font-bold text-gold-400 tracking-wider">SKYFLEET</h1>
          <p className="text-xs text-gold-500/50 mt-0.5">魔法飞艇 · 空域争夺</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                    : "text-gray-400 hover:text-gold-400/80 hover:bg-navy-700/50 border border-transparent"
                }`
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gold-500/10">
          <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors">
            <Settings size={14} />
            <span>系统设置</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
