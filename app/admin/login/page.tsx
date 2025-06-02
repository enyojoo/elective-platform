"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context" // Keep for potential future use, though admin is main domain
import { createClient } from "@supabase/supabase-js"
// import { useToast } from "@/hooks/use-toast" // Toast on successful login might be removed due to redirect
import { Eye, EyeOff } from "lucide-react"

export default function InstitutionLoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  // const { toast } = useToast() // Toasts on login page might be lost due to refresh/redirect
  const { isSubdomainAccess } = useInstitution()

  useEffect(() => {
    if (isSubdomainAccess) {
      // This should ideally be caught by middleware, but as a fallback
      window.location.href = window.location.href.replace("/admin/login", "/student/login") // Or redirect to main domain admin login
    }
  }, [isSubdomainAccess])

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.session) {
        // Successfully signed in with Supabase.
        // Refresh the page. Middleware will handle redirect to dashboard.
        router.refresh()
        // setIsLoading(false) // No need to set loading to false, page will refresh/redirect
      } else {
        // Fallback if no session and no error (should be rare)
        setError("Login failed. Please try again.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.") // More generic error
      setIsLoading(false)
    }
  }

  if (isSubdomainAccess) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-6">
          <Image
            src="https://pbqvvvdhssghkpvsluvw.supabase.co/storage/v1/object/public/logos//epro_logo.svg"
            alt="ElectivePRO Logo"
            width={160}
            height={45}
            className="h-10 w-auto"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.login.title")}</CardTitle>
            <CardDescription>{t("admin.login.description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("admin.login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("admin.login.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="text-sm text-right">
                <Link href="/admin/forgot-password" className="text-primary hover:underline">
                  {t("admin.login.forgotPassword")}
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("admin.login.loggingIn") : t("admin.login.button")}
              </Button>

              <p className="text-sm text-center">
                {t("admin.login.noAccount")}{" "}
                <Link href="/admin/signup" className="text-primary hover:underline">
                  {t("admin.login.register")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        <div className="flex justify-center mt-6">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
