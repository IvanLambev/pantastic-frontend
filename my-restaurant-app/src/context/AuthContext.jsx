import { createContext, useContext, useState, useEffect } from "react"
import { handle401Logout } from "@/lib/utils"

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

  useEffect(() => {
    const checkLoginStatus = () => {
      const user = sessionStorage.getItem("user")
      if (user) {
        try {
          const parsedUser = JSON.parse(user)
          if (parsedUser.access_token) {
            setToken(parsedUser.access_token)
            setIsLoggedIn(true)
          } else {
            setIsLoggedIn(false)
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
    }

    checkLoginStatus()
  }, [])

  const updateLoginState = () => {
    const user = sessionStorage.getItem("user")
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        if (parsedUser.access_token) {
          setToken(parsedUser.access_token)
          setIsLoggedIn(true)
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        setIsLoggedIn(false)
      }
    } else {
      setIsLoggedIn(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("selectedRestaurant")
    setIsLoggedIn(false)
    setToken(null)
    alert("You have been logged out!")
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, setToken, updateLoginState, handleLogout }}>
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