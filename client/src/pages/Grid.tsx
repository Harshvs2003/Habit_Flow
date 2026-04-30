import { useEffect, useMemo, useState } from "react";
import { useHabitStore } from "../store/useHabitStore";
import {
  getLocalDate,
  getLocalMonth,
  getMonthDaysCount,
  getMonthLabel,
  getYesterday,
  shiftMonth,
} from "../utils/date";
import { Check } from "lucide-react";

const Grid = () => {
  const { habits, entries, dayStatus, fetchAll, toggleEntry, toggleDay } =
    useHabitStore();

  const todayStr = getLocalDate();
  const yesterdayStr = getYesterday();
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonth());

  const daysInMonth = useMemo(
    () => getMonthDaysCount(selectedMonth),
    [selectedMonth],
  );
  const monthEndDate = `${selectedMonth}-${String(daysInMonth).padStart(2, "0")}`;

  const visibleHabits = useMemo(
    () => habits.filter((habit) => habit.createdAt.slice(0, 10) <= monthEndDate),
    [habits, monthEndDate],
  );

  const isEditable = (date: string) => {
    return date === todayStr || date === yesterdayStr;
  };

  const isAfterHabitStart = (habitDate: string, cellDate: string) => {
    return cellDate >= habitDate.slice(0, 10);
  };

  useEffect(() => {
    fetchAll(selectedMonth);
  }, [fetchAll, selectedMonth]);

  const getDate = (day: number) => {
    return `${selectedMonth}-${String(day).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black px-4 sm:px-6 md:px-10 py-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        Calendar / Grid View
      </h1>

      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Prev
        </button>
        <div className="px-4 py-2 rounded-xl border border-gray-100 bg-white dark:bg-[#0b1220] dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200 min-w-36 text-center">
          {getMonthLabel(selectedMonth)}
        </div>
        <button
          onClick={() => setSelectedMonth((prev) => shiftMonth(prev, 1))}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>

      <div className="mb-4 rounded-xl bg-white dark:bg-[#0b1220] border border-gray-100 dark:border-gray-800 px-4 py-3">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Tip: Click a day number in the top row to mark that day as skipped or unskipped.
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
            Completed
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700 inline-block" />
            Skipped day
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#0b1220] border border-gray-100 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
        <div className="min-w-[900px]">
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            <div className="w-44 p-4 text-sm font-medium text-gray-500 sticky left-0 z-30 bg-white dark:bg-[#0b1220] border-r border-gray-100 dark:border-gray-800">
              Habit
            </div>

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = getDate(day);
              const skipped = dayStatus[date] === "skipped";
              const locked = !isEditable(date);

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (isEditable(date)) toggleDay(date);
                  }}
                  title={
                    locked
                      ? "Only today and yesterday can be changed"
                      : skipped
                      ? "Click to unskip this day"
                      : "Click to mark this day as skipped"
                  }
                  className={`w-10 h-10 flex items-center justify-center text-xs border-l border-gray-100 dark:border-gray-800
                  ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  ${
                    skipped
                      ? "text-orange-500"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {visibleHabits.map((habit) => (
            <div
              key={habit._id}
              className="flex border-b border-gray-100 dark:border-gray-800"
            >
              <div className="w-44 p-4 text-sm font-medium text-gray-800 dark:text-white border-r border-gray-100 dark:border-gray-800 sticky left-0 z-20 bg-white dark:bg-[#0b1220]">
                {habit.title}
              </div>

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = getDate(day);
                const checked = entries[`${habit._id}-${date}`];
                const skipped = dayStatus[date] === "skipped";
                const habitStartDate = habit.createdAt?.slice(0, 10) || date;
                const beforeStart = !isAfterHabitStart(habitStartDate, date);
                const locked = !isEditable(date) || beforeStart;

                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (!skipped && !beforeStart && isEditable(date)) {
                        toggleEntry(habit._id, date);
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center border-l border-gray-100 dark:border-gray-800"
                  >
                    <div
                      className={`
                        w-5 h-5 rounded-md flex items-center justify-center
                        border transition
                        ${
                          locked
                            ? "opacity-30"
                            : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        }
                        ${
                          skipped
                            ? "border-gray-200 bg-gray-100 dark:bg-gray-900"
                            : checked
                            ? "bg-indigo-500 border-indigo-500 text-white"
                            : "border-gray-300 bg-white dark:bg-transparent"
                        }
                      `}
                    >
                      {checked && <Check size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Grid;
