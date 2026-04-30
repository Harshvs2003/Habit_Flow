import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useAuthStore } from "../store/useAuthStore"
import {
  User,
  Moon,
  Bell,
  Download,
  HelpCircle,
  Info,
  LogOut
} from "lucide-react"

const Settings = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const logout = useAuthStore(state => state.logout)

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">

      <div className="max-w-xl">

        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Settings
        </h1>

        {/* SETTINGS LIST */}
        <div className="bg-white dark:bg-[#0b1220] rounded-2xl border border-gray-200 dark:border-gray-800 divide-y">

          {/* ACCOUNT */}
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <div className="flex items-center gap-3">
              <User size={18} />
              <span className="text-sm text-gray-800 dark:text-white">Account</span>
            </div>
          </div>

          {/* APPEARANCE */}
          <div className="flex items-center justify-between p-4">

            <div className="flex items-center gap-3">
              <Moon size={18} />
              <span className="text-sm text-gray-800 dark:text-white">
                Appearance
              </span>
            </div>

            {/* TOGGLE SWITCH */}
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                theme === "dark" ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
                  theme === "dark" ? "translate-x-6" : ""
                }`}
              />
            </button>

          </div>

          {/* REMINDERS */}
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <div className="flex items-center gap-3">
              <Bell size={18} />
              <span className="text-sm text-gray-800 dark:text-white">
                Reminders
              </span>
            </div>
          </div>

          {/* BACKUP */}
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <div className="flex items-center gap-3">
              <Download size={18} />
              <span className="text-sm text-gray-800 dark:text-white">
                Backup & Export
              </span>
            </div>
          </div>

          {/* HELP */}
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <div className="flex items-center gap-3">
              <HelpCircle size={18} />
              <span className="text-sm text-gray-800 dark:text-white">
                Help & Support
              </span>
            </div>
          </div>

          {/* ABOUT */}
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <div className="flex items-center gap-3">
              <Info size={18} />
              <span className="text-sm text-gray-800 dark:text-white">
                About HabitFlow
              </span>
            </div>
          </div>

        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-white dark:bg-[#0b1220] border border-gray-200 dark:border-gray-800 text-red-500 py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <LogOut size={16} />
          Log Out
        </button>

      </div>
    </div>
  )
}

export default Settings
