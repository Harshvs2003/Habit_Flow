import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { GoogleLogin } from "@react-oauth/google"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"

const Register = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const setAuth = useAuthStore(state => state.setAuth)
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    try {
      setLoading(true)
      setError("")

      if (!name.trim() || !email.trim() || !password.trim()) {
        throw new Error("Please fill all required fields")
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      const res = await fetchWithAuth(`${API}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      })

      const data = await parseResponseBody(res)

      if (!res.ok) {
        throw new Error(data.message || "Registration failed")
      }

      navigate("/login", {
        replace: true,
        state: { message: data.message || "Account created. Please verify your email before logging in." }
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async (credential?: string) => {
    try {
      setError("")

      if (!credential) {
        throw new Error("Google credential missing")
      }

      const res = await fetchWithAuth(`${API}/auth/google`, {
        method: "POST",
        body: JSON.stringify({ credential })
      })

      const data = await parseResponseBody(res)

      if (!res.ok) {
        throw new Error(data.message || "Google registration failed")
      }

      setAuth(data.user)
      navigate("/app", { replace: true })
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-indigo-500 rounded-md"></div>
            <span className="font-semibold text-gray-800">HabitFlow</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Start your journey to better habits today.
          </p>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="mt-2 w-full bg-linear-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg hover:opacity-90 transition"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </div>

          <div className="flex items-center gap-3 my-6 text-sm text-gray-400">
            <div className="flex-1 h-px bg-gray-200"></div>
            or continue with
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="w-full flex justify-center">
            {googleClientId ? (
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  handleGoogleRegister(credentialResponse.credential)
                }}
                onError={() => setError("Google registration failed")}
              />
            ) : (
              <p className="text-xs text-amber-600 text-center">
                Google registration is not configured. Missing VITE_GOOGLE_CLIENT_ID.
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
          )}

          <p className="text-sm text-gray-400 mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-500 font-medium">
              Log in
            </Link>
          </p>
        </div>

        <div className="hidden md:flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600 relative p-10">
          <div className="text-center text-white max-w-xs">
            <p className="text-lg font-medium leading-relaxed">
              Your future is created by what you do today.
            </p>

            <div className="flex justify-center gap-2 mt-6">
              <div className="w-6 h-1 bg-white rounded-full"></div>
              <div className="w-2 h-1 bg-white/50 rounded-full"></div>
              <div className="w-2 h-1 bg-white/50 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
