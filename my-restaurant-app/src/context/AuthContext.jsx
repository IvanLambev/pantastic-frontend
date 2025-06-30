import { createContext, useContext, useState, useEffect } from "react"
import { handle401Logout } from "@/lib/utils"
import { API_URL } from '@/config/api'

const AuthContext = createContext()

// Custom hook for using auth context
const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Auth Provider component
const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkLoginStatus = async () => {
      const user = sessionStorage.getItem("user")
      if (user) {
        try {
          const parsedUser = JSON.parse(user)
          if (parsedUser.access_token) {
            setToken(parsedUser.access_token)
            setIsLoggedIn(true)
            // Check admin status
            const admin = sessionStorage.getItem("isAdmin")
            if (admin !== null) {
              setIsAdmin(admin === "true")
            } else {
              // Optionally, validate admin on load
              await validateAdmin(parsedUser.access_token)
            }
          } else {
            setIsLoggedIn(false)
            setIsAdmin(false)
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
          setIsLoggedIn(false)
          setIsAdmin(false)
        }
      } else {
        setIsLoggedIn(false)
        setIsAdmin(false)
      }
    }

    checkLoginStatus()
  }, [])

  const validateAdmin = async (accessToken) => {
    try {
      const response = await fetch(`${API_URL}/user/validate-admin`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) {
        setIsAdmin(false)
        sessionStorage.setItem("isAdmin", "false")
        return false
      }
      const data = await response.json()
      setIsAdmin(!!data.is_admin)
      sessionStorage.setItem("isAdmin", (!!data.is_admin).toString())
      return !!data.is_admin
    } catch (err) {
      setIsAdmin(false)
      sessionStorage.setItem("isAdmin", "false")
      return false
    }
  }

  const updateLoginState = async () => {
    const user = sessionStorage.getItem("user")
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        if (parsedUser.access_token) {
          setToken(parsedUser.access_token)
          setIsLoggedIn(true)
          await validateAdmin(parsedUser.access_token)
        } else {
          setIsLoggedIn(false)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        setIsLoggedIn(false)
        setIsAdmin(false)
      }
    } else {
      setIsLoggedIn(false)
      setIsAdmin(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("selectedRestaurant")
    sessionStorage.removeItem("isAdmin")
    setIsLoggedIn(false)
    setToken(null)
    setIsAdmin(false)
    alert("You have been logged out!")
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, setToken, updateLoginState, handleLogout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

// Global fetch wrapper
export async function fetchWithAuth(url, options = {}) {
  const response = await fetch(url, options)
  if (response.status === 401) {
    handle401Logout()
    throw new Error("Unauthorized. Logging out.")
  }
  return response
}

export { AuthProvider, useAuth }