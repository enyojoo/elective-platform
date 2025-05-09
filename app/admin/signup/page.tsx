"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function InstitutionSignupPage() {
  const { t } = useLanguage()
  const [institutionName, setInstitutionName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [subdomainStatus, setSubdomainStatus] = useState<"checking" | "available" | "unavailable" | "invalid" | null>(
    null,
  )
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Check subdomain availability
  useEffect(() => {
    const checkSubdomain = async () => {
      if (!subdomain || subdomain.length < 3) {
        setSubdomainStatus(null)
        return
      }

      // Validate subdomain format
      if (!/^[a-z0-9]+$/.test(subdomain)) {
        setSubdomainStatus("invalid")
        return
      }

      setCheckingSubdomain(true)
      setSubdomainStatus("checking")

      try {
        // Check if subdomain exists
        const { data, error } = await supabase.from("institutions").select("id").eq("subdomain", subdomain).single()

        if (error && error.code === "PGRST116") {
          // No results found, subdomain is available
          setSubdomainStatus("available")
        } else {
          // Subdomain exists
          setSubdomainStatus("unavailable")
        }
      } catch (err) {
        console.error("Error checking subdomain:", err)
        setSubdomainStatus(null)
      } finally {
        setCheckingSubdomain(false)
      }
    }

    // Only check when subdomain changes and has at least 3 characters
    if (subdomain && subdomain.length >= 3) {
      const timer = setTimeout(checkSubdomain, 500)
      return () => clearTimeout(timer)
    } else {
      setSubdomainStatus(null)
    }
  }, [subdomain, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate subdomain format
      if (!/^[a-z0-9]+$/.test(subdomain)) {
        throw new Error(t("admin.signup.invalidSubdomain"))
      }

      // Check if subdomain is available
      if (subdomainStatus !== "available") {
        throw new Error(t("admin.signup.subdomainUnavailable"))
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

  const getSubdomainBadge = () => {
    if (!subdomain || subdomain.length < 3) return null

    switch (subdomainStatus) {
      case "checking":
        return (
          <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-700 flex items-center gap-1">
            <Loader2 size={14} className="animate-spin" />
            {t("admin.signup.checking")}
          </Badge>
        )
      case "available":
        return (
          <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 flex items-center gap-1">
            <Check size={14} />
            {t("admin.signup.available")}
          </Badge>
        )
      case "unavailable":
        return (
          <Badge variant="outline" className="ml-2 bg-red-100 text-red-700 flex items-center gap-1">
            <X size={14} />
            {t("admin.signup.unavailable")}
          </Badge>
        )
      case "invalid":
        return (
          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <X size={14} />
            {t("admin.signup.invalidFormat")}
          </Badge>
        )
      default:
        return null
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
                  placeholder="University of Example"
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
                    placeholder="myuniversity"
                    required
                    className="rounded-r-none"
                  />
                  <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md">.electivepro.net</span>
                </div>
                <div className="flex items-center mt-1">{getSubdomainBadge()}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.signup.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">{t("admin.signup.adminEmail")}</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">{t("admin.signup.adminPassword")}</Label>
                <div className="relative">
                  <Input
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  subdomainStatus === "checking" ||
                  subdomainStatus === "unavailable" ||
                  subdomainStatus === "invalid"
                }
              >
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
