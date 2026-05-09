import { create } from "zustand"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"
import type { PlanKey } from "../config/plans"

type AuthUser = {
  _id: string
  name: string
  email: string
  picture?: string
  plan: PlanKey
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
  deleteAccount: (password?: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  hydrateAuth: async () => {
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
