import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage({ updateLoginState }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-bold text-2xl">
          Pantastic Inc.
        </a>
        <LoginForm updateLoginState={updateLoginState} />
      </div>
    </div>
  )
}