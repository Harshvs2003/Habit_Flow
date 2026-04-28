import { useEffect} from "react";
import { useHabitStore } from "../store/useHabitStore";
import { getLocalDate, getLocalMonth, getYesterday } from "../utils/date";

const daysInMonth = 30;

const Grid = () => {
  const { habits, entries, dayStatus, fetchAll, toggleEntry, toggleDay } =
    useHabitStore();

  const todayStr = getLocalDate();
  const yesterdayStr = getYesterday();
  const currentMonth = getLocalMonth();

  const isEditable = (date: string) => {
    return date === todayStr || date === yesterdayStr;
  };

  const isAfterHabitStart = (habitDate: string, cellDate: string) => {
    return cellDate >= habitDate.slice(0, 10);
  };

  useEffect(() => {
    fetchAll();
  }, [todayStr]);

  const getDate = (day: number) => {
    return `${currentMonth}-${String(day).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-6 py-6">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Grid View
      </h1>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#0b1220]">
        <div className="min-w-225">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <div className="w-40 p-3 font-medium text-gray-600 dark:text-gray-300">
              Habits
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
                    if (isEditable(date)) {
                      toggleDay(date);
                    }
                  }}
                  className={`w-10 h-10 flex items-center justify-center text-xs border-l border-gray-200 dark:border-gray-800 ${
                    locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  } ${
                    skipped
                      ? "bg-red-100 dark:bg-red-900 text-red-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {habits.map((habit) => (
            <div
              key={habit._id}
              className="flex border-b border-gray-200 dark:border-gray-800"
            >
              <div className="w-40 p-3 text-sm font-medium text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-800">
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
                    className={`w-10 h-10 flex items-center justify-center text-xs border-l border-gray-200 dark:border-gray-800 ${
                      locked
                        ? "opacity-30 cursor-not-allowed"
                        : skipped
                          ? "bg-gray-100 dark:bg-gray-900"
                          : checked
                            ? "bg-green-500 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    }`}
                  >
                    {checked ? "\u2713" : ""}
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
