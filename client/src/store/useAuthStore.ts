import { create } from "zustand"
import API, { parseResponseBody } from "../services/api"

type AuthUser = {
  _id: string
  name: string
  email: string
}

type AuthStore = {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,

  login: async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await parseResponseBody(res)

    if (!res.ok) {
      throw new Error(data.message || "Login failed")
    }

    localStorage.setItem("token", data.token)

    set({
      user: data.user,
      token: data.token
    })
  },

  setAuth: (user, token) => {
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem("token")
    set({ user: null, token: null })
  }
}))
