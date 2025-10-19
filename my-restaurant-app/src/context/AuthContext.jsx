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

  const refreshUserTokens = async () => {
    try {
      const newTokens = await refreshTokens();
      setToken(newTokens.access_token);
      return newTokens;
    } catch (error) {
      console.error('Failed to refresh user tokens:', error);
      handleLogout();
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      token, 
      setToken, 
      updateLoginState, 
      handleLogout, 
      isAdmin,
      refreshUserTokens
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Helper function to refresh tokens proactively
export async function refreshTokens() {
  const user = sessionStorage.getItem("user");
  if (!user) {
    throw new Error("No user session found");
  }

  let parsedUser;
  try {
    parsedUser = JSON.parse(user);
  } catch (parseError) {
    console.error('Error parsing user session:', parseError);
    throw new Error("Invalid user session data");
  }

  const refresh_token = parsedUser.refresh_token;
  if (!refresh_token) {
    throw new Error("No refresh token available");
  }

  console.log('Proactively refreshing tokens...');

  try {
    const response = await fetch(`${API_URL}/user/refresh-token?refresh_token=${encodeURIComponent(refresh_token)}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        refresh_token: refresh_token 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.detail === "Invalid refresh token") {
        handle401Logout();
        throw new Error("Refresh token expired. Please log in again.");
      }
      throw new Error("Failed to refresh tokens");
    }

    const data = await response.json();
    
    if (data.access_token && data.token_type === 'bearer') {
      // Update tokens in sessionStorage
      parsedUser.access_token = data.access_token;
      if (data.refresh_token) {
        parsedUser.refresh_token = data.refresh_token;
      }
      
      sessionStorage.setItem("user", JSON.stringify(parsedUser));
      console.log('Tokens refreshed successfully');
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refresh_token
      };
    } else {
      throw new Error("Invalid token refresh response format");
    }
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    throw error;
  }
}

// Helper function to check if token is about to expire (within 5 minutes)
export function isTokenExpiringSoon(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (exp - now) < fiveMinutes;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Assume expired if we can't parse it
  }
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
    } catch (error) {
      // Ignore parsing error, will continue without token
      console.error('Error parsing user data:', error);
    }
  }

  // Proactively refresh token if it's about to expire
  if (access_token && refresh_token && isTokenExpiringSoon(access_token)) {
    try {
      console.log('Token expiring soon, refreshing proactively...');
      const newTokens = await refreshTokens();
      access_token = newTokens.access_token;
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
      // Continue with existing token, let the 401 handler deal with it if needed
    }
  }

  // Always set Authorization header if access_token exists
  if (access_token) {
    options.headers = {
      ...(options.headers || {}),
      "Authorization": `Bearer ${access_token}`,
    };
  }
  let response = await fetch(url, options);
  
  // Handle 401 Unauthorized responses
  if (response.status === 401 && refresh_token) {
    console.log('Access token expired, attempting to refresh...');
    
    // Try to refresh the access token
    try {
      const refreshRes = await fetch(`${API_URL}/user/refresh-token?refresh_token=${encodeURIComponent(refresh_token)}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          refresh_token: refresh_token 
        })
      });
      
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        console.log('Token refresh successful');
        
        // Validate response structure
        if (refreshData.access_token && refreshData.token_type === 'bearer') {
          // Update sessionStorage with new tokens
          const userObj = JSON.parse(sessionStorage.getItem("user"));
          userObj.access_token = refreshData.access_token;
          
          // Update refresh token if provided
          if (refreshData.refresh_token) {
            userObj.refresh_token = refreshData.refresh_token;
          }
          
          sessionStorage.setItem("user", JSON.stringify(userObj));
          console.log('Tokens updated in sessionStorage');
          
          // Retry original request with new access token
          options.headers = {
            ...(options.headers || {}),
            "Authorization": `Bearer ${refreshData.access_token}`,
          };
          
          console.log('Retrying original request with new token');
          response = await fetch(url, options);
          
          // Return the response from the retry
          return response;
        } else {
          console.error('Invalid token refresh response format:', refreshData);
          throw new Error('Invalid token refresh response');
        }
      } else {
        // Handle refresh token failure
        const errorData = await refreshRes.json().catch(() => ({}));
        console.error('Token refresh failed:', errorData);
        
        if (errorData.detail === "Invalid refresh token") {
          console.log('Refresh token is invalid or expired');
        }
        throw new Error('Token refresh failed');
      }
    } catch (err) {
      console.error('Error during token refresh:', err);
      // If refresh fails, log out user
      handle401Logout();
      throw new Error("Session expired. Please log in again.");
    }
  }
  return response;
}

export { AuthProvider, useAuth }