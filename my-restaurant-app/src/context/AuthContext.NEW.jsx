import { createContext, useContext, useState, useEffect } from "react"
import { validateSession, validateAdmin, logout as logoutUser } from "@/utils/cookieAuth"

const AuthContext = createContext()

// Custom hook for using auth context
const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Auth Provider component using HttpOnly cookie authentication
const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount and periodically
  useEffect(() => {
    checkAuthStatus()
    
    // Optionally, check auth status periodically (e.g., every 5 minutes)
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  /**
   * Check if user is authenticated by validating session with backend
   * Backend will validate the HttpOnly cookie
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const { isValid, user: userData } = await validateSession()
      
      if (isValid && userData) {
        setIsLoggedIn(true)
        setUser(userData)
        
        // Check admin status if logged in
        const adminStatus = await validateAdmin()
        setIsAdmin(adminStatus)
      } else {
        setIsLoggedIn(false)
        setUser(null)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
      setIsLoggedIn(false)
      setUser(null)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update login state after successful login
   * Call this after login to refresh the auth state
   */
  const updateLoginState = async () => {
    await checkAuthStatus()
  }

  /**
   * Validate and update admin status
   */
  const checkAdminStatus = async () => {
    try {
      const adminStatus = await validateAdmin()
      setIsAdmin(adminStatus)
      return adminStatus
    } catch (error) {
      console.error("Error validating admin status:", error)
      setIsAdmin(false)
      return false
    }
  }

  /**
   * Handle logout
   * Calls backend to clear HttpOnly cookies and clears local state
   */
  const handleLogout = async () => {
    try {
      await logoutUser()
      setIsLoggedIn(false)
      setUser(null)
      setIsAdmin(false)
      
      // Optionally redirect to login or home
      window.location.href = '/login'
    } catch (error) {
      console.error("Error during logout:", error)
      // Even if backend fails, clear local state
      setIsLoggedIn(false)
      setUser(null)
      setIsAdmin(false)
      window.location.href = '/login'
    }
  }

  const value = {
    isLoggedIn,
    user,
    isAdmin,
    isLoading,
    updateLoginState,
    handleLogout,
    checkAdminStatus,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider, useAuth }
