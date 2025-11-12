import { createContext, useState, useEffect, useCallback, useContext } from "react"
import { API_URL } from '@/config/api'

const AdminContext = createContext()

// Custom hook for using admin auth context
export const useAdminAuth = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminProvider")
  }
  return context
}

// Admin Auth Provider component  
export const AdminProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminToken, setAdminToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const verifyAdminToken = useCallback(async () => {
    try {
      console.log('🔍 AdminContext: Verifying admin token...')
      console.log('🔍 AdminContext: Using cookie-based auth')
      console.log('🔍 AdminContext: All cookies:', document.cookie)
      
      const response = await fetch(`${API_URL}/restaurant/admin/verify`, {
        method: "GET",
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log('🔍 AdminContext: Token verification response status:', response.status)
      console.log('🔍 AdminContext: Response headers:', {
        'content-type': response.headers.get('content-type'),
        'set-cookie': response.headers.get('set-cookie')
      })

      if (!response.ok) {
        console.log('🔍 AdminContext: Token verification failed with status:', response.status)
        
        // If token is expired/invalid (401), clear the stored admin data
        if (response.status === 401) {
          console.log('🔍 AdminContext: Token expired/invalid, clearing admin session')
          sessionStorage.removeItem("adminUser")
          setAdminToken(null)
          setIsAdminLoggedIn(false)
        }
        
        throw new Error("Admin verification failed")
      }

      const data = await response.json()
      console.log('🔍 AdminContext: Token verification successful, admin data:', data)
      return { success: true, data }
    } catch (error) {
      console.error("🔍 AdminContext: Admin verification error:", error)
      return { success: false, error: error.message }
    }
  }, [])

  useEffect(() => {
    const checkAdminLoginStatus = async () => {
      console.log('🚀 AdminContext: Initializing admin auth check')
      const adminUser = sessionStorage.getItem("adminUser")
      console.log('🚀 AdminContext: Admin user in storage:', adminUser ? 'Found' : 'Not found')
      
      if (adminUser) {
        try {
          const parsedUser = JSON.parse(adminUser)
          console.log('🚀 AdminContext: Parsed admin user data:', { 
            hasToken: !!parsedUser.access_token,
            role: parsedUser.admin_info?.role,
            email: parsedUser.admin_info?.email
          })
          
          if (parsedUser.access_token) {
            // Verify the token on initial load
            console.log('🚀 AdminContext: Found token, verifying...')
            const verification = await verifyAdminToken(parsedUser.access_token)
            if (verification.success) {
              setAdminToken(parsedUser.access_token)
              setIsAdminLoggedIn(true)
              console.log('🚀 AdminContext: Admin login status set to true')
            } else {
              console.log('🚀 AdminContext: Token verification failed, clearing session')
              sessionStorage.removeItem("adminUser")
              setAdminToken(null)
              setIsAdminLoggedIn(false)
            }
          } else {
            console.log('🚀 AdminContext: No access token found in stored admin data')
          }
        } catch (error) {
          console.error("🚀 AdminContext: Error parsing admin user data:", error)
          sessionStorage.removeItem("adminUser")
          setIsAdminLoggedIn(false)
          setAdminToken(null)
        }
      } else {
        console.log('🚀 AdminContext: No admin user found in session storage')
      }
      
      console.log('🚀 AdminContext: Setting loading to false')
      setLoading(false)
    }

    checkAdminLoginStatus()
  }, [verifyAdminToken])

  const adminLogin = async (email, password) => {
    try {
      console.log('🔐 AdminContext: Attempting admin login for:', email)
      const response = await fetch(`${API_URL}/restaurant/admin/login`, {
        method: "POST",
        credentials: 'include', // ✅ CRITICAL - Save HttpOnly cookies from backend
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('🔐 AdminContext: Login response status:', response.status)
      console.log('🔐 AdminContext: Response headers:', {
        'set-cookie': response.headers.get('set-cookie'),
        'content-type': response.headers.get('content-type')
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Admin login failed")
      }

      const data = await response.json()
      console.log('🔐 AdminContext: Login successful, received data:', { 
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token 
      })
      
      // Verify the token immediately after login
      const verification = await verifyAdminToken(data.access_token)
      if (!verification.success) {
        throw new Error("Failed to verify admin token")
      }
      
      // Store admin token and user info
      const adminUserData = {
        ...data,
        admin_info: verification.data
      }
      sessionStorage.setItem("adminUser", JSON.stringify(adminUserData))
      setAdminToken(data.access_token)
      setIsAdminLoggedIn(true)
      
      return { success: true, data: adminUserData }
    } catch (error) {
      console.error("Admin login error:", error)
      return { success: false, error: error.message }
    }
  }

  const adminLogout = async () => {
    console.log('🚪 AdminContext: Admin logout requested')
    
    try {
      // Call backend to clear HttpOnly cookies
      const response = await fetch(`${API_URL}/user/logout`, {
        method: 'POST',
        credentials: 'include', // CRITICAL: Include cookies in request
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Admin logout request failed, but clearing local data anyway')
      }
      
      console.log('✅ Admin backend logout successful - cookies cleared')
    } catch (error) {
      console.error('Admin logout error:', error)
      // Continue to clear local data even if backend call fails
    }
    
    // Clear admin session data
    sessionStorage.removeItem("adminUser")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("isAdmin")
    
    // Clear state
    setIsAdminLoggedIn(false)
    setAdminToken(null)
  }

  const isAdminEnabled = () => {
    // Check if admin functionality is enabled via environment variable
    return import.meta.env.VITE_ADMIN_ENABLED === 'true'
  }

  return (
    <AdminContext.Provider 
      value={{ 
        isAdminLoggedIn, 
        adminToken, 
        adminLogin, 
        adminLogout, 
        verifyAdminToken,
        isAdminEnabled,
        loading 
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}