import { useEffect, useState } from "react"
import API from "../services/api"
import {
  Check,
  BookOpen,
  Dumbbell,
  Moon,
  Footprints,
  Sun
} from "lucide-react"

type Habit = {
  _id: string
  title: string
  category: string
  createdAt: string
}

const Today = () => {
  const [dayStatus, setDayStatus] = useState<"active" | "skipped">("active")
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<Record<string, boolean>>({})

  const today = new Date().toLocaleDateString("en-CA") // YYYY-MM-DD

  // 🎯 ICON + COLOR MAPPING (UI only)
  const getHabitUI = (category: string) => {
    switch (category) {
      case "Health":
        return { icon: Footprints, color: "bg-green-100 text-green-600" }
      case "Personal":
        return { icon: BookOpen, color: "bg-purple-100 text-purple-600" }
      case "Productivity":
        return { icon: Dumbbell, color: "bg-orange-100 text-orange-600" }
      default:
        return { icon: Moon, color: "bg-blue-100 text-blue-600" }
    }
  }

  // 🚀 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const habitsRes = await fetch(`${API}/habits`)
        const habitsData = await habitsRes.json()
        setHabits(habitsData)

        const entriesRes = await fetch(
          `${API}/entries?month=${today.slice(0, 7)}`
        )
        const entriesData = await entriesRes.json()

        const map: Record<string, boolean> = {}

        entriesData.forEach((e: any) => {
          if (e.date === today) {
            map[e.habitId] = e.completed
          }
        })

        setEntries(map)
        const dayRes = await fetch(`${API}/day-status?month=${today.slice(0, 7)}`)
        const dayData = await dayRes.json()

        let skippedToday = false

        dayData.forEach((d: any) => {
          if (d.date === today && d.status === "skipped") {
            skippedToday = true
          }
        })

        setDayStatus(skippedToday ? "skipped" : "active")

      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  // 🔁 TOGGLE (BACKEND)
  const toggleHabit = async (habitId: string) => {
    try {
      await fetch(`${API}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          habitId,
          date: today
        })
      })

      setEntries(prev => ({
        ...prev,
        [habitId]: !prev[habitId]
      }))

    } catch (err) {
      console.error(err)
    }
  }
  
  const toggleTodayStatus = async () => {
    try {
      const res = await fetch(`${API}/day-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ date: today })
      })

      const data = await res.json()
      setDayStatus(data.status)
    } catch (err) {
      console.error(err)
    }
  }

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  const visibleHabits = habits.filter(
    habit => today >= habit.createdAt.slice(0, 10)
  )
  const completed = visibleHabits.filter(h => entries[h._id]).length
  const activeDay = dayStatus === "active" ? 1 : 0
  const progress =
    activeDay && visibleHabits.length
      ? Math.round((completed / visibleHabits.length) * 100)
      : 0

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">

      <div className="max-w-4xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Good Morning 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">{todayDate}</p>
          </div>

          <div className="bg-white dark:bg-[#0b1220] px-4 py-2 rounded-xl shadow-sm border text-sm">
            🔥 Streaks <span className="ml-2 font-semibold">12</span>
          </div>
        </div>

        {/* DAY STATUS */}
        <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl shadow-sm border mb-6 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
              <Sun size={18} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                Day Status
              </p>
              <p className="text-xs text-gray-500">
                This day will be counted in your progress
              </p>
            </div>
          </div>

          <button
            onClick={toggleTodayStatus}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              dayStatus === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {dayStatus === "active" ? "Active Day ✓" : "Skipped ⛔"}
          </button>
        </div>

        {/* HABITS */}
        <div className="flex flex-col gap-4 mb-6">
          {visibleHabits.map(habit => {
            const { icon: Icon, color } = getHabitUI(habit.category)
            const completedState = entries[habit._id]

            return (
              <div
                key={habit._id}
                className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl shadow-sm border flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {habit.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {habit.category}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleHabit(habit._id)}
                  disabled={dayStatus === "skipped"}
                  className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                    completedState
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {completedState && <Check size={14} />}
                </button>
              </div>
            )
          })}
        </div>

        {/* PROGRESS */}
        <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl shadow-sm border">
          <div className="flex justify-between text-sm mb-2 text-gray-700 dark:text-gray-300">
            <span>
              Progress {completed} / {visibleHabits.length}
            </span>
            <span>
              {progress}%
            </span>
          </div>

          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
            <div
              className="h-2 bg-indigo-500 rounded-full"
              style={{
                width: `${progress}%`
              }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default Today
