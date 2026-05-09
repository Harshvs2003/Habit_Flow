import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Home, BarChart2, Calendar, Lightbulb, List, Settings } from "lucide-react"
import { useAuthStore } from "../../store/useAuthStore"
import SettingsModal from "../settings/SettingsModal"

const Sidebar = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const updateName = useAuthStore(state => state.updateName)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.name || "")
  const [nameError, setNameError] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const navItems = [
    { name: "Today", path: "/app", icon: Home },
    { name: "Month", path: "/app/month", icon: BarChart2 },
    { name: "Calendar", path: "/app/grid", icon: Calendar },
    { name: "Insights", path: "/app/insights", icon: Lightbulb },
    { name: "Habits", path: "/app/add", icon: List }
  ]

  useEffect(() => {
    setNameInput(user?.name || "")
  }, [user?.name])

  const handleNameSave = async () => {
    const nextName = nameInput.trim()
    if (!nextName || !user) return
    try {
      setNameError("")
      await updateName(nextName)
      setEditingName(false)
    } catch (err) {
      setNameError((err as Error).message)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const planLabel = (user?.plan || "free").toUpperCase()
  const currentPlan = user?.plan || "free"
  const planCtaLabel =
    currentPlan === "gold"
      ? "Max Plan User"
      : currentPlan === "pro"
        ? "Upgrade to Gold"
        : "Upgrade to Pro"

  const openProfileMenu = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setIsMenuOpen(true)
  }

  const scheduleCloseProfileMenu = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false)
      setEditingName(false)
    }, 150)
  }

  return (
    <>
      <div className="hidden md:flex w-64 h-screen sticky top-0 bg-white dark:bg-[#05070d] border-r border-gray-200 dark:border-gray-800 flex-col justify-between p-5">
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

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={openProfileMenu}
        onMouseLeave={scheduleCloseProfileMenu}
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
          <div
            className="absolute bottom-full mb-2 left-0 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1220] shadow-lg p-3 z-20"
            onMouseEnter={openProfileMenu}
            onMouseLeave={scheduleCloseProfileMenu}
          >
            <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 mb-3">{user?.email || "No email"}</p>

            {editingName ? (
              <div className="flex gap-2 mb-3">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={30}
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
            {nameError && (
              <p className="text-xs text-red-500 mb-2">{nameError}</p>
            )}

            <button
              onClick={() => {
                setIsMenuOpen(false)
                navigate("/upgrade")
              }}
              className="w-full text-left text-xs text-gray-700 dark:text-gray-200 mb-2"
            >
              {planCtaLabel}
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

      <div className="md:hidden bg-white dark:bg-[#05070d] border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">HabitFlow</h1>
          <button
            onClick={() => navigate("/upgrade")}
            className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
          >
            {planCtaLabel}
          </button>
        </div>
        <div className="text-xs text-gray-500 mb-3">
          {user?.name || "User"} • {planLabel} plan
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition ${
                  isActive
                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-600 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <Icon size={14} />
                {item.name}
              </Link>
            )
          })}
          <button
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
          >
            <Settings size={14} />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="shrink-0 px-3 py-2 rounded-xl text-xs text-red-500 border border-red-200"
          >
            Logout
          </button>
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}

export default Sidebar
