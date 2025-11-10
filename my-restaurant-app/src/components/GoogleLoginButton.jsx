import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { t } from "@/utils/translations"
import { authenticateWithGoogle } from "@/utils/apiClient"

export function GoogleLoginButton({ className = "", onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const { updateLoginState } = useAuth()
  const navigate = useNavigate()

  // Check if Google OAuth is configured
  const isGoogleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID && 
                             import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here'

  if (!isGoogleConfigured) {
    console.warn('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.')
  }

  const googleLogin = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/user.phonenumbers.read https://www.googleapis.com/auth/user.addresses.read",
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      
      try {
        // Use the new API client for Google authentication
        await authenticateWithGoogle(tokenResponse.access_token)
        
        // Update auth state
        await updateLoginState()
        
        // Show success message
        toast.success(t('login.googleLoginSuccess') || 'Successfully logged in with Google!')
        
        // Call custom onSuccess callback if provided, otherwise redirect to /food
        if (onSuccess) {
          onSuccess()
        } else {
          navigate('/food')
        }
        
      } catch (error) {
        console.error('Google login error:', error)
        toast.error(error.message || t('login.errors.googleLoginFailed') || 'Google login failed')
      } finally {
        setIsLoading(false)
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error)
      toast.error(t('login.errors.googleLoginFailed') || 'Google login failed')
      setIsLoading(false)
    }
  })

  const handleClick = () => {
    if (!isGoogleConfigured) {
      toast.error('Google OAuth is not configured')
      return
    }
    googleLogin()
  }

  return (
    <Button 
      variant="outline" 
      className={`w-full ${className}`}
      onClick={handleClick}
      disabled={isLoading || !isGoogleConfigured}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Влизане...</span>
        </div>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Вход с Google
        </>
      )}
    </Button>
  )
}