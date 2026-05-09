import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying email...")

  useEffect(() => {
    const verify = async () => {
      try {
        if (!token) throw new Error("Invalid verification link")
        const res = await fetchWithAuth(`${API}/auth/verify-email`, {
          method: "POST",
          body: JSON.stringify({ token })
        })
        const data = await parseResponseBody(res)
        if (!res.ok) throw new Error(data.message || "Verification failed")
        setStatus("success")
        setMessage(data.message || "Email verified successfully.")
      } catch (err) {
        setStatus("error")
        setMessage((err as Error).message)
      }
    }
    verify()
  }, [token])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Email Verification</h1>
        <p className={`text-sm ${status === "error" ? "text-red-500" : status === "success" ? "text-green-600" : "text-gray-500"}`}>
          {message}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Continue to <Link to="/login" className="text-indigo-600">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyEmail

