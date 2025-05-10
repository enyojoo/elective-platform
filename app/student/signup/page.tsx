"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AuthLanguageSwitcher } from "../../auth/components/auth-language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

export default function StudentSignupPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [degree, setDegree] = useState("")
  const [year, setYear] = useState("")
  const [group, setGroup] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Data states
  const [degrees, setDegrees] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])

  // Refs to prevent multiple fetches
  const dataFetchedRef = useRef(false)

  // Create Supabase client only when needed
  const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials are not available")
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // Load all data once when the component mounts
  useEffect(() => {
    if (!institution || dataFetchedRef.current) return

    async function loadAllData() {
      try {
        dataFetchedRef.current = true
        const supabase = getSupabaseClient()

        // Fetch all data in parallel
        const [degreesResponse, groupsResponse] = await Promise.all([
          supabase.from("degrees").select("*").eq("institution_id", institution.id).eq("status", "active"),
          supabase.from("groups").select("*").eq("institution_id", institution.id).eq("status", "active"),
        ])

        // Process degrees
        if (degreesResponse.data && degreesResponse.data.length > 0) {
          setDegrees(degreesResponse.data)
          setDegree(degreesResponse.data[0].id?.toString() || "")
        } else {
          console.log("No degrees found or empty response", degreesResponse)
        }

        // Process groups
        if (groupsResponse.data && groupsResponse.data.length > 0) {
          setGroups(groupsResponse.data)

          // Extract unique years from groups
          const uniqueYears = [...new Set(groupsResponse.data.map((g) => g.academic_year).filter(Boolean))]
            .sort()
            .reverse()

          setYears(uniqueYears)

          // Set default year
          if (uniqueYears.length > 0) {
            const currentYear = new Date().getFullYear().toString()
            if (uniqueYears.includes(currentYear)) {
              setYear(currentYear)
            } else {
              setYear(uniqueYears[0])
            }
          }
        } else {
          // If no groups found, set some default years
          const currentYear = new Date().getFullYear()
          const defaultYears = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString())
          setYears(defaultYears)
          setYear(currentYear.toString())
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setError(error instanceof Error ? error.message : "Failed to load data")
      }
    }

    loadAllData()
  }, [institution])

  // Add this effect to force re-render when language changes
  useEffect(() => {
    // Force re-render when language changes to update degree names in the UI
    if (degrees.length > 0) {
      const updatedDegrees = [...degrees]
      setDegrees(updatedDegrees)
    }
  }, [language, degrees])

  // Filter groups when degree or year changes
  useEffect(() => {
    if (!groups.length) return

    let filtered = [...groups]

    if (degree) {
      filtered = filtered.filter((g) => g.degree_id?.toString() === degree)
    }

    if (year) {
      filtered = filtered.filter((g) => g.academic_year === year)
    }

    setFilteredGroups(filtered)

    // Set default group if available and not already set
    if (filtered.length > 0 && (!group || !filtered.find((g) => g.id?.toString() === group))) {
      setGroup(filtered[0].id?.toString() || "")
    }
  }, [degree, year, groups, group])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Basic validation
      if (!email.includes("@")) {
        throw new Error(t("auth.error.invalidEmail"))
      }

      if (!degree || !year || !group) {
        throw new Error(t("auth.error.incompleteFields"))
      }

      if (!institution) {
        throw new Error("Institution not found")
      }

      const supabase = getSupabaseClient()

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error("Failed to create user")

      // Create student profile - using the correct column names
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        institution_id: institution.id,
        full_name: name,
        role: "student",
        email: email,
        degree_id: degree,
        academic_year: year,
        group_id: group,
      })

      if (profileError) throw new Error(profileError.message)

      toast({
        title: t("auth.signup.success"),
        description: t("auth.signup.successMessage"),
      })

      // Redirect to login page
      router.push("/student/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signup.error"))
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get the degree name in the current language
  const getDegreeName = (degree: any) => {
    if (!degree) return ""
    return language === "ru" && degree.name_ru ? degree.name_ru : degree.name
  }

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
              alt="ElectivePRO Logo"
              width={160}
              height={45}
              className="h-10 w-auto"
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signup.title")}</CardTitle>
            <CardDescription>{t("auth.signup.description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.signup.name")}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("auth.signup.fullNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Degree */}
              <div className="space-y-2">
                <Label htmlFor="degree">{t("auth.signup.degree")}</Label>
                <Select value={degree} onValueChange={setDegree} required>
                  <SelectTrigger id="degree" className="w-full">
                    <SelectValue placeholder={t("auth.signup.selectDegree")} />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.length > 0 ? (
                      degrees.map((d) => (
                        <SelectItem key={d.id} value={d.id?.toString() || ""}>
                          {getDegreeName(d)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading degrees...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Year and Group */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">{t("auth.signup.year")}</Label>
                  <Select value={year} onValueChange={setYear} required>
                    <SelectTrigger id="year" className="w-full">
                      <SelectValue placeholder={t("auth.signup.selectYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">{t("auth.signup.group")}</Label>
                  <Select value={group} onValueChange={setGroup} required disabled={!degree || !year}>
                    <SelectTrigger id="group" className="w-full">
                      <SelectValue placeholder={t("auth.signup.selectGroup")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredGroups.length > 0 ? (
                        filteredGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id?.toString() || ""}>
                            {g.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-groups" disabled>
                          No groups available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("auth.signup.loading") : t("auth.signup.button")}
              </Button>
              <div className="text-center text-sm">
                {t("auth.signup.hasAccount")}{" "}
                <Link href="/student/login" className="text-primary hover:underline">
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
