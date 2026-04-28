const Insights = () => {
  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">

      <div className="max-w-4xl">

        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Insights
        </h1>

        {/* CARDS */}
        <div className="grid grid-cols-2 gap-4">

          <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">Best Habit</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              Workout
            </p>
          </div>

          <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">Worst Habit</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              Reading
            </p>
          </div>

          <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">Consistency</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              72%
            </p>
          </div>

          <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">Streak</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              12 days
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Insights