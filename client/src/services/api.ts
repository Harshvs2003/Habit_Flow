const normalizeApiBase = (rawUrl?: string) => {
  const fallback = "http://localhost:5000/api"
  const trimmed = (rawUrl || fallback).trim().replace(/\/+$/, "")

  if (/\/api$/i.test(trimmed)) {
    return trimmed
  }

  return `${trimmed}/api`
}

const API = normalizeApiBase(import.meta.env.VITE_API_URL)
const AUTH_STORAGE_KEY = "auth"

type StoredAuth = {
  token: string
  user: {
    _id: string
    name: string
    email: string
    picture?: string
  }
}

export const parseResponseBody = async (res: Response) => {
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return res.json()
  }

  const text = await res.text()
  return { message: text || "Unexpected server response" }
}

export const fetchWithAuth = (url: string, options: any = {}) => {
  let token = ""
  const authRaw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (authRaw) {
    try {
      const parsed = JSON.parse(authRaw) as StoredAuth
      token = parsed?.token || ""
    } catch {
      token = ""
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers
  })
}

export default API
