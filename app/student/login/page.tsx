"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"
// import { useToast } from "@/components/ui/use-toast" // Toast on successful login might be removed due to redirect
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { t } = useLanguage()
  // const { toast } = useToast()
  const { institution, isLoading: institutionLoading, DEFAULT_LOGO_URL } = useInstitution() // Removed isSubdomainAccess as middleware handles domain enforcement

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        // Successfully signed in with Supabase.
        // Refresh the page. Middleware will handle redirect to dashboard.
        router.refresh()
        // setIsLoading(false) // No need to set loading to false, page will refresh/redirect
      } else {
        setError("Login failed. Please try again.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.") // More generic error
      setIsLoading(false)
    }
  }

  // Show loading state for institution data, or a fallback if it's critical for display before login
  if (institutionLoading && typeof window !== "undefined" && window.location.hostname !== "localhost") {
    // Avoid SSR flash for institution loading if applicable
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <div>Loading institution details...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          {institution?.logo_url ? (
            <Image
              src={institution.logo_url || "/placeholder.svg"}
              alt={`${institution.name || "Institution"} Logo`}
              width={160}
              height={45}
              className="h-10 w-auto"
              priority
            />
          ) : (
            <Image
              src={DEFAULT_LOGO_URL || "/placeholder.svg"} // Ensure DEFAULT_LOGO_URL is defined and exported from context or provide a fallback
              alt="ElectivePRO Logo"
              width={160}
              height={45}
              className="h-10 w-auto"
              priority
            />
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("auth.login.title")}</CardTitle>
            <CardDescription>
              {institution ? `${t("auth.login.description")} - ${institution.name}` : t("auth.login.description")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.login.password")}</Label>
                  <Link href="/student/forgot-password" className="text-xs text-primary hover:underline">
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || institutionLoading}>
                {isLoading ? t("auth.login.loading") : t("auth.login.button")}
              </Button>
              <div className="text-center text-sm">
                {t("auth.login.noAccount")}{" "}
                <Link href="/student/signup" className="text-primary hover:underline">
                  {t("auth.login.signUp")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        <div className="flex justify-center mt-8">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
