import { create } from "zustand"
import API, { parseResponseBody } from "../services/api"

type AuthUser = {
  _id: string
  name: string
  email: string
}

type AuthStore = {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  hydrateAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  setAuth: (user: AuthUser) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  hydrateAuth: async () => {
    try {
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include"
      })
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
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include"
    })
    set({ user: null, isAuthenticated: false })
  }
}))
