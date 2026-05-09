import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext"
import { useAuthStore } from "../../store/useAuthStore"

type SettingsModalProps = {
  onClose: () => void
}

const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore(state => state.user)
  const updateName = useAuthStore(state => state.updateName)
  const logout = useAuthStore(state => state.logout)
  const [name, setName] = useState(user?.name || "")
  const [nameError, setNameError] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    setName(user?.name || "")
  }, [user?.name])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  const handleSaveName = async () => {
    const trimmed = name.trim()
    if (!trimmed || !user) return
    try {
      setNameError("")
      await updateName(trimmed)
    } catch (err) {
      setNameError((err as Error).message)
    }
  }

  const handleLogout = async () => {
    await logout()
    onClose()
    navigate("/login")
  }

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[80vh] overflow-hidden transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[#0b1220] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 space-y-6">
            <section>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-3">Profile</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <div className="flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm"
                    >
                      Save
                    </button>
                  </div>
                  {nameError && (
                    <p className="mt-1 text-xs text-red-500">{nameError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input
                    value={user?.email || ""}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f172a] text-sm text-gray-500"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-3">Theme</h3>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
              >
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </button>
            </section>

            <section>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-3">Plan</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Current Plan: {(user?.plan || "free").toUpperCase()}
              </p>
              <button
                onClick={() => {
                  onClose()
                  navigate("/upgrade")
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
              >
                Upgrade Plan
              </button>
            </section>

            <section>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-3">Account</h3>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-red-200 text-red-500 text-sm"
              >
                Logout
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
