import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "@/config/api"
import { toast } from "sonner"
import { ArrowLeft, Mail, Lock, User, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { GoogleLoginButton } from "@/components/GoogleLoginButton"
import { t } from "@/utils/translations"

export default function CheckoutLogin() {
  const navigate = useNavigate()
  
  // Login states
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  
  // Guest checkout states
  const [guestData, setGuestData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    city: ""
  })
  const [guestLoading, setGuestLoading] = useState(false)
  const [guestError, setGuestError] = useState("")

  // Check if user is already logged in and redirect
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isLoggedIn = !!(user?.access_token || user?.customer_id)
    
    if (isLoggedIn) {
      navigate('/checkout-v2', { replace: true })
    }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!loginData.email || !loginData.password) {
      setLoginError(t('login.fillAllFields'))
      return
    }

    setLoginLoading(true)
    setLoginError("")

    try {
      const formData = new URLSearchParams()
      formData.append('username', loginData.email)
      formData.append('password', loginData.password)

      const response = await fetch(`${API_URL}/user/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || t('login.invalidCredentials'))
      }

      const data = await response.json()
      
      if (!data.access_token) {
        throw new Error(t('login.loginFailed'))
      }

      // Get user profile
      const profileResponse = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        },
        credentials: 'include'
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        localStorage.setItem('user', JSON.stringify({
          ...data,
          ...profileData
        }))
      } else {
        localStorage.setItem('user', JSON.stringify(data))
      }

      toast.success(t('login.loginSuccess'))
      navigate('/checkout-v2')
    } catch (error) {
      console.error('Login error:', error)
      setLoginError(error.message || t('login.loginFailed'))
    } finally {
      setLoginLoading(false)
    }
  }

  const handleGuestCheckout = async (e) => {
    e.preventDefault()
    
    // Validate guest data
    if (!guestData.email || !guestData.first_name || !guestData.last_name || 
        !guestData.phone || !guestData.city) {
      setGuestError(t('checkout.guest.allFieldsRequired'))
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestData.email)) {
      setGuestError(t('checkout.guest.invalidEmail'))
      return
    }

    // Phone validation (Bulgarian format)
    const phoneRegex = /^\+359\d{9}$/
    if (!phoneRegex.test(guestData.phone)) {
      setGuestError(t('checkout.guest.invalidPhone'))
      return
    }

    setGuestLoading(true)
    setGuestError("")

    try {
      // Create a temporary guest session
      // Store guest data in sessionStorage for the checkout process
      sessionStorage.setItem('guest_checkout_data', JSON.stringify(guestData))
      
      toast.success(t('checkout.guest.proceedingAsGuest'))
      navigate('/checkout-v2')
    } catch (error) {
      console.error('Guest checkout error:', error)
      setGuestError(error.message || t('checkout.guest.guestCheckoutFailed'))
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate('/cart')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t('checkout.signInOrContinue')}</h1>
              <p className="text-muted-foreground">{t('checkout.signInForFasterCheckout')}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Sign In */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.signInForFasterCheckout')}</CardTitle>
                  <CardDescription>{t('checkout.signInDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Google Sign In */}
                  <GoogleLoginButton 
                    onSuccess={() => navigate('/checkout-v2')}
                    className="w-full"
                  />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
                    </div>
                  </div>

                  {/* Email/Password Login */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('login.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder={t('login.emailPlaceholder')}
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="pl-10"
                          disabled={loginLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t('login.password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder={t('login.passwordPlaceholder')}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="pl-10"
                          disabled={loginLoading}
                        />
                      </div>
                    </div>

                    {loginError && (
                      <p className="text-sm text-red-600">{loginError}</p>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('login.signingIn')}
                        </div>
                      ) : (
                        t('nav.login')
                      )}
                    </Button>
                  </form>

                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">{t('login.noAccount')} </span>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-semibold"
                      onClick={() => navigate('/signup', { state: { from: '/checkout-login' } })}
                    >
                      {t('nav.signup')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vertical Separator */}
            <Separator orientation="vertical" className="hidden lg:block absolute left-1/2 top-0 bottom-0 h-full" />

            {/* Right Column - Guest Checkout */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.guestCheckout')}</CardTitle>
                  <CardDescription>{t('checkout.guestCheckoutDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGuestCheckout} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="guest-email">{t('checkout.guest.email')} *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="guest-email"
                          type="email"
                          placeholder={t('checkout.guest.emailPlaceholder')}
                          value={guestData.email}
                          onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                          className="pl-10"
                          disabled={guestLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest-first-name">{t('checkout.guest.firstName')} *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="guest-first-name"
                            placeholder={t('checkout.guest.firstNamePlaceholder')}
                            value={guestData.first_name}
                            onChange={(e) => setGuestData({ ...guestData, first_name: e.target.value })}
                            className="pl-10"
                            disabled={guestLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="guest-last-name">{t('checkout.guest.lastName')} *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="guest-last-name"
                            placeholder={t('checkout.guest.lastNamePlaceholder')}
                            value={guestData.last_name}
                            onChange={(e) => setGuestData({ ...guestData, last_name: e.target.value })}
                            className="pl-10"
                            disabled={guestLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guest-phone">{t('checkout.guest.phone')} *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="guest-phone"
                          type="tel"
                          placeholder={t('checkout.guest.phonePlaceholder')}
                          value={guestData.phone}
                          onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                          className="pl-10"
                          disabled={guestLoading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{t('checkout.guest.phoneFormat')}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guest-city">{t('checkout.guest.city')} *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="guest-city"
                          placeholder={t('checkout.guest.cityPlaceholder')}
                          value={guestData.city}
                          onChange={(e) => setGuestData({ ...guestData, city: e.target.value })}
                          className="pl-10"
                          disabled={guestLoading}
                        />
                      </div>
                    </div>

                    {guestError && (
                      <p className="text-sm text-red-600">{guestError}</p>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={guestLoading}
                    >
                      {guestLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('checkout.processing')}
                        </div>
                      ) : (
                        t('checkout.continueAsGuest')
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
