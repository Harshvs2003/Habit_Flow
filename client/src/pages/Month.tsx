import { useEffect, useMemo, useState } from "react"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer
} from "recharts"
import API from "../services/api"

type Habit = {
  _id: string
  title: string
}

type Entry = {
  habitId: string
  date: string
  completed: boolean
}

type DayStatusItem = {
  date: string
  status: "active" | "skipped"
}

const barColors = ["#22c55e", "#8b5cf6", "#f97316", "#3b82f6", "#ef4444", "#14b8a6"]

const Month = () => {
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [dayStatus, setDayStatus] = useState<DayStatusItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const month = new Date().toISOString().slice(0, 7)

        const habitsRes = await fetch(`${API}/habits`)
        const habitsData = await habitsRes.json()
        setHabits(habitsData)

        const entryRes = await fetch(`${API}/entries?month=${month}`)
        const entryData = await entryRes.json()
        setEntries(entryData)

        const dayRes = await fetch(`${API}/day-status?month=${month}`)
        const dayData = await dayRes.json()
        setDayStatus(dayData)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const skippedDays = useMemo(
    () =>
      new Set(
        dayStatus
          .filter(d => d.status === "skipped")
          .map(d => d.date)
      ),
    [dayStatus]
  )

  const activeEntries = useMemo(
    () => entries.filter(e => !skippedDays.has(e.date)),
    [entries, skippedDays]
  )

  const completed = useMemo(
    () => activeEntries.filter(e => e.completed).length,
    [activeEntries]
  )

  const totalActive = activeEntries.length || 1
  const progress = Math.round((completed / totalActive) * 100)

  const habitProgress = useMemo(() => {
    return habits.map((habit, index) => {
      const habitEntries = activeEntries.filter(e => e.habitId === habit._id)
      const habitCompleted = habitEntries.filter(e => e.completed).length
      const habitTotal = habitEntries.length

      return {
        name: habit.title,
        value: habitTotal ? Math.round((habitCompleted / habitTotal) * 100) : 0,
        color: barColors[index % barColors.length]
      }
    })
  }, [habits, activeEntries])

  const chartData = [{ name: "Progress", value: progress }]

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Monthly Overview
        </h1>

        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Consistency</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {progress}%
              </p>
            </div>

            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#6366f1"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Habit Progress
          </h2>

          <div className="flex flex-col gap-4">
            {habitProgress.map((habit, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-800 dark:text-white">
                    {habit.name}
                  </span>
                  <span className="text-gray-500">
                    {habit.value}%
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${habit.value}%`,
                      backgroundColor: habit.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Month
