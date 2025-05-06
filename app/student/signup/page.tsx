"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

export default function StudentSignupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution, isLoading: institutionLoading } = useInstitution()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [degree, setDegree] = useState("")
  const [program, setProgram] = useState("")
  const [year, setYear] = useState("")
  const [group, setGroup] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Data states
  const [degrees, setDegrees] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [groups, setGroups] = useState<any[]>([])

  // Filtered lists based on selections
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // REMOVED: Redirect to main domain if not accessed via subdomain
  // This was causing the issue

  // Load degrees, programs, and groups data
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

        // Load groups
        const { data: groupsData } = await supabase
          .from("groups")
          .select("*")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (groupsData) {
          setGroups(groupsData)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [institution, supabase])

  // Filter programs based on selected degree
  useEffect(() => {
    if (degree) {
      const filtered = programs.filter((p) => p.degree_id?.toString() === degree)
      setFilteredPrograms(filtered)
      if (filtered.length > 0 && program && !filtered.find((p) => p.id?.toString() === program)) {
        setProgram("")
      }
    } else {
      setFilteredPrograms([])
    }
  }, [degree, program, programs])

  // Filter groups based on selected degree, program, and year
  useEffect(() => {
    let filtered = groups

    if (degree) {
      filtered = filtered.filter((g) => g.degree_id?.toString() === degree)
    }

    if (program) {
      filtered = filtered.filter((g) => g.program_id?.toString() === program)
    }

    if (year) {
      filtered = filtered.filter((g) => g.year === year)
    }

    setFilteredGroups(filtered)
    if (filtered.length > 0 && group && !filtered.find((g) => g.id?.toString() === group)) {
      setGroup("")
    }
  }, [degree, program, year, group, groups])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Basic validation
      if (!email.includes("@")) {
        throw new Error(t("auth.error.invalidEmail"))
      }

      if (!degree || !program || !year || !group) {
        throw new Error(t("auth.error.incompleteFields"))
      }

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

      // Create student profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user!.id,
        institution_id: institution!.id,
        full_name: name,
        role: "student",
        email: email,
        degree_id: degree,
        program_id: program,
        year: year,
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

  if (institutionLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
      <div className="mx-auto max-w-md space-y-6 w-full">
        <div className="flex justify-center mb-6">
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

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.signup.name")}</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">{t("auth.signup.degree")}</Label>
                <Select value={degree} onValueChange={setDegree} required>
                  <SelectTrigger id="degree" className="w-full">
                    <SelectValue placeholder={t("auth.signup.selectDegree")} />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((d) => (
                      <SelectItem key={d.id} value={d.id?.toString() || ""}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">{t("auth.signup.program")}</Label>
                <Select value={program} onValueChange={setProgram} required disabled={!degree}>
                  <SelectTrigger id="program" className="w-full">
                    <SelectValue placeholder={t("auth.signup.selectProgram")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPrograms.map((p) => (
                      <SelectItem key={p.id} value={p.id?.toString() || ""}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  <Select value={group} onValueChange={setGroup} required disabled={!degree || !program || !year}>
                    <SelectTrigger id="group" className="w-full">
                      <SelectValue placeholder={t("auth.signup.selectGroup")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id?.toString() || ""}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("auth.signup.loading") : t("auth.signup.button")}
              </Button>
              <div className="mt-4 text-center text-sm">
                {t("auth.signup.hasAccount")}{" "}
                <Link href="/student/login" className="text-primary hover:underline">
                  {t("auth.signup.login")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        <div className="flex justify-center mt-4">
          <AuthLanguageSwitcher />
        </div>
      </div>
    </div>
  )
}
