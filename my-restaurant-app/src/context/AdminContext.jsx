import { createContext, useState, useEffect, useCallback } from "react"
import { API_URL } from '@/config/api'

export const AdminContext = createContext()

// Admin Auth Provider component  
export const AdminProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminToken, setAdminToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminLoginStatus = async () => {
      const adminUser = sessionStorage.getItem("adminUser")
      if (adminUser) {
        try {
          const parsedUser = JSON.parse(adminUser)
          if (parsedUser.access_token) {
            // Verify the token is still valid
            const verification = await verifyAdminToken(parsedUser.access_token)
            if (verification.success) {
              setAdminToken(parsedUser.access_token)
              setIsAdminLoggedIn(true)
            } else {
              // Token is invalid, clear storage
              sessionStorage.removeItem("adminUser")
              setIsAdminLoggedIn(false)
              setAdminToken(null)
            }
          }
        } catch (error) {
          console.error("Error parsing admin user data:", error)
          sessionStorage.removeItem("adminUser")
          setIsAdminLoggedIn(false)
          setAdminToken(null)
        }
      }
      setLoading(false)
    }

    checkAdminLoginStatus()
  }, [verifyAdminToken])

  const verifyAdminToken = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_URL}/restaurant/admin/verify`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Admin verification failed")
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error("Admin verification error:", error)
      return { success: false, error: error.message }
    }
  }, [])

  const adminLogin = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/restaurant/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Admin login failed")
      }

      const data = await response.json()
      
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

  const adminLogout = () => {
    sessionStorage.removeItem("adminUser")
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