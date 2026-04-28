import { Routes, Route } from "react-router-dom"
import MainLayout from "./components/layout/MainLayout"

import Today from "./pages/Today"
import Month from "./pages/Month"
import Grid from "./pages/Grid"
import AddHabit from "./pages/AddHabit"
import Settings from "./pages/Settings"

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/month" element={<Month />} />
        <Route path="/grid" element={<Grid />} />
        <Route path="/add" element={<AddHabit />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MainLayout>
  )
}

export default App  