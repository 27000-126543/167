import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Hall from "@/pages/Hall"
import Workshop from "@/pages/Workshop"
import Crew from "@/pages/Crew"
import Explore from "@/pages/Explore"
import Battle from "@/pages/Battle"
import Outpost from "@/pages/Outpost"
import Market from "@/pages/Market"
import Report from "@/pages/Report"
import Leaderboard from "@/pages/Leaderboard"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Hall />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/crew" element={<Crew />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/outpost" element={<Outpost />} />
          <Route path="/market" element={<Market />} />
          <Route path="/report" element={<Report />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </Router>
  )
}
