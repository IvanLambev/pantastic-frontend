import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { t } from "@/utils/translations"

export default function LoginPage({ updateLoginState }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex items-center justify-center overflow-x-hidden">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center w-full">
        <div className="w-full max-w-sm space-y-6 mx-auto px-4">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('login.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('login.subtitle')}
            </p>
          </div>
          <LoginForm updateLoginState={updateLoginState} />
        </div>
      </div>
    </div>
  )
}