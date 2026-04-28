import { useEffect, useMemo } from "react";
import { useHabitStore } from "../store/useHabitStore";
import { getLocalDate} from "../utils/date";

const Insights = () => {
  const { habits, entries, dayStatus, fetchAll } = useHabitStore();

  useEffect(() => {
    fetchAll();
  }, []);

  const insights = useMemo(() => {
    if (!habits.length) {
      return {
        best: "-",
        worst: "-",
        consistency: 0,
        streak: 0,
      };
    }

    const habitStats: Record<string, { completed: number; total: number }> = {};

    // collect all dates present in entries
    const allDates = new Set<string>();

    Object.keys(entries).forEach((key) => {
      const parts = key.split("-");
      const date = parts.slice(1).join("-"); // FIXED
      allDates.add(date);
    });

    // evaluate each habit
    habits.forEach((habit) => {
      const habitId = habit._id;
      const startDate = habit.createdAt.slice(0, 10);

      habitStats[habitId] = { completed: 0, total: 0 };

      allDates.forEach((date) => {
        if (dayStatus[date] === "skipped") return;
        if (date < startDate) return;

        const key = `${habitId}-${date}`;

        habitStats[habitId].total += 1;

        if (entries[key]) {
          habitStats[habitId].completed += 1;
        }
      });
    });

    // 🎯 BEST & WORST
    let best = "-";
    let worst = "-";
    let bestScore = -1;
    let worstScore = 2;

    Object.entries(habitStats).forEach(([habitId, stat]) => {
      if (!stat.total) return;

      const score = stat.completed / stat.total;

      const habit = habits.find((h) => h._id === habitId);

      if (score > bestScore) {
        bestScore = score;
        best = habit?.title || "-";
      }

      if (score < worstScore) {
        worstScore = score;
        worst = habit?.title || "-";
      }
    });

    // 📊 OVERALL CONSISTENCY
    let totalCompleted = 0;
    let totalActive = 0;

    Object.values(habitStats).forEach((stat) => {
      totalCompleted += stat.completed;
      totalActive += stat.total;
    });

    const consistency = totalActive
      ? Math.round((totalCompleted / totalActive) * 100)
      : 0;

    // 🔥 STREAK CALCULATION
    let streak = 0;
    let currentDate = getLocalDate();

    while (true) {
      if (dayStatus[currentDate] === "skipped") {
        // skip doesn't break streak
      } else {
        const dayEntries = Object.entries(entries).filter(([key]) =>
          key.endsWith(currentDate),
        );

        const allDone =
          dayEntries.length > 0 && dayEntries.every(([_, val]) => val === true);

        if (!allDone) break;
        streak++;
      }

      // go back one day
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      currentDate = d.toLocaleDateString("en-CA");
    }

    return { best, worst, consistency, streak };
  }, [habits, entries, dayStatus]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-10 py-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Insights
        </h1>

        <div className="grid grid-cols-2 gap-4">
          <Card title="Best Habit" value={insights.best} />
          <Card title="Worst Habit" value={insights.worst} />
          <Card title="Consistency" value={`${insights.consistency}%`} />
          <Card title="Streak" value={`${insights.streak} days`} />
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-lg font-semibold text-gray-800 dark:text-white">
      {value}
    </p>
  </div>
);

export default Insights;
