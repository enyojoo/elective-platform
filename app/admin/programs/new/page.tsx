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
  const [degrees, setDegrees] = useState<Degree[]>([])
  const [loading, setLoading] = useState(true)

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
    const fetchDegrees = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("degrees")
          .select("id, name, name_ru, code")
          .eq("institution_id", 1) // In a real app, you would get the institution_id from context
          .order("name")

        if (error) throw error

        if (data) {
          setDegrees(
            data.map((degree) => ({
              id: degree.id.toString(),
              name: degree.name,
              nameRu: degree.name_ru,
              code: degree.code,
            })),
          )

          // Only set the default degree if we haven't set one yet
          if (data.length > 0 && !program.degreeId) {
            setProgram((prev) => ({ ...prev, degreeId: data[0].id.toString() }))
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch degrees:", error)
        setLoading(false)
      }
    }

    fetchDegrees()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProgram({ ...program, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setProgram({ ...program, [name]: value })
  }

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!program.name || !program.nameRu || !program.code || !program.degreeId) {
      toast({
        title: t("admin.newProgram.error"),
        description: t("admin.newProgram.fillAllFields"),
        variant: "destructive",
      })
      return
    }

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
          institution_id: 1, // In a real app, you would get the institution_id from context
        })
        .select()

      if (error) throw error

      toast({
        title: t("admin.newProgram.success"),
        description: t("admin.newProgram.programCreated"),
      })

      router.push("/admin/programs")
    } catch (error: any) {
      console.error("Error creating program:", error)
      toast({
        title: t("admin.newProgram.error"),
        description: error.message || t("admin.newProgram.errorCreating"),
        variant: "destructive",
      })
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
                    <Input id="name" name="name" value={program.name} onChange={handleInputChange} required />
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
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameRu">
                      {t("admin.newProgram.nameRu")} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="nameRu" name="nameRu" value={program.nameRu} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="degreeId">
                      {t("admin.newProgram.degree")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={program.degreeId}
                      onValueChange={(value) => handleSelectChange("degreeId", value)}
                      disabled={loading}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">{t("admin.newProgram.descriptionRu")}</Label>
                    <Textarea
                      id="descriptionRu"
                      name="descriptionRu"
                      rows={4}
                      value={program.descriptionRu}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="status">{t("admin.newProgram.status")}</Label>
                <Select value={program.status} onValueChange={(value) => handleSelectChange("status", value)}>
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
                  <Button variant="outline">{t("admin.newProgram.cancel")}</Button>
                </Link>
                <Button type="submit">{t("admin.newProgram.create")}</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
