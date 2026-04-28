import { useState } from "react"
import {
  Check,
  BookOpen,
  Dumbbell,
  Moon,
  Footprints,
  Sun
} from "lucide-react"

type Habit = {
  id: number
  title: string
  category: string
  icon: any
  color: string
  completed: boolean
}

const Today = () => {
  const [dayStatus, setDayStatus] = useState<"active" | "skipped">("active")

  const [habits, setHabits] = useState<Habit[]>([
    {
      id: 1,
      title: "Walking – 15K Steps",
      category: "Health",
      icon: Footprints,
      color: "bg-green-100 text-green-600",
      completed: true
    },
    {
      id: 2,
      title: "Reading – 1 Page",
      category: "Personal Growth",
      icon: BookOpen,
      color: "bg-purple-100 text-purple-600",
      completed: false
    },
    {
      id: 3,
      title: "Exercise",
      category: "Health",
      icon: Dumbbell,
      color: "bg-orange-100 text-orange-600",
      completed: false
    },
    {
      id: 4,
      title: "Sleep Before 1 AM",
      category: "Health",
      icon: Moon,
      color: "bg-blue-100 text-blue-600",
      completed: false
    }
  ])

  const toggleHabit = (id: number) => {
    setHabits(prev =>
      prev.map(h =>
        h.id === id ? { ...h, completed: !h.completed } : h
      )
    )
  }

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  const completed = habits.filter(h => h.completed).length

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-10 py-8">

      <div className="max-w-4xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Good Morning, Harsh! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">{todayDate}</p>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border text-sm">
            🔥 Streaks <span className="ml-2 font-semibold">12</span>
          </div>
        </div>

        {/* DAY STATUS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border mb-6 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
              <Sun size={18} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">Day Status</p>
              <p className="text-xs text-gray-500">
                This day will be counted in your progress
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setDayStatus(prev =>
                prev === "active" ? "skipped" : "active"
              )
            }
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
          {habits.map(habit => {
            const Icon = habit.icon

            return (
              <div
                key={habit.id}
                className="bg-white p-5 rounded-2xl shadow-sm border flex justify-between items-center"
              >
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${habit.color}`}>
                    <Icon size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {habit.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {habit.category}
                    </p>
                  </div>
                </div>

                {/* RIGHT CHECK */}
                <button
                  onClick={() => toggleHabit(habit.id)}
                  disabled={dayStatus === "skipped"}
                  className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                    habit.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {habit.completed && <Check size={14} />}
                </button>
              </div>
            )
          })}
        </div>

        {/* PROGRESS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <div className="flex justify-between text-sm mb-2 text-gray-700">
            <span>
              Progress {completed} / {habits.length} habits completed
            </span>
            <span>
              {Math.round((completed / habits.length) * 100)}%
            </span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-500 rounded-full"
              style={{
                width: `${(completed / habits.length) * 100}%`
              }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default Today