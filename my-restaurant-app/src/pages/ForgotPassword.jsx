import { PasswordResetRequestForm } from "@/components/password-reset-request-form"
import { t } from "@/utils/translations"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex items-center justify-center overflow-x-hidden">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center w-full">
        <div className="w-full max-w-sm space-y-6 mx-auto px-4">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('passwordReset.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('passwordReset.subtitle')}
            </p>
          </div>
          <PasswordResetRequestForm />
        </div>
      </div>
    </div>
  )
}
