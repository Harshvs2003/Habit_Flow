import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isAuthLoading = useAuthStore(state => state.isAuthLoading)

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-black text-sm text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
