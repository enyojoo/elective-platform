"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"

export default function ManagerSignupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution, isLoading: institutionLoading } = useInstitution()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    degreeId: "",
    programId: "",
    enrollmentYear: new Date().getFullYear().toString(),
  })

  // Data states
  const [degrees, setDegrees] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // REMOVED: Redirect to main domain if not accessed via subdomain
  // This was causing the issue

  // Load degrees, programs, and academic years data
  useEffect(() => {
    async function loadData() {
      if (!institution) return

      try {
        // Load degrees
        const { data: degreesData } = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (degreesData) {
          setDegrees(degreesData)
        }

        // Load programs
        const { data: programsData } = await supabase
          .from("programs")
          .select("*")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (programsData) {
          setPrograms(programsData)
        }

        // Load academic years
        const { data: yearsData } = await supabase
          .from("academic_years")
          .select("year")
          .eq("institution_id", institution.id)
          .eq("is_active", true)
          .order("year", { ascending: false })

        if (yearsData) {
          const uniqueYears = [...new Set(yearsData.map((y) => y.year))]
          setYears(uniqueYears)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [institution, supabase])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = programs.filter((p) => p.degree_id.toString() === formData.degreeId)
      setFilteredPrograms(filtered)

      // Reset program selection if the current selection is not valid for the new degree
      if (!filtered.some((p) => p.id.toString() === formData.programId)) {
        setFormData((prev) => ({
          ...prev,
          programId: "",
        }))
      }
    } else {
      setFilteredPrograms([])
    }
  }, [formData.degreeId, programs, formData.programId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error(t("auth.error.passwordsDoNotMatch"))
      }

      if (!formData.degreeId || !formData.programId) {
        throw new Error(t("auth.error.incompleteFields"))
      }

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      })

      if (authError) throw new Error(authError.message)

      // Create manager profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user!.id,
        institution_id: institution!.id,
        full_name: formData.name,
        role: "manager",
        email: formData.email,
        degree_id: formData.degreeId,
        program_id: formData.programId,
        year: formData.enrollmentYear,
      })

      if (profileError) throw new Error(profileError.message)

      toast({
        title: t("auth.signup.success"),
        description: t("auth.signup.successMessage"),
      })

      // Redirect to login page
      router.push("/manager/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signup.error"))
    } finally {
      setIsLoading(false)
    }
  }

  if (institutionLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>
  }

  // Generate enrollment years (from 2021 to current year + 10)
  const currentYear = new Date().getFullYear()
  const enrollmentYears =
    years.length > 0 ? years : Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          {institution?.logo_url ? (
            <Image
              src={institution.logo_url || "/placeholder.svg"}
              alt={`${institution.name} Logo`}
              width={160}
              height={45}
              className="h-10 w-auto"
            />
          ) : (
            <Image
              src="/images/elective-pro-logo.svg"
              alt="Elective Pro Logo"
              width={160}
              height={45}
              className="h-10 w-auto"
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signup.createAccount")}</CardTitle>
            <CardDescription>Create a new manager account for your institution</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("admin.users.fullName")}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t("admin.users.fullName")}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="manager@university.edu"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.signup.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Program Assignment */}
              <div className="space-y-2">
                <Label htmlFor="degree">{t("admin.users.degree")}</Label>
                <Select
                  value={formData.degreeId}
                  onValueChange={(value) => handleSelectChange("degreeId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.users.selectDegree")} />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((degree) => (
                      <SelectItem key={degree.id} value={degree.id.toString()}>
                        {degree.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">{t("admin.users.program")}</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) => handleSelectChange("programId", value)}
                  disabled={!formData.degreeId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.degreeId ? t("admin.users.selectProgram") : t("admin.users.selectDegreeFirst")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollmentYear">{t("admin.users.enrollmentYear")}</Label>
                <Select
                  value={formData.enrollmentYear}
                  onValueChange={(value) => handleSelectChange("enrollmentYear", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.users.selectYear")} />
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
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
