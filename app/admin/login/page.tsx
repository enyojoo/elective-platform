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
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"

export default function InstitutionLoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { isSubdomainAccess, defaultLogoUrl } = useInstitution()

  // Ensure this page is only accessed via main domain
  useEffect(() => {
    if (isSubdomainAccess) {
      // If accessed via subdomain, redirect to student login
      window.location.href = window.location.href.replace("/admin/login", "/student/login")
    }
  }, [isSubdomainAccess])

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Update the handleSubmit function to use the admin API endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.session) {
        // Use a server API endpoint to check the role instead of direct query
        const response = await fetch("/api/auth/check-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.session.access_token}`,
          },
          body: JSON.stringify({ userId: authData.session.user.id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to verify user role")
        }

        const { role } = await response.json()

        if (role !== "admin") {
          await supabase.auth.signOut()
          setError("You do not have admin access")
          return
        }

        toast({
          title: t("auth.login.success"),
          description: t("auth.login.welcomeBack"),
        })
        router.push("/admin/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubdomainAccess) {
    return null // Don't render anything while redirecting
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
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
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
