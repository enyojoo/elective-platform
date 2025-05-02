"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { AuthLanguageSwitcher } from "@/app/auth/components/auth-language-switcher"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })

      if (error) {
        setError(error.message)
        toast({
          title: t("auth.forgotPassword.errorMessage"),
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsSubmitted(true)
      }
    } catch (err) {
      console.error("Password reset error:", err)
      setError(t("auth.forgotPassword.errorMessage"))
      toast({
        title: t("auth.forgotPassword.errorMessage"),
        description: String(err),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4">
        <AuthLanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="ElectivePRO Logo"
            width={160}
            height={45}
            className="h-10 w-auto"
          />
          {!isSubmitted ? (
            <>
              <h2 className="mt-6 text-3xl font-bold tracking-tight">{t("auth.forgotPassword.title")}</h2>
              <p className="mt-2 text-sm text-gray-600">{t("auth.forgotPassword.description")}</p>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-3xl font-bold tracking-tight">{t("auth.forgotPassword.checkEmail")}</h2>
              <p className="mt-2 text-sm text-gray-600">
                {t("auth.forgotPassword.resetLinkSent").replace("{email}", email)}
              </p>
              <p className="mt-2 text-sm text-gray-600">{t("auth.forgotPassword.checkEmailInstructions")}</p>
            </>
          )}
        </div>

        {!isSubmitted ? (
          <div className="mt-8">
            <div className="rounded-md shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="sr-only">
                    {t("auth.common.email")}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.common.email")}
                    className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                {error && <div className="text-sm text-red-500">{error}</div>}

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isLoading ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendResetLink")}
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div className="text-sm">
                <Link href="/admin/login" className="font-medium text-blue-600 hover:text-blue-500">
                  {t("auth.forgotPassword.backToLogin")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-center">
            <div className="text-sm">
              <Link href="/admin/login" className="font-medium text-blue-600 hover:text-blue-500">
                {t("auth.forgotPassword.backToLogin")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
