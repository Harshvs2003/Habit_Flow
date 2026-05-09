import { useEffect, useMemo, useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import { useHabitStore } from "../store/useHabitStore";
import API, { fetchWithAuth } from "../services/api";
import {
  getLocalMonth,
  getMonthDaysCount,
  getMonthLabel,
  shiftMonth,
} from "../utils/date";

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
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonth());
  const [previousTrend, setPreviousTrend] = useState<{ prevProgress: number }>({ prevProgress: 0 });

  useEffect(() => {
    fetchAll(selectedMonth);
  }, [fetchAll, selectedMonth]);

  useEffect(() => {
    const fetchPreviousMonthTrend = async () => {
      try {
        const prevMonth = shiftMonth(selectedMonth, -1);
        const [hRes, eRes, dRes] = await Promise.all([
          fetchWithAuth(`${API}/habits`),
          fetchWithAuth(`${API}/entries?month=${prevMonth}`),
          fetchWithAuth(`${API}/day-status?month=${prevMonth}`),
        ]);

        if (!hRes.ok || !eRes.ok || !dRes.ok) return;

        const [prevHabits, prevEntries, prevDayStatus] = await Promise.all([
          hRes.json(),
          eRes.json(),
          dRes.json(),
        ]);

        const prevDays = getMonthDaysCount(prevMonth);
        const prevMonthDates = Array.from({ length: prevDays }, (_, i) => {
          const day = String(i + 1).padStart(2, "0");
          return `${prevMonth}-${day}`;
        });

        const prevMonthEndDate = `${prevMonth}-${String(prevDays).padStart(2, "0")}`;
        const prevVisibleHabits = prevHabits.filter(
          (habit: any) => habit.createdAt.slice(0, 10) <= prevMonthEndDate,
        );

        const prevEntriesMap: Record<string, boolean> = {};
        prevEntries.forEach((e: any) => {
          prevEntriesMap[`${e.habitId}-${e.date}`] = e.completed;
        });

        const prevSkippedDays = new Set<string>();
        prevDayStatus.forEach((d: any) => {
          if (d.status === "skipped") prevSkippedDays.add(d.date);
        });

        let prevCompleted = 0;
        let prevTotal = 0;
        prevVisibleHabits.forEach((habit: any) => {
          const start = habit.createdAt.slice(0, 10);
          prevMonthDates.forEach((date) => {
            if (date < start || prevSkippedDays.has(date)) return;
            prevTotal += 1;
            if (prevEntriesMap[`${habit._id}-${date}`]) prevCompleted += 1;
          });
        });

        const prevProgress = prevTotal ? Math.round((prevCompleted / prevTotal) * 100) : 0;
        setPreviousTrend({ prevProgress });
      } catch {
        // keep default when analytics fetch fails
      }
    };

    fetchPreviousMonthTrend();
  }, [selectedMonth]);

  const monthEndDate = useMemo(() => {
    const days = getMonthDaysCount(selectedMonth);
    return `${selectedMonth}-${String(days).padStart(2, "0")}`;
  }, [selectedMonth]);

  const visibleHabits = useMemo(
    () => habits.filter((habit) => habit.createdAt.slice(0, 10) <= monthEndDate),
    [habits, monthEndDate],
  );

  const skippedDays = useMemo(
    () =>
      new Set(
        Object.keys(dayStatus).filter((date) => dayStatus[date] === "skipped"),
      ),
    [dayStatus],
  );

  const allMonthDates = useMemo(() => {
    const days = getMonthDaysCount(selectedMonth);
    return Array.from({ length: days }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return `${selectedMonth}-${day}`;
    });
  }, [selectedMonth]);

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

    const perHabit = visibleHabits.map((habit, index) => {
      const habitStart = habit.createdAt.slice(0, 10);
      const validDays = allMonthDates.filter(
        (date) => date >= habitStart && !skippedDays.has(date),
      );
      const validDaysSet = new Set(validDays);

      const habitCompleted = (habitsMap[habit._id] || []).filter(
        (entry) => entry.completed && validDaysSet.has(entry.date),
      ).length;
      const habitTotal = validDays.length;

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
  }, [visibleHabits, habitsMap, skippedDays, allMonthDates]);

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
  const trendDelta = progress - previousTrend.prevProgress;
  const trendLabel =
    trendDelta > 0 ? `+${trendDelta}%` : `${trendDelta}%`;

  const streakStats = useMemo(() => {
    let currentStreak = 0;
    let bestStreak = 0;
    let runningStreak = 0;
    let completedDays = 0;
    let activeDays = 0;

    const sortedDates = [...allMonthDates].sort();
    sortedDates.forEach((date) => {
      if (skippedDays.has(date)) return;
      activeDays += 1;

      const dayHabits = visibleHabits.filter((h) => date >= h.createdAt.slice(0, 10));
      if (dayHabits.length === 0) {
        runningStreak = 0;
        return;
      }

      const isCompleteDay = dayHabits.every((h) => entries[`${h._id}-${date}`]);
      if (isCompleteDay) {
        completedDays += 1;
        runningStreak += 1;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    });

    for (let i = sortedDates.length - 1; i >= 0; i -= 1) {
      const date = sortedDates[i];
      if (skippedDays.has(date)) continue;
      const dayHabits = visibleHabits.filter((h) => date >= h.createdAt.slice(0, 10));
      if (dayHabits.length === 0) break;
      const isCompleteDay = dayHabits.every((h) => entries[`${h._id}-${date}`]);
      if (!isCompleteDay) break;
      currentStreak += 1;
    }

    const consistency = activeDays ? Math.round((completedDays / activeDays) * 100) : 0;
    return { currentStreak, bestStreak, consistency };
  }, [allMonthDates, skippedDays, visibleHabits, entries]);

  const missedMostWeekday = useMemo(() => {
    const missesByWeekday: Record<string, number> = {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
    };
    allMonthDates.forEach((date) => {
      if (skippedDays.has(date)) return;
      const dayHabits = visibleHabits.filter((h) => date >= h.createdAt.slice(0, 10));
      dayHabits.forEach((h) => {
        if (!entries[`${h._id}-${date}`]) {
          const [y, m, d] = date.split("-").map(Number);
          const weekday = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
          missesByWeekday[weekday] += 1;
        }
      });
    });

    const [weekday, misses] = Object.entries(missesByWeekday).reduce((acc, curr) =>
      curr[1] > acc[1] ? curr : acc
    , ["Mon", 0]);

    return misses > 0 ? `${weekday} (${misses} misses)` : "No misses";
  }, [allMonthDates, skippedDays, visibleHabits, entries]);

  const exportCSV = () => {
    const rows = [
      ["Month", getMonthLabel(selectedMonth)],
      ["Overall Progress", `${progress}%`],
      ["Current Streak", String(streakStats.currentStreak)],
      ["Best Streak", String(streakStats.bestStreak)],
      ["Consistency", `${streakStats.consistency}%`],
      ["Trend vs Last Month", trendLabel],
      ["Missed Most On", missedMostWeekday],
      [],
      ["Habit", "Completed", "Total", "Progress %"],
      ...habitProgress.map((h) => [h.name, String(h.completed), String(h.total), String(h.value)]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habitflow-month-report-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const reportHtml = `
      <html><head><title>Month Report</title></head><body>
        <h2>HabitFlow Month Report - ${getMonthLabel(selectedMonth)}</h2>
        <p>Overall Progress: ${progress}%</p>
        <p>Current Streak: ${streakStats.currentStreak} days</p>
        <p>Best Streak: ${streakStats.bestStreak} days</p>
        <p>Consistency: ${streakStats.consistency}%</p>
        <p>Trend vs Last Month: ${trendLabel}</p>
        <p>Missed Most On: ${missedMostWeekday}</p>
        <hr/>
        <h3>Habit Progress</h3>
        <ul>
          ${habitProgress.map((h) => `<li>${h.name}: ${h.completed}/${h.total} (${h.value}%)</li>`).join("")}
        </ul>
      </body></html>
    `;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(reportHtml);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black px-4 sm:px-6 md:px-10 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">
            Monthly Overview
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Prev
            </button>
            <div className="px-4 py-2 rounded-xl border border-gray-100 bg-white dark:bg-[#0b1220] dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200 min-w-36 text-center">
              {getMonthLabel(selectedMonth)}
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white dark:bg-[#0b1220] dark:border-gray-700 dark:text-gray-200"
            />
            <button
              onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Next
            </button>
            <button
              onClick={exportCSV}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white hover:bg-gray-50 dark:bg-[#0b1220] dark:border-gray-700 dark:text-gray-200"
            >
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white hover:bg-gray-50 dark:bg-[#0b1220] dark:border-gray-700 dark:text-gray-200"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-400">Current Streak</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{streakStats.currentStreak} days</p>
          </div>
          <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-400">Best Streak</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{streakStats.bestStreak} days</p>
          </div>
          <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-400">Consistency</p>
            <p className="text-xl font-semibold text-gray-800 dark:text-white">{streakStats.consistency}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-400">Trend vs Last Month</p>
            <p className={`text-lg font-semibold ${trendDelta >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trendLabel}
            </p>
          </div>
          <div className="bg-white dark:bg-[#0b1220] p-4 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-400">Missed Most On</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{missedMostWeekday}</p>
          </div>
        </div>

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
