import { GalleryVerticalEnd } from "lucide-react"
import { SignUpForm } from "@/components/sign-up-form"

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background min-w-[100vw] flex items-center justify-center">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-sm space-y-6 mx-auto px-4">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign Up for Pantastic
            </h1>
            <p className="text-sm text-muted-foreground">
              Create your account to get started
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}
