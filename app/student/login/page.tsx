"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AuthLanguageSwitcher } from "../../auth/components/auth-language-switcher"
import { useLanguage } from "@/lib/language-context"

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo purposes, we'll just redirect to student dashboard
    // In a real app, you would validate credentials against Supabase
    if (email.endsWith("@student.spbu.ru")) {
      router.push("/student/dashboard")
    } else {
      // Default to student dashboard for any email
      router.push("/student/dashboard")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="ElectivePRO Logo"
            width={160}
            height={45}
            className="h-10 w-auto"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("auth.login.title")}</CardTitle>
            <CardDescription>{t("auth.login.description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("auth.login.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder=""
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("auth.login.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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
                  onClick={() => router.push("/student/dashboard")}
                  type="button"
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
          <AuthLanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
