"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"

export default function ManagerLoginPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution, isLoading: institutionLoading, isSubdomainAccess } = useInstitution()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // REMOVED: The redirect to main domain - this was causing the issue
  // We want to allow access to manager login from subdomains

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
        // Check if the user is a manager
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, institution_id")
          .eq("id", data.session.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)

          // If the profile doesn't exist and we have an institution, create a manager profile
          if (profileError.code === "PGRST116" && institution?.id) {
            const { error: insertError } = await supabase.from("profiles").insert({
              id: data.session.user.id,
              email: email,
              role: "manager",
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
                description: "Welcome to the manager dashboard",
              })
              router.push("/manager/dashboard")
            }
          } else {
            await supabase.auth.signOut()
            setError("Error verifying user role: " + profileError.message)
          }
        } else if (profile && profile.role === "manager") {
          // If accessed via subdomain, check if manager belongs to this institution
          if (isSubdomainAccess && institution && profile.institution_id !== institution.id) {
            await supabase.auth.signOut()
            setError("You don't have access to this institution")
          } else {
            toast({
              title: "Login successful",
              description: "Welcome to the manager dashboard",
            })
            router.push("/manager/dashboard")
          }
        } else {
          // User is authenticated but not a manager
          await supabase.auth.signOut()
          setError("You do not have manager access")
        }
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (institutionLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>
  }

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
            />
          ) : (
            <Image
              src="/images/elective-pro-logo.svg"
              alt="Elective Pro Logo"
              width={160}
              height={45}
              className="h-10 w-auto"
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.login.managerLogin")}</CardTitle>
            <CardDescription>
              {institution
                ? `${t("auth.login.managerLoginDescription")} - ${institution.name}`
                : t("auth.login.managerLoginDescription")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="manager@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.login.password")}</Label>
                  <Link href="/manager/forgot-password" className="text-xs text-primary hover:underline">
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("auth.login.loggingIn") : t("auth.login.login")}
              </Button>
              <div className="text-center text-sm">
                {t("auth.login.noAccount")}{" "}
                <Link href="/manager/signup" className="text-primary hover:underline">
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
