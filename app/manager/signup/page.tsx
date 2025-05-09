"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthLanguageSwitcher } from "@/app/auth/components/auth-language-switcher"
import { DynamicBranding } from "@/components/dynamic-branding"

export default function ManagerSignupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "bg-gray-200",
  })

  const [institution, setInstitution] = useState(null)
  const [isLoadingDegrees, setIsLoadingDegrees] = useState(false)
  const [degrees, setDegrees] = useState([])
  const [years, setYears] = useState([])
  const yearsFetchedRef = useRef(false)
  const [isLoadingYears, setIsLoadingYears] = useState(false)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Check password strength when password field changes
    if (name === "password") {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password: string) => {
    // Simple password strength checker
    let score = 0
    let message = t("passwordStrength.weak")
    let color = "bg-red-500"

    if (password.length === 0) {
      setPasswordStrength({ score: 0, message: "", color: "bg-gray-200" })
      return
    }

    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    // Set message and color based on score
    if (score >= 4) {
      message = t("passwordStrength.strong")
      color = "bg-green-500"
    } else if (score >= 2) {
      message = t("passwordStrength.medium")
      color = "bg-yellow-500"
    }

    setPasswordStrength({ score, message, color })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First, create the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: "manager",
          },
        },
      })

      if (authError) throw authError

      // Create the profile in the profiles table
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user?.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: "manager",
      })

      if (profileError) throw profileError

      toast({
        title: t("success"),
        description: t("manager.signup.successMessage"),
      })

      // Redirect to login page
      router.push("/manager/login")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: t("error"),
        description: error.message || t("manager.signup.errorMessage"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function loadData() {
      if (!institution) return

      try {
        // Load degrees
        setIsLoadingDegrees(true)
        const { data: degreesData } = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (degreesData) {
          setDegrees(degreesData)
          if (degreesData.length > 0 && !formData.degreeId) {
            setFormData((prev) => ({
              ...prev,
              degreeId: degreesData[0].id.toString(),
            }))
          }
        }
        setIsLoadingDegrees(false)

        // Only fetch years if not already fetched
        if (!yearsFetchedRef.current) {
          setIsLoadingYears(true)
          // Load academic years
          const { data: yearsData } = await supabase
            .from("academic_years")
            .select("year")
            .eq("institution_id", institution.id)
            .eq("is_active", true)
            .order("year", { ascending: false })

          if (yearsData && yearsData.length > 0) {
            const uniqueYears = [...new Set(yearsData.map((y) => y.year))]
            setYears(uniqueYears)
            yearsFetchedRef.current = true

            // Set current year as default if available
            const currentYear = new Date().getFullYear().toString()
            if (uniqueYears.includes(currentYear)) {
              setFormData((prev) => ({
                ...prev,
                academicYear: currentYear,
              }))
            } else if (uniqueYears.length > 0) {
              setFormData((prev) => ({
                ...prev,
                academicYear: uniqueYears[0],
              }))
            }
          }
          setIsLoadingYears(false)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setIsLoadingDegrees(false)
        setIsLoadingYears(false)
      }
    }

    loadData()
  }, [institution, supabase, formData.degreeId])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center items-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <DynamicBranding type="logo" className="mb-4 h-12 w-auto" />
            <h1 className="text-2xl font-bold">{t("manager.signup.title")}</h1>
            <p className="text-muted-foreground">{t("manager.signup.subtitle")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("manager.signup.formTitle")}</CardTitle>
              <CardDescription>{t("manager.signup.formDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("firstName")}</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder={t("firstNamePlaceholder")}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("lastName")}</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder={t("lastNamePlaceholder")}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">{passwordStrength.message}</p>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("loading") : t("manager.signup.submit")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4">
              <div className="text-sm text-center">
                {t("manager.signup.alreadyHaveAccount")}{" "}
                <Link href="/manager/login" className="text-primary hover:underline">
                  {t("manager.signup.loginLink")}
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ElectivePRO</p>
          <AuthLanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
