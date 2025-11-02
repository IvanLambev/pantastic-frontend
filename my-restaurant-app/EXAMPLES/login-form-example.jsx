/**
 * Example Updated Login Form using Cookie Authentication
 * 
 * This is an example showing how to update login-form.jsx
 * to use the new cookie-based authentication
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/utils/cookieAuth'
import { useAuth } from '@/context/AuthContext'

export function LoginFormExample() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { updateLoginState } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Login using cookie authentication
      // Backend will set HttpOnly cookies automatically
      await login(email, password)
      
      // Update auth context to reflect logged-in state
      await updateLoginState()
      
      // Redirect to dashboard or home
      navigate('/dashboard')
      
      console.log('✅ Login successful - authenticated via HttpOnly cookies')
    } catch (err) {
      console.error('Login failed:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
          disabled={isLoading}
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

/**
 * Key Changes from Old Implementation:
 * 
 * 1. Import login from cookieAuth instead of using fetch directly
 * 2. No need to manually store tokens in sessionStorage
 * 3. Call updateLoginState() after successful login
 * 4. Backend sets HttpOnly cookies automatically
 * 5. No token management in frontend code
 */
