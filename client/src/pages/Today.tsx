import { useEffect } from "react";
import { Check, BookOpen, Dumbbell, Moon, Footprints, Sun } from "lucide-react";
import { useHabitStore } from "../store/useHabitStore";
import { getLocalDate } from "../utils/date";
import { ChevronDown } from "lucide-react";
const Today = () => {
  const { habits, entries, dayStatus, fetchAll, toggleEntry, toggleDay } =
    useHabitStore();

  const today = getLocalDate();

  const getHabitUI = (category: string) => {
    switch (category) {
      case "Health":
        return { icon: Footprints, color: "bg-green-100 text-green-600" };
      case "Personal":
        return { icon: BookOpen, color: "bg-purple-100 text-purple-600" };
      case "Productivity":
        return { icon: Dumbbell, color: "bg-orange-100 text-orange-600" };
      default:
        return { icon: Moon, color: "bg-blue-100 text-blue-600" };
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const visibleHabits = habits.filter(
    (habit) => today >= habit.createdAt.slice(0, 10),
  );

  const completed = visibleHabits.filter(
    (h) => entries[`${h._id}-${today}`],
  ).length;

  const todayDayStatus = dayStatus[today] || "active";
  const activeDay = todayDayStatus === "active" ? 1 : 0;

  const progress =
    activeDay && visibleHabits.length
      ? Math.round((completed / visibleHabits.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black px-10 py-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Good Morning
            </h1>
            <p className="text-gray-400 text-sm mt-1">{todayDate}</p>
          </div>

          <div className="bg-white dark:bg-[#0b1220] px-4 py-2 rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-sm">
            Streaks <span className="ml-2 font-semibold">12</span>
          </div>
        </div>

        {/* Day Status */}
        <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-100 shadow-[0_4px_18px_rgba(0,0,0,0.05)] mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
              <Sun size={18} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                Day Status
              </p>
              <p className="text-xs text-gray-400">
                This day will be counted in your progress
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleDay(today)}
            className={`group px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition ${
              todayDayStatus === "active"
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            {todayDayStatus === "active" ? "Active Day" : "Skipped"}

            <ChevronDown
              size={16}
              className="opacity-70 transition-transform group-hover:translate-y-px"
            />
          </button>
        </div>

        {/* Habit List */}
        <div className="flex flex-col gap-4 mb-6">
          {visibleHabits.map((habit) => {
            const { icon: Icon, color } = getHabitUI(habit.category);
            const completedState = entries[`${habit._id}-${today}`];

            return (
              <div
                key={habit._id}
                className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-100 shadow-[0_3px_16px_rgba(0,0,0,0.05)] flex justify-between items-center hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {habit.title}
                    </p>
                    <p className="text-xs text-gray-400">{habit.category}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleEntry(habit._id, today)}
                  disabled={todayDayStatus === "skipped"}
                  className={`w-6 h-6 rounded-md flex items-center justify-center border ${
                    completedState
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {completedState && <Check size={14} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-gray-100 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between text-sm mb-2 text-gray-600 dark:text-gray-300">
            <span>
              Progress {completed} / {visibleHabits.length}
            </span>
            <span>{progress}%</span>
          </div>

          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Today;
