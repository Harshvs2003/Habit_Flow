import { useEffect, useState } from "react"
import API from "../services/api"

type Habit = {
  _id: string
  title: string
}

const daysInMonth = 30

const Grid = () => {
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<Record<string, boolean>>({})
  const [dayStatus, setDayStatus] = useState<Record<number, "active" | "skipped">>({})

  const today = new Date()
  const currentMonth = today.toISOString().slice(0, 7) // YYYY-MM
  const todayDate = new Date().toISOString().slice(0, 10)
  const yesterdayDate = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10)

  const isEditable = (date: string) => {
    return date === todayDate || date === yesterdayDate
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const habitsRes = await fetch(`${API}/habits`)
        const habitsData = await habitsRes.json()
        setHabits(habitsData)

        const entriesRes = await fetch(`${API}/entries?month=${currentMonth}`)
        const entriesData = await entriesRes.json()

        const entryMap: Record<string, boolean> = {}

        entriesData.forEach((e: any) => {
          entryMap[`${e.habitId}-${e.date}`] = e.completed
        })

        setEntries(entryMap)

        const dayRes = await fetch(`${API}/day-status?month=${currentMonth}`)
        const dayData = await dayRes.json()

        const dayMap: Record<number, "active" | "skipped"> = {}

        dayData.forEach((d: any) => {
          const day = Number(d.date.split("-")[2])
          dayMap[day] = d.status
        })

        setDayStatus(dayMap)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const toggleCell = async (habitId: string, date: string) => {
    try {
      await fetch(`${API}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date })
      })

      setEntries(prev => ({
        ...prev,
        [`${habitId}-${date}`]: !prev[`${habitId}-${date}`]
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const toggleDay = async (date: string, day: number) => {
    try {
      await fetch(`${API}/day-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      })

      setDayStatus(prev => ({
        ...prev,
        [day]: prev[day] === "skipped" ? "active" : "skipped"
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const getDate = (day: number) => {
    return `${currentMonth}-${String(day).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-6 py-6">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Grid View
      </h1>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#0b1220]">
        <div className="min-w-[900px]">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <div className="w-40 p-3 font-medium text-gray-600 dark:text-gray-300">
              Habits
            </div>

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = getDate(day)
              const skipped = dayStatus[day] === "skipped"
              const locked = !isEditable(date)

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (isEditable(date)) {
                      toggleDay(date, day)
                    }
                  }}
                  className={`w-10 h-10 flex items-center justify-center text-xs border-l border-gray-200 dark:border-gray-800 ${
                    locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  } ${
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

          {habits.map(habit => (
            <div
              key={habit._id}
              className="flex border-b border-gray-200 dark:border-gray-800"
            >
              <div className="w-40 p-3 text-sm font-medium text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-800">
                {habit.title}
              </div>

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = getDate(day)
                const key = `${habit._id}-${date}`
                const checked = entries[key]
                const skipped = dayStatus[day] === "skipped"
                const locked = !isEditable(date)

                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (!skipped && isEditable(date)) {
                        toggleCell(habit._id, date)
                      }
                    }}
                    className={`w-10 h-10 flex items-center justify-center text-xs border-l border-gray-200 dark:border-gray-800 ${
                      locked
                        ? "opacity-40 cursor-not-allowed"
                        : skipped
                        ? "bg-gray-100 dark:bg-gray-900"
                        : checked
                        ? "bg-green-500 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    }`}
                  >
                    {checked ? "\u2713" : ""}
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
