import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

type Habit = {
  id: number
  title: string
  category: string
}

const AddHabit = () => {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Health")

  const [habits, setHabits] = useState<Habit[]>([
    { id: 1, title: "Workout", category: "Health" },
    { id: 2, title: "Reading", category: "Personal" }
  ])

  const addHabit = () => {
    if (!title.trim()) return

    const newHabit = {
      id: Date.now(),
      title,
      category
    }

    setHabits(prev => [...prev, newHabit])
    setTitle("")
  }

  const deleteHabit = (id: number) => {
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">

      <div className="max-w-xl">

        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Manage Habits
        </h1>

        {/* ADD FORM */}
        <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 mb-6">

          <div className="flex flex-col gap-3">

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                key={habit.id}
                className="flex justify-between items-center p-4 border-b last:border-none border-gray-200 dark:border-gray-800"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {habit.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {habit.category}
                  </p>
                </div>

                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}

        </div>

      </div>
    </div>
  )
}

export default AddHabit