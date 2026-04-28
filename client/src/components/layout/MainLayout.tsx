import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#f6f7fb] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 min-h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout
