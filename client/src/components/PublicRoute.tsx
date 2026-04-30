import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isAuthLoading = useAuthStore(state => state.isAuthLoading)

  if (isAuthLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return children
}

export default PublicRoute
