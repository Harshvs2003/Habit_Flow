import { create } from "zustand"
import API, { fetchWithAuth } from "../services/api"
import { getLocalMonth } from "../utils/date"

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

export const useHabitStore = create<Store>((set) => ({
  habits: [],
  entries: {},
  dayStatus: {},

  fetchAll: async () => {
    const month = getLocalMonth()

    const [hRes, eRes, dRes] = await Promise.all([
      fetchWithAuth(`${API}/habits`),
      fetchWithAuth(`${API}/entries?month=${month}`),
      fetchWithAuth(`${API}/day-status?month=${month}`)
    ])

    if (!hRes.ok || !eRes.ok || !dRes.ok) {
      return
    }

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

  toggleEntry: async (habitId, date) => {
    const res = await fetchWithAuth(`${API}/entries`, {
      method: "POST",
      body: JSON.stringify({ habitId, date })
    })

    if (!res.ok) {
      return
    }

    const key = `${habitId}-${date}`

    set(state => ({
      entries: {
        ...state.entries,
        [key]: !state.entries[key]
      }
    }))
  },

  toggleDay: async (date) => {
    const res = await fetchWithAuth(`${API}/day-status`, {
      method: "POST",
      body: JSON.stringify({ date })
    })

    if (!res.ok) {
      return
    }

    set(state => ({
      dayStatus: {
        ...state.dayStatus,
        [date]: state.dayStatus[date] === "skipped" ? "active" : "skipped"
      }
    }))
  }
}))
