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
import { signUp } from "@/app/actions/auth"

export default function StudentSignupPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution, DEFAULT_LOGO_URL } = useInstitution()

  // Form state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [degree, setDegree] = useState("")
  const [year, setYear] = useState("")
  const [group, setGroup] = useState("")

  // UI state
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Data states
  const [degrees, setDegrees] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])

  const dataFetchedRef = useRef(false)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Load all data once when the component mounts
  useEffect(() => {
    if (!institution || dataFetchedRef.current) return

    async function loadAllData() {
      try {
        dataFetchedRef.current = true
        const [degreesResponse, groupsResponse] = await Promise.all([
          supabase.from("degrees").select("*").eq("institution_id", institution.id).eq("status", "active"),
          supabase.from("groups").select("*").eq("institution_id", institution.id).eq("status", "active"),
        ])

        if (degreesResponse.data) setDegrees(degreesResponse.data)
        if (groupsResponse.data) {
          setGroups(groupsResponse.data)
          const uniqueYears = [...new Set(groupsResponse.data.map((g) => g.academic_year).filter(Boolean))]
            .sort()
            .reverse()
          setYears(uniqueYears)
          if (uniqueYears.length > 0) setYear(uniqueYears[0])
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setError(t("auth.signup.errorLoadingData"))
      }
    }

    loadAllData()
  }, [institution, supabase, t])

  // Filter groups when degree or year changes
  useEffect(() => {
    if (!groups.length) return
    const filtered = groups.filter(
      (g) => (!degree || g.degree_id?.toString() === degree) && (!year || g.academic_year === year),
    )
    setFilteredGroups(filtered)
    if (filtered.length > 0 && !filtered.some((g) => g.id.toString() === group)) {
      setGroup(filtered[0].id.toString())
    } else if (filtered.length === 0) {
      setGroup("")
    }
  }, [degree, year, groups, group])

  const getDegreeName = (degreeItem: any) =>
    language === "ru" && degreeItem.name_ru ? degreeItem.name_ru : degreeItem.name
  const getGroupName = (groupItem: any) => (language === "ru" && groupItem.name_ru ? groupItem.name_ru : groupItem.name)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!institution) {
      setError("Institution not found.")
      setIsLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)

    const result = await signUp(formData)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      toast({
        title: t("auth.signup.success"),
        description: t("auth.signup.successMessage"),
      })
      router.push("/student/login")
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image
            src={institution?.logo_url || DEFAULT_LOGO_URL || "/placeholder.svg"}
            alt={`${institution?.name || "ElectivePRO"} Logo`}
            width={160}
            height={45}
            className="h-10 w-auto"
            priority
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.signup.title")}</CardTitle>
            <CardDescription>{t("auth.signup.description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

              <input type="hidden" name="role" value="student" />
              <input type="hidden" name="institutionId" value={institution?.id || ""} />

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.signup.name")}</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t("auth.signup.fullNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">{t("auth.signup.degree")}</Label>
                <Select name="degreeId" value={degree} onValueChange={setDegree} required>
                  <SelectTrigger id="degree" className="w-full">
                    <SelectValue placeholder={t("auth.signup.selectDegree")} />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((d) => (
                      <SelectItem key={d.id} value={d.id?.toString() || ""}>
                        {getDegreeName(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">{t("auth.signup.year")}</Label>
                  <Select name="academicYear" value={year} onValueChange={setYear} required>
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
                  <Select
                    name="groupId"
                    value={group}
                    onValueChange={setGroup}
                    required
                    disabled={!degree || !year || filteredGroups.length === 0}
                  >
                    <SelectTrigger id="group" className="w-full">
                      <SelectValue placeholder={t("auth.signup.selectGroup")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id?.toString() || ""}>
                          {getGroupName(g)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !institution}>
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
