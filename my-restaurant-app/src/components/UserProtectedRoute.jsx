import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function UserProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  
  console.log('🛡️ UserProtectedRoute: Auth check started')
  console.log('🛡️ UserProtectedRoute: isLoggedIn:', isLoggedIn)
  
  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    console.log('🛡️ UserProtectedRoute: User not logged in, redirecting to /login')
    return <Navigate to="/login" replace />
  }

  console.log('🛡️ UserProtectedRoute: User authenticated, rendering children')
  return children
}
