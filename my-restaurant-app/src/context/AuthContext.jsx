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
      console.log("Calling validateAdmin with token:", accessToken)
      const response = await fetch(`${API_URL}/user/validate-admin`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })
      console.log("validateAdmin fetch status:", response.status)
      if (!response.ok) {
        setIsAdmin(false)
        sessionStorage.setItem("isAdmin", "false")
        console.log("validateAdmin: response not ok")
        return false
      }
      const data = await response.json()
      console.log("validateAdmin response:", data, "typeof:", typeof data)
      // Accept true, "true", "True" (string or boolean)
      const adminValue = data.is_admin === true || data.is_admin === "true" || data.is_admin === "True" || data === true
      console.log("adminValue computed:", adminValue)
      setIsAdmin(adminValue)
      sessionStorage.setItem("isAdmin", adminValue.toString())
      return adminValue
    } catch (err) {
      console.error("validateAdmin error:", err)
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
  let user = sessionStorage.getItem("user");
  let access_token = null;
  let refresh_token = null;
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      access_token = parsedUser.access_token;
      refresh_token = parsedUser.refresh_token;
    } catch {}
  }
  // Always set Authorization header if access_token exists
  if (access_token) {
    options.headers = {
      ...(options.headers || {}),
      "Authorization": `Bearer ${access_token}`,
    };
  }
  let response = await fetch(url, options);
  if (response.status === 401 && refresh_token) {
    // Try to refresh the access token
    try {
      const refreshRes = await fetch(`${API_URL}/user/refresh-token?refresh_token=${encodeURIComponent(refresh_token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        // Update sessionStorage with new access_token and refresh_token
        const userObj = JSON.parse(sessionStorage.getItem("user"));
        userObj.access_token = refreshData.access_token;
        if (refreshData.refresh_token) {
          userObj.refresh_token = refreshData.refresh_token;
        }
        sessionStorage.setItem("user", JSON.stringify(userObj));
        // Retry original request with new token
        options.headers = {
          ...(options.headers || {}),
          "Authorization": `Bearer ${refreshData.access_token}`,
        };
        response = await fetch(url, options);
        if (response.status !== 401) return response;
      }
    } catch (err) {
      // ignore, will handle below
    }
    // If refresh fails, log out
    handle401Logout();
    throw new Error("Unauthorized. Logging out.");
  }
  return response;
}

export { AuthProvider, useAuth }