import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    try {
      if (!token) throw new Error("Invalid reset link")
      if (password !== confirm) throw new Error("Passwords do not match")
      setLoading(true)
      setError("")
      setMessage("")
      const res = await fetchWithAuth(`${API}/auth/reset-password`, {
        method: "POST",
        body: JSON.stringify({ token, password })
      })
      const data = await parseResponseBody(res)
      if (!res.ok) throw new Error(data.message || "Failed to reset password")
      setMessage("Password reset successful. You can now log in.")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Reset Password</h1>
        <p className="text-sm text-gray-500 mb-4">Enter your new password.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 mb-3"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 mb-3"
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
        {message && <p className="text-green-600 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <p className="text-sm text-gray-500 mt-4">
          Go to <Link to="/login" className="text-indigo-600">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword

