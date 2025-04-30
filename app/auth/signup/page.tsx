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
import { AuthLanguageSwitcher } from "../components/auth-language-switcher"
import { useLanguage } from "@/lib/language-context"

// Mock data from admin pages
const mockDegrees = [
  { id: "1", name: "Bachelor's", code: "bachelor" },
  { id: "2", name: "Master's", code: "master" },
  { id: "3", name: "Executive MBA", code: "emba" },
]

const mockPrograms = [
  { id: "1", name: "Management", degree: "Bachelor's" },
  { id: "2", name: "Management", degree: "Master's" },
  { id: "3", name: "International Management", degree: "Bachelor's" },
  { id: "4", name: "Business Analytics and Big Data", degree: "Master's" },
  { id: "5", name: "Public Administration", degree: "Bachelor's" },
]

const mockYears = ["2023", "2024", "2025"]

const mockGroups = [
  { id: "1", name: "24.B01-vshm", displayName: "B01", program: "Management", degree: "Bachelor's", year: "2024" },
  { id: "2", name: "24.B02-vshm", displayName: "B02", program: "Management", degree: "Master's", year: "2024" },
  { id: "3", name: "23.B01-vshm", displayName: "B01", program: "Management", degree: "Bachelor's", year: "2023" },
  { id: "4", name: "24.M01-vshm", displayName: "M01", program: "Management", degree: "Master's", year: "2024" },
  {
    id: "5",
    name: "23.B11-vshm",
    displayName: "B11",
    program: "International Management",
    degree: "Bachelor's",
    year: "2023",
  },
]

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [degree, setDegree] = useState("")
  const [program, setProgram] = useState("")
  const [year, setYear] = useState("")
  const [group, setGroup] = useState("")
  const [error, setError] = useState("")

  // Filtered lists based on selections
  const [filteredPrograms, setFilteredPrograms] = useState(mockPrograms)
  const [filteredGroups, setFilteredGroups] = useState(mockGroups)

  const router = useRouter()
  const { t, language } = useLanguage()

  // Filter programs based on selected degree
  useEffect(() => {
    if (degree) {
      const filtered = mockPrograms.filter((p) => p.degree === degree)
      setFilteredPrograms(filtered)
      if (filtered.length > 0 && !filtered.find((p) => p.name === program)) {
        setProgram("")
      }
    } else {
      setFilteredPrograms(mockPrograms)
    }
  }, [degree, program])

  // Filter groups based on selected degree, program, and year
  useEffect(() => {
    let filtered = mockGroups

    if (degree) {
      filtered = filtered.filter((g) => g.degree === degree)
    }

    if (program) {
      filtered = filtered.filter((g) => g.program === program)
    }

    if (year) {
      filtered = filtered.filter((g) => g.year === year)
    }

    setFilteredGroups(filtered)
    if (filtered.length > 0 && !filtered.find((g) => g.name === group)) {
      setGroup("")
    }
  }, [degree, program, year, group])

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!email.includes("@")) {
      setError(t("auth.error.invalidEmail"))
      return
    }

    if (!degree || !program || !year || !group) {
      setError(t("auth.error.incompleteFields"))
      return
    }

    // In a real app, you would register the user here
    // For demo purposes, we'll just redirect to login
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-background">
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
            <CardTitle>{t("auth.signup.title")}</CardTitle>
            <CardDescription>{t("auth.signup.description")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.email")}</Label>
                <input
                  id="email"
                  type="email"
                  placeholder=""
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.signup.name")}</Label>
                <input
                  id="name"
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">{t("auth.signup.degree")}</Label>
                <Select value={degree} onValueChange={setDegree} required>
                  <SelectTrigger id="degree" className="w-full">
                    <SelectValue placeholder={t("auth.signup.selectDegree")} />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDegrees.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
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
                      <SelectItem key={p.id} value={p.name}>
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
                      {mockYears.map((y) => (
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
                        <SelectItem key={g.id} value={g.name}>
                          {g.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.password")}</Label>
                <input
                  id="password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full">
                {t("auth.signup.button")}
              </Button>
              <div className="mt-4 text-center text-sm">
                {t("auth.signup.hasAccount")}{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
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
