"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/app/actions/auth"
import Link from "next/link"
import { AuthLanguageSwitcher } from "@/app/auth/components/auth-language-switcher"
import { useLanguage } from "@/lib/language-context"
import { DynamicBranding } from "@/components/dynamic-branding"

export default function StudentLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()

  const handleSignIn = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    // The server action will handle success by redirecting.
    // We only need to handle the case where it returns an error.
    const result = await signIn(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
    // No need for a success case, as the redirect will take over.
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="w-full max-w-md p-4">
        <form action={handleSignIn}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <DynamicBranding />
              </div>
              <CardTitle className="text-2xl">{t("student.login.title")}</CardTitle>
              <CardDescription>{t("student.login.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("student.login.email")}</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("student.login.password")}</Label>
                  <Link
                    href="/student/forgot-password"
                    prefetch={false}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t("student.login.forgotPassword")}
                  </Link>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("student.login.loading") : t("student.login.submit")}
              </Button>
            </CardContent>
          </Card>
        </form>
        <div className="mt-4 text-center text-sm">
          {t("student.login.noAccount")}{" "}
          <Link href="/student/signup" className="underline">
            {t("student.login.signUp")}
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <AuthLanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
