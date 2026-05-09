import { useEffect, useRef, useState } from "react"
import { Archive, ArrowDown, ArrowUp, Check, Pencil, Plus, RotateCcw, Star, Trash2, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"
import { useAuthStore } from "../store/useAuthStore"
import { plans } from "../config/plans"

type Habit = {
  _id: string
  title: string
  category: string
  archived?: boolean
  isPinned?: boolean
  sortOrder?: number
}

const AddHabit = () => {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Health")
  const [habits, setHabits] = useState<Habit[]>([])
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([])
  const [limitMessage, setLimitMessage] = useState("")
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const reorderRequestRef = useRef(0)
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
      const [activeRes, archivedRes] = await Promise.all([
        fetchWithAuth(`${API}/habits`),
        fetchWithAuth(`${API}/habits?archived=true`)
      ])
      const [activeData, archivedData] = await Promise.all([
        activeRes.json(),
        archivedRes.json()
      ])
      setHabits(activeData)
      setArchivedHabits(archivedData)
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
      setArchivedHabits(prev => prev.filter(h => h._id !== id))
      setDeletingHabit(null)
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

  const archiveHabit = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${API}/habits/${id}/archive`, { method: "PATCH" })
      const data = await parseResponseBody(res)
      if (!res.ok) throw new Error(data.message || "Failed to archive habit")
      await fetchHabits()
    } catch (err) {
      setLimitMessage((err as Error).message)
    }
  }

  const unarchiveHabit = async (id: string) => {
    try {
      const res = await fetchWithAuth(`${API}/habits/${id}/unarchive`, { method: "PATCH" })
      const data = await parseResponseBody(res)
      if (!res.ok) throw new Error(data.message || "Failed to restore habit")
      await fetchHabits()
    } catch (err) {
      setLimitMessage((err as Error).message)
    }
  }

  const togglePin = async (habit: Habit) => {
    try {
      const res = await fetchWithAuth(`${API}/habits/${habit._id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ isPinned: !habit.isPinned })
      })
      const data = await parseResponseBody(res)
      if (!res.ok) throw new Error(data.message || "Failed to pin habit")
      setHabits(prev => prev.map(h => (h._id === habit._id ? data : h)))
      await fetchHabits()
    } catch (err) {
      setLimitMessage((err as Error).message)
    }
  }

  const reorderHabits = async (nextHabits: Habit[]) => {
    const requestId = ++reorderRequestRef.current
    setHabits(nextHabits)
    setIsReordering(true)
    try {
      const res = await fetchWithAuth(`${API}/habits/reorder/list`, {
        method: "PATCH",
        body: JSON.stringify({ orderedIds: nextHabits.map(h => h._id) })
      })
      const data = await parseResponseBody(res)
      if (!res.ok) throw new Error(data.message || "Failed to reorder habits")
      if (requestId === reorderRequestRef.current) {
        setHabits(data)
      }
    } catch (err) {
      setLimitMessage((err as Error).message)
      if (requestId === reorderRequestRef.current) {
        await fetchHabits()
      }
    } finally {
      if (requestId === reorderRequestRef.current) {
        setIsReordering(false)
      }
    }
  }

  const moveHabit = (index: number, direction: -1 | 1) => {
    if (isReordering) return
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= habits.length) return
    const nextHabits = [...habits]
    const [moved] = nextHabits.splice(index, 1)
    nextHabits.splice(nextIndex, 0, moved)
    reorderHabits(nextHabits)
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

        {/* ACTIVE HABIT LIST */}
        <div className="bg-white dark:bg-[#0b1220] rounded-2xl border border-gray-200 dark:border-gray-800">

          {habits.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              No habits added yet
            </p>
          ) : (
            habits.map((habit, index) => (
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
                  <button
                    onClick={() => togglePin(habit)}
                    className={habit.isPinned ? "text-amber-500" : "text-gray-400"}
                    title={habit.isPinned ? "Unpin habit" : "Pin habit"}
                  >
                    <Star size={16} fill={habit.isPinned ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => moveHabit(index, -1)}
                    disabled={isReordering}
                    className={`text-gray-500 ${isReordering ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveHabit(index, 1)}
                    disabled={isReordering}
                    className={`text-gray-500 ${isReordering ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
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
                    onClick={() => archiveHabit(habit._id)}
                    className="text-gray-500"
                    title="Archive"
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingHabit(habit)}
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

        {/* ARCHIVED HABITS */}
        <div className="mt-6 bg-white dark:bg-[#0b1220] rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-800 dark:text-white">Archived Habits</p>
          </div>
          {archivedHabits.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No archived habits</p>
          ) : (
            archivedHabits.map(habit => (
              <div
                key={habit._id}
                className="flex justify-between items-center p-4 border-b last:border-none border-gray-200 dark:border-gray-800"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{habit.title}</p>
                  <p className="text-xs text-gray-500">{habit.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => unarchiveHabit(habit._id)}
                    className="text-indigo-600"
                    title="Restore habit"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingHabit(habit)}
                    className="text-red-500"
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {deletingHabit && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0b1220] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Habit?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              This will permanently delete "{deletingHabit.title}" and cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingHabit(null)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteHabit(deletingHabit._id)}
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddHabit
