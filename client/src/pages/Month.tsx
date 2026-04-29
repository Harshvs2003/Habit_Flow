import { useEffect, useMemo } from "react"
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis
} from "recharts"
import { useHabitStore } from "../store/useHabitStore"

const barColors = ["#22c55e", "#8b5cf6", "#f97316", "#3b82f6", "#ef4444", "#14b8a6"]

const Month = () => {
  const { habits, entries, dayStatus, fetchAll } = useHabitStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const skippedDays = useMemo(
    () => new Set(Object.keys(dayStatus).filter(date => dayStatus[date] === "skipped")),
    [dayStatus]
  )

  const entriesList = useMemo(
    () =>
      Object.entries(entries).map(([key, completed]) => {
        const [habitId, ...rest] = key.split("-")
        return { habitId, date: rest.join("-"), completed }
      }),
    [entries]
  )

  const habitsMap = useMemo(() => {
    const map: Record<string, { habitId: string; date: string; completed: boolean }[]> = {}
    entriesList.forEach(entry => {
      if (!map[entry.habitId]) {
        map[entry.habitId] = []
      }
      map[entry.habitId].push(entry)
    })
    return map
  }, [entriesList])

  const { progress, habitProgress } = useMemo(() => {
    let totalCompleted = 0
    let totalActiveDays = 0

    const perHabit = habits.map((habit, index) => {
      const habitStart = habit.createdAt.slice(0, 10)
      const habitEntries = (habitsMap[habit._id] || []).filter(
        entry => entry.date >= habitStart && !skippedDays.has(entry.date)
      )

      const habitCompleted = habitEntries.filter(entry => entry.completed).length
      const habitTotal = habitEntries.length

      totalCompleted += habitCompleted
      totalActiveDays += habitTotal

      return {
        name: habit.title,
        value: habitTotal ? Math.round((habitCompleted / habitTotal) * 100) : 0,
        color: barColors[index % barColors.length]
      }
    })

    const overall = totalActiveDays
      ? Math.round((totalCompleted / totalActiveDays) * 100)
      : 0

    return { progress: overall, habitProgress: perHabit }
  }, [habits, habitsMap, skippedDays])

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

            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar
                    dataKey="value"
                    background
                    clockWise
                    cornerRadius={10}
                    fill="#6366f1"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {progress}%
                </span>
              </div>
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
                  <span className="text-gray-800 dark:text-white">{habit.name}</span>
                  <span className="text-gray-500">{habit.value}%</span>
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
