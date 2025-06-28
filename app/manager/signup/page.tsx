"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/lib/language-context"
import { AuthLanguageSwitcher } from "@/app/auth/components/auth-language-switcher"
import { useInstitution, DEFAULT_LOGO_URL } from "@/lib/institution-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { signUp } from "@/app/actions/auth"
import { Eye, EyeOff } from "lucide-react"

export default function ManagerSignupPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [degreeId, setDegreeId] = useState("")
  const [academicYear, setAcademicYear] = useState("")

  // Data states
  const [degrees, setDegrees] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])

  // Ref to prevent multiple fetches
  const dataFetchedRef = useRef(false)

  // Load all data once when the component mounts
  useEffect(() => {
    if (!institution || dataFetchedRef.current) return

    async function loadAllData() {
      const supabase = getSupabaseBrowserClient()
      try {
        dataFetchedRef.current = true

        const [degreesResponse, groupsResponse] = await Promise.all([
          supabase.from("degrees").select("*").eq("institution_id", institution.id).eq("status", "active"),
          supabase.from("groups").select("academic_year").eq("institution_id", institution.id).eq("status", "active"),
        ])

        if (degreesResponse.data) {
          setDegrees(degreesResponse.data)
          if (degreesResponse.data.length > 0) {
            setDegreeId(degreesResponse.data[0].id.toString())
          }
        }

        if (groupsResponse.data) {
          const uniqueYears = [...new Set(groupsResponse.data.map((g) => g.academic_year).filter(Boolean))]
            .sort()
            .reverse()
          setYears(uniqueYears)
          if (uniqueYears.length > 0) {
            const currentYear = new Date().getFullYear().toString()
            setAcademicYear(uniqueYears.includes(currentYear) ? currentYear : uniqueYears[0])
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadAllData()
  }, [institution])

  const getDegreeName = (degreeItem: any) => {
    return language === "ru" && degreeItem.name_ru ? degreeItem.name_ru : degreeItem.name
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)

    if (result.error) {
      setError(result.error)
    } else {
      toast({
        title: t("auth.signup.success"),
        description: t("auth.signup.successMessage"),
      })
      router.push("/manager/login")
    }
    setIsLoading(false)
  }

  const enrollmentYears =
    years.length > 0 ? years : Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image
            src={institution?.logo_url || DEFAULT_LOGO_URL}
            alt={`${institution?.name || "Elective Pro"} Logo`}
            width={160}
            height={45}
            className="h-10 w-auto"
            priority
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signup.createAccount")}</CardTitle>
            <CardDescription>Create a new manager account for your institution</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

              {/* Hidden inputs for the server action */}
              <input type="hidden" name="role" value="program_manager" />
              <input type="hidden" name="institutionId" value={institution?.id || ""} />

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.email")}</Label>
                <Input id="email" name="email" type="email" placeholder="manager@university.edu" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("admin.users.fullName")}</Label>
                <Input id="name" name="name" placeholder={t("auth.signup.fullNamePlaceholder")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degreeId">{t("admin.users.degree")}</Label>
                <Select name="degreeId" value={degreeId} onValueChange={setDegreeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.users.selectDegree")} />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((degree) => (
                      <SelectItem key={degree.id} value={degree.id.toString()}>
                        {getDegreeName(degree)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">{t("year.enrollment")}</Label>
                <Select name="academicYear" value={academicYear} onValueChange={setAcademicYear} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("auth.signup.selectYear")} />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollmentYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !institution}>
                {isLoading ? t("auth.signup.creating") : t("auth.signup.createAccount")}
              </Button>
              <div className="text-center text-sm">
                {t("auth.signup.alreadyHaveAccount")}{" "}
                <Link href="/manager/login" className="text-primary hover:underline">
                  {t("auth.signup.login")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        <div className="flex justify-center mt-8">
          <AuthLanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
