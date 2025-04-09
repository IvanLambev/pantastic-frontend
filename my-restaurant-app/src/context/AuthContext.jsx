import { createContext, useContext, useState } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const updateLoginState = () => {
    const user = sessionStorage.getItem("user")
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        if (parsedUser.access_token) {
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
    setIsLoggedIn(false)
    alert("You have been logged out!")
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, updateLoginState, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}