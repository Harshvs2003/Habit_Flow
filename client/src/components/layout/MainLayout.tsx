import Sidebar from "./Sidebar"

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-[#f6f7fb] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">

      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </div>

    </div>
  )
}

export default MainLayout