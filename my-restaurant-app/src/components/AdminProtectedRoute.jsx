import { Navigate } from "react-router-dom"
import { useAdminAuth } from "@/context/AdminContext"

export default function AdminProtectedRoute({ children }) {
  const { isAdminLoggedIn, loading, isAdminEnabled } = useAdminAuth()
  
  console.log('🛡️ AdminProtectedRoute: Auth check started')
  console.log('🛡️ AdminProtectedRoute: isAdminLoggedIn:', isAdminLoggedIn)
  console.log('🛡️ AdminProtectedRoute: loading:', loading)
  console.log('🛡️ AdminProtectedRoute: isAdminEnabled():', isAdminEnabled())
  
  // Show loading while checking auth status
  if (loading) {
    console.log('🛡️ AdminProtectedRoute: Showing loading state')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // Check if admin functionality is enabled
  if (!isAdminEnabled()) {
    console.log('🛡️ AdminProtectedRoute: Admin functionality is disabled')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Access Disabled</h1>
          <p className="text-muted-foreground">Admin functionality is currently disabled.</p>
        </div>
      </div>
    )
  }

  // Redirect to admin login if not authenticated
  if (!isAdminLoggedIn) {
    console.log('🛡️ AdminProtectedRoute: Admin not logged in, redirecting to /admin/login')
    return <Navigate to="/admin/login" replace />
  }

  console.log('🛡️ AdminProtectedRoute: Admin authenticated, rendering children')
  return children
}