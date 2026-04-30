import { useState } from "react"
import API, { parseResponseBody } from "../services/api"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

const Register = () => {
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      })

      const data = await parseResponseBody(res)

      if (!res.ok) {
        throw new Error(data.message || "Registration failed")
      }

      localStorage.setItem("token", data.token)
      setAuth(data.user, data.token)
      navigate("/app", { replace: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7fb] dark:bg-black">

      <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl border w-80">

        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Register
        </h2>

        <input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded-lg"
        />

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
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

      </div>
    </div>
  )
}

export default Register
