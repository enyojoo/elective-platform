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
import type { DegreeType, ProgramType } from "@/lib/types"
import { AuthLanguageSwitcher } from "@/app/auth/components/auth-language-switcher"

// Mock degrees data
const mockDegrees: DegreeType[] = [
  { id: 1, name: "Bachelor", code: "BSc" },
  { id: 2, name: "Master", code: "MSc" },
  { id: 3, name: "PhD", code: "PhD" },
]

// Mock programs data
const mockPrograms: ProgramType[] = [
  { id: 1, name: "Management", code: "MGT", degreeId: 1 },
  { id: 2, name: "International Business", code: "IB", degreeId: 1 },
  { id: 3, name: "Management", code: "MGT", degreeId: 2 },
  { id: 4, name: "Business Analytics", code: "BA", degreeId: 2 },
  { id: 5, name: "Corporate Finance", code: "CF", degreeId: 2 },
  { id: 6, name: "Management", code: "MGT", degreeId: 3 },
]

export default function ManagerSignupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const currentYear = new Date().getFullYear()

  const [degrees, setDegrees] = useState<DegreeType[]>([])
  const [programs, setPrograms] = useState<ProgramType[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    degreeId: "",
    programId: "",
    enrollmentYear: currentYear.toString(),
  })

  // Fetch degrees and programs
  useEffect(() => {
    // In a real app, these would be API calls
    setDegrees(mockDegrees)
    setPrograms(mockPrograms)
  }, [])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = programs.filter((program) => program.degreeId === Number(formData.degreeId))
      setFilteredPrograms(filtered)

      // Reset program selection if the current selection is not valid for the new degree
      if (!filtered.some((p) => p.id === Number(formData.programId))) {
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, log the signup data
      console.log("Manager signup:", formData)

      const degree = degrees.find((d) => d.id === Number(formData.degreeId))
      const program = programs.find((p) => p.id === Number(formData.programId))

      toast({
        title: "Account created",
        description: `Your account for ${degree?.name} in ${program?.name} has been created successfully.`,
      })

      // Redirect to login page
      router.push("/manager/login")
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        title: "Signup failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate enrollment years (from 2021 to current year + 10)
  const enrollmentYears = Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image
            src="/images/elective-pro-logo.svg"
            alt="Elective Pro Logo"
            width={160}
            height={45}
            className="h-10 w-auto"
          />
          <h1 className="text-3xl font-bold"></h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signup.createAccount")}</CardTitle>
            <CardDescription>Create a new manager account for your institution</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
