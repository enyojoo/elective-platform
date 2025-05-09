"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthLanguageSwitcher } from "@/app/auth/components/auth-language-switcher"
import { DynamicBranding } from "@/components/dynamic-branding"

export default function StudentSignupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    groupId: "",
  })
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "bg-gray-200",
  })

  // Initialize with placeholder data to prevent layout shifts
  useEffect(() => {
    const placeholderGroups = Array(3)
      .fill(null)
      .map((_, index) => ({
        id: `placeholder-${index}`,
        name: "",
        isPlaceholder: true,
      }))

    setGroups(placeholderGroups)
  }, [])

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoadingGroups(true)
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("groups")
          .select("id, name, degree_id, academic_year")
          .eq("status", "active")
          .order("name")

        if (error) throw error

        // Also fetch degrees to get their names
        const degreeIds = [...new Set(data?.map((g) => g.degree_id).filter(Boolean) || [])]

        const degreeMap = new Map()
        if (degreeIds.length > 0) {
          const { data: degreesData, error: degreesError } = await supabase
            .from("degrees")
            .select("id, name")
            .in("id", degreeIds)

          if (degreesError) throw degreesError

          if (degreesData) {
            degreesData.forEach((degree) => {
              degreeMap.set(degree.id, degree.name)
            })
          }
        }

        // Format the groups with degree names
        const formattedGroups =
          data?.map((group) => ({
            id: group.id,
            name: group.name,
            degreeName: degreeMap.get(group.degree_id) || "",
            year: group.academic_year,
            displayName: `${group.name} (${degreeMap.get(group.degree_id) || ""} - ${group.academic_year})`,
          })) || []

        setGroups(formattedGroups)
      } catch (error) {
        console.error("Error fetching groups:", error)
        toast({
          title: t("error"),
          description: t("errorFetchingGroups"),
          variant: "destructive",
        })
      } finally {
        setIsLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [t, toast])

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

  const handleGroupChange = (value: string) => {
    setFormData((prev) => ({ ...prev, groupId: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      // First, create the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: "student",
            group_id: formData.groupId,
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
        role: "student",
        group_id: formData.groupId,
      })

      if (profileError) throw profileError

      toast({
        title: t("success"),
        description: t("student.signup.successMessage"),
      })

      // Redirect to login page
      router.push("/student/login")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: t("error"),
        description: error.message || t("student.signup.errorMessage"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center items-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <DynamicBranding type="logo" className="mb-4 h-12 w-auto" />
            <h1 className="text-2xl font-bold">{t("student.signup.title")}</h1>
            <p className="text-muted-foreground">{t("student.signup.subtitle")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("student.signup.formTitle")}</CardTitle>
              <CardDescription>{t("student.signup.formDescription")}</CardDescription>
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

                <div className="space-y-2">
                  <Label htmlFor="groupId">{t("student.signup.group")}</Label>
                  <Select value={formData.groupId} onValueChange={handleGroupChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("student.signup.selectGroup")} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.isPlaceholder ? (
                            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                          ) : (
                            group.displayName || group.name
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("loading") : t("student.signup.submit")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4">
              <div className="text-sm text-center">
                {t("student.signup.alreadyHaveAccount")}{" "}
                <Link href="/student/login" className="text-primary hover:underline">
                  {t("student.signup.loginLink")}
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
