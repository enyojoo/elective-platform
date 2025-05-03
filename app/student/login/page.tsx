"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

  // Redirect to main domain if not accessed via subdomain
  useEffect(() => {
    if (!institutionLoading && !isSubdomainAccess) {
      // If not accessed via subdomain, redirect to the main app
      window.location.href = "https://app.electivepro.net/admin/login"
    }
  }, [institutionLoading, isSubdomainAccess])

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
        // Check if the user is a student
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, institution_id")
          .eq("id", data.session.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)

          // If the profile doesn't exist and we have an institution, create a student profile
          if (profileError.code === "PGRST116" && institution?.id) {
            const { error: insertError } = await supabase.from("profiles").insert({
              id: data.session.user.id,
              email: email,
              role: "student",
              institution_id: institution.id,
              created_at: new Date().toISOString(),
            })

            if (insertError) {
              console.error("Error creating profile:", insertError)
              await supabase.auth.signOut()
              setError("Failed to create user profile")
            } else {
              // Successfully created profile
              toast({
                title: "Login successful",
                description: "Welcome to the student dashboard",
              })
              router.push("/student/dashboard")
            }
          } else {
            await supabase.auth.signOut()
            setError("Error verifying user role: " + profileError.message)
          }
        } else if (profile && profile.role === "student") {
          // If accessed via subdomain, check if student belongs to this institution
          if (isSubdomainAccess && profile.institution_id !== institution?.id) {
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
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Demo login for development purposes
  const handleDemoLogin = async () => {
    setIsLoading(true)

    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: t("auth.login.demoSuccess"),
        description: t("auth.login.demoMessage"),
      })

      // Redirect to student dashboard
      router.push("/student/dashboard")
    } catch (error) {
      setError(t("auth.error.demoFailed"))
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
              <div className="text-sm text-center text-muted-foreground">{t("auth.login.demoText")}</div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleDemoLogin}
                  type="button"
                  disabled={isLoading}
                >
                  {t("auth.login.studentDemo")}
                </Button>
              </div>
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
