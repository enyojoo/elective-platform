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
      "id, name, name_ru, description, description_ru, semester, academic_year, status, selection_start_date, selection_end_date, created_by",
    )
    .eq("institution_id", institution.id)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get unique creator IDs
  const creatorIds = data
    .map((item) => item.created_by)
    .filter((id) => id !== null && id !== undefined)
    .filter((id, index, self) => self.indexOf(id) === index)

  // Fetch creator profiles in a single query
  let creatorProfiles = {}
  if (creatorIds.length > 0) {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", creatorIds)

      if (profilesError) {
        console.error("Error fetching creator profiles:", profilesError)
      } else if (profiles) {
        // Create a map of profile IDs to names
        creatorProfiles = profiles.reduce((acc, profile) => {
          if (profile && profile.id) {
            acc[profile.id] = profile.full_name || "Unknown"
          }
          return acc
        }, {})
      }
    } catch (profileError) {
      console.error("Error in profile fetching:", profileError)
    }
  }

  // Add creator_name to each item
  const dataWithCreatorNames = data.map((item) => {
    const creatorName = item.created_by ? creatorProfiles[item.created_by] || null : null
    return {
      ...item,
      creator_name: creatorName,
    }
  })

  return NextResponse.json(dataWithCreatorNames)
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
