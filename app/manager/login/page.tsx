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
import { AuthLanguageSwitcher } from "@/app/auth/components/auth-language-switcher"

export default function ManagerLoginPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, accept any login
      console.log("Manager logged in with:", { email, password })

      toast({
        title: "Login successful",
        description: "Welcome back to the Elective Platform",
      })

      // Redirect to manager dashboard
      router.push("/manager/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: string) => {
    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Demo login successful",
        description: `Logged in as ${role}`,
      })

      // Redirect to manager dashboard
      router.push("/manager/dashboard")
    } catch (error) {
      console.error("Demo login error:", error)
      toast({
        title: "Login failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="Elective Pro Logo"
            width={160}
            height={45}
            className="h-10 w-auto"
          />
          <h1 className="text-3xl font-bold"></h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.login.managerLogin")}</CardTitle>
            <CardDescription>{t("auth.login.managerLoginDescription")}</CardDescription>
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

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("auth.login.demoAccounts")}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" onClick={() => handleDemoLogin("Program Manager")} disabled={isLoading}>
              {t("auth.login.demoManager")}
            </Button>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <AuthLanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
