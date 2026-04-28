const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "")

export const fetchWithAuth = (url: string, options: any = {}) => {
  const token = localStorage.getItem("token")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return fetch(url, {
    ...options,
    headers
  })
}

export default API
