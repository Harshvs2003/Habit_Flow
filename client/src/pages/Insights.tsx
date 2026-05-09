import { useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useHabitStore } from "../store/useHabitStore";
import { getLocalDate } from "../utils/date";

const toYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDays = (value: string, delta: number) => {
  const d = new Date(value);
  d.setDate(d.getDate() + delta);
  return toYMD(d);
};

const Insights = () => {
  const { habits, entries, dayStatus, fetchAll } = useHabitStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const insights = useMemo(() => {
    const today = getLocalDate();
    if (!habits.length) {
      return {
        best: "-",
        worst: "-",
        consistency: 0,
        streak: 0,
        ranking: [] as any[],
        weeklyData: [] as any[],
        monthlyData: [] as any[],
        bestWindow: "-",
        weakWindow: "-",
        recoveryRate: 0,
        suggestion: "Add your first habit to unlock suggestions.",
      };
    }

    const getExpectedHabits = (date: string) =>
      habits.filter((h: any) => date >= h.createdAt.slice(0, 10));

    const allDates = new Set<string>();
    Object.keys(entries).forEach((key) => {
      const parts = key.split("-");
      allDates.add(parts.slice(1).join("-"));
    });
    allDates.add(today);

    const habitStats: Record<string, { completed: number; total: number }> = {};
    habits.forEach((habit: any) => {
      habitStats[habit._id] = { completed: 0, total: 0 };
      allDates.forEach((date) => {
        if (dayStatus[date] === "skipped") return;
        if (date < habit.createdAt.slice(0, 10)) return;
        habitStats[habit._id].total += 1;
        if (entries[`${habit._id}-${date}`]) habitStats[habit._id].completed += 1;
      });
    });

    let best = "-";
    let worst = "-";
    let bestScore = -1;
    let worstScore = 2;
    let totalCompleted = 0;
    let totalActive = 0;

    const ranking = habits
      .map((habit: any) => {
        const stat = habitStats[habit._id];
        const score = stat.total ? stat.completed / stat.total : 0;
        if (stat.total) {
          if (score > bestScore) {
            bestScore = score;
            best = habit.title;
          }
          if (score < worstScore) {
            worstScore = score;
            worst = habit.title;
          }
        }
        totalCompleted += stat.completed;
        totalActive += stat.total;

        const sparkline = Array.from({ length: 14 }).map((_, idx) => {
          const date = shiftDays(today, -(13 - idx));
          return entries[`${habit._id}-${date}`] ? 1 : 0;
        });

        return {
          id: habit._id,
          name: habit.title,
          score: Math.round(score * 100),
          sparkline,
        };
      })
      .sort((a, b) => b.score - a.score);

    const consistency = totalActive ? Math.round((totalCompleted / totalActive) * 100) : 0;

    let streak = 0;
    let cursor = today;
    while (true) {
      if (dayStatus[cursor] !== "skipped") {
        const expected = getExpectedHabits(cursor);
        if (!expected.length) break;
        const allDone = expected.every((h: any) => entries[`${h._id}-${cursor}`]);
        if (!allDone) break;
        streak += 1;
      }
      cursor = shiftDays(cursor, -1);
    }

    const weeklyData = Array.from({ length: 8 }).map((_, idx) => {
      const weekStart = shiftDays(today, -(7 * (7 - idx)));
      const weekDays = Array.from({ length: 7 }).map((__, i) => shiftDays(weekStart, i));
      let c = 0;
      let t = 0;
      weekDays.forEach((date) => {
        if (dayStatus[date] === "skipped") return;
        const expected = getExpectedHabits(date);
        expected.forEach((h: any) => {
          t += 1;
          if (entries[`${h._id}-${date}`]) c += 1;
        });
      });
      return { label: `W${idx + 1}`, consistency: t ? Math.round((c / t) * 100) : 0 };
    });

    const monthlyData = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - idx));
      d.setDate(1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const monthStr = `${y}-${m}`;
      const days = new Date(y, d.getMonth() + 1, 0).getDate();
      let c = 0;
      let t = 0;
      for (let day = 1; day <= days; day += 1) {
        const date = `${monthStr}-${String(day).padStart(2, "0")}`;
        if (dayStatus[date] === "skipped") continue;
        const expected = getExpectedHabits(date);
        expected.forEach((h: any) => {
          t += 1;
          if (entries[`${h._id}-${date}`]) c += 1;
        });
      }
      return {
        label: d.toLocaleDateString("en-US", { month: "short" }),
        consistency: t ? Math.round((c / t) * 100) : 0,
      };
    });

    const windowStats = { Weekday: { c: 0, t: 0 }, Weekend: { c: 0, t: 0 } };
    allDates.forEach((date) => {
      if (dayStatus[date] === "skipped") return;
      const [yy, mm, dd] = date.split("-").map(Number);
      const dayIndex = new Date(yy, mm - 1, dd).getDay();
      const bucket = dayIndex === 0 || dayIndex === 6 ? "Weekend" : "Weekday";
      const expected = getExpectedHabits(date);
      expected.forEach((h: any) => {
        windowStats[bucket].t += 1;
        if (entries[`${h._id}-${date}`]) windowStats[bucket].c += 1;
      });
    });

    const weekdayRate = windowStats.Weekday.t ? windowStats.Weekday.c / windowStats.Weekday.t : 0;
    const weekendRate = windowStats.Weekend.t ? windowStats.Weekend.c / windowStats.Weekend.t : 0;
    const bestWindow =
      weekdayRate >= weekendRate
        ? `Weekday (${Math.round(weekdayRate * 100)}%)`
        : `Weekend (${Math.round(weekendRate * 100)}%)`;
    const weakWindow =
      weekdayRate < weekendRate
        ? `Weekday (${Math.round(weekdayRate * 100)}%)`
        : `Weekend (${Math.round(weekendRate * 100)}%)`;

    const sortedDates = [...allDates].sort();
    let misses = 0;
    let bounceBack = 0;
    sortedDates.forEach((date, idx) => {
      if (dayStatus[date] === "skipped") return;
      const expected = getExpectedHabits(date);
      if (!expected.length) return;
      const allDone = expected.every((h: any) => entries[`${h._id}-${date}`]);
      if (allDone) return;
      misses += 1;
      const next = sortedDates[idx + 1];
      if (!next || dayStatus[next] === "skipped") return;
      const nextExpected = getExpectedHabits(next);
      if (!nextExpected.length) return;
      const recovered = nextExpected.every((h: any) => entries[`${h._id}-${next}`]);
      if (recovered) bounceBack += 1;
    });
    const recoveryRate = misses ? Math.round((bounceBack / misses) * 100) : 0;

    const lowDays = sortedDates.filter((date) => {
      if (dayStatus[date] === "skipped") return false;
      const expected = getExpectedHabits(date);
      if (!expected.length) return false;
      const completed = expected.filter((h: any) => entries[`${h._id}-${date}`]).length;
      const ratio = completed / expected.length;
      return ratio < 0.5;
    });
    const suggestedHabitCap = lowDays.length
      ? Math.max(
          1,
          Math.round(
            lowDays
              .map((date) => getExpectedHabits(date).length)
              .reduce((a, b) => a + b, 0) / lowDays.length,
          ) - 1,
        )
      : Math.max(1, habits.length - 1);
    const suggestion = lowDays.length
      ? `On low-consistency days, reduce to about ${suggestedHabitCap} core habits.`
      : "Consistency looks stable. Keep your current habit load.";

    return {
      best,
      worst,
      consistency,
      streak,
      ranking,
      weeklyData,
      monthlyData,
      bestWindow,
      weakWindow,
      recoveryRate,
      suggestion,
    };
  }, [habits, entries, dayStatus]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-4 sm:px-6 md:px-10 py-6 sm:py-8">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Insights
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card title="Best Habit" value={insights.best} />
          <Card title="Worst Habit" value={insights.worst} />
          <Card title="Consistency" value={`${insights.consistency}%`} />
          <Card title="Streak" value={`${insights.streak} days`} />
        </div>

        <section className="mt-6 bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
            Per-Habit Completion Ranking
          </h2>
          <div className="space-y-3">
            {insights.ranking.map((row: any, idx: number) => (
              <div key={row.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    #{idx + 1} {row.name}
                  </p>
                  <p className="text-xs text-gray-500">{row.score}% completion</p>
                </div>
                <Sparkline data={row.sparkline} />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              Weekly Consistency
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="consistency" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
              Monthly Consistency
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="consistency"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Best Window" value={insights.bestWindow} />
          <Card title="Weak Window" value={insights.weakWindow} />
          <Card title="Recovery Rate" value={`${insights.recoveryRate}%`} />
          <Card title="Goal Suggestion" value={insights.suggestion} />
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

const Sparkline = ({ data }: { data: number[] }) => {
  const width = 90;
  const height = 26;
  const stepX = width / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - v * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline fill="none" stroke="#6366f1" strokeWidth="2" points={points} />
    </svg>
  );
};

export default Insights;

