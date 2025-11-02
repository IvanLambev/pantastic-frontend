import { API_URL } from '@/config/api'

/**
 * Enhanced API client that handles authentication and token refresh automatically
 * This replaces manual fetch calls with proper token management
 */

// Get current user and tokens from sessionStorage
function getCurrentUser() {
  try {
    const user = sessionStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

// Store updated user data in sessionStorage
function storeUserData(userData) {
  sessionStorage.setItem('user', JSON.stringify(userData))
}

// Clear user data and redirect to login
function clearUserAndRedirect() {
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('isAdmin')
  window.location.href = '/login'
}

// Refresh access token using HttpOnly refresh cookie
async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_URL}/user/refresh-token`, {
      method: 'POST',
      credentials: 'include', // Send HttpOnly refresh_token cookie
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    console.log('✅ Token refreshed successfully')
    
    // Backend sets new HttpOnly cookies, we just need to verify success
    // No need to store tokens in sessionStorage anymore
    return true
  } catch (error) {
    console.error('❌ Token refresh failed:', error)
    clearUserAndRedirect()
    throw error
  }
}

/**
 * Main API client function - USE THIS for all authenticated requests
 * Automatically handles token refresh and authentication
 */
export async function makeAuthenticatedRequest(url, options = {}) {
  const user = getCurrentUser()
  
  console.log('🔍 makeAuthenticatedRequest - user:', user)
  
  // Check for either customer_id (new cookie auth) or access_token (old token auth)
  if (!user?.customer_id && !user?.access_token) {
    console.error('❌ No customer_id or access_token found in sessionStorage')
    throw new Error('No authentication found')
  }

  if (user?.customer_id) {
    console.log('✅ customer_id found:', user.customer_id)
  } else {
    console.log('⚠️ Using access_token (legacy mode):', user.access_token?.substring(0, 20) + '...')
  }

  // Build full URL if relative path provided
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`
  
  // Prepare headers with credentials
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Make the request with cookies
  let response = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers
  })

  // Handle 401 Unauthorized - token expired
  if (response.status === 401) {
    try {
      console.log('🔄 Access token expired, attempting refresh...')
      await refreshAccessToken()
      
      // Retry the request with new cookie
      response = await fetch(fullUrl, {
        ...options,
        credentials: 'include',
        headers
      })
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError)
      clearUserAndRedirect()
      throw new Error('Authentication expired. Please log in again.')
    }
  }

  return response
}

/**
 * Convenience methods for common HTTP operations
 * All methods return parsed JSON data, not raw responses
 */
export const api = {
  // GET request
  get: async (url, options = {}) => {
    const response = await makeAuthenticatedRequest(url, {
      method: 'GET',
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  // POST request
  post: async (url, data, options = {}) => {
    const response = await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  // PUT request
  put: async (url, data, options = {}) => {
    const response = await makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  // DELETE request
  delete: async (url, options = {}) => {
    const response = await makeAuthenticatedRequest(url, {
      method: 'DELETE',
      ...options
    })
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  },

  // PATCH request
  patch: async (url, data, options = {}) => {
    const response = await makeAuthenticatedRequest(url, {
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

/**
 * Google OAuth authentication flow
 */
export async function authenticateWithGoogle(googleAccessToken) {
  try {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: googleAccessToken
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Google authentication failed')
    }

    const authData = await response.json()
    
    // Store backend JWT tokens (NOT Google tokens)
    storeUserData(authData)
    
    console.log('✅ Successfully authenticated with Google and stored backend JWT tokens')
    return authData
    
  } catch (error) {
    console.error('Google authentication failed:', error)
    throw error
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const user = getCurrentUser()
  return !!(user?.customer_id)
}

/**
 * Get current customer ID
 */
export function getCustomerId() {
  const user = getCurrentUser()
  return user?.customer_id || null
}

/**
 * Logout user
 */
export function logout() {
  clearUserAndRedirect()
}