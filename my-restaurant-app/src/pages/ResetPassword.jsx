import { PasswordResetConfirmForm } from "@/components/password-reset-confirm-form"
import { t } from "@/utils/translations"
import { useSearchParams } from "react-router-dom"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full flex items-center justify-center overflow-x-hidden">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center w-full">
        <div className="w-full max-w-sm space-y-6 mx-auto px-4">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('passwordReset.pageTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('passwordReset.pageSubtitle')}
            </p>
          </div>
          <PasswordResetConfirmForm token={token} />
        </div>
      </div>
    </div>
  )
}
