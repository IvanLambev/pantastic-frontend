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

export function LoginForm({ className }) {
  const { updateLoginState } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
  
    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      const contentType = response.headers.get("Content-Type");
  
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || t('login.errors.invalidCredentials'));
        } else {
          const errorText = await response.text();
          throw new Error(errorText || t('login.errors.invalidCredentials'));
        }
      }
  
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("Login successful:", data);
        sessionStorage.setItem("user", JSON.stringify(data));
        await updateLoginState(); // Trigger login state update and admin check
        // alert("Login successful!");
        navigate("/food");
      } else {
        throw new Error(t('login.errors.serverError'));
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError(err.message || t('login.errors.serverError'));
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Добре дошли отново</CardTitle>
          <CardDescription>
            Влезте с вашия Google акаунт
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
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full">
                {t('login.loginButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        Чрез кликване върху продължи, вие се съгласявате с нашите <a href="#">Условия за ползване</a>{" "}
        и <a href="#">Политика за поверителност</a>.
      </div>
    </div>
  )
}