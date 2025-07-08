import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Globe, MapPin, Users, Calendar, GraduationCap, Star } from "lucide-react"
import Link from "next/link"

interface ExchangeUniversity {
  id: string
  name: string
  country: string
  city: string
  description: string | null
  max_students: number
  current_enrollment: number
  requirements: string | null
  application_deadline: string | null
  semester_start: string | null
  semester_end: string | null
  language_requirements: string | null
  gpa_requirement: number | null
  website_url: string | null
  is_full: boolean
}

interface ElectivePack {
  id: string
  name: string
  description: string | null
  max_selections: number
  selection_deadline: string | null
  universities: ExchangeUniversity[]
}

async function getElectivePack(packId: string): Promise<ElectivePack | null> {
  try {
    // Get the elective pack
    const { data: pack, error: packError } = await supabase
      .from("elective_packs")
      .select("*")
      .eq("id", packId)
      .eq("type", "exchange")
      .single()

    if (packError || !pack) {
      console.error("Error fetching elective pack:", packError)
      return null
    }

    // Get exchange universities for this pack with enrollment counts
    const { data: universities, error: universitiesError } = await supabase
      .from("exchange_universities")
      .select(`
        id,
        name,
        country,
        city,
        description,
        max_students,
        requirements,
        application_deadline,
        semester_start,
        semester_end,
        language_requirements,
        gpa_requirement,
        website_url
      `)
      .eq("elective_pack_id", packId)
      .order("name")

    if (universitiesError) {
      console.error("Error fetching universities:", universitiesError)
      return null
    }

    // Get enrollment counts for each university
    const universitiesWithEnrollment = await Promise.all(
      (universities || []).map(async (university) => {
        const { count } = await supabase
          .from("student_exchange_selections")
          .select("*", { count: "exact", head: true })
          .eq("exchange_university_id", university.id)
          .in("status", ["pending", "approved"])

        const currentEnrollment = count || 0
        const isFull = currentEnrollment >= university.max_students

        return {
          ...university,
          current_enrollment: currentEnrollment,
          is_full: isFull,
        }
      }),
    )

    return {
      ...pack,
      universities: universitiesWithEnrollment,
    }
  } catch (error) {
    console.error("Error in getElectivePack:", error)
    return null
  }
}

export default async function ExchangePackPage({ params }: { params: { packId: string } }) {
  const pack = await getElectivePack(params.packId)

  if (!pack) {
    notFound()
  }

  const availableUniversities = pack.universities.filter((uni) => !uni.is_full)
  const fullUniversities = pack.universities.filter((uni) => uni.is_full)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/student/exchange" className="hover:text-foreground">
            Exchange Programs
          </Link>
          <span>/</span>
          <span>{pack.name}</span>
        </div>
        <h1 className="text-3xl font-bold">{pack.name}</h1>
        {pack.description && <p className="text-muted-foreground">{pack.description}</p>}
      </div>

      {/* Pack Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Program Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Maximum Selections: <strong>{pack.max_selections}</strong>
              </span>
            </div>
            {pack.selection_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Deadline: <strong>{new Date(pack.selection_deadline).toLocaleDateString()}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Total Universities: <strong>{pack.universities.length}</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Universities */}
      {availableUniversities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Universities</h2>
          <div className="grid gap-4">
            {availableUniversities.map((university) => (
              <UniversityCard key={university.id} university={university} packId={params.packId} />
            ))}
          </div>
        </div>
      )}

      {/* Full Universities */}
      {fullUniversities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-muted-foreground">Full Universities</h2>
          <div className="grid gap-4">
            {fullUniversities.map((university) => (
              <UniversityCard key={university.id} university={university} packId={params.packId} disabled />
            ))}
          </div>
        </div>
      )}

      {pack.universities.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No universities available in this program.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function UniversityCard({
  university,
  packId,
  disabled = false,
}: { university: ExchangeUniversity; packId: string; disabled?: boolean }) {
  const enrollmentPercentage = (university.current_enrollment / university.max_students) * 100

  return (
    <Card className={disabled ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {university.name}
              {disabled && <Badge variant="destructive">Full</Badge>}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {university.city}, {university.country}
            </CardDescription>
            {university.description && <p className="text-sm text-muted-foreground mt-2">{university.description}</p>}
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-muted-foreground">
              {university.current_enrollment}/{university.max_students} enrolled
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enrollment Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enrollment</span>
            <span className={enrollmentPercentage >= 100 ? "text-red-600" : "text-muted-foreground"}>
              {Math.round(enrollmentPercentage)}%
            </span>
          </div>
          <Progress
            value={enrollmentPercentage}
            className={`h-2 ${enrollmentPercentage >= 100 ? "[&>div]:bg-red-500" : ""}`}
          />
        </div>

        {/* University Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {university.semester_start && university.semester_end && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(university.semester_start).toLocaleDateString()} -{" "}
                {new Date(university.semester_end).toLocaleDateString()}
              </span>
            </div>
          )}
          {university.application_deadline && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-500" />
              <span>Deadline: {new Date(university.application_deadline).toLocaleDateString()}</span>
            </div>
          )}
          {university.gpa_requirement && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span>Min GPA: {university.gpa_requirement}</span>
            </div>
          )}
          {university.website_url && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={university.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {university.language_requirements && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Language Requirements:</div>
            <div className="text-sm text-muted-foreground">{university.language_requirements}</div>
          </div>
        )}

        {university.requirements && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Requirements:</div>
            <div className="text-sm text-muted-foreground">{university.requirements}</div>
          </div>
        )}

        <div className="flex justify-end">
          <Button asChild disabled={disabled} variant={disabled ? "outline" : "default"}>
            <Link href={`/student/exchange/${packId}/select?universityId=${university.id}`}>
              {disabled ? "University Full" : "Apply to University"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
