import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

const MainLayout = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#f6f7fb] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 overflow-y-auto min-h-0">
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout
