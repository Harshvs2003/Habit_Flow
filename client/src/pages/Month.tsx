import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer
} from "recharts"

const Month = () => {
  const data = [
    { name: "Progress", value: 68 }
  ]

  const habits = [
    { name: "Walking", value: 85, color: "#22c55e" },
    { name: "Reading", value: 60, color: "#8b5cf6" },
    { name: "Exercise", value: 45, color: "#f97316" },
    { name: "Sleep", value: 70, color: "#3b82f6" }
  ]

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">

      <div className="max-w-4xl">

        {/* HEADER */}
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Monthly Overview
        </h1>

        {/* TOP CARD */}
        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6">

          <div className="flex items-center justify-between">

            {/* LEFT TEXT */}
            <div>
              <p className="text-sm text-gray-500">Overall Consistency</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                68%
              </p>
            </div>

            {/* CHART */}
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={data}
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

        {/* HABIT PROGRESS */}
        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">

          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Habit Progress
          </h2>

          <div className="flex flex-col gap-4">
            {habits.map((habit, i) => (
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