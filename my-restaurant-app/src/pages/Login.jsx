import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage({ updateLoginState }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background min-w-[100vw] flex items-center justify-center">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-sm space-y-6 mx-auto px-4">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login to Pantastic
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>
          <LoginForm updateLoginState={updateLoginState} />
        </div>
      </div>
    </div>
  )
}