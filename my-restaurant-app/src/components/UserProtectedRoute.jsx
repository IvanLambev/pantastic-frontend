import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function UserProtectedRoute({ children }) {
  const { user, token } = useAuth()
  
  console.log('🛡️ UserProtectedRoute: Auth check started')
  console.log('🛡️ UserProtectedRoute: user:', user)
  console.log('🛡️ UserProtectedRoute: token:', token)
  
  // Check if user is logged in (either has token or user object)
  const isLoggedIn = Boolean(token || user)
  
  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    console.log('🛡️ UserProtectedRoute: User not logged in, redirecting to /login')
    return <Navigate to="/login" replace />
  }

  console.log('🛡️ UserProtectedRoute: User authenticated, rendering children')
  return children
}
