import { useState } from "react"
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
import { CheckCircle2, Mail } from "lucide-react"
import { t } from "@/utils/translations"

export function PasswordResetRequestForm({ className }) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/user/password-reset/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const contentType = response.headers.get("Content-Type")

      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.message || t('passwordReset.errors.requestFailed'))
        } else {
          const errorText = await response.text()
          throw new Error(errorText || t('passwordReset.errors.requestFailed'))
        }
      }

      // Success - show success message
      setSuccess(true)
      
    } catch (err) {
      console.error("Error during password reset request:", err)
      setError(err.message || t('passwordReset.errors.serverError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-xl">{t('passwordReset.checkEmail')}</CardTitle>
            <CardDescription>
              {t('passwordReset.emailSent')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {t('passwordReset.emailInstructions')}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSuccess(false)
                  setEmail("")
                }}
              >
                {t('passwordReset.sendAnother')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('passwordReset.title')}</CardTitle>
          <CardDescription>
            {t('passwordReset.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">{t('login.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('passwordReset.sending') : t('passwordReset.sendButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        {t('passwordReset.rememberPassword')}{" "}
        <a href="/login" className="underline">{t('passwordReset.backToLogin')}</a>
      </div>
    </div>
  )
}
