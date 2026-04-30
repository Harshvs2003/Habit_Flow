import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isAuthLoading = useAuthStore(state => state.isAuthLoading)

  if (isAuthLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
