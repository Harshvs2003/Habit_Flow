import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Home, BarChart2, Calendar, Lightbulb, List, Settings } from "lucide-react"
import { useAuthStore } from "../../store/useAuthStore"

const Sidebar = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const setUser = useAuthStore(state => state.setUser)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name || "")

  const navItems = [
    { name: "Today", path: "/app", icon: Home },
    { name: "Month", path: "/app/month", icon: BarChart2 },
    { name: "Calendar", path: "/app/grid", icon: Calendar },
    { name: "Insights", path: "/app/insights", icon: Lightbulb },
    { name: "Habits", path: "/app/add", icon: List },
    { name: "Settings", path: "/app/settings", icon: Settings }
  ]

  useEffect(() => {
    setNameInput(user?.name || "")
  }, [user?.name])

  const handleNameSave = () => {
    const nextName = nameInput.trim()
    if (!nextName || !user) return
    setUser({ name: nextName })
    setEditingName(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const planLabel = (user?.plan || "free").toUpperCase()

  return (
    <div className="w-64 h-screen sticky top-0 bg-white dark:bg-[#05070d] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between p-5">
      <div>
        <h1 className="text-xl font-semibold mb-8 text-gray-900 dark:text-white">
          HabitFlow
        </h1>

        <div className="flex flex-col gap-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive =
              item.path === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                  isActive
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

      <div
        className="relative"
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => {
          setIsMenuOpen(false)
          setEditingName(false)
        }}
      >
        <button
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-300"></div>

            <div className="text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500">{planLabel} Plan</p>
            </div>
          </div>

          <div className="text-gray-400 text-sm">*</div>
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-12 left-0 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1220] shadow-lg p-3 z-20">
            <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 mb-3">{user?.email || "No email"}</p>

            {editingName ? (
              <div className="flex gap-2 mb-3">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
                />
                <button
                  onClick={handleNameSave}
                  className="text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="w-full text-left text-xs text-indigo-600 mb-3"
              >
                Edit Name
              </button>
            )}

            <button
              onClick={() => {
                setIsMenuOpen(false)
                navigate("/upgrade")
              }}
              className="w-full text-left text-xs text-gray-700 dark:text-gray-200 mb-2"
            >
              Upgrade to Pro
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left text-xs text-red-500"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
