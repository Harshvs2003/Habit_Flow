import { create } from "zustand"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"
import type { PlanKey } from "../config/plans"

let hydrateInFlight: Promise<void> | null = null
let lastHydrateAt = 0

type AuthUser = {
  _id: string
  name: string
  email: string
  picture?: string
  plan: PlanKey
  subscription?: {
    billingType: "none" | "one_time" | "recurring"
    interval: "monthly" | "yearly" | null
    status: "inactive" | "created" | "authenticated" | "active" | "charged" | "halted" | "cancelled"
    subscriptionId: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtCycleEnd: boolean
    cancelledAt: string | null
  }
}

type AuthStore = {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  hydrateAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  setAuth: (user: AuthUser) => void
  setUser: (updates: Partial<AuthUser>) => void
  clearAuth: () => void
  updateName: (name: string) => Promise<void>
  updatePlan: (plan: PlanKey) => Promise<void>
  resetData: () => Promise<void>
  deleteAccount: (password?: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  hydrateAuth: async () => {
    const now = Date.now()
    const state = get()

    // Prevent request storms (focus events, multiple mounts, etc).
    if (hydrateInFlight) return hydrateInFlight

    // If user is not authenticated, don't keep hammering /me.
    if (!state.isAuthenticated && !state.isAuthLoading && now - lastHydrateAt < 60_000) {
      return
    }

    // If user is authenticated, allow occasional refreshes (e.g. on focus) but throttle them.
    if (state.isAuthenticated && now - lastHydrateAt < 10_000) {
      return
    }

    lastHydrateAt = now

    hydrateInFlight = (async () => {
    try {
      const res = await fetchWithAuth(`${API}/auth/me`)
      const data = await parseResponseBody(res)

      if (!res.ok) {
        throw new Error(data.message || "Not authenticated")
      }

      set({
        user: data.user,
        isAuthenticated: true,
        isAuthLoading: false
      })
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isAuthLoading: false
      })
    }
    })().finally(() => {
      hydrateInFlight = null
    })

    return hydrateInFlight
  },

  login: async (email: string, password: string) => {
    const res = await fetchWithAuth(`${API}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password })
    })

    const data = await parseResponseBody(res)

    if (!res.ok) {
      throw new Error(data.message || "Login failed")
    }

    set({
      user: data.user,
      isAuthenticated: true
    })
  },

  setAuth: (user) => {
    set({
      user,
      isAuthenticated: true
    })
  },

  setUser: (updates) => {
    set((state) => {
      if (!state.user) return state
      return {
        user: { ...state.user, ...updates }
      }
    })
  },

  clearAuth: () => set({ user: null, isAuthenticated: false, isAuthLoading: false }),

  updateName: async (name) => {
    const res = await fetchWithAuth(`${API}/user/name`, {
      method: "PATCH",
      body: JSON.stringify({ name })
    })
    const data = await parseResponseBody(res)
    if (!res.ok) {
      throw new Error(data.message || "Failed to update name")
    }

    set({
      user: data.user,
      isAuthenticated: true
    })
  },

  updatePlan: async (plan) => {
    const res = await fetchWithAuth(`${API}/user/plan`, {
      method: "PATCH",
      body: JSON.stringify({ plan })
    })
    const data = await parseResponseBody(res)
    if (!res.ok) {
      throw new Error(data.message || "Failed to update plan")
    }

    set({
      user: data.user,
      isAuthenticated: true
    })
  },

  resetData: async () => {
    const res = await fetchWithAuth(`${API}/user/data`, {
      method: "DELETE"
    })
    const data = await parseResponseBody(res)
    if (!res.ok) {
      throw new Error(data.message || "Failed to reset data")
    }
  },

  deleteAccount: async (password = "") => {
    const res = await fetchWithAuth(`${API}/user/account`, {
      method: "DELETE",
      body: JSON.stringify({ password })
    })
    const data = await parseResponseBody(res)
    if (!res.ok) {
      throw new Error(data.message || "Failed to delete account")
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("auth")
      channel.postMessage("logout")
      channel.close()
    }
    set({ user: null, isAuthenticated: false, isAuthLoading: false })
  },

  logout: async () => {
    try {
      await fetchWithAuth(`${API}/auth/logout`, {
        method: "POST"
      })
    } finally {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("auth")
        channel.postMessage("logout")
        channel.close()
      }
      set({ user: null, isAuthenticated: false, isAuthLoading: false })
    }
  }
}))
