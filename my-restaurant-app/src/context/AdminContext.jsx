import { createContext, useState, useEffect } from "react"
import { API_URL } from '@/config/api'

export const AdminContext = createContext()

// Admin Auth Provider component  
export const AdminProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminToken, setAdminToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminLoginStatus = () => {
      const adminUser = sessionStorage.getItem("adminUser")
      if (adminUser) {
        try {
          const parsedUser = JSON.parse(adminUser)
          if (parsedUser.access_token) {
            setAdminToken(parsedUser.access_token)
            setIsAdminLoggedIn(true)
          }
        } catch (error) {
          console.error("Error parsing admin user data:", error)
          setIsAdminLoggedIn(false)
          setAdminToken(null)
        }
      }
      setLoading(false)
    }

    checkAdminLoginStatus()
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
      
      // Store admin token
      sessionStorage.setItem("adminUser", JSON.stringify(data))
      setAdminToken(data.access_token)
      setIsAdminLoggedIn(true)
      
      return { success: true, data }
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
        isAdminEnabled,
        loading 
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}