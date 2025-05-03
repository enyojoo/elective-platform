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
  const degreeId = searchParams.get("degreeId")

  let query = supabase
    .from("programs")
    .select("id, name, name_ru, code, description, description_ru, status, degree_id, degrees(name, name_ru, code)")
    .eq("institution_id", institution.id)

  if (degreeId) {
    query = query.eq("degree_id", degreeId)
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

  // Check if user is admin
  if (userInfo.profile.role !== "admin") {
    return forbidden()
  }

  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from("programs")
      .insert({
        institution_id: institution.id,
        name: body.name,
        name_ru: body.nameRu,
        code: body.code,
        description: body.description,
        description_ru: body.descriptionRu,
        status: body.status || "active",
        degree_id: body.degreeId,
      })
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
