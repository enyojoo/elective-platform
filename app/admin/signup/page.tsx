"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import Image from "next/image"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/components/ui/use-toast"

export default function InstitutionSignupPage() {
  const { t } = useLanguage()
  const [institutionName, setInstitutionName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate subdomain format
      if (!/^[a-z0-9]+$/.test(subdomain)) {
        throw new Error(t("admin.signup.invalidSubdomain"))
      }

      // Use API endpoint to create institution and admin
      const response = await fetch("/api/auth/signup-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institutionName,
          subdomain,
          adminEmail,
          adminPassword,
          fullName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Signup failed")
      }

      toast({
        title: t("admin.signup.success"),
        description: t("admin.signup.successMessage"),
      })

      // Redirect to login page
      router.push("/admin/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.signup.error"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-background">
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
            <CardTitle>{t("admin.signup.title")}</CardTitle>
            <CardDescription>{t("admin.signup.description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionName">{t("admin.signup.institutionName")}</Label>
                <Input
                  id="institutionName"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">{t("admin.signup.subdomain")}</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    required
                    className="rounded-r-none"
                  />
                  <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md">.electivepro.net</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t("admin.signup.fullName")}</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">{t("admin.signup.adminEmail")}</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">{t("admin.signup.adminPassword")}</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("admin.signup.creating") : t("admin.signup.button")}
              </Button>

              <p className="text-sm text-center">
                {t("admin.signup.hasAccount")}{" "}
                <Link href="/admin/login" className="text-primary hover:underline">
                  {t("admin.signup.login")}
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
