import { Link, useLocation } from "react-router-dom"
import { Home, BarChart2, Calendar, Lightbulb, List, Settings } from "lucide-react"

const Sidebar = () => {
  const { pathname } = useLocation()

  const navItems = [
    { name: "Today", path: "/", icon: Home },
    { name: "Track Record", path: "/month", icon: BarChart2 },
    { name: "Calendar", path: "/grid", icon: Calendar },
    { name: "Insights", path: "/insights", icon: Lightbulb },
    { name: "Habits", path: "/add", icon: List },
    { name: "Settings", path: "/settings", icon: Settings },
  ]

  return (
    <div className="w-64 h-screen bg-white dark:bg-[#05070d] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between p-5">

      {/* Top */}
      <div>
        <h1 className="text-xl font-semibold mb-8 text-gray-900 dark:text-white">
          HabitFlow
        </h1>

        <div className="flex flex-col gap-2">
          {navItems.map(item => {
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                  pathname === item.path
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-600 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-300"></div>

          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              Harsh
            </p>
            <p className="text-xs text-gray-500">Pro Plan</p>
          </div>
        </div>

        {/* placeholder for theme toggle later */}
        <div className="text-gray-400 text-sm">☀️</div>

      </div>

    </div>
  )
}

export default Sidebar