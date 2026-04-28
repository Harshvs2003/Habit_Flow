import { useState } from "react"
import { GoogleLogin } from "@react-oauth/google"
import { useAuthStore } from "../store/useAuthStore"
import { useNavigate } from "react-router-dom"
import API, { parseResponseBody } from "../services/api"

const Login = () => {
  const login = useAuthStore(state => state.login)
  const setAuth = useAuthStore(state => state.setAuth)
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError("")

      await login(email, password)
      navigate("/app")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (credential?: string) => {
    try {
      setError("")

      if (!credential) {
        throw new Error("Google credential missing")
      }

      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ credential })
      })

      const data = await parseResponseBody(res)

      if (!res.ok) {
        throw new Error(data.message || "Google login failed")
      }

      localStorage.setItem("token", data.token)
      setAuth(data.user, data.token)
      navigate("/app")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7fb] dark:bg-black">
      <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl border w-80">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Login
        </h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-lg"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="my-4 flex justify-center">
          <GoogleLogin
            onSuccess={credentialResponse => {
              handleGoogleLogin(credentialResponse.credential)
            }}
            onError={() => setError("Google login failed")}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  )
}

export default Login
