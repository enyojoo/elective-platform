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

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const { institution, isLoading: institutionLoading, isSubdomainAccess } = useInstitution()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // REMOVED: The redirect to main domain - this was causing the issue
  // We want to allow access to student login from subdomains

  // Update the handleLogin function to handle missing profiles
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.session) {
        // Use a server API endpoint to check the role instead of direct query
        const response = await fetch("/api/auth/check-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ userId: data.session.user.id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to verify user role")
        }

        const { role, institutionId } = await response.json()

        if (role === "student") {
          // If accessed via subdomain, check if student belongs to this institution
          if (isSubdomainAccess && institution && institutionId !== institution.id) {
            await supabase.auth.signOut()
            setError("You don't have access to this institution")
          } else {
            toast({
              title: "Login successful",
              description: "Welcome to the student dashboard",
            })
            router.push("/student/dashboard")
          }
        } else {
          // User is authenticated but not a student
          await supabase.auth.signOut()
          setError("You do not have student access")
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (institutionLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-6">
          {institution?.logo_url ? (
            <Image
              src={institution.logo_url || "/placeholder.svg"}
              alt={`${institution.name} Logo`}
              width={160}
              height={45}
              className="h-10 w-auto"
            />
          ) : (
            <Image
              src="/images/elective-pro-logo.svg"
              alt="ElectivePRO Logo"
              width={160}
              height={45}
              className="h-10 w-auto"
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
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="text-sm text-right">
                <Link href="/student/forgot-password" className="text-primary hover:underline">
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("auth.login.loading") : t("auth.login.button")}
              </Button>
              <div className="mt-4 text-center text-sm">
                {t("auth.login.noAccount")}{" "}
                <Link href="/student/signup" className="text-primary hover:underline">
                  {t("auth.login.signUp")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        <div className="flex justify-center mt-4">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
