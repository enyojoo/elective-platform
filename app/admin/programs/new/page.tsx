"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useDataCache } from "@/lib/data-cache-context"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the Degree type
interface Degree {
  id: string
  name: string
  nameRu: string
  code: string
}

export default function NewProgramPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()

  const [degrees, setDegrees] = useState<Degree[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [program, setProgram] = useState({
    name: "",
    nameRu: "",
    code: "",
    description: "",
    descriptionRu: "",
    status: "active",
    degreeId: "",
  })

  // Fetch degrees from Supabase
  useEffect(() => {
    if (!institution) return

    const fetchDegrees = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache for degrees
        const cachedDegrees = getCachedData<Degree[]>("degrees", institution.id.toString())

        if (cachedDegrees) {
          setDegrees(cachedDegrees)

          // Only set the default degree if we haven't set one yet
          if (cachedDegrees.length > 0 && !program.degreeId) {
            setProgram((prev) => ({ ...prev, degreeId: cachedDegrees[0].id.toString() }))
          }
        } else {
          const { data, error } = await supabase
            .from("degrees")
            .select("id, name, name_ru, code")
            .eq("institution_id", institution.id)
            .order("name")

          if (error) throw error

          if (data) {
            const formattedDegrees = data.map((degree) => ({
              id: degree.id.toString(),
              name: degree.name,
              nameRu: degree.name_ru,
              code: degree.code,
            }))

            setDegrees(formattedDegrees)

            // Cache the degrees
            setCachedData("degrees", institution.id.toString(), formattedDegrees)

            // Only set the default degree if we haven't set one yet
            if (data.length > 0 && !program.degreeId) {
              setProgram((prev) => ({ ...prev, degreeId: data[0].id.toString() }))
            }
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch degrees:", error)
        setError(error.message || "Failed to load degrees")
        toast({
          title: "Error",
          description: "Failed to load degrees",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDegrees()
  }, [institution, getCachedData, setCachedData, program.degreeId, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProgram({ ...program, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setProgram({ ...program, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!program.name || !program.nameRu || !program.code || !program.degreeId) {
      toast({
        title: t("admin.newProgram.error"),
        description: t("admin.newProgram.fillAllFields"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from("programs")
        .insert({
          name: program.name,
          name_ru: program.nameRu,
          code: program.code,
          description: program.description,
          description_ru: program.descriptionRu,
          status: program.status,
          degree_id: Number.parseInt(program.degreeId),
          institution_id: institution?.id,
        })
        .select()

      if (error) throw error

      // Invalidate programs cache
      invalidateCache("programs", institution?.id.toString())

      toast({
        title: t("admin.newProgram.success"),
        description: t("admin.newProgram.programCreated"),
      })

      router.push("/admin/programs")
    } catch (error: any) {
      console.error("Error creating program:", error)
      setError(error.message || t("admin.newProgram.errorCreating"))
      toast({
        title: t("admin.newProgram.error"),
        description: error.message || t("admin.newProgram.errorCreating"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/programs">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("admin.newProgram.title")}</h1>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.newProgram.programDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t("admin.newProgram.nameEn")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={program.name}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">
                      {t("admin.newProgram.code")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      value={program.code}
                      onChange={handleInputChange}
                      placeholder={t("admin.newProgram.codePlaceholder")}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("admin.newProgram.descriptionEn")}</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={program.description}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameRu">
                      {t("admin.newProgram.nameRu")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nameRu"
                      name="nameRu"
                      value={program.nameRu}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="degreeId">
                      {t("admin.newProgram.degree")} <span className="text-destructive">*</span>
                    </Label>
                    {loading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={program.degreeId}
                        onValueChange={(value) => handleSelectChange("degreeId", value)}
                        disabled={loading || isSubmitting}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("admin.newProgram.selectDegree")} />
                        </SelectTrigger>
                        <SelectContent>
                          {degrees.map((degree) => (
                            <SelectItem key={degree.id} value={degree.id}>
                              {degree.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">{t("admin.newProgram.descriptionRu")}</Label>
                    <Textarea
                      id="descriptionRu"
                      name="descriptionRu"
                      rows={4}
                      value={program.descriptionRu}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="status">{t("admin.newProgram.status")}</Label>
                <Select
                  value={program.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.programs.active")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.programs.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end mt-8 gap-4">
                <Link href="/admin/programs">
                  <Button variant="outline" disabled={isSubmitting}>
                    {t("admin.newProgram.cancel")}
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("admin.newProgram.creating") : t("admin.newProgram.create")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
