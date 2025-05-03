import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getInstitutionFromRequest, getUserFromRequest, unauthorized, forbidden } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  const institution = await getInstitutionFromRequest(req)
  const userInfo = await getUserFromRequest(req)

  if (!userInfo) {
    return unauthorized()
  }

  if (!institution || institution.id !== userInfo.profile?.institution_id) {
    return forbidden()
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  let query = supabase
    .from("elective_packs")
    .select(
      "id, name, name_ru, description, description_ru, semester, academic_year, status, selection_start_date, selection_end_date",
    )
    .eq("institution_id", institution.id)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const institution = await getInstitutionFromRequest(req)
  const userInfo = await getUserFromRequest(req)

  if (!userInfo) {
    return unauthorized()
  }

  if (!institution || institution.id !== userInfo.profile?.institution_id) {
    return forbidden()
  }

  // Check if user is admin or program manager
  if (userInfo.profile.role !== "admin" && userInfo.profile.role !== "program_manager") {
    return forbidden()
  }

  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from("elective_packs")
      .insert({
        institution_id: institution.id,
        name: body.name,
        name_ru: body.nameRu,
        description: body.description,
        description_ru: body.descriptionRu,
        semester: body.semester,
        academic_year: body.academicYear,
        status: body.status || "draft",
        selection_start_date: body.selectionStartDate,
        selection_end_date: body.selectionEndDate,
        created_by: userInfo.user.id,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
