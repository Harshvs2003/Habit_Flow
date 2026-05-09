import { useEffect, useState } from "react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"
import { useAuthStore } from "../store/useAuthStore"
import { plans } from "../config/plans"

type Habit = {
  _id: string
  title: string
  category: string
}

const AddHabit = () => {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Health")
  const [habits, setHabits] = useState<Habit[]>([])
  const [limitMessage, setLimitMessage] = useState("")
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const currentPlan = user?.plan || "free"
  const upgradeLabel =
    currentPlan === "gold"
      ? "Max Plan User"
      : currentPlan === "pro"
        ? "Upgrade to Gold"
        : "Upgrade to Pro"
  const limitUpgradeMessage =
    currentPlan === "pro"
      ? "Upgrade to Gold to add more habits"
      : "Upgrade to Pro to add more habits"

  // 🚀 FETCH HABITS
  const fetchHabits = async () => {
    try {
      const res = await fetchWithAuth(`${API}/habits`)
      const data = await res.json()
      setHabits(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [])

  // ➕ ADD HABIT
  const addHabit = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const userPlan = user?.plan || "free"
    const maxHabits = plans[userPlan].maxHabits
    if (Number.isFinite(maxHabits) && habits.length >= maxHabits) {
      setLimitMessage(limitUpgradeMessage)
      return
    }

    try {
      const res = await fetchWithAuth(`${API}/habits`, {
        method: "POST",
        body: JSON.stringify({ title: trimmedTitle, category })
      })
      const data = await parseResponseBody(res)
      if (!res.ok) {
        throw new Error(data.message || "Failed to add habit")
      }

      setHabits(prev => [...prev, data])
      setTitle("")
      setLimitMessage("")
    } catch (err) {
      setLimitMessage((err as Error).message)
    }
  }

  // ❌ DELETE HABIT
  const deleteHabit = async (id: string) => {
    try {
      await fetchWithAuth(`${API}/habits/${id}`, {
        method: "DELETE"
      })

      setHabits(prev => prev.filter(h => h._id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const startEditing = (habit: Habit) => {
    setEditingHabitId(habit._id)
    setEditingTitle(habit.title)
  }

  const cancelEditing = () => {
    setEditingHabitId(null)
    setEditingTitle("")
  }

  const renameHabit = async (id: string) => {
    const nextTitle = editingTitle.trim()
    if (!nextTitle) return

    try {
      const res = await fetchWithAuth(`${API}/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: nextTitle })
      })
      const data = await parseResponseBody(res)
      if (!res.ok) {
        throw new Error(data.message || "Failed to rename habit")
      }

      setHabits(prev => prev.map(h => (
        h._id === id ? { ...h, title: data.title } : h
      )))
      cancelEditing()
    } catch (err) {
      setLimitMessage((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">

      <div className="max-w-xl">

        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Manage Habits
        </h1>

        {limitMessage && (
          <div className="mb-4 p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-sm flex items-center justify-between gap-3">
            <span>{limitMessage}</span>
            <button
              onClick={() => navigate("/upgrade")}
              className="text-indigo-600 font-medium whitespace-nowrap"
            >
              {upgradeLabel}
            </button>
          </div>
        )}

        {/* ADD FORM */}
        <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 mb-6">

          <div className="flex flex-col gap-3">

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="Habit name..."
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm outline-none"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm outline-none"
            >
              <option>Health</option>
              <option>Personal</option>
              <option>Productivity</option>
              <option>Learning</option>
            </select>

            <button
              onClick={addHabit}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-xl text-sm"
            >
              <Plus size={16} />
              Add Habit
            </button>

          </div>
        </div>

        {/* HABIT LIST */}
        <div className="bg-white dark:bg-[#0b1220] rounded-2xl border border-gray-200 dark:border-gray-800">

          {habits.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              No habits added yet
            </p>
          ) : (
            habits.map(habit => (
              <div
                key={habit._id}
                className="flex justify-between items-center p-4 border-b last:border-none border-gray-200 dark:border-gray-800"
              >
                <div>
                  {editingHabitId === habit._id ? (
                    <input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      maxLength={60}
                      className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm outline-none"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {habit.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {habit.category}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {editingHabitId === habit._id ? (
                    <>
                      <button
                        onClick={() => renameHabit(habit._id)}
                        className="text-green-600"
                        title="Save name"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-500"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing(habit)}
                      className="text-gray-600 dark:text-gray-300"
                      title="Edit name"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteHabit(habit._id)}
                    className="text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}

        </div>

      </div>
    </div>
  )
}

export default AddHabit
