import { GalleryVerticalEnd } from "lucide-react"
import { SignUpForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-sm space-y-6">
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
