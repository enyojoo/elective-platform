import { CourseSelectionClient } from "@/components/student/course-selection-client"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import type { Database } from "@/lib/database.types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Helper function to get public URL, can be moved to a util file
async function getPublicUrl(supabase: any, bucketName: string, path: string | null) {
  if (!path) return null
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
  return data?.publicUrl || null
}

export default async function StudentElectiveCoursePackPage({
  params,
}: {
  params: { packId: string }
}) {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { packId } = params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?message=Please log in to view your courses.")
  }

  // Fetch student's profile to check group, if necessary for pack access control
  // For now, assuming pack access is already handled by the page listing packs.

  const { data: electivePackData, error: packError } = await supabase
    .from("elective_courses")
    .select("*")
    .eq("id", packId)
    .single()

  if (packError || !electivePackData) {
    console.error("Error fetching elective pack:", packError)
    notFound() // Or show a specific error message
  }

  // Get public URL for syllabus template
  const syllabusTemplatePublicUrl = await getPublicUrl(
    supabase,
    "course-templates",
    electivePackData.syllabus_template_url,
  )
  const electivePackWithUrl = { ...electivePackData, syllabus_template_public_url: syllabusTemplatePublicUrl }

  // Fetch courses for this pack
  // Assuming courses have an 'elective_course_id' FK to 'elective_courses' table
  // Or if courses are linked via a join table, adjust query accordingly.
  // For this example, let's assume a direct FK `elective_course_id` on `courses` table.
  // If courses are linked via `elective_course_offerings` and then to `courses`, the query would be more complex.
  // Based on previous context, `courses` might be directly linked or through `elective_packs_courses`
  // Let's assume `courses.elective_course_id` exists for simplicity here.
  // If not, this query needs to be adapted to your specific schema for linking courses to an elective_courses (pack).
  const { data: coursesData, error: coursesError } = await supabase
    .from("courses")
    .select("*, course_department:departments(name)") // Example of joining department
    // This condition needs to match your schema.
    // If courses are linked via a many-to-many through `elective_packs_courses`:
    // 1. Get course_ids from `elective_packs_courses` where `elective_pack_id` = packId
    // 2. Then get courses where `id` IN (course_ids)
    // For now, assuming a simpler direct link or that `elective_course_id` is on `courses`
    .eq("elective_course_id", packId) // THIS IS AN ASSUMPTION. Adjust if your schema is different.
    .order("name", { ascending: true })

  if (coursesError) {
    console.error("Error fetching courses for pack:", coursesError)
    // return <Alert variant="destructive">Error loading courses.</Alert>; // Or handle differently
  }
  const courses = coursesData || []

  const { data: currentSelectionData, error: selectionError } = await supabase
    .from("course_selections")
    .select("*")
    .eq("student_id", user.id)
    .eq("elective_course_id", packId)
    .single()

  if (selectionError && selectionError.code !== "PGRST116") {
    // PGRST116: single row not found (acceptable)
    console.error("Error fetching current selection:", selectionError)
    // Potentially show an error, but the client component can handle null initialSelection
  }

  let initialSelectionWithUrl = null
  if (currentSelectionData) {
    const statementPublicUrl = await getPublicUrl(supabase, "student-statements", currentSelectionData.statement_url)
    initialSelectionWithUrl = { ...currentSelectionData, statement_public_url: statementPublicUrl }
  }

  if (coursesError && courses.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Courses</AlertTitle>
          <AlertDescription>
            There was an issue fetching the courses for this pack. It's possible that the course linkage (e.g.,
            `courses.elective_course_id`) is not correctly set up or there are no courses assigned. Please contact
            support.
            <pre className="mt-2 whitespace-pre-wrap text-xs">{JSON.stringify(coursesError, null, 2)}</pre>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <CourseSelectionClient
        electivePack={electivePackWithUrl}
        courses={courses}
        initialSelection={initialSelectionWithUrl}
        userId={user.id}
      />
    </div>
  )
}
