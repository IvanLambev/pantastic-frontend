/**
 * Cookie-based Authentication Utility
 * Handles authentication with HttpOnly cookies
 * 
 * IMPORTANT:
 * - access_token and refresh_token are stored in HttpOnly cookies by the backend
 * - Frontend CANNOT and SHOULD NOT access these tokens directly
 * - Authentication is handled automatically via cookies sent with each request
 */

import { API_URL } from '@/config/api'
import { clearAllSessionData } from './sessionStorage'

/**
 * Login with email and password
 * Backend will set HttpOnly cookies with tokens
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include cookies in request
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || 'Login failed')
    }

    const data = await response.json()
    
    // Backend has set HttpOnly cookies with tokens
    // We don't store tokens in localStorage/sessionStorage anymore
    console.log('✅ Login successful - tokens stored in HttpOnly cookies')
    
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * Logout user
 * Calls backend to clear HttpOnly cookies
 */
export async function logout() {
  try {
    const response = await fetch(`${API_URL}/user/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include cookies in request
    })

    if (!response.ok) {
      console.error('Logout request failed, but clearing local data anyway')
    }

    // Clear non-sensitive session data from localStorage
    // You may choose to keep some data like cart or delivery address
    // For now, we'll clear everything on logout
    clearAllSessionData()
    
    console.log('✅ Logout successful - cookies cleared')
    
    return true
  } catch (error) {
    console.error('Logout error:', error)
    // Clear local data even if backend call fails
    clearAllSessionData()
    throw error
  }
}

/**
 * Validate current session
 * Checks if user is authenticated by calling a protected endpoint
 */
export async function validateSession() {
  try {
    const response = await fetch(`${API_URL}/user/validate-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include cookies in request
    })

    if (response.ok) {
      const data = await response.json()
      return {
        isValid: true,
        user: data
      }
    }
    
    return {
      isValid: false,
      user: null
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      isValid: false,
      user: null
    }
  }
}

/**
 * Validate admin status
 * Checks if current user has admin privileges
 */
export async function validateAdmin() {
  try {
    const response = await fetch(`${API_URL}/user/validate-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include cookies in request
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.is_admin === true || data.is_admin === 'true' || data.is_admin === 'True'
  } catch (error) {
    console.error('Admin validation error:', error)
    return false
  }
}

/**
 * Google OAuth authentication
 * Backend will set HttpOnly cookies after successful OAuth
 */
export async function authenticateWithGoogle(googleAccessToken) {
  try {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include cookies in request
      body: JSON.stringify({
        access_token: googleAccessToken
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Google authentication failed')
    }

    const authData = await response.json()
    
    // Backend has set HttpOnly cookies with tokens
    console.log('✅ Successfully authenticated with Google - tokens stored in HttpOnly cookies')
    
    return authData
  } catch (error) {
    console.error('Google authentication failed:', error)
    throw error
  }
}

/**
 * Make authenticated API request
 * Cookies are automatically sent with each request
 * No need to manually attach Authorization header
 */
export async function fetchWithCookies(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`
  
  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include', // CRITICAL: Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  // Handle 401 Unauthorized
  if (response.status === 401) {
    console.error('❌ Authentication failed - session expired or invalid')
    // Clear local session data
    clearAllSessionData()
    // Redirect to login
    window.location.href = '/login'
    throw new Error('Authentication required. Please log in.')
  }

  return response
}

/**
 * API helper methods using cookie authentication
 */
export const cookieApi = {
  get: async (url, options = {}) => {
    const response = await fetchWithCookies(url, {
      method: 'GET',
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  post: async (url, data, options = {}) => {
    const response = await fetchWithCookies(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  put: async (url, data, options = {}) => {
    const response = await fetchWithCookies(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  delete: async (url, options = {}) => {
    const response = await fetchWithCookies(url, {
      method: 'DELETE',
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  patch: async (url, data, options = {}) => {
    const response = await fetchWithCookies(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }
}
