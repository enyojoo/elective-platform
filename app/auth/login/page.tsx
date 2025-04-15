"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AuthLanguageSwitcher } from "../components/auth-language-switcher"
import { useLanguage } from "@/lib/language-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { t, language } = useLanguage()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would validate and authenticate here
    // For demo purposes, we'll just redirect based on email domain

    if (email.endsWith("@student.spbu.ru")) {
      router.push("/student/dashboard")
    } else if (email.endsWith("@gsom.spbu.ru") && email.includes("manager")) {
      router.push("/manager/dashboard")
    } else if (email.endsWith("@gsom.spbu.ru") && email.includes("admin")) {
      router.push("/admin/dashboard")
    } else {
      // Default to student dashboard for demo
      router.push("/student/dashboard")
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-6">
          <Image
            src={language === "ru" ? "/images/gsom-logo-ru.png" : "/images/gsom-logo-en.png"}
            alt="GSOM Logo"
            width={200}
            height={60}
            className="h-12 w-auto"
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
                  placeholder="email@student.spbu.ru"
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
              <Button type="submit" className="w-full">
                {t("auth.login.button")}
              </Button>
              <div className="text-sm text-center text-muted-foreground">{t("auth.login.demoText")}</div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push("/student/dashboard")}
                  type="button"
                >
                  {t("auth.login.studentDemo")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push("/manager/dashboard")}
                  type="button"
                >
                  {t("auth.login.managerDemo")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push("/admin/dashboard")}
                  type="button"
                >
                  {t("auth.login.adminDemo")}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                {t("auth.login.noAccount")}{" "}
                <Link href="/auth/signup" className="text-primary hover:underline">
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
