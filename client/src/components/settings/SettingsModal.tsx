import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext"
import { useAuthStore } from "../../store/useAuthStore"
import { useHabitStore } from "../../store/useHabitStore"

type SettingsModalProps = {
  onClose: () => void
}

const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore(state => state.user)
  const updateName = useAuthStore(state => state.updateName)
  const logout = useAuthStore(state => state.logout)
  const resetData = useAuthStore(state => state.resetData)
  const deleteAccount = useAuthStore(state => state.deleteAccount)
  const clearHabitData = useHabitStore(state => state.clearData)
  const [name, setName] = useState(user?.name || "")
  const [nameError, setNameError] = useState("")
  const [resetConfirmText, setResetConfirmText] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const currentPlan = user?.plan || "free"
  const planCtaLabel =
    currentPlan === "gold"
      ? "Max Plan User"
      : currentPlan === "pro"
        ? "Upgrade to Gold"
        : "Upgrade to Pro"

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      setDeleteError("Type DELETE to confirm account deletion.")
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError("")
      await deleteAccount(deletePassword)
      onClose()
      navigate("/register")
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetData = async () => {
    if (resetConfirmText.trim().toUpperCase() !== "RESET") {
      setResetError("Type RESET to confirm data reset.")
      return
    }

    try {
      setIsResetting(true)
      setResetError("")
      setResetSuccess("")
      await resetData()
      clearHabitData()
      setResetSuccess("All your habit data has been reset.")
      setResetConfirmText("")
    } catch (err) {
      setResetError((err as Error).message)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200 opacity-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden transition-all duration-200 opacity-100 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[#0b1220] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col max-h-[90vh]">
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

          <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
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
                {planCtaLabel}
              </button>
            </section>

            <section>
              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-3">Danger Zone</h3>
              <div className="flex flex-col gap-4">
                <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                    Reset all habit data (habits, entries, and skipped-day status)
                  </p>
                  <input
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="Type RESET to confirm"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm mb-2"
                  />
                  <button
                    onClick={handleResetData}
                    disabled={isResetting}
                    className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm disabled:opacity-60"
                  >
                    {isResetting ? "Resetting..." : "Reset All Data"}
                  </button>
                  {resetError && <p className="text-xs text-red-500 mt-2">{resetError}</p>}
                  {resetSuccess && <p className="text-xs text-green-600 mt-2">{resetSuccess}</p>}
                </div>

                

                <div className="border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs text-red-500 mb-2">Delete account permanently</p>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Confirm with password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm mb-2"
                  />
                  <input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm mb-2"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-60"
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </button>
                  
                  {deleteError && <p className="text-xs text-red-500 mt-2">{deleteError}</p>}

                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg border bg-red-600 border-red-200 text-white text-sm w-fit"
                >
                  Logout
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
