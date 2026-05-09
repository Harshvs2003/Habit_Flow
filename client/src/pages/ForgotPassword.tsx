import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"

const RESET_COOLDOWN_SECONDS = 120

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const saved = Number(localStorage.getItem("forgot_password_cooldown_until") || 0)
    if (!saved) return
    const left = Math.max(0, Math.ceil((saved - Date.now()) / 1000))
    setCooldown(left)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const onSubmit = async () => {
    if (cooldown > 0) return
    try {
      setLoading(true)
      setError("")
      setMessage("")
      const res = await fetchWithAuth(`${API}/auth/forgot-password`, {
        method: "POST",
        body: JSON.stringify({ email })
      })
      const data = await parseResponseBody(res)
      if (!res.ok) throw new Error(data.message || "Unable to process request")
      setMessage(data.message || "If that email exists, a reset link has been sent.")
      const until = Date.now() + RESET_COOLDOWN_SECONDS * 1000
      localStorage.setItem("forgot_password_cooldown_until", String(until))
      setCooldown(RESET_COOLDOWN_SECONDS)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-500 mb-4">Enter your email and we will send a reset link.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 mb-3"
        />
        <button
          onClick={onSubmit}
          disabled={loading || cooldown > 0}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg"
        >
          {loading ? "Sending..." : cooldown > 0 ? `Resend in ${formatCooldown(cooldown)}` : "Send Reset Link"}
        </button>
        {message && <p className="text-green-600 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <p className="text-sm text-gray-500 mt-4">
          Back to <Link to="/login" className="text-indigo-600">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
