const API = "http://localhost:5000/api"

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
