import { Navigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(state => state.token)

  if (token) {
    return <Navigate to="/app" replace />
  }

  return children
}

export default PublicRoute
