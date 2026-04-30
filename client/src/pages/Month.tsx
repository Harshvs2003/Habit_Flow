import { useEffect, useMemo } from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import { useHabitStore } from "../store/useHabitStore";

const barColors = [
  "#22c55e",
  "#8b5cf6",
  "#f97316",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

const Month = () => {
  const { habits, entries, dayStatus, fetchAll } = useHabitStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const skippedDays = useMemo(
    () =>
      new Set(
        Object.keys(dayStatus).filter((date) => dayStatus[date] === "skipped"),
      ),
    [dayStatus],
  );

  const entriesList = useMemo(
    () =>
      Object.entries(entries).map(([key, completed]) => {
        const [habitId, ...rest] = key.split("-");
        return { habitId, date: rest.join("-"), completed };
      }),
    [entries],
  );

  const habitsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    entriesList.forEach((entry) => {
      if (!map[entry.habitId]) map[entry.habitId] = [];
      map[entry.habitId].push(entry);
    });
    return map;
  }, [entriesList]);

  const { progress, habitProgress } = useMemo(() => {
    let totalCompleted = 0;
    let totalActiveDays = 0;

    const perHabit = habits.map((habit, index) => {
      const habitStart = habit.createdAt.slice(0, 10);

      const habitEntries = (habitsMap[habit._id] || []).filter(
        (entry) => entry.date >= habitStart && !skippedDays.has(entry.date),
      );

      const habitCompleted = habitEntries.filter((e) => e.completed).length;
      const habitTotal = habitEntries.length;

      totalCompleted += habitCompleted;
      totalActiveDays += habitTotal;

      return {
        name: habit.title,
        value: habitTotal ? Math.round((habitCompleted / habitTotal) * 100) : 0,
        color: barColors[index % barColors.length],
        completed: habitCompleted,
        total: habitTotal,
      };
    });

    const overall = totalActiveDays
      ? Math.round((totalCompleted / totalActiveDays) * 100)
      : 0;

    return { progress: overall, habitProgress: perHabit };
  }, [habits, habitsMap, skippedDays]);

  const summaryStats = useMemo(() => {
    const activeDays = new Set<string>();
    let completed = 0;

    entriesList.forEach((entry) => {
      if (skippedDays.has(entry.date)) return;
      activeDays.add(entry.date);
      if (entry.completed) completed += 1;
    });

    return {
      activeDays: activeDays.size,
      completed,
      skippedDays: skippedDays.size,
    };
  }, [entriesList, skippedDays]);

  const chartData = [{ name: "Progress", value: progress }];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black px-4 sm:px-6 md:px-10 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Monthly Overview
        </h1>

        {/* Top Section */}
        <div className="bg-white dark:bg-[#0b1220] p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-[0_4px_18px_rgba(0,0,0,0.05)] mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Text */}
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-400">Overall Consistency</p>
              <p className="text-3xl sm:text-4xl font-semibold text-gray-800 dark:text-white mt-1">
                {progress}%
              </p>
              <p className="text-xs text-gray-400 mt-1">Based on active days</p>
            </div>

            {/* Chart */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="75%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar
                    dataKey="value"
                    background
                    cornerRadius={12}
                    fill="#6366f1"
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Habit Progress */}
        <div className="bg-white dark:bg-[#0b1220] p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-5">
            Habit Progress
          </h2>

          <div className="flex flex-col gap-5">
            {habitProgress.map((habit, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-sm mb-1 gap-3">
                  <span className="text-gray-800 dark:text-white font-medium">
                    {habit.name}
                  </span>

                  <div className="flex items-center gap-4 text-gray-400 text-xs sm:text-sm tabular-nums whitespace-nowrap">
                    {/* completed/total */}
                    <span className="min-w-15 text-right">
                      {habit.completed}/{habit.total}
                    </span>

                    {/* percentage */}
                    <span className="min-w-10 text-right">
                      {habit.value}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${habit.value}%`,
                      backgroundColor: habit.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
        </div>

        <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-100 shadow-[0_4px_18px_rgba(0,0,0,0.05)] mt-6">
          <div className="grid grid-cols-3">
            <div className="text-center px-2">
              <p className="text-xs text-gray-400">Active Days</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {summaryStats.activeDays}
              </p>
            </div>

            <div className="text-center px-2 border-x border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {summaryStats.completed}
              </p>
            </div>

            <div className="text-center px-2">
              <p className="text-xs text-gray-400">Skipped Days</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {summaryStats.skippedDays}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Month;
