import { useState } from "react"

type Habit = {
  id: number
  name: string
}

const daysInMonth = 30

const Grid = () => {
  const [habits] = useState<Habit[]>([
    { id: 1, name: "Workout" },
    { id: 2, name: "Reading" },
    { id: 3, name: "Meditation" },
  ])

  const [entries, setEntries] = useState<Record<string, boolean>>({})
  const [dayStatus, setDayStatus] = useState<Record<number, "active" | "skipped">>({})

  const toggleCell = (habitId: number, day: number) => {
    const key = `${habitId}-${day}`

    setEntries(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleDay = (day: number) => {
    setDayStatus(prev => ({
      ...prev,
      [day]: prev[day] === "skipped" ? "active" : "skipped"
    }))
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-6 py-6">

      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Grid View
      </h1>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#0b1220]">

        <div className="min-w-[900px]">

          {/* HEADER ROW */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">

            {/* Empty corner */}
            <div className="w-40 p-3 font-medium text-gray-600 dark:text-gray-300">
              Habits
            </div>

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const skipped = dayStatus[day] === "skipped"

              return (
                <div
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-10 flex items-center justify-center text-xs cursor-pointer border-l border-gray-200 dark:border-gray-800 ${
                    skipped
                      ? "bg-red-100 dark:bg-red-900 text-red-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* HABIT ROWS */}
          {habits.map(habit => (
            <div
              key={habit.id}
              className="flex border-b border-gray-200 dark:border-gray-800"
            >

              {/* HABIT NAME */}
              <div className="w-40 p-3 text-sm font-medium text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-800">
                {habit.name}
              </div>

              {/* CELLS */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const key = `${habit.id}-${day}`
                const checked = entries[key]
                const skipped = dayStatus[day] === "skipped"

                return (
                  <div
                    key={day}
                    onClick={() => !skipped && toggleCell(habit.id, day)}
                    className={`w-10 h-10 flex items-center justify-center text-xs border-l border-gray-200 dark:border-gray-800 cursor-pointer transition ${
                      skipped
                        ? "bg-gray-100 dark:bg-gray-900 cursor-not-allowed"
                        : checked
                        ? "bg-green-500 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {checked ? "✓" : ""}
                  </div>
                )
              })}

            </div>
          ))}

        </div>

      </div>
    </div>
  )
}

export default Grid