import { create } from "zustand"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"

const AUTH_STORAGE_KEY = "auth"

type AuthUser = {
  _id: string
  name: string
  email: string
  picture?: string
}

type AuthData = {
  token: string
  user: AuthUser
}

type AuthStore = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  hydrateAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  setAuth: (authData: AuthData) => void
  syncAuthFromStorage: () => void
  logout: () => Promise<void>
}

const readStoredAuth = (): AuthData | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthData
    if (!parsed?.token || !parsed?.user?._id) return null
    return parsed
  } catch {
    return null
  }
}

const writeStoredAuth = (authData: AuthData) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
}

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: readStoredAuth()?.user || null,
  token: readStoredAuth()?.token || null,
  isAuthenticated: Boolean(readStoredAuth()?.token),
  isAuthLoading: true,

  hydrateAuth: async () => {
    const savedAuth = readStoredAuth()

    if (!savedAuth) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAuthLoading: false
      })
      return
    }

    try {
      set({
        user: savedAuth.user,
        token: savedAuth.token,
        isAuthenticated: true,
        isAuthLoading: true
      })

      const res = await fetchWithAuth(`${API}/auth/me`)
      const data = await parseResponseBody(res)

      if (!res.ok) {
        throw new Error(data.message || "Not authenticated")
      }

      const nextAuth: AuthData = { token: savedAuth.token, user: data.user }
      writeStoredAuth(nextAuth)

      set({
        user: nextAuth.user,
        token: nextAuth.token,
        isAuthenticated: true,
        isAuthLoading: false
      })
    } catch {
      clearStoredAuth()
      set({
        user: null,
        token: null,
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

    const nextAuth: AuthData = {
      token: data.token,
      user: data.user
    }
    writeStoredAuth(nextAuth)

    set({
      user: nextAuth.user,
      token: nextAuth.token,
      isAuthenticated: true
    })
  },

  setAuth: (authData) => {
    writeStoredAuth(authData)
    set({
      user: authData.user,
      token: authData.token,
      isAuthenticated: true
    })
  },

  syncAuthFromStorage: () => {
    const savedAuth = readStoredAuth()
    if (!savedAuth) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAuthLoading: false
      })
      return
    }

    set({
      user: savedAuth.user,
      token: savedAuth.token,
      isAuthenticated: true,
      isAuthLoading: false
    })
  },

  logout: async () => {
    try {
      await fetchWithAuth(`${API}/auth/logout`, {
        method: "POST"
      })
    } finally {
      clearStoredAuth()
      set({ user: null, token: null, isAuthenticated: false, isAuthLoading: false })
    }
  }
}))
