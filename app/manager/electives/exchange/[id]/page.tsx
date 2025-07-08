import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Globe, MapPin, Users, Calendar, Star, Edit, Eye } from "lucide-react"
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

interface StudentSelection {
  id: string
  status: string
  created_at: string
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    student_id: string
  }
}

interface ElectivePack {
  id: string
  name: string
  description: string | null
  max_selections: number
  selection_deadline: string | null
  university: ExchangeUniversity
  student_selections: StudentSelection[]
}

async function getExchangeElectivePack(packId: string): Promise<ElectivePack | null> {
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

    // Get the exchange university for this pack
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
      .single()

    if (universitiesError || !universities) {
      console.error("Error fetching university:", universitiesError)
      return null
    }

    // Get student selections for this university
    const { data: selections, error: selectionsError } = await supabase
      .from("student_exchange_selections")
      .select(`
        id,
        status,
        created_at,
        profiles!inner (
          id,
          first_name,
          last_name,
          email,
          student_id
        )
      `)
      .eq("exchange_university_id", universities.id)
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching selections:", selectionsError)
      return null
    }

    // Count current enrollment (pending + approved)
    const currentEnrollment = selections?.filter((s) => s.status === "pending" || s.status === "approved").length || 0

    const universityWithEnrollment = {
      ...universities,
      current_enrollment: currentEnrollment,
      is_full: currentEnrollment >= universities.max_students,
    }

    const studentSelections =
      selections?.map((selection) => ({
        id: selection.id,
        status: selection.status,
        created_at: selection.created_at,
        student: {
          id: selection.profiles.id,
          first_name: selection.profiles.first_name,
          last_name: selection.profiles.last_name,
          email: selection.profiles.email,
          student_id: selection.profiles.student_id,
        },
      })) || []

    return {
      ...pack,
      university: universityWithEnrollment,
      student_selections: studentSelections,
    }
  } catch (error) {
    console.error("Error in getExchangeElectivePack:", error)
    return null
  }
}

export default async function ManagerExchangeElectivePackPage({ params }: { params: { id: string } }) {
  const pack = await getExchangeElectivePack(params.id)

  if (!pack) {
    notFound()
  }

  const university = pack.university
  const enrollmentPercentage = (university.current_enrollment / university.max_students) * 100

  const pendingSelections = pack.student_selections.filter((s) => s.status === "pending")
  const approvedSelections = pack.student_selections.filter((s) => s.status === "approved")
  const rejectedSelections = pack.student_selections.filter((s) => s.status === "rejected")

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/manager/electives/exchange" className="hover:text-foreground">
              Exchange Programs
            </Link>
            <span>/</span>
            <span>{pack.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{pack.name}</h1>
          {pack.description && <p className="text-muted-foreground">{pack.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/manager/electives/exchange/${params.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Pack
            </Link>
          </Button>
        </div>
      </div>

      {/* University Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            University Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{university.name}</h3>
                {university.is_full && <Badge variant="destructive">Full</Badge>}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {university.city}, {university.country}
              </div>
              {university.description && <p className="text-muted-foreground mt-2">{university.description}</p>}
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground">
                {university.current_enrollment}/{university.max_students} enrolled
              </div>
            </div>
          </div>

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

          {/* University Details Grid */}
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
        </CardContent>
      </Card>

      {/* Selection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{pack.student_selections.length}</div>
            <div className="text-sm text-muted-foreground">Total Applications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingSelections.length}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{approvedSelections.length}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{rejectedSelections.length}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Selections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pack.student_selections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pack.student_selections.map((selection) => (
                  <TableRow key={selection.id}>
                    <TableCell className="font-medium">
                      {selection.student.first_name} {selection.student.last_name}
                    </TableCell>
                    <TableCell>{selection.student.student_id}</TableCell>
                    <TableCell>{selection.student.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          selection.status === "approved"
                            ? "default"
                            : selection.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {selection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(selection.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/manager/users/${selection.student.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No student applications yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
