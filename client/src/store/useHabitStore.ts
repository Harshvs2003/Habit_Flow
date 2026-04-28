import { create } from "zustand"
import API from "../services/api"

type Habit = {
  _id: string
  title: string
  category: string
  createdAt: string
}

type Store = {
  habits: Habit[]
  entries: Record<string, boolean>
  dayStatus: Record<string, "active" | "skipped">

  fetchAll: () => Promise<void>
  toggleEntry: (habitId: string, date: string) => Promise<void>
  toggleDay: (date: string) => Promise<void>
}

export const useHabitStore = create<Store>((set, get) => ({
  habits: [],
  entries: {},
  dayStatus: {},

  // 🚀 FETCH EVERYTHING
  fetchAll: async () => {
    const today = new Date().toISOString().slice(0, 7)

    const [hRes, eRes, dRes] = await Promise.all([
      fetch(`${API}/habits`),
      fetch(`${API}/entries?month=${today}`),
      fetch(`${API}/day-status?month=${today}`)
    ])

    const habits = await hRes.json()
    const entriesData = await eRes.json()
    const dayData = await dRes.json()

    const entries: Record<string, boolean> = {}
    entriesData.forEach((e: any) => {
      entries[`${e.habitId}-${e.date}`] = e.completed
    })

    const dayStatus: Record<string, "active" | "skipped"> = {}
    dayData.forEach((d: any) => {
      dayStatus[d.date] = d.status
    })

    set({ habits, entries, dayStatus })
  },

  // 🔁 TOGGLE ENTRY
  toggleEntry: async (habitId, date) => {
    await fetch(`${API}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date })
    })

    const key = `${habitId}-${date}`

    set(state => ({
      entries: {
        ...state.entries,
        [key]: !state.entries[key]
      }
    }))
  },

  // 🔁 TOGGLE DAY
  toggleDay: async (date) => {
    await fetch(`${API}/day-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date })
    })

    set(state => ({
      dayStatus: {
        ...state.dayStatus,
        [date]:
          state.dayStatus[date] === "skipped"
            ? "active"
            : "skipped"
      }
    }))
  }
}))