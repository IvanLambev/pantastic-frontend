import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { API_URL } from '@/config/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { t } from "@/utils/translations"
import { useNavigate } from "react-router-dom"

export function PasswordResetConfirmForm({ className, token }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenEmail, setTokenEmail] = useState("")
  const navigate = useNavigate()

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError(t('passwordReset.errors.noToken'))
        setIsValidating(false)
        return
      }

      try {
        const response = await fetch(`${API_URL}/user/password-reset/validate?token=${token}`, {
          method: "POST",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || t('passwordReset.errors.invalidToken'))
        }

        const data = await response.json()
        setTokenValid(true)
        setTokenEmail(data.email || "")
      } catch (err) {
        console.error("Error validating token:", err)
        setError(err.message || t('passwordReset.errors.invalidToken'))
        setTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError(t('passwordReset.errors.passwordMismatch'))
      return
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError(t('signup.errors.passwordTooShort'))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/user/password-reset/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      })

      const contentType = response.headers.get("Content-Type")

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.message || t('passwordReset.errors.resetFailed'))
        } else {
          const errorText = await response.text()
          throw new Error(errorText || t('passwordReset.errors.resetFailed'))
        }
      }

      // Success
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)
      
    } catch (err) {
      console.error("Error during password reset:", err)
      setError(err.message || t('passwordReset.errors.serverError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('passwordReset.validatingToken')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl">{t('passwordReset.invalidTokenTitle')}</CardTitle>
            <CardDescription>
              {error || t('passwordReset.errors.invalidToken')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate("/forgot-password")}
              >
                {t('passwordReset.requestNew')}
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate("/login")}
              >
                {t('passwordReset.backToLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-xl">{t('passwordReset.successTitle')}</CardTitle>
            <CardDescription>
              {t('passwordReset.successMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t('passwordReset.redirecting')}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Reset password form
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('passwordReset.resetTitle')}</CardTitle>
          <CardDescription>
            {t('passwordReset.resetDescription')} {tokenEmail && <strong>{tokenEmail}</strong>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="newPassword">{t('passwordReset.newPasswordLabel')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('passwordReset.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  {t('signup.passwordHelper')}
                </p>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">{t('passwordReset.confirmPasswordLabel')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('passwordReset.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('passwordReset.resetting') : t('passwordReset.resetButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
