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
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { t } from "@/utils/translations"
import { GoogleLoginButton } from "@/components/GoogleLoginButton"

export function SignUpForm({ className, ...props }) {
  const { updateLoginState } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null) // Clear any previous errors

    try {
      const response = await fetch(`${API_URL}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName, phone, city }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || t('signup.errors.serverError'))
      }

      const data = await response.json()
      console.log("Sign up successful:", data)
      localStorage.setItem("user", JSON.stringify(data))
      await updateLoginState() // Trigger login state update and admin check
      // alert("Sign up successful!")
      navigate("/food")
    } catch (err) {
      console.error("Error during sign up:", err)
      setError(err.message || t('signup.errors.serverError'))
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Добре дошли в Pantastic Палачинки</CardTitle>
          <CardDescription>
            Регистрирайте се с вашия Google акаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <GoogleLoginButton />
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border py-4">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Или продължете с
              </span>
            </div>
            <div className="grid gap-6 ">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-6 ">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">{t('signup.firstNameLabel')}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t('signup.firstNamePlaceholder')}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">{t('signup.lastNameLabel')}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={t('signup.lastNamePlaceholder')}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* City */}
              <div className="grid gap-3">
                <Label htmlFor="city">{t('signup.cityLabel')}</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder={t('signup.cityPlaceholder')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="grid gap-3">
                <Label htmlFor="phone">{t('signup.phoneLabel')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('signup.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="grid gap-3">
                <Label htmlFor="email">{t('signup.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('signup.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="grid gap-3">
                <Label htmlFor="password">{t('signup.passwordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('signup.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full">
                {t('signup.signUpButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        Чрез регистрация, вие се съгласявате с нашите <a href="#">Условия за ползване</a>{" "}
        и <a href="#">Политика за поверителност</a>.
      </div>
    </div>
  )
}
