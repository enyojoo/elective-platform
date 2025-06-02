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
import { useToast } from "@/components/ui/use-toast"
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
  const { toast } = useToast()
  const { institution, isLoading: institutionLoading, isSubdomainAccess, DEFAULT_LOGO_URL } = useInstitution()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Update the handleLogin function to handle missing profiles
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    console.log("Student Login: Attempting login...")

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("Student Login: Supabase auth error:", authError.message)
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.session && authData.user) {
        console.log("Student Login: Supabase auth successful, session created for user:", authData.user.id)

        const response = await fetch("/api/auth/check-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.session.access_token}`,
          },
          body: JSON.stringify({ userId: authData.user.id }),
        })

        console.log("Student Login: Role check API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse role check error response" }))
          console.error("Student Login: Role check API error:", errorData)
          setError(errorData.error || "Failed to verify user role. Please try again.")
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        const { role, institutionId: userInstitutionId } = await response.json() // Expect institutionId too
        console.log("Student Login: Role received from API:", role, "Institution ID:", userInstitutionId)

        if (role !== "student") {
          console.error("Student Login: Role mismatch. Expected 'student', got:", role)
          setError("You do not have student access.")
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        // If accessed via subdomain, check if student belongs to this institution
        if (isSubdomainAccess && institution && userInstitutionId !== institution.id) {
          console.error(
            "Student Login: Institution mismatch. Subdomain institution:",
            institution.id,
            "User's institution:",
            userInstitutionId,
          )
          setError("You don't have access to this institution's student portal.")
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        toast({
          title: "Login successful",
          description: "Welcome to the student dashboard",
        })
        console.log("Student Login: Redirecting to /student/dashboard...")
        router.push("/student/dashboard")
      } else {
        console.error("Student Login: Supabase auth returned no error, but no session or user data.")
        setError("Login failed: Could not establish a session. Please try again.")
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error("Student Login: An unexpected error occurred during login:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  // Remove loading indicator - render the page immediately

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          {institution?.logo_url ? (
            <Image
              src={institution.logo_url || "/placeholder.svg"}
              alt={`${institution.name} Logo`}
              width={160}
              height={45}
              className="h-10 w-auto"
              priority
            />
          ) : (
            <Image
              src={DEFAULT_LOGO_URL || "/placeholder.svg"}
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
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
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
