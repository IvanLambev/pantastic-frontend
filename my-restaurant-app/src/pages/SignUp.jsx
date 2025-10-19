import { GalleryVerticalEnd } from "lucide-react"
import { SignUpForm } from "@/components/sign-up-form"
import { t } from "@/utils/translations"

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex items-center justify-center overflow-x-hidden">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center w-full">
        <div className="w-full max-w-sm space-y-12 mx-auto px-4">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('signup.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('signup.subtitle')}
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}