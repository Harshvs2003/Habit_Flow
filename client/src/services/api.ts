const normalizeApiBase = (rawUrl?: string) => {
  const fallback = "http://localhost:5000/api"
  const trimmed = (rawUrl || fallback).trim().replace(/\/+$/, "")

  if (/\/api$/i.test(trimmed)) {
    return trimmed
  }

  return `${trimmed}/api`
}

const API = normalizeApiBase(import.meta.env.VITE_API_URL)

export const parseResponseBody = async (res: Response) => {
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return res.json()
  }

  const text = await res.text()
  return { message: text || "Unexpected server response" }
}

export const fetchWithAuth = (url: string, options: any = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers
  })
}

export default API
