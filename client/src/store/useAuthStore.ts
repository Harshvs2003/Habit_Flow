import { create } from "zustand"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"

type AuthUser = {
  _id: string
  name: string
  email: string
  picture?: string
}

type AuthStore = {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  hydrateAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  setAuth: (user: AuthUser) => void
  clearAuth: () => void
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

  clearAuth: () => set({ user: null, isAuthenticated: false, isAuthLoading: false }),

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
